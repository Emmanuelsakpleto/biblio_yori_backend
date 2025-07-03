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
    
    // Supprimer toutes les tables dans l'ordre inverse des dépendances
    const dropQueries = [
      'DROP TABLE IF EXISTS user_sessions',
      'DROP TABLE IF EXISTS notifications',
      'DROP TABLE IF EXISTS reviews', 
      'DROP TABLE IF EXISTS loans',
      'DROP TABLE IF EXISTS books',
      'DROP TABLE IF EXISTS users'
    ];
    
    for (const query of dropQueries) {
      await connection.execute(query);
      log(`✅ ${query}`, colors.green);
    }
    
    // Réactiver les contraintes
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    log('\n🗑️  Toutes les tables ont été supprimées!', colors.yellow);
    log('💡 Exécutez "npm run db:init" pour recréer la base', colors.cyan);
    
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
