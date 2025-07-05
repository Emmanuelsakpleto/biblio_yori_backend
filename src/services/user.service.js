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
}

module.exports = UserService;
