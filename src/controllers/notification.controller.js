const NotificationService = require('../services/notification.service');
const { AppError, formatResponse, paginate } = require('../utils/helpers');

class NotificationController {
  // Obtenir les notifications de l'utilisateur connecté
  static async getMyNotifications(req, res, next) {
    try {
      // Extraction userId - même approche que le contrôleur reviews
      const { id: userId } = req.user;
      
      if (!userId) {
        throw new AppError('Impossible de déterminer l\'utilisateur connecté', 401);
      }
      const {
        page = 1,
        limit = 20,
        unread_only = 'false',
        type = '',
        priority = ''
      } = req.query;

      const options = {
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        unread_only: unread_only === 'true',
        type: type.trim(),
        priority: priority.trim()
      };

      const result = await NotificationService.getUserNotifications(userId, options);

      res.json(formatResponse(true, 'Notifications récupérées avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir une notification spécifique
  static async getNotificationById(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      // Récupérer la notification depuis la base (utilisation directe du service)
      const notifications = await NotificationService.getUserNotifications(userId, { limit: 1000 });
      const notification = notifications.notifications.find(n => n.id === id);

      if (!notification) {
        throw new AppError('Notification non trouvée', 404);
      }

      // Vérifier les permissions (utilisateur peut voir ses propres notifications, admin peut tout voir)
      if (role !== 'admin' && notification.user_id !== userId) {
        throw new AppError('Accès non autorisé à cette notification', 403);
      }

      res.json(formatResponse(true, 'Notification récupérée avec succès', notification));
    } catch (error) {
      next(error);
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      // Extraction userId - même approche que le contrôleur reviews
      const { id: userId } = req.user;

      if (!userId) {
        throw new AppError('Impossible de déterminer l\'utilisateur connecté', 401);
      }

      const notification = await NotificationService.markAsRead(id, userId);

      res.json(formatResponse(true, 'Notification marquée comme lue', notification));
    } catch (error) {
      next(error);
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(req, res, next) {
    try {
      // Extraction userId - même approche que le contrôleur reviews
      const { id: userId } = req.user;

      if (!userId) {
        throw new AppError('Impossible de déterminer l\'utilisateur connecté', 401);
      }

      const result = await NotificationService.markAllAsRead(userId);

      res.json(formatResponse(true, 'Toutes les notifications marquées comme lues', result));
    } catch (error) {
      next(error);
    }
  }

  // Supprimer une notification
  static async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      await NotificationService.delete(id, userId);

      res.json(formatResponse(true, 'Notification supprimée avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir le nombre de notifications non lues
  static async getUnreadCount(req, res, next) {
    try {
      const { userId } = req.user;

      const count = await NotificationService.getUnreadCount(userId);

      res.json(formatResponse(true, 'Nombre de notifications non lues récupéré', { unread_count: count }));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les notifications en temps réel (pour SSE/WebSocket)
  static async getRealtimeNotifications(req, res, next) {
    try {
      const { userId } = req.user;
      const { last_notification_id } = req.query;

      const notifications = await NotificationService.getRealtimeNotifications(
        userId, 
        last_notification_id
      );

      res.json(formatResponse(true, 'Notifications temps réel récupérées', notifications));
    } catch (error) {
      next(error);
    }
  }

  // Créer une notification personnalisée (utilisateur)
  static async createCustomNotification(req, res, next) {
    try {
      const { userId } = req.user;
      const { title, message, priority = 'normal' } = req.body;

      const notification = await NotificationService.createSystemNotification({
        user_id: userId,
        type: 'custom',
        customTitle: title,
        customMessage: message,
        priority
      });

      res.status(201).json(formatResponse(true, 'Notification créée avec succès', notification));
    } catch (error) {
      next(error);
    }
  }

  // Routes administrateur

  // Obtenir toutes les notifications (Admin seulement)
  static async getAllNotifications(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        user_id = '',
        type = '',
        priority = '',
        unread_only = 'false'
      } = req.query;

      const filters = {
        user_id: user_id.trim(),
        type: type.trim(),
        priority: priority.trim(),
        unread_only: unread_only === 'true'
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      
      // Pour l'admin, on récupère toutes les notifications
      // Cette fonctionnalité nécessiterait une méthode spéciale dans le service
      const result = await NotificationService.getAllNotificationsAdmin(filters, pagination);

      res.json(formatResponse(true, 'Toutes les notifications récupérées', result));
    } catch (error) {
      next(error);
    }
  }

  // Créer une notification en lot (Admin seulement)
  static async createBulkNotification(req, res, next) {
    try {
      const {
        user_ids,
        type,
        title,
        message,
        priority = 'normal',
        send_email = false
      } = req.body;

      const result = await NotificationService.createBulkNotification({
        user_ids,
        type,
        title,
        message,
        priority,
        send_email
      });

      res.status(201).json(formatResponse(true, 'Notifications créées en lot', result));
    } catch (error) {
      next(error);
    }
  }

  // Créer une notification système pour tous les utilisateurs (Admin seulement)
  static async createSystemWideNotification(req, res, next) {
    try {
      const {
        title,
        message,
        priority = 'normal',
        send_email = false,
        exclude_user_ids = []
      } = req.body;

      // Récupérer tous les utilisateurs actifs
      const activeUsersQuery = `
        SELECT id FROM users 
        WHERE is_active = true 
        ${exclude_user_ids.length > 0 ? `AND id NOT IN (${exclude_user_ids.map(() => '?').join(',')})` : ''}
      `;

      // Cette partie nécessiterait une fonction dans le service pour récupérer tous les IDs utilisateurs
      const result = await NotificationService.createSystemWideNotification({
        title,
        message,
        priority,
        send_email,
        exclude_user_ids
      });

      res.status(201).json(formatResponse(true, 'Notification système créée pour tous les utilisateurs', result));
    } catch (error) {
      next(error);
    }
  }

  // Supprimer les anciennes notifications (Admin seulement)
  static async cleanupOldNotifications(req, res, next) {
    try {
      const { days_old = 30 } = req.body;

      const result = await NotificationService.deleteOldNotifications(parseInt(days_old));

      res.json(formatResponse(true, 'Nettoyage des anciennes notifications effectué', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques des notifications (Admin seulement)
  static async getNotificationStats(req, res, next) {
    try {
      const {
        period = 'month',
        start_date,
        end_date
      } = req.query;

      const stats = await NotificationService.getNotificationStats({
        period,
        start_date,
        end_date
      });

      res.json(formatResponse(true, 'Statistiques des notifications récupérées', stats));
    } catch (error) {
      next(error);
    }
  }

  // Envoyer des notifications de rappel pour les emprunts (Admin seulement)
  static async sendLoanReminders(req, res, next) {
    try {
      const { 
        days_before_due = 3,
        include_overdue = true,
        custom_message = ''
      } = req.body;

      const result = await NotificationService.sendLoanReminders({
        days_before_due: parseInt(days_before_due),
        include_overdue,
        custom_message
      });

      res.json(formatResponse(true, 'Rappels d\'emprunts envoyés', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les notifications par type (Admin seulement)
  static async getNotificationsByType(req, res, next) {
    try {
      const { type } = req.params;
      const {
        page = 1,
        limit = 20,
        start_date,
        end_date
      } = req.query;

      const filters = {
        type,
        start_date,
        end_date
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await NotificationService.getNotificationsByType(filters, pagination);

      res.json(formatResponse(true, `Notifications de type ${type} récupérées`, result));
    } catch (error) {
      next(error);
    }
  }

  // Exporter les notifications (Admin seulement)
  static async exportNotifications(req, res, next) {
    try {
      const {
        format = 'csv',
        type = '',
        start_date,
        end_date,
        user_id = ''
      } = req.query;

      const filters = {
        type: type.trim(),
        start_date,
        end_date,
        user_id: user_id.trim()
      };

      const result = await NotificationService.exportNotifications(format, filters);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="notifications.${format}"`);
      res.send(result.data);
    } catch (error) {
      next(error);
    }
  }

  // Tester l'envoi d'email de notification (Admin seulement)
  static async testEmailNotification(req, res, next) {
    try {
      const { 
        email,
        notification_type = 'test',
        test_data = {}
      } = req.body;

      const result = await NotificationService.testEmailNotification(email, notification_type, test_data);

      res.json(formatResponse(true, 'Email de test envoyé', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les paramètres de notification d'un utilisateur
  static async getNotificationSettings(req, res, next) {
    try {
      const { userId } = req.user;

      const settings = await NotificationService.getUserNotificationSettings(userId);

      res.json(formatResponse(true, 'Paramètres de notification récupérés', settings));
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour les paramètres de notification d'un utilisateur
  static async updateNotificationSettings(req, res, next) {
    try {
      const { userId } = req.user;
      const settings = req.body;

      const updatedSettings = await NotificationService.updateUserNotificationSettings(userId, settings);

      res.json(formatResponse(true, 'Paramètres de notification mis à jour', updatedSettings));
    } catch (error) {
      next(error);
    }
  }

  // Route pour les Server-Sent Events (SSE)
  static async streamNotifications(req, res, next) {
    try {
      const { userId } = req.user;

      // Configuration SSE
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Envoyer un message initial
      res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connexion établie' })}\n\n`);

      // Configurer un intervalle pour vérifier les nouvelles notifications
      const intervalId = setInterval(async () => {
        try {
          const notifications = await NotificationService.getRealtimeNotifications(userId);
          if (notifications.length > 0) {
            res.write(`data: ${JSON.stringify({ type: 'notifications', data: notifications })}\n\n`);
          }
        } catch (error) {
          console.error('Erreur SSE notifications:', error);
        }
      }, 5000); // Vérifier toutes les 5 secondes

      // Nettoyer quand la connexion se ferme
      req.on('close', () => {
        clearInterval(intervalId);
        res.end();
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = NotificationController;