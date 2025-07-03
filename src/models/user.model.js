const database = require('../config/database');
const { hashPassword, sanitizeUser, logger } = require('../utils/helpers');
const { USER_ROLES } = require('../utils/constants');

class UserModel {
  /**
   * Créer un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} - Utilisateur créé
   */
  static async create(userData) {
    try {
      const {
        first_name,
        last_name,
        email,
        password,
        phone,
        role = USER_ROLES.STUDENT,
        student_id,
        department
      } = userData;

      // Hasher le mot de passe
      const hashedPassword = await hashPassword(password);

      const sql = `
        INSERT INTO users (
          first_name, last_name, email, password, phone, role, student_id, department
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await database.query(sql, [
        first_name, 
        last_name, 
        email, 
        hashedPassword, 
        phone || null, // Gérer phone optionnel
        role, 
        student_id || null, // Gérer student_id optionnel
        department || null // Gérer department optionnel
      ]);

      // Récupérer l'utilisateur créé
      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Trouver un utilisateur par ID
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<Object|null>} - Utilisateur ou null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT id, first_name, last_name, email, phone, role, student_id, 
               department, is_active, profile_image, created_at, updated_at
        FROM users 
        WHERE id = ? AND is_active = 1
      `;
      
      const [user] = await database.query(sql, [id]);
      return user || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'utilisateur par ID:', error);
      throw error;
    }
  }

  /**
   * Trouver un utilisateur par email
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<Object|null>} - Utilisateur ou null
   */
  static async findByEmail(email) {
    try {
      const sql = `
        SELECT id, first_name, last_name, email, password, phone, role, 
               student_id, department, is_active, profile_image, created_at, updated_at
        FROM users 
        WHERE email = ? AND is_active = 1
      `;
      
      const [user] = await database.query(sql, [email]);
      return user || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'utilisateur par email:', error);
      throw error;
    }
  }

  /**
   * Trouver un utilisateur par numéro étudiant
   * @param {string} studentId - Numéro étudiant
   * @returns {Promise<Object|null>} - Utilisateur ou null
   */
  static async findByStudentId(studentId) {
    try {
      const sql = `
        SELECT id, first_name, last_name, email, phone, role, student_id, 
               department, is_active, profile_image, created_at, updated_at
        FROM users 
        WHERE student_id = ? AND is_active = 1
      `;
      
      const [user] = await database.query(sql, [studentId]);
      return user || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'utilisateur par numéro étudiant:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @param {Object} userData - Nouvelles données
   * @returns {Promise<Object>} - Utilisateur mis à jour
   */
  static async update(id, userData) {
    try {
      const allowedFields = [
        'first_name', 'last_name', 'phone', 'department', 'profile_image'
      ];
      
      const updateFields = [];
      const values = [];

      // Construire la requête dynamiquement
      Object.keys(userData).forEach(key => {
        if (allowedFields.includes(key) && userData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(userData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('Aucun champ valide à mettre à jour');
      }

      values.push(id);
      
      const sql = `
        UPDATE users 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await database.query(sql, values);
      
      return await this.findById(id);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le mot de passe
   * @param {number} id - ID de l'utilisateur
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await hashPassword(newPassword);
      
      const sql = `
        UPDATE users 
        SET password = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await database.query(sql, [hashedPassword, id]);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }
  }

  /**
   * Désactiver un utilisateur
   * @param {number} id - ID de l'utilisateur
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async deactivate(id) {
    try {
      const sql = `
        UPDATE users 
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await database.query(sql, [id]);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la désactivation de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Lister tous les utilisateurs avec pagination
   * @param {Object} options - Options de pagination et filtres
   * @returns {Promise<Object>} - Liste paginée des utilisateurs
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        department,
        search
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = ['is_active = 1'];
      let params = [];

      // Filtres
      if (role) {
        whereConditions.push('role = ?');
        params.push(role);
      }

      if (department) {
        whereConditions.push('department = ?');
        params.push(department);
      }

      if (search) {
        whereConditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.join(' AND ');

      // Requête de comptage
      const countSql = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
      const [{ total }] = await database.query(countSql, params);

      // Requête de données
      const sql = `
        SELECT id, first_name, last_name, email, phone, role, student_id, 
               department, profile_image, created_at, updated_at
        FROM users 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const users = await database.query(sql, [...params, limit, offset]);

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des utilisateurs
   * @returns {Promise<Object>} - Statistiques
   */
  static async getStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
          SUM(CASE WHEN role = 'librarian' THEN 1 ELSE 0 END) as librarians,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_this_month
        FROM users 
        WHERE is_active = 1
      `;

      const [stats] = await database.query(sql);
      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un email existe déjà
   * @param {string} email - Email à vérifier
   * @param {number} excludeId - ID à exclure de la vérification
   * @returns {Promise<boolean>} - True si existe
   */
  static async emailExists(email, excludeId = null) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
      let params = [email];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const [{ count }] = await database.query(sql, params);
      return count > 0;
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'email:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un numéro étudiant existe déjà
   * @param {string} studentId - Numéro étudiant à vérifier
   * @param {number} excludeId - ID à exclure de la vérification
   * @returns {Promise<boolean>} - True si existe
   */
  static async studentIdExists(studentId, excludeId = null) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM users WHERE student_id = ?';
      let params = [studentId];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const [{ count }] = await database.query(sql, params);
      return count > 0;
    } catch (error) {
      logger.error('Erreur lors de la vérification du numéro étudiant:', error);
      throw error;
    }
  }
}

module.exports = UserModel;