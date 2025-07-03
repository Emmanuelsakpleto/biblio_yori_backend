#!/usr/bin/env node

/**
 * 🚀 SCRIPT D'INITIALISATION DE LA BASE DE DONNÉES
 * 
 * Ce script exécute toutes les migrations et seeders pour configurer
 * une base de données complète avec des données de test.
 * 
 * Utilisation:
 * npm run db:init
 * 
 * Ou directement:
 * node database/init-database.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la base de données
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lectura_db',
  multipleStatements: true
};

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function executeSQL(connection, filePath, description) {
  try {
    log(`\n📂 Exécution: ${description}`, colors.cyan);
    log(`   Fichier: ${path.basename(filePath)}`, colors.blue);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Nettoyer le SQL en supprimant les commentaires et lignes vides
    const cleanedSQL = sql
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n');
    
    // Diviser en instructions SQL séparées
    const statements = cleanedSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    log(`   📊 ${statements.length} instruction(s) SQL à exécuter`, colors.blue);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          log(`   🔄 Instruction ${i + 1}/${statements.length}...`, colors.yellow);
          await connection.execute(statement);
          log(`   ✅ Instruction ${i + 1} exécutée`, colors.green);
        } catch (stmtError) {
          log(`   ❌ Erreur instruction ${i + 1}: ${stmtError.message}`, colors.red);
          log(`   📝 SQL: ${statement.substring(0, 100)}...`, colors.red);
          throw stmtError;
        }
      }
    }
    
    log(`   ✅ Toutes les instructions exécutées avec succès!`, colors.green);
    return true;
  } catch (error) {
    log(`   ❌ Erreur: ${error.message}`, colors.red);
    return false;
  }
}

async function initDatabase() {
  let connection;
  
  try {
    log('🚀 INITIALISATION DE LA BASE DE DONNÉES LECTURA', colors.bright);
    log('=' .repeat(50), colors.yellow);
    
    // Connexion à la base de données
    log('\n🔌 Connexion à la base de données...', colors.cyan);
    connection = await mysql.createConnection(DB_CONFIG);
    log('   ✅ Connexion établie!', colors.green);
    
    // Ordre d'exécution des migrations
    const migrations = [
      {
        file: 'database/migrations/001_create_users_table.sql',
        description: 'Création de la table users'
      },
      {
        file: 'database/migrations/002_create_books_table.sql',
        description: 'Création de la table books'
      },
      {
        file: 'database/migrations/003_create_loans_table.sql',
        description: 'Création de la table loans'
      },
      {
        file: 'database/migrations/004_create_reviews_table.sql',
        description: 'Création de la table reviews'
      },
      {
        file: 'database/migrations/005_create_notifications_table.sql',
        description: 'Création de la table notifications'
      },
      {
        file: 'database/migrations/006_create_user_sessions_table.sql',
        description: 'Création de la table user_sessions'
      }
    ];
    
    // Ordre d'exécution des seeders
    const seeders = [
      {
        file: 'database/seeders/001_users_seeder.sql',
        description: 'Insertion des utilisateurs par défaut'
      },
      {
        file: 'database/seeders/002_books_seeder.sql',
        description: 'Insertion des livres de démonstration'
      },
      {
        file: 'database/seeders/003_loans_seeder.sql',
        description: 'Insertion des emprunts de test'
      }
    ];
    
    log('\n🏗️  EXÉCUTION DES MIGRATIONS', colors.bright);
    log('-' .repeat(30), colors.yellow);
    
    let migrationSuccess = true;
    for (const migration of migrations) {
      const success = await executeSQL(connection, migration.file, migration.description);
      if (!success) {
        migrationSuccess = false;
        break;
      }
    }
    
    if (!migrationSuccess) {
      log('\n❌ Échec des migrations. Arrêt du processus.', colors.red);
      return;
    }
    
    log('\n🌱 EXÉCUTION DES SEEDERS', colors.bright);
    log('-' .repeat(30), colors.yellow);
    
    let seederSuccess = true;
    for (const seeder of seeders) {
      const success = await executeSQL(connection, seeder.file, seeder.description);
      if (!success) {
        seederSuccess = false;
        break;
      }
    }
    
    if (seederSuccess) {
      log('\n🎉 INITIALISATION TERMINÉE AVEC SUCCÈS!', colors.green + colors.bright);
      log('\n📋 COMPTES CRÉÉS:', colors.cyan);
      log('   👨‍💼 Admin: admin@lectura.com', colors.blue);
      log('   📚 Bibliothécaire: librarian@lectura.com', colors.blue);
      log('   🎓 Étudiant: student@lectura.com', colors.blue);
      log('   🔑 Mot de passe pour tous: Password123!', colors.magenta);
      
      log('\n📊 DONNÉES DE TEST:', colors.cyan);
      log('   📖 10 livres d\'exemple ajoutés', colors.blue);
      log('   📝 5 emprunts de démonstration créés', colors.blue);
      log('   👥 8 utilisateurs de test disponibles', colors.blue);
    } else {
      log('\n⚠️  Migrations réussies mais erreurs dans les seeders', colors.yellow);
    }
    
  } catch (error) {
    log(`\n💥 Erreur générale: ${error.message}`, colors.red);
    log('Stack trace:', colors.red);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      log('\n🔌 Connexion fermée.', colors.cyan);
    }
  }
}

// Vérifier que les fichiers existent
function checkFiles() {
  const requiredFiles = [
    'database/migrations/001_create_users_table.sql',
    'database/migrations/002_create_books_table.sql',
    'database/migrations/003_create_loans_table.sql',
    'database/migrations/004_create_reviews_table.sql',
    'database/migrations/005_create_notifications_table.sql',
    'database/migrations/006_create_user_sessions_table.sql',
    'database/seeders/001_users_seeder.sql',
    'database/seeders/002_books_seeder.sql',
    'database/seeders/003_loans_seeder.sql'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`❌ Fichier manquant: ${file}`, colors.red);
      return false;
    }
  }
  return true;
}

// Exécution du script
if (require.main === module) {
  if (!checkFiles()) {
    log('❌ Fichiers de migration/seeder manquants!', colors.red);
    process.exit(1);
  }
  
  initDatabase()
    .then(() => {
      log('\n✨ Script terminé.', colors.green);
    })
    .catch(error => {
      log(`\n💥 Erreur fatale: ${error.message}`, colors.red);
      process.exit(1);
    });
}

module.exports = { initDatabase };
