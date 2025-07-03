require('dotenv').config();
const app = require('./app');
const database = require('./config/database');
const { logger } = require('./utils/helpers');

const PORT = process.env.PORT || 5000;

/**
 * Démarrage du serveur
 */
async function startServer() {
  try {
    // Connexion à la base de données
    await database.connect();
    logger.info('🔗 Base de données connectée');

    // Démarrage du serveur HTTP
    const server = app.listen(PORT, () => {
      logger.info(`Serveur YORI démarré sur le port ${PORT}`);
      logger.info(`Environnement: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`URL: http://localhost:${PORT}`);
    });

    // Gestion gracieuse de l'arrêt
    const gracefulShutdown = async (signal) => {
      logger.info(`Signal ${signal} reçu, arrêt en cours...`);
      
      server.close(async () => {
        logger.info('Serveur HTTP fermé');
        
        try {
          await database.close();
          logger.info('Connexion à la base de données fermée');
          process.exit(0);
        } catch (error) {
          logger.error('Erreur lors de la fermeture de la base de données:', error);
          process.exit(1);
        }
      });

      // Force l'arrêt après 10 secondes
      setTimeout(() => {
        logger.error('Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    // Écoute des signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      logger.error('Exception non capturée:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Promesse rejetée non gérée:', { reason, promise });
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Démarrer le serveur seulement si ce fichier est exécuté directement
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
