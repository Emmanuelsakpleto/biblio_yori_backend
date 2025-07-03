const fs = require('fs').promises;
const path = require('path');
const database = require('../config/database');
const { logger } = require('./helpers');

class DatabaseInitializer {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../../database/migrations');
    this.seedsPath = path.join(__dirname, '../../database/seeds');
  }

  /**
   * Initialise la base de données complète
   */
  async initialize() {
    try {
      logger.info('Initialisation de la base de données...');
      
      // Connexion à la base de données
      await database.connect();
      
      // Création de la base de données si elle n'existe pas
      await this.createDatabaseIfNotExists();
      
      // Exécution des migrations
      await this.runMigrations();
      
      // Insertion des données de test
      if (process.env.NODE_ENV === 'development') {
        await this.runSeeds();
      }
      
      logger.info('Base de données initialisée avec succès');
    } catch (error) {
      logger.error('Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  /**
   * Crée la base de données si elle n'existe pas
   */
  async createDatabaseIfNotExists() {
    try {
      const dbName = process.env.DB_NAME || 'yori_db';
      await database.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await database.query(`USE \`${dbName}\``);
      logger.info(`Base de données '${dbName}' prête`);
    } catch (error) {
      logger.error('Erreur lors de la création de la base de données:', error);
      throw error;
    }
  }

  /**
   * Exécute toutes les migrations
   */
  async runMigrations() {
    try {
      logger.info('Exécution des migrations...');
      
      // Table pour suivre les migrations
      await this.createMigrationsTable();
      
      const migrationFiles = await this.getMigrationFiles();
      
      for (const file of migrationFiles) {
        await this.runMigration(file);
      }
      
      logger.info('Migrations terminées');
    } catch (error) {
      logger.error('Erreur lors des migrations:', error);
      throw error;
    }
  }

  /**
   * Crée la table des migrations
   */
  async createMigrationsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await database.query(sql);
  }

  /**
   * Récupère la liste des fichiers de migration
   */
  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort(); // Tri par ordre alphabétique/numérique
    } catch (error) {
      logger.warn('Aucun fichier de migration trouvé');
      return [];
    }
  }

  /**
   * Exécute une migration spécifique
   */
  async runMigration(filename) {
    try {
      // Vérifier si la migration a déjà été exécutée
      const [existing] = await database.query(
        'SELECT * FROM migrations WHERE filename = ?',
        [filename]
      );

      if (existing.length > 0) {
        logger.info(`Migration ${filename} déjà exécutée`);
        return;
      }

      // Lire et exécuter le fichier SQL
      const filePath = path.join(this.migrationsPath, filename);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Diviser en requêtes individuelles
      const queries = sql
        .split(';')
        .map(query => query.trim())
        .filter(query => query.length > 0);

      // Exécuter chaque requête
      for (const query of queries) {
        await database.query(query);
      }

      // Marquer la migration comme exécutée
      await database.query(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );

      logger.info(`Migration ${filename} exécutée`);
    } catch (error) {
      logger.error(`Erreur lors de la migration ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Exécute tous les seeds
   */
  async runSeeds() {
    try {
      logger.info('Insertion des données de test...');
      
      const seedFiles = await this.getSeedFiles();
      
      for (const file of seedFiles) {
        await this.runSeed(file);
      }
      
      logger.info('Données de test insérées');
    } catch (error) {
      logger.error('Erreur lors de l\'insertion des données:', error);
      throw error;
    }
  }

  /**
   * Récupère la liste des fichiers de seed
   */
  async getSeedFiles() {
    try {
      const files = await fs.readdir(this.seedsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      logger.warn('Aucun fichier de seed trouvé');
      return [];
    }
  }

  /**
   * Exécute un seed spécifique
   */
  async runSeed(filename) {
    try {
      const filePath = path.join(this.seedsPath, filename);
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Diviser en requêtes individuelles
      const queries = sql
        .split(';')
        .map(query => query.trim())
        .filter(query => query.length > 0);

      // Exécuter chaque requête
      for (const query of queries) {
        await database.query(query);
      }

      logger.info(`Seed ${filename} exécuté`);
    } catch (error) {
      logger.error(`Erreur lors du seed ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Réinitialise complètement la base de données
   */
  async reset() {
    try {
      logger.info('Réinitialisation de la base de données...');
      
      const dbName = process.env.DB_NAME || 'yori_db';
      await database.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
      
      await this.initialize();
      
      logger.info('Base de données réinitialisée');
    } catch (error) {
      logger.error('Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }
}

// Utilisation en ligne de commande
if (require.main === module) {
  const initializer = new DatabaseInitializer();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'reset':
      initializer.reset().then(() => process.exit(0));
      break;
    case 'migrate':
      initializer.runMigrations().then(() => process.exit(0));
      break;
    case 'seed':
      initializer.runSeeds().then(() => process.exit(0));
      break;
    default:
      initializer.initialize().then(() => process.exit(0));
  }
}

module.exports = DatabaseInitializer;