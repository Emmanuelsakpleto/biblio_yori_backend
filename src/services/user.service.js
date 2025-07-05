const database = require('../config/database');

class UserService {
  /**
   * Récupérer tous les utilisateurs avec pagination, recherche, filtre rôle/statut, tri
   * @param {Object} filters
   * @param {Object} pagination
   * @returns {Promise<{users: any[], pagination: any}>}
   */
  static async getAllUsers(filters = {}, pagination = { page: 1, limit: 20 }) {
    const { search = '', role = '', status = '', sort_by = 'created_at', sort_order = 'DESC' } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      where += ' AND is_active = ?';
      params.push(status === 'active' ? 1 : 0);
    }

    const orderBy = `ORDER BY ${sort_by} ${sort_order}`;
    const sql = `SELECT * FROM users ${where} ${orderBy} LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const users = await database.query(sql, params);
    const [{ count }] = await database.query(
      `SELECT COUNT(*) as count FROM users ${where}`,
      params.slice(0, -2)
    );

    return {
      users,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Récupérer un utilisateur par ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  static async getUserById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const users = await database.query(sql, [id]);
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Mettre à jour le profil d'un utilisateur
   * @param {number} id
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  static async updateUserProfile(id, updateData) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'student_id', 'department', 'profile_image', 'password'];
    
    const updateFields = [];
    const params = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (updateFields.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }
    
    params.push(id);
    const sql = `UPDATE users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    
    await database.query(sql, params);
    return await this.getUserById(id);
  }

  /**
   * Activer/Désactiver un utilisateur
   * @param {number} id
   * @param {boolean} isActive
   * @param {string} reason
   * @returns {Promise<Object>}
   */
  static async toggleUserStatus(id, isActive, reason = null) {
    const sql = 'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?';
    await database.query(sql, [isActive ? 1 : 0, id]);
    
    // Log the status change
    if (reason) {
      console.log(`User ${id} status changed to ${isActive ? 'active' : 'inactive'}: ${reason}`);
    }
    
    return await this.getUserById(id);
  }

  /**
   * Changer le rôle d'un utilisateur
   * @param {number} id
   * @param {string} newRole
   * @param {Array} permissions
   * @returns {Promise<Object>}
   */
  static async changeUserRole(id, newRole, permissions = []) {
    const validRoles = ['student', 'librarian', 'admin'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error('Rôle invalide');
    }
    
    const sql = 'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?';
    await database.query(sql, [newRole, id]);
    
    return await this.getUserById(id);
  }

  /**
   * Supprimer un utilisateur
   * @param {number} id
   * @param {number} transferDataTo
   * @returns {Promise<void>}
   */
  static async deleteUser(id, transferDataTo = null) {
    // Si transferDataTo est spécifié, transférer les données
    if (transferDataTo) {
      // Transférer les emprunts historiques
      const transferLoansSql = 'UPDATE loans SET user_id = ? WHERE user_id = ?';
      await database.query(transferLoansSql, [transferDataTo, id]);
      
      // Transférer les avis
      const transferReviewsSql = 'UPDATE reviews SET user_id = ? WHERE user_id = ?';
      await database.query(transferReviewsSql, [transferDataTo, id]);
    } else {
      // Supprimer les données liées
      await database.query('DELETE FROM user_sessions WHERE user_id = ?', [id]);
      await database.query('DELETE FROM notifications WHERE user_id = ?', [id]);
      await database.query('DELETE FROM reviews WHERE user_id = ?', [id]);
      await database.query('DELETE FROM loans WHERE user_id = ?', [id]);
      await database.query('DELETE FROM user_book_likes WHERE user_id = ?', [id]);
    }
    
    // Supprimer l'utilisateur
    const sql = 'DELETE FROM users WHERE id = ?';
    await database.query(sql, [id]);
  }

  /**
   * Créer un nouvel utilisateur (pour admin)
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  static async createUser(userData) {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone = null, 
      student_id = null, 
      department = null, 
      role = 'student' 
    } = userData;
    
    // Vérifier si l'email existe déjà
    const existingUser = await database.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      throw new Error('Cet email est déjà utilisé');
    }
    
    // Vérifier si le student_id existe déjà (s'il est fourni)
    if (student_id) {
      const existingStudentId = await database.query('SELECT id FROM users WHERE student_id = ?', [student_id]);
      if (existingStudentId.length > 0) {
        throw new Error('Ce numéro étudiant est déjà utilisé');
      }
    }
    
    const sql = `
      INSERT INTO users (email, password, first_name, last_name, phone, student_id, department, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const result = await database.query(sql, [email, password, first_name, last_name, phone, student_id, department, role]);
    
    return await this.getUserById(result.insertId);
  }

  /**
   * Rechercher des utilisateurs par terme de recherche
   * @param {string} searchTerm
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async searchUsers(searchTerm, limit = 10) {
    const sql = `
      SELECT id, first_name, last_name, email, role, student_id
      FROM users 
      WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR student_id LIKE ?)
      AND is_active = 1
      LIMIT ?
    `;
    
    const searchPattern = `%${searchTerm}%`;
    return await database.query(sql, [searchPattern, searchPattern, searchPattern, searchPattern, limit]);
  }

  /**
   * Obtenir les statistiques d'un utilisateur
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  static async getUserStats(userId) {
    const queries = await Promise.all([
      database.query('SELECT COUNT(*) as total FROM loans WHERE user_id = ?', [userId]),
      database.query('SELECT COUNT(*) as active FROM loans WHERE user_id = ? AND status = "active"', [userId]),
      database.query('SELECT COUNT(*) as overdue FROM loans WHERE user_id = ? AND status = "overdue"', [userId]),
      database.query('SELECT COUNT(*) as reviews FROM reviews WHERE user_id = ?', [userId]),
      database.query('SELECT COUNT(*) as likes FROM user_book_likes WHERE user_id = ?', [userId])
    ]);
    
    return {
      totalLoans: queries[0][0].total,
      activeLoans: queries[1][0].active,
      overdueLoans: queries[2][0].overdue,
      totalReviews: queries[3][0].reviews,
      totalLikes: queries[4][0].likes
    };
  }

  /**
   * Exporter les utilisateurs en CSV
   * @param {Array} users
   * @returns {string}
   */
  static exportToCSV(users) {
    const headers = ['ID', 'Prénom', 'Nom', 'Email', 'Rôle', 'Numéro étudiant', 'Département', 'Actif', 'Date création'];
    
    const csvData = users.map(user => [
      user.id,
      user.first_name,
      user.last_name,
      user.email,
      user.role,
      user.student_id || '',
      user.department || '',
      user.is_active ? 'Oui' : 'Non',
      new Date(user.created_at).toLocaleDateString('fr-FR')
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
}

module.exports = UserService;
