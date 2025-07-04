#!/usr/bin/env node

/**
 * 🔄 SCRIPT DE RÉINITIALISATION RAPIDE
 * 
 * Ce script permet de vider et recréer rapidement la base de données
 * pour les tests et le développement.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lectura_db',
  multipleStatements: true
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function resetDatabase() {
  let connection;
  
  try {
    log('🔄 RÉINITIALISATION DE LA BASE DE DONNÉES', colors.cyan);
    
    connection = await mysql.createConnection(DB_CONFIG);
    

    // Désactiver les contraintes de clés étrangères
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Vider les tables sans les supprimer
    const truncateQueries = [
      'TRUNCATE TABLE user_sessions',
      'TRUNCATE TABLE notifications',
      'TRUNCATE TABLE reviews',
      'TRUNCATE TABLE loans',
      'TRUNCATE TABLE books',
      'TRUNCATE TABLE users'
    ];

    for (const query of truncateQueries) {
      try {
        await connection.execute(query);
        log(`✅ ${query}`, colors.green);
      } catch (err) {
        log(`⚠️  ${query} : ${err.message}`, colors.yellow);
      }
    }

    // Réactiver les contraintes
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    log('\n🗑️  Toutes les tables ont été vidées (TRUNCATE) !', colors.yellow);
    log('💡 Vous pouvez maintenant réinsérer vos données de test.', colors.cyan);
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, colors.red);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };
