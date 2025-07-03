const db = require('../config/database');
const { AppError, generateId, formatDate } = require('../utils/helpers');

class ReviewService {
  // Créer une nouvelle critique
  static async createReview(reviewData) {
    try {
      const { user_id, book_id, rating, comment } = reviewData;

      // Vérifier que l'utilisateur a emprunté ce livre
      const loanCheck = await db.query(
        'SELECT COUNT(*) as loan_count FROM loans WHERE user_id = ? AND book_id = ? AND status IN (?, ?)',
        [user_id, book_id, 'returned', 'active']
      );

      if (parseInt(loanCheck[0].loan_count) === 0) {
        throw new AppError('Vous devez avoir emprunté ce livre pour pouvoir le critiquer', 403);
      }

      // Vérifier qu'il n'y a pas déjà une critique
      const existingReview = await db.query(
        'SELECT id FROM reviews WHERE user_id = ? AND book_id = ?',
        [user_id, book_id]
      );

      if (existingReview.length > 0) {
        throw new AppError('Vous avez déjà critiqué ce livre', 400);
      }

      // Insérer la nouvelle critique (id AUTO_INCREMENT, is_approved au lieu de is_anonymous)
      const query = `
        INSERT INTO reviews (
          user_id, book_id, rating, comment, is_approved
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const values = [user_id, book_id, rating, comment, false];
      const result = await db.query(query, values);

      // Retourner les données de base
      return {
        id: result.insertId,
        user_id,
        book_id,
        rating,
        comment,
        is_approved: false,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erreur création critique:', error);
      throw new AppError('Erreur lors de la création de la critique', 500);
    }
  }

  // Récupérer une critique par ID
  static async getReviewById(reviewId) {
    try {
      const query = `
        SELECT 
          r.*,
          CONCAT(u.first_name, ' ', u.last_name) as reviewer_name,
          b.title as book_title,
          b.author as book_author
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        WHERE r.id = ?
      `;

      const result = await db.query(query, [reviewId]);
      return result[0] || null;
    } catch (error) {
      console.error('Erreur récupération critique:', error);
      throw new AppError('Erreur lors de la récupération de la critique', 500);
    }
  }

  // Récupérer toutes les critiques avec filtres
  static async getAllReviews(filters, pagination) {
    try {
      let whereConditions = ['1=1'];
      let params = [];

      if (filters.book_id) {
        whereConditions.push('r.book_id = ?');
        params.push(filters.book_id);
      }

      if (filters.user_id) {
        whereConditions.push('r.user_id = ?');
        params.push(filters.user_id);
      }

      if (filters.rating) {
        whereConditions.push('r.rating = ?');
        params.push(filters.rating);
      }

      const orderBy = `ORDER BY r.${filters.sort_by || 'created_at'} ${filters.sort_order || 'DESC'}`;
      
      const query = `
        SELECT 
          r.*,
          CONCAT(u.first_name, ' ', u.last_name) as reviewer_name,
          b.title as book_title,
          b.author as book_author
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        WHERE ${whereConditions.join(' AND ')}
        ${orderBy}
        LIMIT ? OFFSET ?
      `;

      params.push(pagination.limit, pagination.offset);

      // Compter le total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reviews r
        WHERE ${whereConditions.join(' AND ')}
      `;

      const [reviewsResult, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params.slice(0, -2))
      ]);

      return {
        reviews: reviewsResult,
        total: parseInt(countResult[0].total),
        page: pagination.page,
        limit: pagination.limit,
        hasMore: pagination.offset + pagination.limit < parseInt(countResult[0].total)
      };
    } catch (error) {
      console.error('Erreur récupération critiques:', error);
      throw new AppError('Erreur lors de la récupération des critiques', 500);
    }
  }

  // Récupérer les critiques d'un livre
  static async getBookReviews(bookId, filters, pagination) {
    try {
      // Version ultra-simplifiée qui fonctionne
      const query = `
        SELECT 
          r.id, 
          r.user_id, 
          r.book_id, 
          r.rating, 
          r.comment, 
          r.is_approved, 
          r.created_at, 
          r.updated_at,
          CONCAT(u.first_name, ' ', u.last_name) as reviewer_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.book_id = ?
        ORDER BY r.created_at DESC
        LIMIT 20
      `;

      const result = await db.query(query, [bookId]);

      return {
        reviews: result,
        total: result.length,
        page: 1,
        limit: 20,
        hasMore: false
      };
    } catch (error) {
      console.error('Erreur récupération critiques livre:', error.message);
      throw new AppError('Erreur lors de la récupération des critiques du livre', 500);
    }
  }

  // Récupérer les critiques d'un utilisateur
  static async getUserReviews(userId, filters, pagination) {
    try {
      const userFilters = { ...filters, user_id: userId };
      return await this.getAllReviews(userFilters, pagination);
    } catch (error) {
      console.error('Erreur récupération critiques utilisateur:', error);
      throw new AppError('Erreur lors de la récupération des critiques de l\'utilisateur', 500);
    }
  }

  // Mettre à jour une critique
  static async updateReview(reviewId, updateData) {
    try {
      const { rating, comment } = updateData;
      
      let updateFields = [];
      let values = [];

      if (rating !== undefined) {
        updateFields.push('rating = ?');
        values.push(rating);
      }

      if (comment !== undefined) {
        updateFields.push('comment = ?');
        values.push(comment);
      }

      updateFields.push('updated_at = NOW()');
      values.push(reviewId);

      const query = `
        UPDATE reviews 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;

      const result = await db.query(query, values);
      
      if (result.affectedRows === 0) {
        throw new AppError('Critique non trouvée', 404);
      }

      return await this.getReviewById(reviewId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erreur mise à jour critique:', error);
      throw new AppError('Erreur lors de la mise à jour de la critique', 500);
    }
  }

  // Supprimer une critique
  static async deleteReview(reviewId) {
    try {
      const query = 'DELETE FROM reviews WHERE id = ?';
      const result = await db.query(query, [reviewId]);
      
      if (result.affectedRows === 0) {
        throw new AppError('Critique non trouvée', 404);
      }

      return { success: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erreur suppression critique:', error);
      throw new AppError('Erreur lors de la suppression de la critique', 500);
    }
  }

  // Marquer une critique comme utile
  static async markReviewHelpful(reviewId, userId, isHelpful) {
    try {
      // Vérifier que la critique existe
      const review = await this.getReviewById(reviewId);
      if (!review) {
        throw new AppError('Critique non trouvée', 404);
      }

      // Vérifier si l'utilisateur a déjà voté
      const existingVote = await db.query(
        'SELECT * FROM review_votes WHERE review_id = $1 AND user_id = $2',
        [reviewId, userId]
      );

      if (existingVote.rows.length > 0) {
        // Mettre à jour le vote existant
        await db.query(
          'UPDATE review_votes SET is_helpful = $1, updated_at = NOW() WHERE review_id = $2 AND user_id = $3',
          [isHelpful, reviewId, userId]
        );
      } else {
        // Créer un nouveau vote
        const voteId = generateId();
        await db.query(
          'INSERT INTO review_votes (id, review_id, user_id, is_helpful, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [voteId, reviewId, userId, isHelpful]
        );
      }

      // Récupérer les statistiques mises à jour
      const statsQuery = `
        SELECT 
          COUNT(CASE WHEN is_helpful = true THEN 1 END) as helpful_count,
          COUNT(CASE WHEN is_helpful = false THEN 1 END) as not_helpful_count
        FROM review_votes 
        WHERE review_id = $1
      `;
      
      const statsResult = await db.query(statsQuery, [reviewId]);
      
      return {
        helpful_count: parseInt(statsResult.rows[0].helpful_count),
        not_helpful_count: parseInt(statsResult.rows[0].not_helpful_count)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erreur vote critique:', error);
      throw new AppError('Erreur lors du vote sur la critique', 500);
    }
  }

  // Signaler une critique
  static async reportReview(reviewId, reporterId, reportData) {
    try {
      const { reason, details } = reportData;

      // Vérifier que la critique existe
      const review = await this.getReviewById(reviewId);
      if (!review) {
        throw new AppError('Critique non trouvée', 404);
      }

      // Vérifier que l'utilisateur n'a pas déjà signalé cette critique
      const existingReport = await db.query(
        'SELECT id FROM review_reports WHERE review_id = $1 AND reporter_id = $2',
        [reviewId, reporterId]
      );

      if (existingReport.rows.length > 0) {
        throw new AppError('Vous avez déjà signalé cette critique', 400);
      }

      const reportId = generateId();
      
      const query = `
        INSERT INTO review_reports (
          id, review_id, reporter_id, reason, details, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW())
        RETURNING *
      `;

      const result = await db.query(query, [reportId, reviewId, reporterId, reason, details]);
      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erreur signalement critique:', error);
      throw new AppError('Erreur lors du signalement de la critique', 500);
    }
  }

  // Obtenir les statistiques des critiques d'un livre
  static async getBookReviewStats(bookId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_reviews,
          ROUND(AVG(rating), 2) as average_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1
        FROM reviews 
        WHERE book_id = $1
      `;

      const result = await db.query(query, [bookId]);
      return result.rows[0];
    } catch (error) {
      console.error('Erreur statistiques critiques livre:', error);
      throw new AppError('Erreur lors de la récupération des statistiques', 500);
    }
  }

  // Obtenir les critiques récentes
  static async getRecentReviews(limit = 10) {
    try {
      const query = `
        SELECT 
          r.*,
          CASE 
            WHEN r.is_anonymous = true THEN 'Utilisateur anonyme'
            ELSE CONCAT(u.first_name, ' ', u.last_name)
          END as reviewer_name,
          u.avatar_url,
          b.title as book_title,
          b.author as book_author,
          b.cover_image
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        ORDER BY r.created_at DESC
        LIMIT $1
      `;

      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Erreur critiques récentes:', error);
      throw new AppError('Erreur lors de la récupération des critiques récentes', 500);
    }
  }

  // Obtenir les meilleures critiques
  static async getTopReviews(limit = 10, period = 'all') {
    try {
      let dateFilter = '';
      let params = [limit];

      if (period !== 'all') {
        switch (period) {
          case 'week':
            dateFilter = 'AND r.created_at >= NOW() - INTERVAL \'7 days\'';
            break;
          case 'month':
            dateFilter = 'AND r.created_at >= NOW() - INTERVAL \'1 month\'';
            break;
          case 'year':
            dateFilter = 'AND r.created_at >= NOW() - INTERVAL \'1 year\'';
            break;
        }
      }

      const query = `
        SELECT 
          r.*,
          CASE 
            WHEN r.is_anonymous = true THEN 'Utilisateur anonyme'
            ELSE CONCAT(u.first_name, ' ', u.last_name)
          END as reviewer_name,
          u.avatar_url,
          b.title as book_title,
          b.author as book_author,
          b.cover_image,
          COALESCE(v.helpful_count, 0) as helpful_count
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        LEFT JOIN (
          SELECT 
            review_id,
            COUNT(CASE WHEN is_helpful = true THEN 1 END) as helpful_count
          FROM review_votes 
          GROUP BY review_id
        ) v ON r.id = v.review_id
        WHERE 1=1 ${dateFilter}
        ORDER BY v.helpful_count DESC, r.rating DESC, r.created_at DESC
        LIMIT $1
      `;

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Erreur meilleures critiques:', error);
      throw new AppError('Erreur lors de la récupération des meilleures critiques', 500);
    }
  }

  // Rechercher des critiques
  static async searchReviews(filters, pagination) {
    try {
      let whereConditions = ['1=1'];
      let params = [];
      let paramIndex = 1;

      if (filters.search) {
        whereConditions.push(`(r.comment ILIKE $${paramIndex} OR b.title ILIKE $${paramIndex} OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.rating) {
        whereConditions.push(`r.rating = $${paramIndex}`);
        params.push(filters.rating);
        paramIndex++;
      }

      if (filters.book_id) {
        whereConditions.push(`r.book_id = $${paramIndex}`);
        params.push(filters.book_id);
        paramIndex++;
      }

      const query = `
        SELECT 
          r.*,
          CASE 
            WHEN r.is_anonymous = true THEN 'Utilisateur anonyme'
            ELSE CONCAT(u.first_name, ' ', u.last_name)
          END as reviewer_name,
          u.avatar_url,
          b.title as book_title,
          b.author as book_author,
          b.cover_image
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(pagination.limit, pagination.offset);

      // Compter le total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        WHERE ${whereConditions.join(' AND ')}
      `;

      const [reviewsResult, countResult] = await Promise.all([
        db.query(query, params),
        db.query(countQuery, params.slice(0, -2))
      ]);

      return {
        reviews: reviewsResult.rows,
        total: parseInt(countResult.rows[0].total),
        page: pagination.page,
        limit: pagination.limit,
        hasMore: pagination.offset + pagination.limit < parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      console.error('Erreur recherche critiques:', error);
      throw new AppError('Erreur lors de la recherche de critiques', 500);
    }
  }

  // Vérifier l'éligibilité pour critiquer un livre
  static async checkReviewEligibility(userId, bookId) {
    try {
      // Vérifier si l'utilisateur a emprunté le livre
      const loanCheck = await db.query(
        'SELECT COUNT(*) as loan_count FROM loans WHERE user_id = $1 AND book_id = $2 AND status IN ($3, $4)',
        [userId, bookId, 'completed', 'active']
      );

      const hasLoaned = parseInt(loanCheck.rows[0].loan_count) > 0;

      // Vérifier s'il y a déjà une critique
      const reviewCheck = await db.query(
        'SELECT id FROM reviews WHERE user_id = $1 AND book_id = $2',
        [userId, bookId]
      );

      const hasReviewed = reviewCheck.rows.length > 0;

      return {
        can_review: hasLoaned && !hasReviewed,
        has_loaned: hasLoaned,
        has_reviewed: hasReviewed,
        reason: !hasLoaned ? 'Vous devez avoir emprunté ce livre pour le critiquer' :
                hasReviewed ? 'Vous avez déjà critiqué ce livre' : null
      };
    } catch (error) {
      console.error('Erreur vérification éligibilité critique:', error);
      throw new AppError('Erreur lors de la vérification d\'éligibilité', 500);
    }
  }

  // Modérer une critique (Admin)
  static async moderateReview(reviewId, action, reason) {
    try {
      let updateQuery = '';
      const params = [];

      switch (action) {
        case 'approve':
          updateQuery = 'UPDATE reviews SET is_approved = true, updated_at = NOW() WHERE id = ?';
          params.push(reviewId);
          break;
        case 'reject':
          updateQuery = 'UPDATE reviews SET is_approved = false, updated_at = NOW() WHERE id = ?';
          params.push(reviewId);
          break;
        case 'hide':
          // Note: la colonne is_hidden n'existe pas dans notre schéma, on utilise is_approved = false
          updateQuery = 'UPDATE reviews SET is_approved = false, updated_at = NOW() WHERE id = ?';
          params.push(reviewId);
          break;
        default:
          throw new AppError('Action de modération invalide', 400);
      }

      const result = await db.query(updateQuery, params);
      
      if (result.affectedRows === 0) {
        throw new AppError('Critique non trouvée', 404);
      }

      return await this.getReviewById(reviewId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      console.error('Erreur modération critique:', error);
      throw new AppError('Erreur lors de la modération de la critique', 500);
    }
  }

  // Autres méthodes pour les fonctionnalités administrateur...
  static async getReportedReviews(filters, pagination) {
    // Implementation similar to getAllReviews but for reported reviews
  }

  static async processReport(reportId, action, adminNotes) {
    // Implementation for processing review reports
  }

  static async getReviewStats(filters) {
    // Implementation for review statistics
  }

  static async exportReviews(format, filters) {
    // Implementation for exporting reviews
  }
}

module.exports = ReviewService;
