const database = require('../config/database');
const { logger, generateSlug } = require('../utils/helpers');
const { BOOK_STATUS, PAGINATION } = require('../utils/constants');
const fs = require('fs').promises;
const path = require('path');
const NotificationService = require('./notification.service');

class BookService {
  /**
   * Rechercher des livres avec filtres et pagination
   * @param {Object} filters - Filtres de recherche
   * @param {Object} pagination - Options de pagination
   * @returns {Promise<Object>} - Résultats paginés
   */
  static async searchBooks(filters = {}, pagination = {}) {
    const mysql = require('mysql2/promise');
    
    try {
      // Connexion directe pour éviter les problèmes de la classe Database
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lectura_db',
        port: process.env.DB_PORT || 3306
      });
      
      const { search, category, author, isbn, status, available } = filters;
      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      let whereConditions = ["status != ?"];
      let params = ['lost'];

      // Filtres de recherche
      if (search && search.trim()) {
        whereConditions.push(
          '(title LIKE ? OR author LIKE ? OR isbn LIKE ? OR description LIKE ?)'
        );
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (category && category.trim()) {
        whereConditions.push('category = ?');
        params.push(category.trim());
      }

      if (author && author.trim()) {
        whereConditions.push('author LIKE ?');
        params.push(`%${author.trim()}%`);
      }

      if (isbn && isbn.trim()) {
        whereConditions.push('isbn = ?');
        params.push(isbn.trim());
      }

      if (status && status.trim()) {
        whereConditions.push('status = ?');
        params.push(status.trim());
      }

      if (available === true) {
        whereConditions.push('available_copies > ?');
        params.push(0);
      } else if (available === false) {
        whereConditions.push('available_copies = ?');
        params.push(0);
      }

      const whereClause = whereConditions.join(' AND ');
      
      // Debug logging
      console.log('🔍 Modern Search parameters:', { search, category, author, isbn, status, available });
      console.log('🔍 Modern Search WHERE clause:', whereClause);
      console.log('🔍 Modern Search Parameters:', params);
      console.log('🔍 Modern Search Pagination:', { page, limit, offset });

      // Requête principale
      const booksQuery = `
        SELECT 
          id, title, author, isbn, publisher, publication_year, category, 
          description, total_copies, available_copies, status, cover_image, 
          language, pages, location, created_at, updated_at
        FROM books 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;

      const [books] = await connection.query(booksQuery, [...params, limit, offset]);

      // Requête de comptage
      const countQuery = `SELECT COUNT(*) as total FROM books WHERE ${whereClause}`;
      const [countResult] = await connection.query(countQuery, params);
      const total = countResult[0].total;

      await connection.end();

      return {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Erreur moderne dans searchBooks:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les livres avec filtres et pagination (VERSION MODERNE CORRIGÉE)
   * @param {Object} filters - Filtres de recherche
   * @param {Object} pagination - Options de pagination
   * @returns {Promise<Object>} - Résultats paginés
   */
  static async getAllBooks(filters = {}, pagination = {}) {
    const mysql = require('mysql2/promise');
    
    try {
      // Connexion directe pour éviter les problèmes de la classe Database
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lectura_db',
        port: process.env.DB_PORT || 3306
      });
      
      const {
        search = '',
        category = '',
        author = '',
        isbn = '',
        status = '',
        available = null
      } = filters;
      
      const {
        page = 1,
        limit = 20
      } = pagination;
      
      const offset = (page - 1) * limit;
      
      // Construction moderne de la requête
      let whereConditions = ["status != ?"];
      let params = ['lost'];
      
      if (search && search.trim()) {
        whereConditions.push("(title LIKE ? OR author LIKE ? OR isbn LIKE ? OR description LIKE ?)");
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (category && category.trim()) {
        whereConditions.push("category = ?");
        params.push(category.trim());
      }
      
      if (author && author.trim()) {
        whereConditions.push("author LIKE ?");
        params.push(`%${author.trim()}%`);
      }
      
      if (isbn && isbn.trim()) {
        whereConditions.push("isbn = ?");
        params.push(isbn.trim());
      }
      
      if (status && status.trim()) {
        whereConditions.push("status = ?");
        params.push(status.trim());
      }
      
      if (available === true) {
        whereConditions.push("available_copies > ?");
        params.push(0);
      } else if (available === false) {
        whereConditions.push("available_copies = ?");
        params.push(0);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Requête principale
      const booksQuery = `
        SELECT 
          id, title, author, isbn, publisher, publication_year, category, 
          description, total_copies, available_copies, status, cover_image, 
          language, pages, location, created_at, updated_at
        FROM books 
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [books] = await connection.query(booksQuery, [...params, limit, offset]);
      
      // Requête de comptage
      const countQuery = `SELECT COUNT(*) as total FROM books WHERE ${whereClause}`;
      const [countResult] = await connection.query(countQuery, params);
      const total = countResult[0].total;
      
      await connection.end();
      
      return {
        books,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
      
    } catch (error) {
      logger.error('Erreur moderne dans getAllBooks:', error);
      throw error;
    }
  }

  /**
   * Obtenir les livres populaires
   * @param {number} limit - Nombre de livres à retourner
   * @returns {Promise<Array>} - Liste des livres populaires
   */
  static async getPopularBooks(limit = 10) {
    try {
      const sql = `
        SELECT 
          b.*,
          COUNT(l.id) as loan_count,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as review_count
        FROM books b
        LEFT JOIN loans l ON b.id = l.book_id AND l.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        LEFT JOIN reviews r ON b.id = r.book_id
        WHERE b.status != 'deleted' AND b.status = ?
        GROUP BY b.id
        ORDER BY loan_count DESC, average_rating DESC
        LIMIT ?
      `;

      const books = await database.query(sql, [BOOK_STATUS.AVAILABLE, limit]);
      return books;
    } catch (error) {
      logger.error('Erreur lors de la récupération des livres populaires:', error);
      throw error;
    }
  }

  /**
   * Obtenir les nouveaux livres
   * @param {number} limit - Nombre de livres à retourner
   * @returns {Promise<Array>} - Liste des nouveaux livres
   */
  static async getNewBooks(limit = 10) {
    try {
      const sql = `
        SELECT 
          b.*,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as review_count
        FROM books b
        LEFT JOIN reviews r ON b.id = r.book_id
        WHERE b.status != 'deleted' AND b.status = ?
        GROUP BY b.id
        ORDER BY b.created_at DESC
        LIMIT ?
      `;

      const books = await database.query(sql, [BOOK_STATUS.AVAILABLE, limit]);
      return books;
    } catch (error) {
      logger.error('Erreur lors de la récupération des nouveaux livres:', error);
      throw error;
    }
  }

  /**
   * Obtenir les recommandations pour un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {number} limit - Nombre de livres à retourner
   * @returns {Promise<Array>} - Liste des livres recommandés
   */
  static async getRecommendations(userId, limit = 10) {
    try {
      // Basé sur les catégories des livres empruntés et les avis
      const sql = `
        SELECT DISTINCT
          b.*,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as review_count
        FROM books b
        LEFT JOIN reviews r ON b.id = r.book_id
        WHERE b.status != 'deleted' 
          AND b.status = ?
          AND b.id NOT IN (
            SELECT DISTINCT l.book_id 
            FROM loans l 
            WHERE l.user_id = ?
          )
          AND b.category IN (
            SELECT DISTINCT b2.category
            FROM books b2
            JOIN loans l2 ON b2.id = l2.book_id
            WHERE l2.user_id = ?
            UNION
            SELECT DISTINCT b3.category
            FROM books b3
            JOIN reviews r2 ON b3.id = r2.book_id
            WHERE r2.user_id = ? AND r2.rating >= 4
          )
        GROUP BY b.id
        ORDER BY average_rating DESC, review_count DESC
        LIMIT ?
      `;

      const books = await database.query(sql, [
        BOOK_STATUS.AVAILABLE, userId, userId, userId, limit
      ]);

      // Si pas assez de recommandations basées sur l'historique, compléter avec les populaires
      if (books.length < limit) {
        const additionalBooks = await this.getPopularBooks(limit - books.length);
        const existingIds = books.map(book => book.id);
        const filteredAdditional = additionalBooks.filter(book => !existingIds.includes(book.id));
        books.push(...filteredAdditional);
      }

      return books.slice(0, limit);
    } catch (error) {
      logger.error('Erreur lors de la récupération des recommandations:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'un livre
   * @param {number} bookId - ID du livre
   * @returns {Promise<Object>} - Statistiques du livre
   */
  static async getBookStats(bookId) {
    try {
      const sql = `
        SELECT 
          b.id,
          b.title,
          b.total_quantity,
          b.available_quantity,
          (b.total_quantity - b.available_quantity) as loaned_quantity,
          COUNT(DISTINCT l.id) as total_loans,
          COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END) as active_loans,
          COUNT(DISTINCT CASE WHEN l.status = 'returned' THEN l.id END) as returned_loans,
          COUNT(DISTINCT CASE WHEN l.status = 'overdue' THEN l.id END) as overdue_loans,
          COUNT(DISTINCT r.id) as total_reviews,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT CASE WHEN r.rating = 5 THEN r.id END) as five_star_reviews,
          COUNT(DISTINCT CASE WHEN r.rating = 4 THEN r.id END) as four_star_reviews,
          COUNT(DISTINCT CASE WHEN r.rating = 3 THEN r.id END) as three_star_reviews,
          COUNT(DISTINCT CASE WHEN r.rating = 2 THEN r.id END) as two_star_reviews,
          COUNT(DISTINCT CASE WHEN r.rating = 1 THEN r.id END) as one_star_reviews
        FROM books b
        LEFT JOIN loans l ON b.id = l.book_id
        LEFT JOIN reviews r ON b.id = r.book_id AND r.status != 'deleted'
        WHERE b.id = ? AND b.status != 'deleted'
        GROUP BY b.id
      `;

      const [stats] = await database.query(sql, [bookId]);
      return stats || null;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques du livre:', error);
      throw error;
    }
  }

  /**
   * Vérifier la disponibilité d'un livre
   * @param {number} bookId - ID du livre
   * @returns {Promise<Object>} - Informations de disponibilité
   */
  static async checkAvailability(bookId) {
    try {
      const sql = `
        SELECT 
          id,
          title,
          total_quantity,
          available_quantity,
          status,
          (available_quantity > 0) as is_available
        FROM books
        WHERE id = ? AND status != 'deleted'
      `;

      const [book] = await database.query(sql, [bookId]);
      return book || null;
    } catch (error) {
      logger.error('Erreur lors de la vérification de disponibilité:', error);
      throw error;
    }
  }

  /**
   * Réserver la quantité d'un livre (pour emprunts)
   * @param {number} bookId - ID du livre
   * @param {number} quantity - Quantité à réserver
   * @returns {Promise<boolean>} - Succès de la réservation
   */
  static async reserveQuantity(bookId, quantity = 1) {
    try {
      return await database.transaction(async (connection) => {
        // Vérifier la disponibilité avec verrou
        const [book] = await connection.execute(
          'SELECT available_quantity FROM books WHERE id = ? FOR UPDATE',
          [bookId]
        );

        if (!book.length || book[0].available_quantity < quantity) {
          return false;
        }

        // Réduire la quantité disponible
        const result = await connection.execute(
          'UPDATE books SET available_quantity = available_quantity - ? WHERE id = ?',
          [quantity, bookId]
        );

        return result.affectedRows > 0;
      });
    } catch (error) {
      logger.error('Erreur lors de la réservation de quantité:', error);
      throw error;
    }
  }

  /**
   * Libérer la quantité d'un livre (pour retours)
   * @param {number} bookId - ID du livre
   * @param {number} quantity - Quantité à libérer
   * @returns {Promise<boolean>} - Succès de la libération
   */
  static async releaseQuantity(bookId, quantity = 1) {
    try {
      const sql = `
        UPDATE books 
        SET available_quantity = LEAST(available_quantity + ?, total_quantity)
        WHERE id = ? AND status != 'deleted'
      `;

      const result = await database.query(sql, [quantity, bookId]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur lors de la libération de quantité:', error);
      throw error;
    }
  }

  /**
   * Obtenir les catégories de livres avec compteurs
   * @returns {Promise<Array>} - Liste des catégories
   */
  static async getCategories() {
    try {
      const sql = `
        SELECT 
          category,
          COUNT(*) as book_count,
          SUM(available_copies) as available_books
        FROM books
        WHERE status != 'deleted' AND status = ?
        GROUP BY category
        ORDER BY book_count DESC
      `;

      const categories = await database.query(sql, [BOOK_STATUS.AVAILABLE]);
      return categories;
    } catch (error) {
      logger.error('Erreur lors de la récupération des catégories:', error);
      throw error;
    }
  }

  /**
   * Obtenir les auteurs avec compteurs
   * @param {number} limit - Limite de résultats
   * @returns {Promise<Array>} - Liste des auteurs
   */
  static async getAuthors(limit = 50) {
    try {
      const sql = `
        SELECT 
          author,
          COUNT(*) as book_count,
          SUM(available_quantity) as available_books,
          COALESCE(AVG(
            (SELECT AVG(rating) FROM reviews r WHERE r.book_id = b.id AND r.status != 'deleted')
          ), 0) as average_rating
        FROM books b
        WHERE status != 'deleted' AND status = ?
        GROUP BY author
        ORDER BY book_count DESC
        LIMIT ?
      `;

      const authors = await database.query(sql, [BOOK_STATUS.AVAILABLE, limit]);
      return authors;
    } catch (error) {
      logger.error('Erreur lors de la récupération des auteurs:', error);
      throw error;
    }
  }

  /**
   * Rechercher des livres par titre similaire
   * @param {string} title - Titre à rechercher
   * @param {number} limit - Limite de résultats
   * @returns {Promise<Array>} - Livres similaires
   */
  static async findSimilarBooks(title, limit = 10) {
    try {
      const sql = `
        SELECT 
          b.*,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(DISTINCT r.id) as review_count,
          MATCH(title, description) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
        FROM books b
        LEFT JOIN reviews r ON b.id = r.book_id AND r.status != 'deleted'
        WHERE b.status != 'deleted' 
          AND b.status = ?
          AND (
            MATCH(title, description) AGAINST(? IN NATURAL LANGUAGE MODE) > 0
            OR title LIKE ?
          )
        GROUP BY b.id
        ORDER BY relevance DESC, average_rating DESC
        LIMIT ?
      `;

      const searchTerm = `%${title}%`;
      const books = await database.query(sql, [
        title, BOOK_STATUS.AVAILABLE, title, searchTerm, limit
      ]);

      return books;
    } catch (error) {
      logger.error('Erreur lors de la recherche de livres similaires:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour les statistiques d'un livre
   * @param {number} bookId - ID du livre
   * @returns {Promise<boolean>} - Succès de la mise à jour
   */
  static async updateBookStats(bookId) {
    try {
      const sql = `
        UPDATE books 
        SET 
          total_loans = (
            SELECT COUNT(*) FROM loans WHERE book_id = ?
          ),
          average_rating = (
            SELECT COALESCE(AVG(rating), 0) FROM reviews 
            WHERE book_id = ? AND status != 'deleted'
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const result = await database.query(sql, [bookId, bookId, bookId]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour des statistiques:', error);
      throw error;
    }
  }

  /**
   * Gérer l'upload d'image de couverture
   * @param {number} bookId - ID du livre
   * @param {string} imagePath - Chemin de l'image
   * @returns {Promise<string>} - URL de l'image
   */
  static async uploadCoverImage(bookId, imagePath) {
    try {
      const fileName = `book-${bookId}-${Date.now()}.jpg`;
      const destinationPath = path.join(process.cwd(), 'uploads', 'books', fileName);
      
      // Créer le répertoire si nécessaire
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      
      // Copier le fichier
      await fs.copyFile(imagePath, destinationPath);
      
      const imageUrl = `/uploads/books/${fileName}`;
      
      // Mettre à jour la base de données
      await database.query(
        'UPDATE books SET cover_image = ? WHERE id = ?',
        [imageUrl, bookId]
      );
      
      return imageUrl;
    } catch (error) {
      logger.error('Erreur lors de l\'upload d\'image:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques globales des livres
   * @returns {Promise<Object>} - Statistiques globales
   */
  static async getGlobalStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_books,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_books,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_books,
          COUNT(CASE WHEN status = 'retired' THEN 1 END) as retired_books,
          SUM(total_quantity) as total_copies,
          SUM(available_quantity) as available_copies,
          COUNT(DISTINCT category) as total_categories,
          COUNT(DISTINCT author) as total_authors,
          COALESCE(AVG(average_rating), 0) as global_average_rating
        FROM books
        WHERE status != 'deleted'
      `;

      const [stats] = await database.query(sql);
      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques globales:', error);
      throw error;
    }
  }

  /**
   * Vérifier les livres en retard et mettre à jour les statuts
   * @returns {Promise<number>} - Nombre de livres traités
   */
  static async checkOverdueBooks() {
    try {
      // Cette méthode sera utilisée par les jobs CRON
      const sql = `
        UPDATE loans 
        SET status = 'overdue'
        WHERE status = 'active' 
          AND due_date < NOW()
          AND DATEDIFF(NOW(), due_date) > 0
      `;

      const result = await database.query(sql);
      
      if (result.affectedRows > 0) {
        logger.info(`${result.affectedRows} emprunts marqués comme en retard`);
      }
      
      return result.affectedRows;
    } catch (error) {
      logger.error('Erreur lors de la vérification des retards:', error);
      throw error;
    }
  }

  /**
   * Obtenir un livre par ID (VERSION MODERNE CORRIGÉE)
   * @param {number} id - ID du livre
   * @param {Object} options - Options (include_reviews, include_stats, etc.)
   * @returns {Promise<Object|null>} - Livre trouvé ou null
   */
  static async getBookById(id, options = {}) {
    const mysql = require('mysql2/promise');
    
    try {
      // Validation de l'ID
      if (!id || isNaN(parseInt(id))) {
        throw new Error('ID de livre invalide');
      }
      
      const bookId = parseInt(id);
      const { include_reviews = false, include_stats = false } = options;
      
      // Connexion directe moderne
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lectura_db',
        port: process.env.DB_PORT || 3306
      });
      
      // Requête principale pour récupérer le livre
      const bookQuery = `
        SELECT 
          id, title, author, isbn, publisher, publication_year, category,
          description, total_copies, available_copies, status, cover_image,
          language, pages, location, created_at, updated_at
        FROM books 
        WHERE id = ? AND status != 'lost'
      `;
      
      const [books] = await connection.query(bookQuery, [bookId]);
      
      if (books.length === 0) {
        await connection.end();
        return null;
      }
      
      const book = books[0];
      
      // Si on veut inclure les avis
      if (include_reviews) {
        const reviewsQuery = `
          SELECT 
            r.id, r.rating, r.comment, r.created_at,
            u.first_name, u.last_name
          FROM reviews r
          JOIN users u ON r.user_id = u.id
          WHERE r.book_id = ? AND r.is_approved = 1
          ORDER BY r.created_at DESC
        `;
        
        const [reviews] = await connection.query(reviewsQuery, [bookId]);
        book.reviews = reviews;
        
        // Calculer les statistiques des avis
        if (reviews.length > 0) {
          book.average_rating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
          book.review_count = reviews.length;
        } else {
          book.average_rating = 0;
          book.review_count = 0;
        }
      }
      
      // Si on veut inclure les statistiques
      if (include_stats) {
        const statsQuery = `
          SELECT 
            COUNT(DISTINCT l.id) as total_loans,
            COUNT(DISTINCT r.id) as total_reviews,
            COALESCE(AVG(r.rating), 0) as average_rating
          FROM books b
          LEFT JOIN loans l ON b.id = l.book_id
          LEFT JOIN reviews r ON b.id = r.book_id AND r.is_approved = 1
          WHERE b.id = ?
          GROUP BY b.id
        `;
        
        const [stats] = await connection.query(statsQuery, [bookId]);
        if (stats.length > 0) {
          book.total_loans = stats[0].total_loans;
          book.total_reviews = stats[0].total_reviews;
          book.average_rating = stats[0].average_rating;
        }
      }
      
      // Ajouter des informations de disponibilité
      book.is_available = book.available_copies > 0;
      book.availability_status = book.available_copies > 0 ? 'available' : 'unavailable';
      
      await connection.end();
      
      return book;
      
    } catch (error) {
      logger.error('Erreur moderne dans getBookById:', error);
      throw error;
    }
  }

  // Créer un nouveau livre (moderne avec connexion directe)
  static async createBook(bookData) {
    const mysql = require('mysql2/promise');
    
    try {
      console.log('📚 Création livre - Données reçues:', bookData);
      
      // Connexion directe moderne
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lectura_db',
        port: process.env.DB_PORT || 3306
      });
      
      // Vérifier si l'ISBN existe déjà
      if (bookData.isbn) {
        const checkQuery = 'SELECT id FROM books WHERE isbn = ?';
        const [existing] = await connection.query(checkQuery, [bookData.isbn]);
        
        if (existing.length > 0) {
          await connection.end();
          throw new Error('Un livre avec cet ISBN existe déjà');
        }
      }
      
      // Requête d'insertion
      const insertQuery = `
        INSERT INTO books (
          title, author, isbn, publisher, publication_year, category,
          description, total_copies, available_copies, language, pages, 
          location, cover_image, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', NOW(), NOW())
      `;
      
      const values = [
        bookData.title,
        bookData.author,
        bookData.isbn || null,
        bookData.publisher || null,
        bookData.publication_year || null,
        bookData.category,
        bookData.description || null,
        bookData.total_copies || 1,
        bookData.available_copies || bookData.total_copies || 1,
        bookData.language || 'fr',
        bookData.pages || null,
        bookData.location || null,
        bookData.cover_image || null
      ];
      
      console.log('📝 Exécution requête INSERT avec values:', values);
      
      const [result] = await connection.query(insertQuery, values);
      
      // Récupérer le livre créé
      const selectQuery = `
        SELECT 
          id, title, author, isbn, publisher, publication_year, category,
          description, total_copies, available_copies, status, cover_image,
          language, pages, location, created_at, updated_at
        FROM books 
        WHERE id = ?
      `;
      
      const [books] = await connection.query(selectQuery, [result.insertId]);
      
      await connection.end();
      
      if (books.length === 0) {
        throw new Error('Erreur lors de la récupération du livre créé');
      }
      
      const createdBook = books[0];
      console.log('✅ Livre créé avec succès:', createdBook);

      // Récupérer dynamiquement la liste des admins actifs
      const [admins] = await database.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true");
      const adminIds = admins.map(a => a.id);
      // Notifier les admins de l'ajout d'un nouveau livre
      await NotificationService.createBookNotification({
        admin_id: adminIds,
        type: 'new_book',
        book_title: createdBook.title,
        book_id: createdBook.id
      });

      return createdBook;
      
    } catch (error) {
      console.error('❌ Erreur dans createBook:', error);
      throw error;
    }
  }

  // Mettre à jour un livre existant (moderne avec connexion directe)
  static async updateBook(id, updateData) {
    const mysql = require('mysql2/promise');
    
    try {
      console.log('📝 Mise à jour livre - ID:', id, 'Données:', updateData);
      
      // Connexion directe moderne
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lectura_db',
        port: process.env.DB_PORT || 3306
      });
      
      // Vérifier si le livre existe
      const checkQuery = 'SELECT id FROM books WHERE id = ?';
      const [existing] = await connection.query(checkQuery, [id]);
      
      if (existing.length === 0) {
        await connection.end();
        throw new Error('Livre non trouvé');
      }
      
      // Vérifier l'ISBN si modifié
      if (updateData.isbn) {
        const isbnCheckQuery = 'SELECT id FROM books WHERE isbn = ? AND id != ?';
        const [isbnExists] = await connection.query(isbnCheckQuery, [updateData.isbn, id]);
        
        if (isbnExists.length > 0) {
          await connection.end();
          throw new Error('Un autre livre avec cet ISBN existe déjà');
        }
      }
      
      // Construire la requête UPDATE dynamiquement
      const allowedFields = [
        'title', 'author', 'isbn', 'publisher', 'publication_year', 'category',
        'description', 'total_copies', 'available_copies', 'language', 'pages',
        'location', 'cover_image', 'pdf_file', 'status'
      ];
      
      const setClause = [];
      const values = [];
      
      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          setClause.push(`${field} = ?`);
          values.push(updateData[field]);
        }
      }
      
      if (setClause.length === 0) {
        await connection.end();
        throw new Error('Aucune donnée à mettre à jour');
      }
      
      setClause.push('updated_at = NOW()');
      values.push(id);
      
      const updateQuery = `UPDATE books SET ${setClause.join(', ')} WHERE id = ?`;
      
      console.log('📝 Exécution requête UPDATE:', updateQuery, 'Values:', values);
      
      await connection.query(updateQuery, values);
      
      // Récupérer le livre mis à jour
      const selectQuery = `
        SELECT 
          id, title, author, isbn, publisher, publication_year, category,
          description, total_copies, available_copies, status, cover_image,
          language, pages, location, created_at, updated_at
        FROM books 
        WHERE id = ?
      `;
      
      const [books] = await connection.query(selectQuery, [id]);
      
      await connection.end();
      
      const updatedBook = books[0];
      console.log('✅ Livre mis à jour avec succès:', updatedBook);
      
      // Créer une notification pour la mise à jour du livre
      await NotificationService.createBookNotification(updatedBook.id, 'updated');
      
      return updatedBook;
      
    } catch (error) {
      console.error('❌ Erreur dans updateBook:', error);
      throw error;
    }
  }

  // Supprimer un livre (moderne avec connexion directe)
  static async deleteBook(id) {
    const mysql = require('mysql2/promise');
    
    try {
      console.log('🗑️ Suppression livre - ID:', id);
      
      // Connexion directe moderne
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'lectura_db',
        port: process.env.DB_PORT || 3306
      });
      
      // Vérifier si le livre existe
      const checkQuery = 'SELECT id, title FROM books WHERE id = ?';
      const [existing] = await connection.query(checkQuery, [id]);
      
      if (existing.length === 0) {
        await connection.end();
        throw new Error('Livre non trouvé');
      }
      
      // Vérifier s'il y a des emprunts actifs
      const loansQuery = 'SELECT id FROM loans WHERE book_id = ? AND status IN (?, ?)';
      const [activeLoans] = await connection.query(loansQuery, [id, 'active', 'overdue']);
      
      if (activeLoans.length > 0) {
        await connection.end();
        throw new Error('Impossible de supprimer le livre : il y a des emprunts actifs');
      }
      
      // Supprimer le livre (suppression douce en changeant le statut)
      const deleteQuery = 'UPDATE books SET status = ?, updated_at = NOW() WHERE id = ?';
      await connection.query(deleteQuery, ['deleted', id]);
      
      await connection.end();

      // Récupérer dynamiquement la liste des admins actifs
      const [admins2] = await database.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true");
      const adminIds2 = admins2.map(a => a.id);
      // Notifier les admins de la suppression d'un livre
      await NotificationService.createBookNotification({
        admin_id: adminIds2,
        type: 'book_deleted',
        book_title: existing[0].title,
        book_id: id
      });

      console.log('✅ Livre supprimé avec succès');
      
      // Créer une notification pour la suppression du livre
      await NotificationService.createBookNotification(id, 'deleted');
      
      return { message: 'Livre supprimé avec succès' };
      
    } catch (error) {
      console.error('❌ Erreur dans deleteBook:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un livre a des emprunts actifs
   * @param {number} bookId - ID du livre
   * @returns {Promise<boolean>} - True si le livre a des emprunts actifs
   */
  static async hasActiveLoans(bookId) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM loans 
        WHERE book_id = ? AND status IN ('active', 'overdue')
      `;
      
      const [result] = await database.query(sql, [bookId]);
      return result.count > 0;
    } catch (error) {
      logger.error('Erreur lors de la vérification des emprunts actifs:', error);
      throw error;
    }
  }
}

module.exports = BookService;