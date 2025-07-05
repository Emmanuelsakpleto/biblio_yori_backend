const db = require('../config/database');
const { AppError, formatDate, generateId } = require('../utils/helpers');
const EmailService = require('./email.service');

class NotificationService {
  /**
   * Crée une notification pour une action sur un livre (ajout, suppression, mise à jour, réservation, etc.)
   * bookData doit contenir : user_id (cible), admin_id (optionnel), type, book_title, book_id
   */
  static async createBookNotification(bookData) {
    try {
      const { user_id, admin_id, book_title, type, book_id } = bookData;
      const notifications = [];

      // Notif utilisateur (étudiant ou abonné)
      if (user_id) {
        let title, message, notifType = type;
        switch (type) {
          case 'book_available':
            notifType = 'book_available';
            title = 'Livre disponible';
            message = `Le livre "${book_title}" que vous attendiez est maintenant disponible !`;
            break;
          case 'new_book':
            notifType = 'new_book';
            title = 'Nouveau livre ajouté';
            message = `Un nouveau livre a été ajouté à la bibliothèque : "${book_title}"`;
            break;
          case 'book_reservation':
            notifType = 'book_reservation';
            title = 'Réservation confirmée';
            message = `Votre réservation pour le livre "${book_title}" a été confirmée.`;
            break;
          case 'book_deleted':
            notifType = 'book_deleted';
            title = 'Livre supprimé';
            message = `Le livre "${book_title}" a été supprimé du catalogue.`;
            break;
          default:
            notifType = type;
            title = 'Notification livre';
            message = `Mise à jour concernant le livre "${book_title}".`;
        }
        notifications.push(this.create({
          user_id,
          type: notifType,
          title,
          message,
          priority: type === 'book_available' ? 'high' : 'normal',
          related_entity_type: 'book',
          related_entity_id: book_id,
          send_email: type === 'book_available',
          metadata: { book_title }
        }));
      }

      // Notif admin (pour les actions importantes)
      let adminIds = [];
      if (Array.isArray(admin_id)) {
        adminIds = admin_id;
      } else if (admin_id) {
        adminIds = [admin_id];
      }
      for (const aid of adminIds) {
        let adminTitle, adminMessage, adminType;
        switch (type) {
          case 'book_reservation':
            adminType = 'book_reservation_admin';
            adminTitle = 'Nouvelle réservation de livre';
            adminMessage = `Un utilisateur a réservé le livre "${book_title}".`;
            break;
          case 'book_deleted':
            adminType = 'book_deleted_admin';
            adminTitle = 'Livre supprimé';
            adminMessage = `Le livre "${book_title}" a été supprimé du catalogue.`;
            break;
          case 'new_book':
            adminType = 'new_book_admin';
            adminTitle = 'Nouveau livre ajouté';
            adminMessage = `Un nouveau livre a été ajouté : "${book_title}".`;
            break;
          default:
            adminType = 'book_admin_update';
            adminTitle = 'Notification livre (admin)';
            adminMessage = `Mise à jour concernant le livre "${book_title}".`;
        }
        notifications.push(this.create({
          user_id: aid,
          type: adminType,
          title: adminTitle,
          message: adminMessage,
          priority: 'normal',
          related_entity_type: 'book',
          related_entity_id: book_id,
          send_email: false,
          metadata: { book_title }
        }));
      }

      return Promise.all(notifications);
    } catch (error) {
      console.error('Erreur notification livre:', error);
      throw new AppError('Erreur lors de la création de la notification de livre', 500);
    }
  }

  /**
   * Crée une notification système (ex: maintenance, bienvenue, changement de mot de passe, etc.)
   * userData doit contenir : user_id, type, customTitle, customMessage
   */
  static async createSystemNotification(userData) {
    try {
      const { user_id, type, customTitle, customMessage } = userData;
      let title, message, notifType = type, priority = 'normal';
      switch (type) {
        case 'welcome':
          notifType = 'welcome';
          title = 'Bienvenue sur YORI';
          message = 'Bonjour et bienvenue sur la plateforme YORI ! Vous pouvez maintenant explorer notre catalogue et emprunter des livres.';
          break;
        case 'password_changed':
          notifType = 'password_changed';
          title = 'Mot de passe modifié';
          message = 'Votre mot de passe a été modifié avec succès.';
          break;
        case 'email_verified':
          notifType = 'email_verified';
          title = 'Email vérifié';
          message = 'Votre adresse email a été vérifiée avec succès.';
          break;
        case 'profile_updated':
          notifType = 'profile_updated';
          title = 'Profil mis à jour';
          message = 'Vos informations de profil ont été mises à jour.';
          break;
        case 'maintenance':
          notifType = 'maintenance';
          title = 'Maintenance programmée';
          message = 'Une maintenance du système YORI est prévue. Vous serez notifié des détails.';
          priority = 'high';
          break;
        case 'custom':
          notifType = 'custom';
          title = customTitle || 'Notification';
          message = customMessage || 'Vous avez une nouvelle notification.';
          break;
        default:
          notifType = 'system_update';
          title = 'Notification système YORI';
          message = 'Vous avez une nouvelle notification système YORI.';
      }

      return await this.create({
        user_id,
        type: notifType,
        title,
        message,
        priority,
        send_email: false,
        metadata: { notification_type: type }
      });
    } catch (error) {
      console.error('Erreur notification système:', error);
      throw new AppError('Erreur lors de la création de la notification système', 500);
    }
  }
  // Créer une notification
  static async create(notificationData) {
    try {
      const {
        user_id,
        type,
        title,
        message,
        priority = 'normal',
        related_entity_type = null,
        related_entity_id = null,
        send_email = false,
        metadata = null
      } = notificationData;
      
      const query = `
        INSERT INTO notifications (
          user_id, type, title, message, priority,
          related_entity_type, related_entity_id, metadata,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        user_id, type, title, message, priority,
        related_entity_type, related_entity_id,
        metadata ? JSON.stringify(metadata) : null
      ];

      const result = await db.query(query, values);
      
      // Récupérer la notification créée avec l'ID auto-généré
      const [notification] = await db.query(
        'SELECT * FROM notifications WHERE id = ?',
        [result.insertId]
      );

      // Envoyer par email si demandé
      if (send_email && notification) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      throw new AppError('Erreur lors de la création de la notification', 500);
    }
  }

  // Récupérer les notifications d'un utilisateur
  static async getUserNotifications(userId, options = {}) {
    try {
      // Vérifier d'abord si la table existe
      const checkTableQuery = "SHOW TABLES LIKE 'notifications'";
      const tableExists = await db.query(checkTableQuery);
      if (!tableExists || tableExists.length === 0) {
        return {
          notifications: [],
          total: 0,
          hasMore: false
        };
      }

      // Gestion des options de pagination et de filtrage
      const {
        limit = 20,
        offset = 0,
        unread_only = false,
        type = '',
        priority = ''
      } = options;

      let where = 'WHERE user_id = ?';
      const params = [userId];
      if (unread_only) {
        where += ' AND is_read = false';
      }
      if (type && type !== '') {
        where += ' AND type = ?';
        params.push(type);
      }
      if (priority && priority !== '') {
        where += ' AND priority = ?';
        params.push(priority);
      }

      // Récupérer le total pour la pagination
      const countQuery = `SELECT COUNT(*) as total FROM notifications ${where}`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult[0]?.total || 0);

      // Récupérer les notifications paginées
      const query = `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      const notifParams = [...params, parseInt(limit), parseInt(offset)];
      const result = await db.query(query, notifParams);

      return {
        notifications: result,
        total,
        hasMore: offset + result.length < total
      };
    } catch (error) {
      console.error('Erreur récupération notifications:', error.message);
      return {
        notifications: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId, userId) {
    try {
      const query = `
        UPDATE notifications 
        SET is_read = true, read_at = NOW(), updated_at = NOW()
        WHERE id = ? AND user_id = ?
      `;

      const result = await db.query(query, [notificationId, userId]);
      
      if (result.affectedRows === 0) {
        throw new AppError('Notification non trouvée', 404);
      }

      // Récupérer la notification mise à jour
      const [notification] = await db.query(
        'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );

      return notification;
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erreur marquage notification:', error);
      throw new AppError('Erreur lors du marquage de la notification', 500);
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(userId) {
    try {
      const query = `
        UPDATE notifications 
        SET is_read = true, read_at = NOW(), updated_at = NOW()
        WHERE user_id = ? AND is_read = false
      `;

      const result = await db.query(query, [userId]);
      return { updated_count: result.affectedRows };
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error);
      throw new AppError('Erreur lors du marquage des notifications', 500);
    }
  }

  // Supprimer une notification
  static async delete(notificationId, userId) {
    try {
      const query = `
        DELETE FROM notifications 
        WHERE id = ? AND user_id = ?
      `;

      const result = await db.query(query, [notificationId, userId]);
      
      if (result.affectedRows === 0) {
        throw new AppError('Notification non trouvée', 404);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erreur suppression notification:', error);
      throw new AppError('Erreur lors de la suppression de la notification', 500);
    }
  }

  // Supprimer les anciennes notifications
  static async deleteOldNotifications(daysOld = 30) {
    try {
      const query = `
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '${daysOld} days'
        AND is_read = true
      `;

      const result = await db.query(query);
      return { deleted_count: result.rowCount };
    } catch (error) {
      console.error('Erreur suppression anciennes notifications:', error);
      throw new AppError('Erreur lors de la suppression des anciennes notifications', 500);
    }
  }

  // Créer une notification d'emprunt
  /**
   * Crée une notification d'emprunt pour l'étudiant et/ou l'admin selon la transition métier.
   * loanData doit contenir : user_id (étudiant), admin_id (optionnel), type, book_title, loan_id, loan_date, due_date
   */
  static async createLoanNotification(loanData) {
    try {
      const { user_id, admin_id, book_title, loan_date, due_date, type, loan_id } = loanData;
      const notifications = [];

      // Notif étudiant (toutes transitions)
      if (user_id) {
        let title, message, notifType = type;
        switch (type) {
          case 'loan_created':
            notifType = 'loan_created';
            title = 'Nouvel emprunt confirmé';
            message = `Votre emprunt du livre "${book_title}" a été confirmé. Date de retour prévue : ${formatDate(due_date)}`;
            break;
          case 'loan_requested':
            notifType = 'loan_requested';
            title = 'Demande d\'emprunt envoyée';
            message = `Votre demande d'emprunt pour le livre "${book_title}" a bien été envoyée à l'administration.`;
            break;
          case 'loan_validated':
            notifType = 'loan_validated';
            title = 'Emprunt validé';
            message = `Votre emprunt du livre "${book_title}" a été validé. Vous pouvez venir le récupérer.`;
            break;
          case 'loan_refused':
            notifType = 'loan_refused';
            title = 'Emprunt refusé';
            message = `Votre demande d'emprunt pour le livre "${book_title}" a été refusée.`;
            break;
          case 'loan_reminder':
            notifType = 'loan_reminder';
            title = 'Rappel de retour';
            message = `N'oubliez pas de rendre le livre "${book_title}" avant le ${formatDate(due_date)}`;
            break;
          case 'loan_overdue':
            notifType = 'loan_overdue';
            title = 'Retard de retour';
            message = `Le livre "${book_title}" devait être rendu le ${formatDate(due_date)}. Merci de le rendre rapidement.`;
            break;
          case 'loan_returned':
            notifType = 'loan_returned';
            title = 'Retour confirmé';
            message = `Le retour du livre "${book_title}" a été confirmé. Merci !`;
            break;
          case 'loan_renewed':
            notifType = 'loan_renewed';
            title = 'Renouvellement accepté';
            message = `Votre emprunt du livre "${book_title}" a été renouvelé. Nouvelle date de retour : ${formatDate(due_date)}`;
            break;
          case 'loan_renewal_requested':
            notifType = 'loan_renewal_requested';
            title = 'Demande de renouvellement envoyée';
            message = `Votre demande de renouvellement pour le livre "${book_title}" a bien été envoyée à l'administration.`;
            break;
          default:
            notifType = type;
            title = 'Notification d\'emprunt';
            message = `Mise à jour concernant votre emprunt du livre "${book_title}"`;
        }
        notifications.push(this.create({
          user_id,
          type: notifType,
          title,
          message,
          priority: ['loan_overdue'].includes(type) ? 'high' : 'normal',
          related_entity_type: 'loan',
          related_entity_id: loan_id,
          send_email: ['loan_overdue'].includes(type),
          metadata: { book_title, due_date }
        }));
      }

      // Notif admin (toutes transitions métier utiles)
      let adminIds = [];
      if (Array.isArray(admin_id)) {
        adminIds = admin_id;
      } else if (admin_id) {
        adminIds = [admin_id];
      }
      for (const aid of adminIds) {
        let adminTitle, adminMessage, adminType;
        switch (type) {
          case 'loan_requested':
            adminType = 'loan_requested';
            adminTitle = 'Nouvelle demande d\'emprunt';
            adminMessage = `Un étudiant a demandé l'emprunt du livre "${book_title}".`;
            break;
          case 'loan_validated':
            adminType = 'loan_validated_admin';
            adminTitle = 'Emprunt validé';
            adminMessage = `Un emprunt du livre "${book_title}" a été validé.`;
            break;
          case 'loan_refused':
            adminType = 'loan_refused_admin';
            adminTitle = 'Emprunt refusé';
            adminMessage = `Une demande d'emprunt pour le livre "${book_title}" a été refusée.`;
            break;
          case 'loan_returned':
            adminType = 'loan_returned_admin';
            adminTitle = 'Livre retourné';
            adminMessage = `Le livre "${book_title}" a été rendu par l'étudiant.`;
            break;
          case 'loan_renewal_requested':
            adminType = 'loan_renewal_requested';
            adminTitle = 'Demande de renouvellement';
            adminMessage = `Un étudiant a demandé le renouvellement de l'emprunt du livre "${book_title}".`;
            break;
          case 'loan_renewed':
            adminType = 'loan_renewed_admin';
            adminTitle = 'Renouvellement accepté';
            adminMessage = `Un emprunt du livre "${book_title}" a été renouvelé.`;
            break;
          case 'loan_overdue':
            adminType = 'loan_overdue_admin';
            adminTitle = 'Emprunt en retard';
            adminMessage = `Un emprunt du livre "${book_title}" est en retard.`;
            break;
          default:
            adminType = 'loan_admin_update';
            adminTitle = 'Notification d\'emprunt (admin)';
            adminMessage = `Mise à jour concernant un emprunt du livre "${book_title}".`;
        }
        notifications.push(this.create({
          user_id: aid,
          type: adminType,
          title: adminTitle,
          message: adminMessage,
          priority: ['loan_overdue'].includes(type) ? 'high' : 'normal',
          related_entity_type: 'loan',
          related_entity_id: loan_id,
          send_email: false,
          metadata: { book_title, due_date }
        }));
      }

      return Promise.all(notifications);
    } catch (error) {
      console.error('Erreur notification emprunt:', error);
      throw new AppError('Erreur lors de la création de la notification d\'emprunt', 500);
    }
  }

  // Créer une notification de livre
  static async createBookNotification(bookData) {
    try {
      const { user_id, book_title, type, book_id } = bookData;

      let title, message, notifType = type;
      switch (type) {
        case 'book_available':
          title = 'Livre disponible';
          message = `Le livre "${book_title}" que vous attendiez est maintenant disponible !`;
          break;
        case 'new_book':
          title = 'Nouveau livre ajouté';
          message = `Un nouveau livre a été ajouté à la bibliothèque : "${book_title}"`;
          break;
        case 'book_reservation':
          title = 'Réservation confirmée';
          message = `Votre réservation pour le livre "${book_title}" a été confirmée`;
          break;
        default:
          notifType = 'book_update';
          title = 'Notification de livre';
          message = `Mise à jour concernant le livre "${book_title}"`;
      }

      return await this.create({
        user_id,
        type: notifType, // type explicite (ex: book_available, new_book...)
        title,
        message,
        priority: type === 'book_available' ? 'high' : 'normal',
        related_entity_type: 'book',
        related_entity_id: book_id,
        send_email: type === 'book_available',
        metadata: { book_title }
      });
    } catch (error) {
      console.error('Erreur notification livre:', error);
      throw new AppError('Erreur lors de la création de la notification de livre', 500);
    }
  }

  // Créer une notification système
  static async createSystemNotification(userData) {
    try {
      const { user_id, type, customTitle, customMessage } = userData;

      let title, message, notifType = type, priority = 'normal';
      switch (type) {
        case 'welcome':
          title = 'Bienvenue sur YORI';
          message = 'Bonjour et bienvenue sur la plateforme YORI ! Vous pouvez maintenant explorer notre catalogue et emprunter des livres.';
          break;
        case 'password_changed':
          title = 'Mot de passe modifié';
          message = 'Votre mot de passe a été modifié avec succès.';
          break;
        case 'email_verified':
          title = 'Email vérifié';
          message = 'Votre adresse email a été vérifiée avec succès.';
          break;
        case 'profile_updated':
          title = 'Profil mis à jour';
          message = 'Vos informations de profil ont été mises à jour.';
          break;
        case 'maintenance':
          title = 'Maintenance programmée';
          message = 'Une maintenance du système YORI est prévue. Vous serez notifié des détails.';
          priority = 'high';
          break;
        case 'custom':
          title = customTitle || 'Notification';
          message = customMessage || 'Vous avez une nouvelle notification.';
          break;
        default:
          notifType = 'system_update';
          title = 'Notification système YORI';
          message = 'Vous avez une nouvelle notification système YORI.';
      }

      return await this.create({
        user_id,
        type: notifType, // type explicite (ex: welcome, maintenance...)
        title,
        message,
        priority,
        send_email: false,
        metadata: { notification_type: type }
      });
    } catch (error) {
      console.error('Erreur notification système:', error);
      throw new AppError('Erreur lors de la création de la notification système', 500);
    }
  }

  // Envoyer une notification par email
  static async sendEmailNotification(notification) {
    try {
      // Récupérer les infos utilisateur
      const userQuery = `
        SELECT email, first_name, last_name, email_notifications
        FROM users 
        WHERE id = ? AND is_active = true
      `;
      
      const userResult = await db.query(userQuery, [notification.user_id]);
      
      if (userResult.length === 0 || !userResult[0].email_notifications) {
        return; // Utilisateur non trouvé ou notifications email désactivées
      }

      const user = userResult[0];
      
      await EmailService.sendNotificationEmail(
        user.email,
        {
          firstName: user.first_name,
          lastName: user.last_name,
          notificationTitle: notification.title,
          notificationMessage: notification.message,
          notificationType: notification.type,
          priority: notification.priority
        }
      );
    } catch (error) {
      console.error('Erreur envoi email notification:', error);
      // Ne pas lever d'erreur pour ne pas bloquer la création de la notification
    }
  }

  // Obtenir le nombre de notifications non lues
  static async getUnreadCount(userId) {
    try {
      const query = `
        SELECT COUNT(*) as unread_count
        FROM notifications
        WHERE user_id = ? AND is_read = false
      `;

      const result = await db.query(query, [userId]);
      return parseInt(result[0].unread_count);
    } catch (error) {
      console.error('Erreur comptage notifications non lues:', error);
      throw new AppError('Erreur lors du comptage des notifications', 500);
    }
  }

  // Notifications en temps réel (pour WebSocket/SSE)
  static async getRealtimeNotifications(userId, lastNotificationId = null) {
    try {
      let query = `
        SELECT 
          id, type, title, message, priority,
          related_entity_type, related_entity_id,
          is_read, metadata, created_at
        FROM notifications
        WHERE user_id = ?
      `;
      
      let params = [userId];
      
      if (lastNotificationId) {
        query += ` AND created_at > (
          SELECT created_at FROM notifications WHERE id = ?
        )`;
        params.push(lastNotificationId);
      }
      
      query += ` ORDER BY created_at DESC LIMIT 10`;

      const result = await db.query(query, params);
      return result;
    } catch (error) {
      console.error('Erreur notifications temps réel:', error);
      throw new AppError('Erreur lors de la récupération des notifications temps réel', 500);
    }
  }

  // Notification en lot pour les administrateurs
  static async createBulkNotification(notificationData) {
    try {
      const {
        user_ids,
        type,
        title,
        message,
        priority = 'normal',
        send_email = false
      } = notificationData;

      const notifications = [];
      
      for (const user_id of user_ids) {
        const notification = await this.create({
          user_id,
          type,
          title,
          message,
          priority,
          send_email
        });
        notifications.push(notification);
      }

      return {
        created_count: notifications.length,
        notifications
      };
    } catch (error) {
      console.error('Erreur notifications en lot:', error);
      throw new AppError('Erreur lors de la création des notifications en lot', 500);
    }
  }
}

module.exports = NotificationService;
