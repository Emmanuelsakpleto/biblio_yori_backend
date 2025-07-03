const database = require('../config/database');
const { logger } = require('../utils/helpers');

class ReviewModel {
  /**
   * Créer un nouvel avis
   * @param {Object} reviewData - Données de l'avis
   * @returns {Promise<Object>} - Avis créé
   */
  static async create(reviewData) {
    try {
      const {
        user_id,
        book_id,
        rating,
        comment,
        is_anonymous = false
      } = reviewData;

      // Vérifier si l'utilisateur a déjà laissé un avis pour ce livre
      const existingReview = await this.findByUserAndBook(user_id, book_id);
      if (existingReview) {
        throw new Error('Vous avez déjà laissé un avis pour ce livre');
      }

      const sql = `
        INSERT INTO reviews (user_id, book_id, rating, comment, is_anonymous)
        VALUES (?, ?, ?, ?, ?)
      `;

      const result = await database.query(sql, [
        user_id, book_id, rating, comment, is_anonymous
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('Erreur lors de la création de l\'avis:', error);
      throw error;
    }
  }

  /**
   * Trouver un avis par ID
   * @param {number} id - ID de l'avis
   * @returns {Promise<Object|null>} - Avis ou null
   */
  static async findById(id) {
    try {
      const sql = `
        SELECT r.*, 
               CASE 
                 WHEN r.is_anonymous = 1 THEN 'Anonyme'
                 ELSE CONCAT(u.first_name, ' ', u.last_name)
               END as reviewer_name,
               CASE 
                 WHEN r.is_anonymous = 1 THEN NULL
                 ELSE u.profile_image
               END as reviewer_image,
               b.title as book_title, b.author as book_author
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        WHERE r.id = ?
      `;
      
      const [review] = await database.query(sql, [id]);
      return review || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'avis par ID:', error);
      throw error;
    }
  }

  /**
   * Trouver un avis par utilisateur et livre
   * @param {number} userId - ID de l'utilisateur
   * @param {number} bookId - ID du livre
   * @returns {Promise<Object|null>} - Avis ou null
   */
  static async findByUserAndBook(userId, bookId) {
    try {
      const sql = `
        SELECT r.*, 
               u.first_name, u.last_name,
               b.title as book_title
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        WHERE r.user_id = ? AND r.book_id = ?
      `;
      
      const [review] = await database.query(sql, [userId, bookId]);
      return review || null;
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'avis par utilisateur et livre:', error);
      throw error;
    }
  }

  /**
   * Lister tous les avis avec pagination et filtres
   * @param {Object} options - Options de pagination et filtres
   * @returns {Promise<Object>} - Liste paginée des avis
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        book_id,
        user_id,
        rating,
        sort = 'newest'
      } = options;

      const offset = (page - 1) * limit;
      let whereConditions = [];
      let params = [];

      // Filtres
      if (book_id) {
        whereConditions.push('r.book_id = ?');
        params.push(book_id);
      }

      if (user_id) {
        whereConditions.push('r.user_id = ?');
        params.push(user_id);
      }

      if (rating) {
        whereConditions.push('r.rating = ?');
        params.push(rating);
      }

      const whereClause = whereConditions.length > 0 ? 
        'WHERE ' + whereConditions.join(' AND ') : '';

      // Définir l'ordre de tri
      let orderClause = 'ORDER BY r.created_at DESC';
      switch (sort) {
        case 'oldest':
          orderClause = 'ORDER BY r.created_at ASC';
          break;
        case 'rating_high':
          orderClause = 'ORDER BY r.rating DESC, r.created_at DESC';
          break;
        case 'rating_low':
          orderClause = 'ORDER BY r.rating ASC, r.created_at DESC';
          break;
        case 'helpful':
          orderClause = 'ORDER BY r.helpful_count DESC, r.created_at DESC';
          break;
      }

      // Requête de comptage
      const countSql = `
        SELECT COUNT(*) as total 
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        ${whereClause}
      `;
      const [{ total }] = await database.query(countSql, params);

      // Requête de données
      const sql = `
        SELECT r.*, 
               CASE 
                 WHEN r.is_anonymous = 1 THEN 'Anonyme'
                 ELSE CONCAT(u.first_name, ' ', u.last_name)
               END as reviewer_name,
               CASE 
                 WHEN r.is_anonymous = 1 THEN NULL
                 ELSE u.profile_image
               END as reviewer_image,
               b.title as book_title, b.author as book_author, b.cover_image
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `;

      const reviews = await database.query(sql, [...params, limit, offset]);

      return {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des avis:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un avis
   * @param {number} id - ID de l'avis
   * @param {Object} reviewData - Nouvelles données
   * @returns {Promise<Object>} - Avis mis à jour
   */
  static async update(id, reviewData) {
    try {
      const allowedFields = ['rating', 'comment', 'is_anonymous'];
      
      const updateFields = [];
      const values = [];

      // Construire la requête dynamiquement
      Object.keys(reviewData).forEach(key => {
        if (allowedFields.includes(key) && reviewData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(reviewData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('Aucun champ valide à mettre à jour');
      }

      values.push(id);
      
      const sql = `
        UPDATE reviews 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await database.query(sql, values);
      
      return await this.findById(id);
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'avis:', error);
      throw error;
    }
  }

  /**
   * Supprimer un avis
   * @param {number} id - ID de l'avis
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async delete(id) {
    try {
      const sql = 'DELETE FROM reviews WHERE id = ?';
      const result = await database.query(sql, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'avis:', error);
      throw error;
    }
  }

  /**
   * Obtenir les avis d'un livre
   * @param {number} bookId - ID du livre
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} - Avis du livre avec statistiques
   */
  static async getBookReviews(bookId, options = {}) {
    try {
      const { page = 1, limit = 10, sort = 'newest' } = options;
      
      // Statistiques des avis
      const statsSql = `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_stars,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_stars,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_stars,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_stars,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
        FROM reviews 
        WHERE book_id = ?
      `;
      
      const [stats] = await database.query(statsSql, [bookId]);

      // Avis avec pagination
      const reviewsResult = await this.findAll({
        book_id: bookId,
        page,
        limit,
        sort
      });

      return {
        ...reviewsResult,
        stats: {
          ...stats,
          average_rating: parseFloat(stats.average_rating || 0).toFixed(1)
        }
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des avis du livre:', error);
      throw error;
    }
  }

  /**
   * Obtenir les avis d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Promise<Object>} - Avis de l'utilisateur
   */
  static async getUserReviews(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      return await this.findAll({
        user_id: userId,
        page,
        limit,
        sort: 'newest'
      });
    } catch (error) {
      logger.error('Erreur lors de la récupération des avis de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Marquer un avis comme utile
   * @param {number} reviewId - ID de l'avis
   * @param {number} userId - ID de l'utilisateur qui trouve l'avis utile
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async markAsHelpful(reviewId, userId) {
    try {
      return await database.transaction(async (connection) => {
        // Vérifier si l'utilisateur a déjà marqué cet avis comme utile
        const [existing] = await connection.execute(
          'SELECT * FROM review_helpful WHERE review_id = ? AND user_id = ?',
          [reviewId, userId]
        );

        if (existing.length) {
          // Retirer le vote utile
          await connection.execute(
            'DELETE FROM review_helpful WHERE review_id = ? AND user_id = ?',
            [reviewId, userId]
          );
          
          await connection.execute(
            'UPDATE reviews SET helpful_count = GREATEST(0, helpful_count - 1) WHERE id = ?',
            [reviewId]
          );
          
          return false; // Vote retiré
        } else {
          // Ajouter le vote utile
          await connection.execute(
            'INSERT INTO review_helpful (review_id, user_id) VALUES (?, ?)',
            [reviewId, userId]
          );
          
          await connection.execute(
            'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
            [reviewId]
          );
          
          return true; // Vote ajouté
        }
      });
    } catch (error) {
      logger.error('Erreur lors du marquage comme utile:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques globales des avis
   * @returns {Promise<Object>} - Statistiques
   */
  static async getStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          COUNT(DISTINCT user_id) as unique_reviewers,
          COUNT(DISTINCT book_id) as reviewed_books,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as new_this_month
        FROM reviews
      `;

      const [stats] = await database.query(sql);
      return {
        ...stats,
        average_rating: parseFloat(stats.average_rating || 0).toFixed(1)
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  /**
   * Obtenir les livres les mieux notés
   * @param {number} limit - Nombre de résultats
   * @returns {Promise<Array>} - Livres les mieux notés
   */
  static async getTopRatedBooks(limit = 10) {
    try {
      const sql = `
        SELECT b.id, b.title, b.author, b.cover_image,
               AVG(r.rating) as average_rating,
               COUNT(r.id) as reviews_count
        FROM books b
        JOIN reviews r ON b.id = r.book_id
        GROUP BY b.id
        HAVING reviews_count >= 3
        ORDER BY average_rating DESC, reviews_count DESC
        LIMIT ?
      `;

      const books = await database.query(sql, [limit]);
      return books.map(book => ({
        ...book,
        average_rating: parseFloat(book.average_rating).toFixed(1)
      }));
    } catch (error) {
      logger.error('Erreur lors de la récupération des livres les mieux notés:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un utilisateur peut laisser un avis
   * @param {number} userId - ID de l'utilisateur
   * @param {number} bookId - ID du livre
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  static async canUserReview(userId, bookId) {
    try {
      // Vérifier si l'utilisateur a déjà un avis pour ce livre
      const existingReview = await this.findByUserAndBook(userId, bookId);
      if (existingReview) {
        return {
          canReview: false,
          reason: 'Avis déjà existant',
          existingReview
        };
      }

      // Optionnel: Vérifier si l'utilisateur a emprunté le livre
      const [loan] = await database.query(
        'SELECT * FROM loans WHERE user_id = ? AND book_id = ? AND status = "returned"',
        [userId, bookId]
      );

      return {
        canReview: true,
        reason: 'Avis autorisé',
        hasReadBook: loan.length > 0
      };
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'avis:', error);
      throw error;
    }
  }
}

module.exports = ReviewModel;