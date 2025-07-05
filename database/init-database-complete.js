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

const dbName = process.env.DB_NAME || 'yori_db';

async function initDatabase() {
  let connection;
  
  try {
    logger.info('🚀 Initialisation de la base de données YORI...');
    
    // Connexion sans spécifier la base (pour la créer)
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Créer la base de données si elle n'existe pas
    logger.info('📁 Création de la base de données...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.execute(`USE ${dbName}`);
    logger.info(`✅ Base de données '${dbName}' créée/sélectionnée`);
    
    // 2. Exécuter le schéma principal
    logger.info('🏗️ Création des tables...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');
    
    // Diviser le schéma en commandes individuelles
    const commands = schemaSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    for (const command of commands) {
      if (command.includes('CREATE TABLE') || command.includes('CREATE DATABASE') || command.includes('USE')) {
        try {
          await connection.execute(command);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            logger.warn(`Erreur lors de l'exécution: ${command.substring(0, 50)}...`);
            logger.warn(error.message);
          }
        }
      }
    }
    
    // 3. Exécuter les migrations dans l'ordre
    logger.info('📋 Exécution des migrations...');
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = await fs.readdir(migrationsDir);
    
    // Trier les fichiers de migration par ordre numérique
    const sortedMigrations = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const migrationFile of sortedMigrations) {
      try {
        logger.info(`  📄 Exécution: ${migrationFile}`);
        const migrationPath = path.join(migrationsDir, migrationFile);
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Exécuter les commandes de la migration
        const migrationCommands = migrationSQL
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (const command of migrationCommands) {
          if (command.trim().length > 0) {
            await connection.execute(command);
          }
        }
        
      } catch (error) {
        if (!error.message.includes('already exists')) {
          logger.warn(`Erreur dans ${migrationFile}: ${error.message}`);
        }
      }
    }
    
    // 4. Exécuter les seeders
    logger.info('🌱 Insertion des données de test...');
    const seedersDir = path.join(__dirname, 'seeders');
    const seederFiles = await fs.readdir(seedersDir);
    
    // Trier les fichiers de seeder par ordre numérique
    const sortedSeeders = seederFiles
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const seederFile of sortedSeeders) {
      try {
        logger.info(`  🌱 Insertion: ${seederFile}`);
        const seederPath = path.join(seedersDir, seederFile);
        const seederSQL = await fs.readFile(seederPath, 'utf8');
        
        // Vérifier si il y a déjà des données pour éviter les doublons
        if (seederFile.includes('users')) {
          const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
          if (users[0].count > 0) {
            logger.info(`  ⏭️ Table users déjà remplie, passage au suivant`);
            continue;
          }
        }
        
        if (seederFile.includes('books')) {
          const [books] = await connection.execute('SELECT COUNT(*) as count FROM books');
          if (books[0].count > 0) {
            logger.info(`  ⏭️ Table books déjà remplie, passage au suivant`);
            continue;
          }
        }

        if (seederFile.includes('loans')) {
          const [loans] = await connection.execute('SELECT COUNT(*) as count FROM loans');
          if (loans[0].count > 0) {
            logger.info(`  ⏭️ Table loans déjà remplie, passage au suivant`);
            continue;
          }
        }
          // Exécuter les commandes du seeder
        const seederCommands = seederSQL
          .split(';')
          .map(cmd => cmd.trim())
          .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

        for (const command of seederCommands) {
          if (command.trim().length > 0 && (command.includes('INSERT') || command.includes('UPDATE'))) {
            await connection.execute(command);
          }
        }
        
      } catch (error) {
        if (!error.message.includes('Duplicate entry')) {
          logger.warn(`Erreur dans ${seederFile}: ${error.message}`);
        }
      }
    }
    
    // 5. Vérifications finales
    logger.info('🔍 Vérification de l\'installation...');
    const [tables] = await connection.execute('SHOW TABLES');
    logger.info(`📊 Tables créées: ${tables.length}`);
    tables.forEach(table => {
      logger.info(`  ✓ ${Object.values(table)[0]}`);
    });
    
    // Compter les enregistrements
    const [usersCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [booksCount] = await connection.execute('SELECT COUNT(*) as count FROM books');
    const [loansCount] = await connection.execute('SELECT COUNT(*) as count FROM loans');
    const [notificationsCount] = await connection.execute('SELECT COUNT(*) as count FROM notifications');
    const [likesCount] = await connection.execute('SELECT COUNT(*) as count FROM user_book_likes');
    
    logger.info('📈 Données insérées:');
    logger.info(`  👥 Utilisateurs: ${usersCount[0].count}`);
    logger.info(`  📚 Livres: ${booksCount[0].count}`);
    logger.info(`  📖 Emprunts: ${loansCount[0].count}`);
    logger.info(`  🔔 Notifications: ${notificationsCount[0].count}`);
    logger.info(`  ❤️ Likes: ${likesCount[0].count}`);
    
    logger.info('🎉 Initialisation de la base de données terminée avec succès!');
    
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Fonction de reset complet
async function resetDatabase() {
  let connection;
  
  try {
    logger.info('🗑️ Reset complet de la base de données...');
    
    connection = await mysql.createConnection(dbConfig);
    
    // Supprimer la base de données
    await connection.execute(`DROP DATABASE IF EXISTS ${dbName}`);
    logger.info(`🗑️ Base de données '${dbName}' supprimée`);
    
    // Réinitialiser
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
    resetDatabase().catch(console.error);
  } else {
    initDatabase().catch(console.error);
  }
}
