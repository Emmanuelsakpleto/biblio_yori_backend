const database = require('../config/database');
const { logger } = require('../utils/helpers');
const { BOOK_STATUS } = require('../utils/constants');

class BookModel {
  /**
   * Créer un nouveau livre
   * @param {Object} bookData - Données du livre
   * @returns {Promise<Object>} - Livre créé
   */
  static async create(bookData) {
    try {
      const {
        title,
        author,
        isbn,
        description,
        publisher,
        publication_year,
        category,
        language = 'fr',
        pages,
        quantity = 1,
        cover_image,
        pdf_file,
        added_by
      } = bookData;

      const sql = `
        INSERT INTO books (
          title, author, isbn, description, publisher, publication_year,
          category, language, pages, quantity, available_quantity,
          cover_image, pdf_file, status, added_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await database.query(sql, [
        title, author, isbn, description, publisher, publication_year,
        category, language, pages, quantity, quantity,
        cover_image, pdf_file, BOOK_STATUS.AVAILABLE, added_by
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('Erreur lors de la création du livre:', error);
      throw error;
    }
  }

  /**
   * Trouver un livre par ID
   * @param {number} id - ID du livre
   * @returns {Promise<Object|null>} - Livre ou null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT b.*, 
               u.first_name as added_by_name, u.last_name as added_by_lastname,
               (SELECT AVG(rating) FROM reviews WHERE book_id = b.id) as average_rating,
               (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) as reviews_count
        FROM books b
        LEFT JOIN users u ON b.added_by = u.id
        WHERE b.id = ?
      `;
      
      const [book] = await database.query(sql, [id]);
      return book || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche de livre par ID:', error);
      throw error;
    }
  }

  /**
   * Trouver un livre par ISBN
   * @param {string} isbn - ISBN du livre
   * @returns {Promise<Object|null>} - Livre ou null
   */
  static async findByISBN(isbn) {
    try {
      const sql = `
        SELECT b.*, 
               u.first_name as added_by_name, u.last_name as added_by_lastname
        FROM books b
        LEFT JOIN users u ON b.added_by = u.id
        WHERE b.isbn = ?
      `;
      
      const [book] = await database.query(sql, [isbn]);
      return book || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche de livre par ISBN:', error);
      throw error;
    }
  }

  /**
   * Lister tous les livres avec pagination et filtres
   * @param {Object} options - Options de pagination et filtres
   * @returns {Promise<Object>} - Liste paginée des livres
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        category,
        author,
        language,
        status,
        available_only = false
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let params = [];

      // Filtres
      if (search) {
        whereConditions.push('(b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (category) {
        whereConditions.push('b.category = ?');
        params.push(category);
      }

      if (author) {
        whereConditions.push('b.author LIKE ?');
        params.push(`%${author}%`);
      }

      if (language) {
        whereConditions.push('b.language = ?');
        params.push(language);
      }

      if (status) {
        whereConditions.push('b.status = ?');
        params.push(status);
      }

      if (available_only) {
        whereConditions.push('b.available_quantity > 0 AND b.status = ?');
        params.push(BOOK_STATUS.AVAILABLE);
      }

      const whereClause = whereConditions.length > 0 ? 
        'WHERE ' + whereConditions.join(' AND ') : '';

      // Requête de comptage
      const countSql = `SELECT COUNT(*) as total FROM books b ${whereClause}`;
      const [{ total }] = await database.query(countSql, params);

      // Requête de données
      const sql = `
        SELECT b.*, 
               u.first_name as added_by_name, u.last_name as added_by_lastname,
               (SELECT AVG(rating) FROM reviews WHERE book_id = b.id) as average_rating,
               (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) as reviews_count
        FROM books b
        LEFT JOIN users u ON b.added_by = u.id
        ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT ? OFFSET ?
      `;

      const books = await database.query(sql, [...params, limit, offset]);

      return {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des livres:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un livre
   * @param {number} id - ID du livre
   * @param {Object} bookData - Nouvelles données
   * @returns {Promise<Object>} - Livre mis à jour
   */
  static async update(id, bookData) {
    try {
      const allowedFields = [
        'title', 'author', 'isbn', 'description', 'publisher', 
        'publication_year', 'category', 'language', 'pages', 
        'quantity', 'cover_image', 'pdf_file', 'status'
      ];
      
      const updateFields = [];
      const values = [];

      // Construire la requête dynamiquement
      Object.keys(bookData).forEach(key => {
        if (allowedFields.includes(key) && bookData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(bookData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('Aucun champ valide à mettre à jour');
      }

      // Si quantity est modifiée, recalculer available_quantity
      if (bookData.quantity !== undefined) {
        const currentBook = await this.findById(id);
        const borrowedQuantity = currentBook.quantity - currentBook.available_quantity;
        const newAvailableQuantity = Math.max(0, bookData.quantity - borrowedQuantity);
        
        updateFields.push('available_quantity = ?');
        values.push(newAvailableQuantity);
      }

      values.push(id);
      
      const sql = `
        UPDATE books 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await database.query(sql, values);
      
      return await this.findById(id);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du livre:', error);
      throw error;
    }
  }

  /**
   * Supprimer un livre
   * @param {number} id - ID du livre
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async delete(id) {
    try {
      // Vérifier s'il y a des emprunts actifs
      const activeLoansSql = 'SELECT COUNT(*) as count FROM loans WHERE book_id = ? AND status = "active"';
      const [{ count }] = await database.query(activeLoansSql, [id]);

      if (count > 0) {
        throw new Error('Impossible de supprimer un livre avec des emprunts actifs');
      }

      const sql = 'DELETE FROM books WHERE id = ?';
      await database.query(sql, [id]);
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de la suppression du livre:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la quantité disponible
   * @param {number} id - ID du livre
   * @param {number} change - Changement de quantité (+ ou -)
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async updateAvailableQuantity(id, change) {
    try {
      const sql = `
        UPDATE books 
        SET available_quantity = GREATEST(0, available_quantity + ?),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await database.query(sql, [change, id]);
      
      // Mettre à jour le statut si nécessaire
      await this.updateStatus(id);
      
      return true;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de la quantité disponible:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour automatiquement le statut du livre
   * @param {number} id - ID du livre
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async updateStatus(id) {
    try {
      const book = await this.findById(id);
      if (!book) return false;

      let newStatus = book.status;

      if (book.available_quantity <= 0) {
        newStatus = BOOK_STATUS.BORROWED;
      } else if (book.available_quantity > 0 && book.status === BOOK_STATUS.BORROWED) {
        newStatus = BOOK_STATUS.AVAILABLE;
      }

      if (newStatus !== book.status) {
        const sql = 'UPDATE books SET status = ? WHERE id = ?';
        await database.query(sql, [newStatus, id]);
      }

      return true;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  /**
   * Obtenir les catégories disponibles
   * @returns {Promise<Array>} - Liste des catégories
   */
  static async getCategories() {
    try {
      const sql = `
        SELECT DISTINCT category 
        FROM books 
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category
      `;

      const categories = await database.query(sql);
      return categories.map(row => row.category);
    } catch (error) {
      logger.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }

  /**
   * Obtenir les auteurs disponibles
   * @returns {Promise<Array>} - Liste des auteurs
   */
  static async getAuthors() {
    try {
      const sql = `
        SELECT DISTINCT author 
        FROM books 
        WHERE author IS NOT NULL AND author != ''
        ORDER BY author
      `;

      const authors = await database.query(sql);
      return authors.map(row => row.author);
    } catch (error) {
      logger.error('Erreur lors de la récupération des auteurs:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des livres
   * @returns {Promise<Object>} - Statistiques
   */
  static async getStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_books,
          SUM(quantity) as total_copies,
          SUM(available_quantity) as available_copies,
          SUM(quantity - available_quantity) as borrowed_copies,
          COUNT(DISTINCT category) as categories_count,
          COUNT(DISTINCT author) as authors_count,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_this_month
        FROM books
      `;

      const [stats] = await database.query(sql);
      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un ISBN existe déjà
   * @param {string} isbn - ISBN à vérifier
   * @param {number} excludeId - ID à exclure de la vérification
   * @returns {Promise<boolean>} - True si existe
   */
  static async isbnExists(isbn, excludeId = null) {
    try {
      let sql = 'SELECT COUNT(*) as count FROM books WHERE isbn = ?';
      let params = [isbn];

      if (excludeId) {
        sql += ' AND id != ?';
        params.push(excludeId);
      }

      const [{ count }] = await database.query(sql, params);
      return count > 0;
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'ISBN:', error);
      throw error;
    }
  }

  /**
   * Recherche avancée de livres
   * @param {Object} searchCriteria - Critères de recherche
   * @returns {Promise<Array>} - Résultats de recherche
   */
  static async advancedSearch(searchCriteria) {
    try {
      const {
        query,
        filters = {},
        sort = 'relevance',
        limit = 20
      } = searchCriteria;

      let sql = `
        SELECT b.*, 
               u.first_name as added_by_name, u.last_name as added_by_lastname,
               (SELECT AVG(rating) FROM reviews WHERE book_id = b.id) as average_rating,
               (SELECT COUNT(*) FROM reviews WHERE book_id = b.id) as reviews_count
      `;

      if (query) {
        sql += `, MATCH(title, author, description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance_score`;
      }

      sql += ` FROM books b LEFT JOIN users u ON b.added_by = u.id WHERE 1=1`;

      let params = [];

      // Recherche textuelle
      if (query) {
        sql += ` AND MATCH(title, author, description) AGAINST(? IN NATURAL LANGUAGE MODE)`;
        params.push(query, query);
      }

      // Filtres
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          sql += ` AND b.${key} = ?`;
          params.push(filters[key]);
        }
      });

      // Tri
      switch (sort) {
        case 'title':
          sql += ' ORDER BY b.title ASC';
          break;
        case 'author':
          sql += ' ORDER BY b.author ASC';
          break;
        case 'newest':
          sql += ' ORDER BY b.created_at DESC';
          break;
        case 'rating':
          sql += ' ORDER BY average_rating DESC';
          break;
        case 'relevance':
        default:
          if (query) {
            sql += ' ORDER BY relevance_score DESC';
          } else {
            sql += ' ORDER BY b.created_at DESC';
          }
      }

      sql += ` LIMIT ?`;
      params.push(limit);

      const books = await database.query(sql, params);
      return books;
    } catch (error) {
      logger.error('Erreur lors de la recherche avancée:', error);
      throw error;
    }
  }
}

module.exports = BookModel;