const cron = require('node-cron');
const { logger } = require('../utils/helpers');
const LoanService = require('../services/loan.service');
const NotificationService = require('../services/notification.service');
const EmailService = require('../services/email.service');
const db = require('../config/database');

class NotificationJobs {
  /**
   * Notifier l'admin lors de la création d'un nouvel avis
   * @param {string|number} reviewId
   */
  static async sendAdminReviewNotification(reviewId) {
    const ReviewService = require('../services/review.service');
    try {
      // Récupérer l'avis
      const review = await ReviewService.getReviewById(reviewId);
      if (!review) throw new Error('Avis non trouvé');

      // Récupérer les admins
      const admins = await db.query(
        "SELECT id, email, first_name, last_name FROM users WHERE role = 'admin' AND status = 'active'"
      );
      if (!admins.length) throw new Error('Aucun admin trouvé');

      const notifResults = [];
      for (const admin of admins) {
        // Créer notification
        const notification = await NotificationService.create({
          user_id: admin.id,
          type: 'review_new',
          title: 'Nouvel avis à modérer',
          message: `Un nouvel avis a été posté sur le livre "${review.book_title}" par ${review.reviewer_name}.`,
          metadata: {
            review_id: review.id,
            book_id: review.book_id,
            user_id: review.user_id,
            rating: review.rating
          }
        });

        // Envoyer email (optionnel)
        if (typeof EmailService.sendAdminReviewNotification === 'function') {
          await EmailService.sendAdminReviewNotification({
            email: admin.email,
            name: `${admin.first_name} ${admin.last_name}`,
            review
          });
        }

        notifResults.push({
          admin_id: admin.id,
          notification_id: notification.id,
          email: admin.email
        });
      }
      return notifResults;
    } catch (error) {
      logger.error('❌ Erreur notification admin nouvel avis:', error);
      throw error;
    }
  }
  // Vérifier les emprunts qui arrivent à échéance (tous les jours à 9h)
  static scheduleDueDateReminders() {
    cron.schedule('0 9 * * *', async () => {
      try {
        logger.info('📅 Vérification des dates d\'échéance...');
        
        // Emprunts qui arrivent à échéance dans 3 jours
        const upcomingQuery = `
          SELECT l.*, u.email, u.first_name, u.last_name, b.title, b.author
          FROM loans l
          JOIN users u ON l.user_id = u.id
          JOIN books b ON l.book_id = b.id
          WHERE l.status = 'active'
          AND DATE(l.due_date) = DATE(DATE_ADD(NOW(), INTERVAL 3 DAY))
          AND l.reminder_sent = false
        `;
        
        const upcomingLoans = await db.query(upcomingQuery);
        
        for (const loan of upcomingLoans) {
          try {
            // Créer notification
            await NotificationService.create({
              user_id: loan.user_id,
              type: 'loan_reminder',
              title: 'Rappel d\'échéance',
              message: `Le livre "${loan.title}" doit être retourné dans 3 jours (${new Date(loan.due_date).toLocaleDateString('fr-FR')})`,
              metadata: {
                loan_id: loan.id,
                book_id: loan.book_id,
                due_date: loan.due_date
              }
            });
            
            // Envoyer email
            await EmailService.sendLoanReminder({
              email: loan.email,
              name: `${loan.first_name} ${loan.last_name}`,
              bookTitle: loan.title,
              author: loan.author,
              dueDate: loan.due_date,
              daysLeft: 3
            });
            
            // Marquer comme envoyé
            await db.query(
              'UPDATE loans SET reminder_sent = true WHERE id = ?',
              [loan.id]
            );
            
            logger.info(`📧 Rappel envoyé pour l'emprunt ${loan.id}`);
          } catch (error) {
            logger.error(`❌ Erreur envoi rappel emprunt ${loan.id}:`, error);
          }
        }
        
        logger.info(`✅ ${upcomingLoans.length} rappels d'échéance traités`);
      } catch (error) {
        logger.error('❌ Erreur lors des rappels d\'échéance:', error);
      }
    });
  }

  // Vérifier les emprunts en retard (tous les jours à 10h)
  static scheduleOverdueNotifications() {
    cron.schedule('0 10 * * *', async () => {
      try {
        logger.info('⏰ Vérification des emprunts en retard...');
        
        const overdueQuery = `
          SELECT l.*, u.email, u.first_name, u.last_name, b.title, b.author,
                 DATEDIFF(NOW(), l.due_date) as days_overdue
          FROM loans l
          JOIN users u ON l.user_id = u.id
          JOIN books b ON l.book_id = b.id
          WHERE l.status = 'active'
          AND DATE(l.due_date) < DATE(NOW())
          AND (l.overdue_notification_sent = false OR 
               DATE(l.last_overdue_notification) < DATE(NOW()))
        `;
        
        const overdueLoans = await db.query(overdueQuery);
        
        for (const loan of overdueLoans) {
          try {
            const penalty = await LoanService.calculatePenalty(loan.id);
            
            // Créer notification
            await NotificationService.create({
              user_id: loan.user_id,
              type: 'loan_overdue',
              title: 'Emprunt en retard',
              message: `Le livre "${loan.title}" est en retard de ${loan.days_overdue} jour(s). Pénalité: ${penalty.amount}€`,
              metadata: {
                loan_id: loan.id,
                book_id: loan.book_id,
                days_overdue: loan.days_overdue,
                penalty_amount: penalty.amount
              }
            });
            
            // Envoyer email
            await EmailService.sendOverdueNotification({
              email: loan.email,
              name: `${loan.first_name} ${loan.last_name}`,
              bookTitle: loan.title,
              author: loan.author,
              dueDate: loan.due_date,
              daysOverdue: loan.days_overdue,
              penaltyAmount: penalty.amount
            });
            
            // Mettre à jour le statut
            await db.query(`
              UPDATE loans 
              SET overdue_notification_sent = true, 
                  last_overdue_notification = NOW()
              WHERE id = ?
            `, [loan.id]);
            
            logger.info(`📧 Notification retard envoyée pour l'emprunt ${loan.id}`);
          } catch (error) {
            logger.error(`❌ Erreur notification retard emprunt ${loan.id}:`, error);
          }
        }
        
        logger.info(`✅ ${overdueLoans.length} notifications de retard traitées`);
      } catch (error) {
        logger.error('❌ Erreur lors des notifications de retard:', error);
      }
    });
  }

  // Envoyer les nouvelles sorties de livres (tous les lundis à 11h)
  static scheduleNewBooksNotifications() {
    cron.schedule('0 11 * * 1', async () => {
      try {
        logger.info('📚 Envoi des notifications nouvelles sorties...');
        
        // Livres ajoutés la semaine dernière
        const newBooksQuery = `
          SELECT * FROM books 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND status = 'available'
          ORDER BY created_at DESC
        `;
        
        const newBooks = await db.query(newBooksQuery);
        
        if (newBooks.length > 0) {
          // Utilisateurs qui veulent recevoir les notifications
          const usersQuery = `
            SELECT id, email, first_name, last_name 
            FROM users 
            WHERE notification_preferences LIKE '%new_books%'
            AND status = 'active'
          `;
          
          const users = await db.query(usersQuery);
          
          for (const user of users) {
            try {
              // Créer notification
              await NotificationService.create({
                user_id: user.id,
                type: 'new_books',
                title: 'Nouvelles sorties',
                message: `${newBooks.length} nouveau(x) livre(s) ajouté(s) cette semaine`,
                metadata: {
                  books_count: newBooks.length,
                  books: newBooks.slice(0, 5).map(b => ({
                    id: b.id,
                    title: b.title,
                    author: b.author
                  }))
                }
              });
              
              // Envoyer email
              await EmailService.sendNewBooksNotification({
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                books: newBooks.slice(0, 10)
              });
              
              logger.info(`📧 Notification nouvelles sorties envoyée à ${user.email}`);
            } catch (error) {
              logger.error(`❌ Erreur notification nouvelles sorties ${user.email}:`, error);
            }
          }
          
          logger.info(`✅ Notifications nouvelles sorties envoyées à ${users.length} utilisateurs`);
        }
      } catch (error) {
        logger.error('❌ Erreur lors des notifications nouvelles sorties:', error);
      }
    });
  }

  // Envoyer des recommandations personnalisées (tous les vendredis à 14h)
  static schedulePersonalizedRecommendations() {
    cron.schedule('0 14 * * 5', async () => {
      try {
        logger.info('🎯 Génération des recommandations personnalisées...');
        
        // Utilisateurs actifs qui veulent des recommandations
        const usersQuery = `
          SELECT u.id, u.email, u.first_name, u.last_name,
                 GROUP_CONCAT(DISTINCT b.category) as preferred_categories
          FROM users u
          LEFT JOIN loans l ON u.id = l.user_id
          LEFT JOIN books b ON l.book_id = b.id
          WHERE u.notification_preferences LIKE '%recommendations%'
          AND u.status = 'active'
          AND u.last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY u.id
          HAVING COUNT(l.id) > 0
        `;
        
        const users = await db.query(usersQuery);
        
        for (const user of users) {
          try {
            const categories = user.preferred_categories ? 
              user.preferred_categories.split(',') : [];
            
            // Trouver des livres similaires
            const recommendationsQuery = `
              SELECT * FROM books
              WHERE status = 'available'
              ${categories.length > 0 ? `AND category IN (${categories.map(() => '?').join(',')})` : ''}
              AND id NOT IN (
                SELECT book_id FROM loans WHERE user_id = ?
              )
              ORDER BY rating DESC, created_at DESC
              LIMIT 5
            `;
            
            const params = categories.length > 0 ? 
              [...categories, user.id] : [user.id];
            
            const recommendations = await db.query(recommendationsQuery, params);
            
            if (recommendations.length > 0) {
              // Créer notification
              await NotificationService.create({
                user_id: user.id,
                type: 'recommendations',
                title: 'Recommandations pour vous',
                message: `Découvrez ${recommendations.length} livre(s) qui pourraient vous intéresser`,
                metadata: {
                  recommendations: recommendations.map(b => ({
                    id: b.id,
                    title: b.title,
                    author: b.author,
                    rating: b.rating
                  }))
                }
              });
              
              // Envoyer email
              await EmailService.sendRecommendations({
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                recommendations: recommendations
              });
              
              logger.info(`📧 Recommandations envoyées à ${user.email}`);
            }
          } catch (error) {
            logger.error(`❌ Erreur recommandations ${user.email}:`, error);
          }
        }
        
        logger.info(`✅ Recommandations traitées pour ${users.length} utilisateurs`);
      } catch (error) {
        logger.error('❌ Erreur lors des recommandations:', error);
      }
    });
  }

  // Envoyer un résumé d'activité mensuel (le 1er de chaque mois à 12h)
  static scheduleMonthlyActivitySummary() {
    cron.schedule('0 12 1 * *', async () => {
      try {
        logger.info('📊 Génération du résumé d\'activité mensuel...');
        
        const usersQuery = `
          SELECT id, email, first_name, last_name 
          FROM users 
          WHERE notification_preferences LIKE '%monthly_summary%'
          AND status = 'active'
        `;
        
        const users = await db.query(usersQuery);
        
        for (const user of users) {
          try {
            // Statistiques du mois dernier
            const statsQuery = `
              SELECT 
                COUNT(CASE WHEN l.created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY), INTERVAL 1 MONTH) 
                               AND l.created_at < DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY) THEN 1 END) as loans_last_month,
                COUNT(CASE WHEN l.returned_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY), INTERVAL 1 MONTH) 
                               AND l.returned_at < DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY) THEN 1 END) as returns_last_month,
                COUNT(CASE WHEN r.created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY), INTERVAL 1 MONTH) 
                               AND r.created_at < DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY) THEN 1 END) as reviews_last_month
              FROM users u
              LEFT JOIN loans l ON u.id = l.user_id
              LEFT JOIN reviews r ON u.id = r.user_id
              WHERE u.id = ?
            `;
            
            const stats = await db.query(statsQuery, [user.id]);
            const userStats = stats[0];
            
            if (userStats.loans_last_month > 0 || userStats.returns_last_month > 0) {
              // Créer notification
              await NotificationService.create({
                user_id: user.id,
                type: 'monthly_summary',
                title: 'Résumé mensuel',
                message: `Le mois dernier: ${userStats.loans_last_month} emprunt(s), ${userStats.returns_last_month} retour(s)`,
                metadata: {
                  loans: userStats.loans_last_month,
                  returns: userStats.returns_last_month,
                  reviews: userStats.reviews_last_month
                }
              });
              
              // Envoyer email
              await EmailService.sendMonthlySummary({
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                stats: userStats
              });
              
              logger.info(`📧 Résumé mensuel envoyé à ${user.email}`);
            }
          } catch (error) {
            logger.error(`❌ Erreur résumé mensuel ${user.email}:`, error);
          }
        }
        
        logger.info(`✅ Résumés mensuels traités pour ${users.length} utilisateurs`);
      } catch (error) {
        logger.error('❌ Erreur lors des résumés mensuels:', error);
      }
    });
  }

  // Nettoyer les notifications non lues anciennes (tous les jours à 23h)
  static scheduleUnreadNotificationReminders() {
    cron.schedule('0 23 * * *', async () => {
      try {
        logger.info('🔔 Rappel notifications non lues...');
        
        const unreadQuery = `
          SELECT n.user_id, u.email, u.first_name, u.last_name, 
                 COUNT(n.id) as unread_count
          FROM notifications n
          JOIN users u ON n.user_id = u.id
          WHERE n.read_at IS NULL
          AND n.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          AND n.created_at <= DATE_SUB(NOW(), INTERVAL 1 DAY)
          AND u.notification_preferences LIKE '%unread_reminders%'
          GROUP BY n.user_id
          HAVING unread_count >= 3
        `;
        
        const usersWithUnread = await db.query(unreadQuery);
        
        for (const user of usersWithUnread) {
          try {
            // Créer notification de rappel
            await NotificationService.create({
              user_id: user.user_id,
              type: 'unread_reminder',
              title: 'Notifications non lues',
              message: `Vous avez ${user.unread_count} notification(s) non lue(s)`,
              metadata: {
                unread_count: user.unread_count
              }
            });
            
            logger.info(`🔔 Rappel notifications envoyé à ${user.email}`);
          } catch (error) {
            logger.error(`❌ Erreur rappel notifications ${user.email}:`, error);
          }
        }
        
        logger.info(`✅ ${usersWithUnread.length} rappels de notifications traités`);
      } catch (error) {
        logger.error('❌ Erreur lors des rappels de notifications:', error);
      }
    });
  }

  // Démarrer toutes les tâches de notification
  static startAllNotificationJobs() {
    logger.info('🚀 Démarrage des tâches de notification programmées...');
    
    this.scheduleDueDateReminders();
    this.scheduleOverdueNotifications();
    this.scheduleNewBooksNotifications();
    this.schedulePersonalizedRecommendations();
    this.scheduleMonthlyActivitySummary();
    this.scheduleUnreadNotificationReminders();
    
    logger.info('✅ Toutes les tâches de notification sont programmées');
  }

  // Envoyer une notification immédiate
  static async sendImmediateNotification(type, users, data) {
    try {
      logger.info(`📧 Envoi notification immédiate: ${type}`);
      
      const results = [];
      
      for (const user of users) {
        try {
          let notification, email;
          
          switch (type) {
            case 'system_maintenance':
              notification = await NotificationService.create({
                user_id: user.id,
                type: 'system_maintenance',
                title: 'Maintenance système',
                message: data.message,
                metadata: data.metadata || {}
              });
              
              email = await EmailService.sendSystemMaintenance({
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                ...data
              });
              break;
              
            case 'urgent_announcement':
              notification = await NotificationService.create({
                user_id: user.id,
                type: 'announcement',
                title: data.title,
                message: data.message,
                metadata: { urgent: true, ...data.metadata }
              });
              
              email = await EmailService.sendUrgentAnnouncement({
                email: user.email,
                name: `${user.first_name} ${user.last_name}`,
                ...data
              });
              break;
              
            default:
              throw new Error(`Type de notification non supporté: ${type}`);
          }
          
          results.push({
            user_id: user.id,
            email: user.email,
            notification_id: notification.id,
            status: 'sent'
          });
          
        } catch (error) {
          logger.error(`❌ Erreur notification immédiate ${user.email}:`, error);
          results.push({
            user_id: user.id,
            email: user.email,
            status: 'failed',
            error: error.message
          });
        }
      }
      
      logger.info(`✅ Notification immédiate ${type} traitée pour ${users.length} utilisateurs`);
      return results;
      
    } catch (error) {
      logger.error('❌ Erreur lors de l\'envoi de notification immédiate:', error);
      throw error;
    }
  }
}

module.exports = NotificationJobs;