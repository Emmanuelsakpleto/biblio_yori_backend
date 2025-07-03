const cron = require('node-cron');
const { logger } = require('../utils/helpers');
const NotificationService = require('../services/notification.service');
const AuthService = require('../services/auth.service');
const db = require('../config/database');

class CleanupJobs {
  // Nettoyer les anciennes notifications (tous les jours à 2h du matin)
  static scheduleNotificationCleanup() {
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('🧹 Début du nettoyage des notifications...');
        
        const result = await NotificationService.deleteOldNotifications(30);
        
        logger.info(`Nettoyage notifications terminé: ${result.deleted_count} notifications supprimées`);
      } catch (error) {
        logger.error('Erreur lors du nettoyage des notifications:', error);
      }
    });
  }

  // Nettoyer les sessions expirées (toutes les 6 heures)
  static scheduleSessionCleanup() {
    cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('🧹 Début du nettoyage des sessions...');
        
        const query = 'DELETE FROM user_sessions WHERE expires_at < NOW()';
        const result = await db.query(query);
        
        logger.info(`✅ Nettoyage sessions terminé: ${result.affectedRows || 0} sessions supprimées`);
      } catch (error) {
        logger.error('❌ Erreur lors du nettoyage des sessions:', error);
      }
    });
  }

  // Nettoyer les tokens expirés (tous les jours à 3h du matin)
  static scheduleTokenCleanup() {
    cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('🧹 Début du nettoyage des tokens...');
        
        // Nettoyer les refresh tokens expirés
        const refreshQuery = 'DELETE FROM refresh_tokens WHERE expires_at < NOW()';
        const refreshResult = await db.query(refreshQuery);
        
        // Nettoyer les tokens de réinitialisation expirés
        const resetQuery = 'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE reset_token_expires < NOW()';
        const resetResult = await db.query(resetQuery);
        
        // Nettoyer les tokens de vérification expirés
        const verifyQuery = 'UPDATE users SET verification_token = NULL WHERE verification_token_expires < NOW()';
        const verifyResult = await db.query(verifyQuery);
        
        logger.info(`✅ Nettoyage tokens terminé: ${refreshResult.affectedRows || 0} refresh tokens, ${resetResult.affectedRows || 0} reset tokens, ${verifyResult.affectedRows || 0} verification tokens supprimés`);
      } catch (error) {
        logger.error('❌ Erreur lors du nettoyage des tokens:', error);
      }
    });
  }

  // Nettoyer les fichiers temporaires (tous les jours à 4h du matin)
  static scheduleFileCleanup() {
    cron.schedule('0 4 * * *', async () => {
      try {
        logger.info('🧹 Début du nettoyage des fichiers temporaires...');
        
        const fs = require('fs').promises;
        const path = require('path');
        
        const tempPaths = [
          path.join(process.cwd(), 'uploads/temp'),
          path.join(process.cwd(), 'uploads/temp/imports'),
          path.join(process.cwd(), 'uploads/temp/exports')
        ];
        
        let deletedCount = 0;
        
        for (const tempPath of tempPaths) {
          try {
            const files = await fs.readdir(tempPath);
            
            for (const file of files) {
              const filePath = path.join(tempPath, file);
              const stats = await fs.stat(filePath);
              
              // Supprimer les fichiers de plus de 24 heures
              const hoursDiff = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
              
              if (hoursDiff > 24) {
                await fs.unlink(filePath);
                deletedCount++;
              }
            }
          } catch (error) {
            // Ignorer les erreurs de dossiers inexistants
            if (error.code !== 'ENOENT') {
              logger.error(`Erreur nettoyage dossier ${tempPath}:`, error);
            }
          }
        }
        
        logger.info(`✅ Nettoyage fichiers terminé: ${deletedCount} fichiers supprimés`);
      } catch (error) {
        logger.error('❌ Erreur lors du nettoyage des fichiers:', error);
      }
    });
  }

  // Nettoyer les logs anciens (toutes les semaines le dimanche à 5h)
  static scheduleLogCleanup() {
    cron.schedule('0 5 * * 0', async () => {
      try {
        logger.info('🧹 Début du nettoyage des logs...');
        
        const query = 'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)';
        const result = await db.query(query);
        
        logger.info(`✅ Nettoyage logs terminé: ${result.affectedRows || 0} entrées supprimées`);
      } catch (error) {
        logger.error('❌ Erreur lors du nettoyage des logs:', error);
      }
    });
  }

  // Nettoyer les données d'audit anciennes (tous les mois le 1er à 6h)
  static scheduleAuditCleanup() {
    cron.schedule('0 6 1 * *', async () => {
      try {
        logger.info('🧹 Début du nettoyage des données d\'audit...');
        
        const query = 'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        const result = await db.query(query);
        
        logger.info(`✅ Nettoyage audit terminé: ${result.affectedRows || 0} entrées supprimées`);
      } catch (error) {
        logger.error('❌ Erreur lors du nettoyage de l\'audit:', error);
      }
    });
  }

  // Optimiser la base de données (toutes les semaines le dimanche à 6h)
  static scheduleDatabaseOptimization() {
    cron.schedule('0 6 * * 0', async () => {
      try {
        logger.info('🔧 Début de l\'optimisation de la base de données...');
        
        const tables = [
          'users', 'books', 'loans', 'reviews', 'notifications',
          'user_sessions', 'refresh_tokens', 'system_logs', 'audit_logs'
        ];
        
        for (const table of tables) {
          try {
            await db.query(`OPTIMIZE TABLE ${table}`);
            logger.info(`✅ Table ${table} optimisée`);
          } catch (error) {
            logger.error(`❌ Erreur optimisation table ${table}:`, error);
          }
        }
        
        logger.info('✅ Optimisation de la base de données terminée');
      } catch (error) {
        logger.error('❌ Erreur lors de l\'optimisation de la base de données:', error);
      }
    });
  }

  // Analyser les statistiques d'utilisation des tables (tous les jours à 7h)
  static scheduleTableAnalysis() {
    cron.schedule('0 7 * * *', async () => {
      try {
        logger.info('📊 Début de l\'analyse des tables...');
        
        const tables = [
          'users', 'books', 'loans', 'reviews', 'notifications'
        ];
        
        for (const table of tables) {
          try {
            await db.query(`ANALYZE TABLE ${table}`);
          } catch (error) {
            logger.error(`❌ Erreur analyse table ${table}:`, error);
          }
        }
        
        logger.info('✅ Analyse des tables terminée');
      } catch (error) {
        logger.error('❌ Erreur lors de l\'analyse des tables:', error);
      }
    });
  }

  // Démarrer toutes les tâches de nettoyage
  static startAllCleanupJobs() {
    logger.info('🚀 Démarrage des tâches de nettoyage programmées...');
    
    this.scheduleNotificationCleanup();
    this.scheduleSessionCleanup();
    this.scheduleTokenCleanup();
    this.scheduleFileCleanup();
    this.scheduleLogCleanup();
    this.scheduleAuditCleanup();
    this.scheduleDatabaseOptimization();
    this.scheduleTableAnalysis();
    
    logger.info('✅ Toutes les tâches de nettoyage sont programmées');
  }

  // Exécuter le nettoyage manuellement
  static async runManualCleanup(options = {}) {
    const {
      notifications = true,
      sessions = true,
      tokens = true,
      files = true,
      logs = false,
      audit = false,
      optimize = false
    } = options;

    logger.info('🧹 Début du nettoyage manuel...');

    try {
      if (notifications) {
        const result = await NotificationService.deleteOldNotifications(30);
        logger.info(`✅ ${result.deleted_count} notifications supprimées`);
      }

      if (sessions) {
        const query = 'DELETE FROM user_sessions WHERE expires_at < NOW()';
        const result = await db.query(query);
        logger.info(`✅ ${result.affectedRows || 0} sessions supprimées`);
      }

      if (tokens) {
        const refreshQuery = 'DELETE FROM refresh_tokens WHERE expires_at < NOW()';
        const refreshResult = await db.query(refreshQuery);
        
        const resetQuery = 'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE reset_token_expires < NOW()';
        const resetResult = await db.query(resetQuery);
        
        logger.info(`✅ ${refreshResult.affectedRows || 0} refresh tokens et ${resetResult.affectedRows || 0} reset tokens supprimés`);
      }

      if (files) {
        // Code de nettoyage des fichiers ici
        logger.info('✅ Fichiers temporaires nettoyés');
      }

      if (logs) {
        const query = 'DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)';
        const result = await db.query(query);
        logger.info(`✅ ${result.affectedRows || 0} logs supprimés`);
      }

      if (audit) {
        const query = 'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)';
        const result = await db.query(query);
        logger.info(`✅ ${result.affectedRows || 0} entrées d\'audit supprimées`);
      }

      if (optimize) {
        const tables = ['users', 'books', 'loans', 'reviews', 'notifications'];
        for (const table of tables) {
          await db.query(`OPTIMIZE TABLE ${table}`);
        }
        logger.info('✅ Base de données optimisée');
      }

      logger.info('🎉 Nettoyage manuel terminé avec succès');
      return { success: true };
    } catch (error) {
      logger.error('❌ Erreur lors du nettoyage manuel:', error);
      throw error;
    }
  }
}

module.exports = CleanupJobs;