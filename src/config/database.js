const mysql = require('mysql2/promise');
const { logger } = require('../utils/helpers');

class Database {
  constructor() {
    this.pool = null;
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lectura_db',
      connectionLimit: 20,
      acquireTimeout: 60000,
      timeout: 60000,
      reconnect: true,
      charset: 'utf8mb4'
    };
  }

  async connect() {
    try {
      this.pool = mysql.createPool(this.config);
      
      // Test de connexion
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      
      logger.info('🗄️ Connexion à MySQL établie avec succès');
      return this.pool;
    } catch (error) {
      logger.error('❌ Erreur de connexion à MySQL:', error);
      throw error;
    }
  }

  getPool() {
    if (!this.pool) {
      throw new Error('Base de données non initialisée. Appelez connect() d\'abord.');
    }
    return this.pool;
  }

  async query(sql, params = []) {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows;
    } catch (error) {
      logger.error('Erreur SQL:', { sql, params, error: error.message });
      throw error;
    }
  }

  async transaction(callback) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('🔒 Connexion MySQL fermée');
    }
  }
}

// Instance singleton
const database = new Database();

module.exports = database;