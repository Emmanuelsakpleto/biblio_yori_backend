const database = require('../config/database');
const { logger, calculateReturnDate, isOverdue } = require('../utils/helpers');
const { LOAN_STATUS, DURATIONS } = require('../utils/constants');
const BookModel = require('./book.model');

class LoanModel {
  /**
   * Créer un nouvel emprunt
   * @param {Object} loanData - Données de l'emprunt
   * @returns {Promise<Object>} - Emprunt créé
   */
  static async create(loanData) {
    try {
      const {
        user_id,
        book_id,
        loan_period_days = DURATIONS.LOAN_PERIOD_DAYS,
        notes
      } = loanData;

      const loan_date = new Date();
      const due_date = calculateReturnDate(loan_period_days);

      return await database.transaction(async (connection) => {
        // Vérifier la disponibilité du livre
        const [book] = await connection.execute(
          'SELECT * FROM books WHERE id = ? AND available_quantity > 0',
          [book_id]
        );

        if (!book.length) {
          throw new Error('Livre non disponible pour l\'emprunt');
        }

        // Vérifier si l'utilisateur n'a pas déjà emprunté ce livre
        const [existingLoan] = await connection.execute(
          'SELECT * FROM loans WHERE user_id = ? AND book_id = ? AND status = ?',
          [user_id, book_id, LOAN_STATUS.ACTIVE]
        );

        if (existingLoan.length) {
          throw new Error('Livre déjà emprunté par cet utilisateur');
        }

        // Créer l'emprunt
        const [result] = await connection.execute(`
          INSERT INTO loans (user_id, book_id, loan_date, due_date, status, notes)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [user_id, book_id, loan_date, due_date, LOAN_STATUS.ACTIVE, notes]);

        // Décrémenter la quantité disponible
        await connection.execute(
          'UPDATE books SET available_quantity = available_quantity - 1 WHERE id = ?',
          [book_id]
        );

        return result.insertId;
      });
    } catch (error) {
      logger.error('Erreur lors de la création de l\'emprunt:', error);
      throw error;
    }
  }

  /**
   * Trouver un emprunt par ID
   * @param {number} id - ID de l'emprunt
   * @returns {Promise<Object|null>} - Emprunt ou null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT l.*, 
               u.first_name, u.last_name, u.email, u.student_id,
               b.title, b.author, b.isbn, b.cover_image
        FROM loans l
        JOIN users u ON l.user_id = u.id
        JOIN books b ON l.book_id = b.id
        WHERE l.id = ?
      `;
      
      const [loan] = await database.query(sql, [id]);
      
      if (loan) {
        loan.is_overdue = isOverdue(loan.due_date);
      }
      
      return loan || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'emprunt par ID:', error);
      throw error;
    }
  }

  /**
   * Lister tous les emprunts avec pagination et filtres
   * @param {Object} options - Options de pagination et filtres
   * @returns {Promise<Object>} - Liste paginée des emprunts
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        user_id,
        book_id,
        status,
        overdue_only = false,
        search
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let params = [];

      // Filtres
      if (user_id) {
        whereConditions.push('l.user_id = ?');
        params.push(user_id);
      }

      if (book_id) {
        whereConditions.push('l.book_id = ?');
        params.push(book_id);
      }

      if (status) {
        whereConditions.push('l.status = ?');
        params.push(status);
      }

      if (overdue_only) {
        whereConditions.push('l.due_date < NOW() AND l.status = ?');
        params.push(LOAN_STATUS.ACTIVE);
      }

      if (search) {
        whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR b.title LIKE ? OR b.author LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      }

      const whereClause = whereConditions.length > 0 ? 
        'WHERE ' + whereConditions.join(' AND ') : '';

      // Requête de comptage
      const countSql = `
        SELECT COUNT(*) as total 
        FROM loans l
        JOIN users u ON l.user_id = u.id
        JOIN books b ON l.book_id = b.id
        ${whereClause}
      `;
      const [{ total }] = await database.query(countSql, params);

      // Requête de données
      const sql = `
        SELECT l.*, 
               u.first_name, u.last_name, u.email, u.student_id,
               b.title, b.author, b.isbn, b.cover_image,
               CASE WHEN l.due_date < NOW() AND l.status = 'active' THEN 1 ELSE 0 END as is_overdue
        FROM loans l
        JOIN users u ON l.user_id = u.id
        JOIN books b ON l.book_id = b.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const loans = await database.query(sql, [...params, limit, offset]);

      return {
        loans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des emprunts:', error);
      throw error;
    }
  }

  /**
   * Retourner un livre
   * @param {number} id - ID de l'emprunt
   * @param {Object} returnData - Données de retour
   * @returns {Promise<Object>} - Emprunt mis à jour
   */
  static async returnBook(id, returnData = {}) {
    try {
      const { notes, condition_on_return = 'good' } = returnData;
      const return_date = new Date();

      return await database.transaction(async (connection) => {
        // Récupérer l'emprunt
        const [loan] = await connection.execute(
          'SELECT * FROM loans WHERE id = ? AND status = ?',
          [id, LOAN_STATUS.ACTIVE]
        );

        if (!loan.length) {
          throw new Error('Emprunt non trouvé ou déjà retourné');
        }

        const loanData = loan[0];

        // Mettre à jour l'emprunt
        await connection.execute(`
          UPDATE loans 
          SET status = ?, return_date = ?, condition_on_return = ?, 
              return_notes = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [LOAN_STATUS.RETURNED, return_date, condition_on_return, notes, id]);

        // Incrémenter la quantité disponible
        await connection.execute(
          'UPDATE books SET available_quantity = available_quantity + 1 WHERE id = ?',
          [loanData.book_id]
        );

        // Mettre à jour le statut du livre si nécessaire
        await BookModel.updateStatus(loanData.book_id);

        return await this.findById(id);
      });
    } catch (error) {
      logger.error('Erreur lors du retour du livre:', error);
      throw error;
    }
  }

  /**
   * Renouveler un emprunt
   * @param {number} id - ID de l'emprunt
   * @param {number} extensionDays - Nombre de jours d'extension
   * @returns {Promise<Object>} - Emprunt mis à jour
   */
  static async renewLoan(id, extensionDays = DURATIONS.LOAN_PERIOD_DAYS) {
    try {
      const loan = await this.findById(id);
      
      if (!loan || loan.status !== LOAN_STATUS.ACTIVE) {
        throw new Error('Emprunt non trouvé ou non actif');
      }

      // Vérifier si le livre n'est pas en retard
      if (isOverdue(loan.due_date)) {
        throw new Error('Impossible de renouveler un emprunt en retard');
      }

      // Vérifier le nombre de renouvellements
      if (loan.renewals_count >= DURATIONS.MAX_RENEWALS) {
        throw new Error('Nombre maximum de renouvellements atteint');
      }

      const newDueDate = calculateReturnDate(extensionDays);
      
      const sql = `
        UPDATE loans 
        SET due_date = ?, renewals_count = renewals_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await database.query(sql, [newDueDate, id]);
      
      return await this.findById(id);
    } catch (error) {
      logger.error('Erreur lors du renouvellement de l\'emprunt:', error);
      throw error;
    }
  }

  /**
   * Obtenir les emprunts d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} - Liste des emprunts
   */
  static async findByUser(userId, options = {}) {
    try {
      const { status, limit = 50 } = options;
      
      let whereClause = 'WHERE l.user_id = ?';
      let params = [userId];

      if (status) {
        whereClause += ' AND l.status = ?';
        params.push(status);
      }

      const sql = `
        SELECT l.*, 
               b.title, b.author, b.isbn, b.cover_image,
               CASE WHEN l.due_date < NOW() AND l.status = 'active' THEN 1 ELSE 0 END as is_overdue
        FROM loans l
        JOIN books b ON l.book_id = b.id
        ${whereClause}
        ORDER BY l.created_at DESC
        LIMIT ?
      `;

      const loans = await database.query(sql, [...params, limit]);
      return loans;
    } catch (error) {
      logger.error('Erreur lors de la récupération des emprunts de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Obtenir les emprunts en retard
   * @param {number} graceDays - Jours de grâce avant notification
   * @returns {Promise<Array>} - Liste des emprunts en retard
   */
  static async getOverdueLoans(graceDays = DURATIONS.OVERDUE_GRACE_DAYS) {
    try {
      const sql = `
        SELECT l.*, 
               u.first_name, u.last_name, u.email,
               b.title, b.author,
               DATEDIFF(NOW(), l.due_date) as days_overdue
        FROM loans l
        JOIN users u ON l.user_id = u.id
        JOIN books b ON l.book_id = b.id
        WHERE l.status = ? AND l.due_date < DATE_SUB(NOW(), INTERVAL ? DAY)
        ORDER BY l.due_date ASC
      `;

      const loans = await database.query(sql, [LOAN_STATUS.ACTIVE, graceDays]);
      return loans;
    } catch (error) {
      logger.error('Erreur lors de la récupération des emprunts en retard:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des emprunts
   * @returns {Promise<Object>} - Statistiques
   */
  static async getStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_loans,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_loans,
          SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_loans,
          SUM(CASE WHEN status = 'active' AND due_date < NOW() THEN 1 ELSE 0 END) as overdue_loans,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_this_month,
          AVG(CASE WHEN status = 'returned' THEN DATEDIFF(return_date, loan_date) ELSE NULL END) as avg_loan_duration
        FROM loans
      `;

      const [stats] = await database.query(sql);
      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un utilisateur peut emprunter un livre
   * @param {number} userId - ID de l'utilisateur
   * @param {number} bookId - ID du livre
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  static async canUserBorrow(userId, bookId) {
    try {
      // Vérifier le nombre d'emprunts actifs de l'utilisateur
      const [userLoans] = await database.query(
        'SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND status = ?',
        [userId, LOAN_STATUS.ACTIVE]
      );

      if (userLoans.count >= 5) { // LIMITS.MAX_BOOKS_PER_USER
        return {
          canBorrow: false,
          reason: 'Limite d\'emprunts atteinte'
        };
      }

      // Vérifier si le livre est disponible
      const [book] = await database.query(
        'SELECT available_quantity FROM books WHERE id = ?',
        [bookId]
      );

      if (!book.length || book[0].available_quantity <= 0) {
        return {
          canBorrow: false,
          reason: 'Livre non disponible'
        };
      }

      // Vérifier si l'utilisateur n'a pas déjà emprunté ce livre
      const [existingLoan] = await database.query(
        'SELECT COUNT(*) as count FROM loans WHERE user_id = ? AND book_id = ? AND status = ?',
        [userId, bookId, LOAN_STATUS.ACTIVE]
      );

      if (existingLoan.count > 0) {
        return {
          canBorrow: false,
          reason: 'Livre déjà emprunté'
        };
      }

      return {
        canBorrow: true,
        reason: 'Emprunt autorisé'
      };
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'emprunt:', error);
      throw error;
    }
  }

  /**
   * Obtenir l'historique des emprunts d'un livre
   * @param {number} bookId - ID du livre
   * @param {number} limit - Nombre de résultats
   * @returns {Promise<Array>} - Historique des emprunts
   */
  static async getBookLoanHistory(bookId, limit = 20) {
    try {
      const sql = `
        SELECT l.*, 
               u.first_name, u.last_name, u.student_id
        FROM loans l
        JOIN users u ON l.user_id = u.id
        WHERE l.book_id = ?
        ORDER BY l.created_at DESC
        LIMIT ?
      `;

      const loans = await database.query(sql, [bookId, limit]);
      return loans;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }
}

module.exports = LoanModel;