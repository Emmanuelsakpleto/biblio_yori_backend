const database = require('../config/database');
const { logger } = require('../utils/helpers');
const { NOTIFICATION_TYPES } = require('../utils/constants');

class NotificationModel {
  /**
   * Créer une nouvelle notification
   * @param {Object} notificationData - Données de la notification
   * @returns {Promise<Object>} - Notification créée
   */
  static async create(notificationData) {
    try {
      const {
        user_id,
        type,
        title,
        message,
        related_loan_id = null,
        related_book_id = null,
        scheduled_for = null
      } = notificationData;

      const sql = `
        INSERT INTO notifications (user_id, type, title, message, related_loan_id, related_book_id, scheduled_for)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await database.query(sql, [
        user_id, type, title, message, 
        related_loan_id, related_book_id, scheduled_for
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('Erreur lors de la création de la notification:', error);
      throw error;
    }
  }

  /**
   * Créer des notifications en lot
   * @param {Array} notifications - Tableau de notifications
   * @returns {Promise<Array>} - Notifications créées
   */
  static async createBatch(notifications) {
    try {
      const sql = `
        INSERT INTO notifications (user_id, type, title, message, related_loan_id, related_book_id, scheduled_for)
        VALUES ?
      `;

      const values = notifications.map(notif => [
        notif.user_id,
        notif.type,
        notif.title,
        notif.message,
        notif.related_loan_id || null,
        notif.related_book_id || null,
        notif.scheduled_for || null
      ]);

      await database.query(sql, [values]);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la création en lot des notifications:', error);
      throw error;
    }
  }

  /**
   * Trouver une notification par ID
   * @param {number} id - ID de la notification
   * @returns {Promise<Object|null>} - Notification ou null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT n.*, 
               u.first_name, u.last_name, u.email
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        WHERE n.id = ?
      `;
      
      const [notification] = await database.query(sql, [id]);
      
      return notification || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche de notification par ID:', error);
      throw error;
    }
  }

  /**
   * Obtenir les notifications d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination et filtres
   * @returns {Promise<Object>} - Notifications de l'utilisateur
   */
  static async findByUser(userId, options = {}) {
    if (!userId) {
      const err = new Error('userId manquant pour la récupération des notifications');
      logger.error('Erreur lors de la récupération des notifications:', err);
      throw err;
    }
    try {
      const {
        page = 1,
        limit = 20,
        unread_only = false,
        type
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = ['n.user_id = ?'];
      let params = [userId];

      // Filtres
      if (unread_only) {
        whereConditions.push('n.is_read = 0');
      }

      if (type) {
        whereConditions.push('n.type = ?');
        params.push(type);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      // Requête de comptage
      const countSql = `
        SELECT COUNT(*) as total 
        FROM notifications n
        ${whereClause}
      `;
      const [{ total }] = await database.query(countSql, params);

      // Requête de données
      const sql = `
        SELECT n.*
        FROM notifications n
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const notifications = await database.query(sql, [...params, limit, offset]);

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications:', error);
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   * @param {number} id - ID de la notification
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async markAsRead(id) {
    try {
      const sql = `
        UPDATE notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const result = await database.query(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications d'un utilisateur comme lues
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} - Nombre de notifications marquées
   */
  static async markAllAsRead(userId) {
    try {
      const sql = `
        UPDATE notifications 
        SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND is_read = 0
      `;

      const result = await database.query(sql, [userId]);
      return result.affectedRows;
    } catch (error) {
      logger.error('Erreur lors du marquage global comme lu:', error);
      throw error;
    }
  }

  /**
   * Supprimer une notification
   * @param {number} id - ID de la notification
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async delete(id) {
    try {
      const sql = 'DELETE FROM notifications WHERE id = ?';
      const result = await database.query(sql, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur lors de la suppression de la notification:', error);
      throw error;
    }
  }

  /**
   * Supprimer les anciennes notifications
   * @param {number} daysOld - Âge en jours des notifications à supprimer
   * @returns {Promise<number>} - Nombre de notifications supprimées
   */
  static async deleteOld(daysOld = 30) {
    try {
      const sql = `
        DELETE FROM notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND is_read = 1
      `;

      const result = await database.query(sql, [daysOld]);
      return result.affectedRows;
    } catch (error) {
      logger.error('Erreur lors de la suppression des anciennes notifications:', error);
      throw error;
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} - Nombre de notifications non lues
   */
  static async getUnreadCount(userId) {
    try {
      const sql = `
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ? AND is_read = 0
      `;

      const [{ count }] = await database.query(sql, [userId]);
      return parseInt(count);
    } catch (error) {
      logger.error('Erreur lors du comptage des notifications non lues:', error);
      throw error;
    }
  }

  /**
   * Créer une notification de rappel d'emprunt
   * @param {Object} loanData - Données de l'emprunt
   * @returns {Promise<Object>} - Notification créée
   */
  static async createLoanReminder(loanData) {
    try {
      const { user_id, book_title, due_date, days_remaining } = loanData;
      
      let title, message;
      
      if (days_remaining <= 0) {
        title = 'Livre en retard';
        message = `Le livre "${book_title}" devait être retourné le ${due_date}. Veuillez le retourner dès que possible.`;
      } else if (days_remaining <= 3) {
        title = 'Retour de livre bientôt';
        message = `Le livre "${book_title}" doit être retourné dans ${days_remaining} jour(s) (${due_date}).`;
      } else {
        title = 'Rappel d\'emprunt';
        message = `N'oubliez pas de retourner le livre "${book_title}" avant le ${due_date}.`;
      }

      return await this.create({
        user_id,
        type: NOTIFICATION_TYPES.LOAN_REMINDER,
        title,
        message,
        related_loan_id: loanData.loan_id,
        related_book_id: loanData.book_id
      });
    } catch (error) {
      logger.error('Erreur lors de la création du rappel d\'emprunt:', error);
      throw error;
    }
  }

  /**
   * Créer une notification de réservation prête
   * @param {Object} reservationData - Données de la réservation
   * @returns {Promise<Object>} - Notification créée
   */
  static async createReservationReady(reservationData) {
    try {
      const { user_id, book_title, book_id } = reservationData;
      
      return await this.create({
        user_id,
        type: NOTIFICATION_TYPES.RESERVATION_READY,
        title: 'Réservation disponible',
        message: `Le livre "${book_title}" que vous avez réservé est maintenant disponible.`,
        related_book_id: book_id
      });
    } catch (error) {
      logger.error('Erreur lors de la création de la notification de réservation:', error);
      throw error;
    }
  }

  /**
   * Créer une notification de bienvenue
   * @param {number} userId - ID de l'utilisateur
   * @param {string} userName - Nom de l'utilisateur
   * @returns {Promise<Object>} - Notification créée
   */
  static async createWelcomeNotification(userId, userName) {
    try {
      return await this.create({
        user_id: userId,
        type: NOTIFICATION_TYPES.ACCOUNT_CREATED,
        title: 'Bienvenue sur LECTURA',
        message: `Bonjour ${userName}, bienvenue sur la plateforme LECTURA ! Vous pouvez maintenant explorer notre catalogue et emprunter des livres.`
      });
    } catch (error) {
      logger.error('Erreur lors de la création de la notification de bienvenue:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des notifications
   * @returns {Promise<Object>} - Statistiques
   */
  static async getStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_notifications,
          SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_notifications,
          SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_notifications,
          COUNT(DISTINCT user_id) as users_with_notifications,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 ELSE 0 END) as sent_today
        FROM notifications
      `;

      const [stats] = await database.query(sql);
      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Obtenir les notifications par type
   * @param {string} type - Type de notification
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} - Notifications filtrées
   */
  static async findByType(type, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        user_id
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = ['n.type = ?'];
      let params = [type];

      if (user_id) {
        whereConditions.push('n.user_id = ?');
        params.push(user_id);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      // Requête de comptage
      const countSql = `
        SELECT COUNT(*) as total 
        FROM notifications n
        ${whereClause}
      `;
      const [{ total }] = await database.query(countSql, params);

      // Requête de données
      const sql = `
        SELECT n.*, 
               u.first_name, u.last_name, u.email
        FROM notifications n
        JOIN users u ON n.user_id = u.id
        ${whereClause}
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const notifications = await database.query(sql, [...params, limit, offset]);

      // Parser les données JSON
      notifications.forEach(notif => {
        if (notif.data) {
          notif.data = JSON.parse(notif.data);
        }
      });

      return {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des notifications par type:', error);
      throw error;
    }
  }

  /**
   * Obtenir les préférences de notification d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Préférences de notification
   */
  static async getUserPreferences(userId) {
    try {
      const sql = `
        SELECT * FROM notification_preferences 
        WHERE user_id = ?
      `;

      const [preferences] = await database.query(sql, [userId]);
      
      // Retourner les préférences par défaut si aucune n'existe
      if (!preferences) {
        return {
          user_id: userId,
          email_reminders: true,
          email_overdue: true,
          email_reservations: true,
          push_notifications: true
        };
      }

      return preferences;
    } catch (error) {
      logger.error('Erreur lors de la récupération des préférences:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les préférences de notification
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} preferences - Nouvelles préférences
   * @returns {Promise<Object>} - Préférences mises à jour
   */
  static async updateUserPreferences(userId, preferences) {
    try {
      const sql = `
        INSERT INTO notification_preferences 
        (user_id, email_reminders, email_overdue, email_reservations, push_notifications)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        email_reminders = VALUES(email_reminders),
        email_overdue = VALUES(email_overdue),
        email_reservations = VALUES(email_reservations),
        push_notifications = VALUES(push_notifications),
        updated_at = CURRENT_TIMESTAMP
      `;

      await database.query(sql, [
        userId,
        preferences.email_reminders,
        preferences.email_overdue,
        preferences.email_reservations,
        preferences.push_notifications
      ]);

      return await this.getUserPreferences(userId);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des préférences:', error);
      throw error;
    }
  }
}

module.exports = NotificationModel;