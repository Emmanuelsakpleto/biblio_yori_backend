const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../src/utils/logger');

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  charset: 'utf8mb4'
};

/**
 * Initialise la base de données YORI avec le fichier SQL complet
 */
async function initDatabase() {
  let connection;
  
  try {
    logger.info('🚀 Initialisation de la base de données YORI...');
    
    // Connexion sans spécifier la base
    connection = await mysql.createConnection(dbConfig);
    
    // Lire et exécuter le fichier SQL complet
    const sqlPath = path.join(__dirname, 'yori_complete.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    logger.info('📄 Exécution du script SQL complet...');
    await connection.execute(sqlContent);
    
    logger.info('✅ Base de données YORI initialisée avec succès!');
    
    // Vérifications finales
    await connection.execute('USE yori_db');
    const [tables] = await connection.execute('SHOW TABLES');
    const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [booksCount] = await connection.execute('SELECT COUNT(*) as count FROM books');
    
    logger.info(`📊 Tables créées: ${tables.length}`);
    logger.info(`👥 Utilisateurs: ${usersCount[0].count}`);
    logger.info(`📚 Livres: ${booksCount[0].count}`);
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Reset complet de la base de données
 */
async function resetDatabase() {
  let connection;
  
  try {
    logger.info('🗑️ Reset complet de la base de données...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Supprimer la base si elle existe
    await connection.execute('DROP DATABASE IF EXISTS yori_db');
    logger.info('🗑️ Ancienne base de données supprimée');
    
    // Réinitialiser avec le fichier complet
    await initDatabase();
    
  } catch (error) {
    logger.error('❌ Erreur lors du reset:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = {
  initDatabase,
  resetDatabase
};

// Exécution directe si appelé depuis la ligne de commande
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'reset') {
    resetDatabase()
      .then(() => {
        console.log('✅ Reset terminé avec succès!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Erreur lors du reset:', error);
        process.exit(1);
      });
  } else {
    initDatabase()
      .then(() => {
        console.log('✅ Initialisation terminée avec succès!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        process.exit(1);
      });
  }
}
