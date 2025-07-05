const ReviewService = require('../services/review.service');
const { AppError, formatResponse, paginate } = require('../utils/helpers');

class ReviewController {
  // Créer une nouvelle critique
  static async createReview(req, res, next) {
    try {
      const { book_id, rating, comment, is_anonymous = false } = req.body;
      const { id: userId } = req.user;

      const review = await ReviewService.createReview({
        user_id: userId,
        book_id,
        rating,
        comment,
        is_anonymous
      });

      // Notifier l'admin automatiquement lors de la création d'un avis
      try {
        const NotificationJobs = require('../jobs/notification.jobs');
        if (typeof NotificationJobs.sendAdminReviewNotification === 'function') {
          await NotificationJobs.sendAdminReviewNotification(review.id);
        }
      } catch (notifError) {
        // Log mais ne bloque pas la création de l'avis
        console.error('Erreur notification admin nouvel avis:', notifError);
      }

      res.status(201).json(formatResponse(true, 'Critique créée avec succès', review));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir toutes les critiques avec filtres
  static async getAllReviews(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        book_id = '',
        user_id = '',
        rating = '',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const filters = {
        book_id: book_id.trim(),
        user_id: user_id.trim(),
        rating: rating ? parseInt(rating) : null,
        sort_by,
        sort_order: sort_order.toUpperCase()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await ReviewService.getAllReviews(filters, pagination);

      res.json(formatResponse(true, 'Critiques récupérées avec succès', Array.isArray(result.reviews) ? result.reviews : []));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir une critique par ID
  static async getReviewById(req, res, next) {
    try {
      const { id } = req.params;

      const review = await ReviewService.getReviewById(id);

      if (!review) {
        throw new AppError('Critique non trouvée', 404);
      }

      res.json(formatResponse(true, 'Critique récupérée avec succès', review));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les critiques d'un livre
  static async getBookReviews(req, res, next) {
    try {
      const { bookId } = req.params;
      const {
        page = 1,
        limit = 20,
        rating = '',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const filters = {
        rating: rating ? parseInt(rating) : null,
        sort_by,
        sort_order: sort_order.toUpperCase()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await ReviewService.getBookReviews(bookId, filters, pagination);

      res.json(formatResponse(true, 'Critiques du livre récupérées avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les critiques d'un utilisateur
  static async getUserReviews(req, res, next) {
    try {
      const { userId: targetUserId } = req.params;
      const { id: currentUserId, role } = req.user;
      const {
        page = 1,
        limit = 20,
        rating = '',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // Vérifier les permissions
      if (role !== 'admin' && currentUserId !== parseInt(targetUserId)) {
        throw new AppError('Accès non autorisé aux critiques de cet utilisateur', 403);
      }

      const filters = {
        rating: rating ? parseInt(rating) : null,
        sort_by,
        sort_order: sort_order.toUpperCase()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await ReviewService.getUserReviews(targetUserId, filters, pagination);

      res.json(formatResponse(true, 'Critiques de l\'utilisateur récupérées avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les critiques de l'utilisateur connecté
  static async getMyReviews(req, res, next) {
    try {
      const { id: userId } = req.user;
      const {
        page = 1,
        limit = 20,
        rating = '',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const filters = {
        rating: rating ? parseInt(rating) : null,
        sort_by,
        sort_order: sort_order.toUpperCase()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await ReviewService.getUserReviews(userId, filters, pagination);

      res.json(formatResponse(true, 'Vos critiques récupérées avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour une critique
  static async updateReview(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const updateData = req.body;

      // Récupérer la critique existante
      const existingReview = await ReviewService.getReviewById(id);
      if (!existingReview) {
        throw new AppError('Critique non trouvée', 404);
      }

      // Vérifier les permissions
      if (role !== 'admin' && existingReview.user_id !== userId) {
        throw new AppError('Vous ne pouvez modifier que vos propres critiques', 403);
      }

      const review = await ReviewService.updateReview(id, updateData);

      res.json(formatResponse(true, 'Critique mise à jour avec succès', review));
    } catch (error) {
      next(error);
    }
  }

  // Supprimer une critique
  static async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;

      // Récupérer la critique existante
      const existingReview = await ReviewService.getReviewById(id);
      if (!existingReview) {
        throw new AppError('Critique non trouvée', 404);
      }

      // Vérifier les permissions
      if (role !== 'admin' && existingReview.user_id !== userId) {
        throw new AppError('Vous ne pouvez supprimer que vos propres critiques', 403);
      }

      await ReviewService.deleteReview(id);

      res.json(formatResponse(true, 'Critique supprimée avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Marquer une critique comme utile
  static async markReviewHelpful(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { is_helpful } = req.body;

      const result = await ReviewService.markReviewHelpful(id, userId, is_helpful);

      res.json(formatResponse(true, 'Vote enregistré avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Signaler une critique
  static async reportReview(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId } = req.user;
      const { reason, details } = req.body;

      const report = await ReviewService.reportReview(id, userId, { reason, details });

      res.json(formatResponse(true, 'Critique signalée avec succès', report));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques des critiques d'un livre
  static async getBookReviewStats(req, res, next) {
    try {
      const { bookId } = req.params;

      const stats = await ReviewService.getBookReviewStats(bookId);

      res.json(formatResponse(true, 'Statistiques des critiques récupérées', stats));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les critiques les plus récentes
  static async getRecentReviews(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const reviews = await ReviewService.getRecentReviews(parseInt(limit));

      res.json(formatResponse(true, 'Critiques récentes récupérées', reviews));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les critiques les mieux notées
  static async getTopReviews(req, res, next) {
    try {
      const { limit = 10, period = 'all' } = req.query;

      const reviews = await ReviewService.getTopReviews(parseInt(limit), period);

      res.json(formatResponse(true, 'Meilleures critiques récupérées', reviews));
    } catch (error) {
      next(error);
    }
  }

  // Rechercher des critiques
  static async searchReviews(req, res, next) {
    try {
      const {
        q: query = '',
        page = 1,
        limit = 20,
        rating = '',
        book_id = ''
      } = req.query;

      if (!query.trim()) {
        throw new AppError('Terme de recherche requis', 400);
      }

      const filters = {
        search: query.trim(),
        rating: rating ? parseInt(rating) : null,
        book_id: book_id.trim()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await ReviewService.searchReviews(filters, pagination);

      res.json(formatResponse(true, 'Recherche de critiques effectuée', result));
    } catch (error) {
      next(error);
    }
  }

  // Modérer une critique (Admin seulement)
  static async moderateReview(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!['approve', 'reject', 'hide'].includes(action)) {
        throw new AppError('Action de modération invalide', 400);
      }

      const review = await ReviewService.moderateReview(id, action, reason);

      res.json(formatResponse(true, 'Critique modérée avec succès', review));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les critiques signalées (Admin seulement)
  static async getReportedReviews(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status = 'pending'
      } = req.query;

      const filters = { status };
      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await ReviewService.getReportedReviews(filters, pagination);

      res.json(formatResponse(true, 'Critiques signalées récupérées', result));
    } catch (error) {
      next(error);
    }
  }

  // Traiter un signalement (Admin seulement)
  static async processReport(req, res, next) {
    try {
      const { id } = req.params;
      const { action, admin_notes } = req.body;

      if (!['dismiss', 'warning', 'remove_review', 'suspend_user'].includes(action)) {
        throw new AppError('Action invalide', 400);
      }

      const result = await ReviewService.processReport(id, action, admin_notes);

      res.json(formatResponse(true, 'Signalement traité avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques générales des critiques (Admin seulement)
  static async getReviewStats(req, res, next) {
    try {
      const {
        period = 'month',
        start_date,
        end_date
      } = req.query;

      const stats = await ReviewService.getReviewStats({
        period,
        start_date,
        end_date
      });

      res.json(formatResponse(true, 'Statistiques des critiques récupérées', stats));
    } catch (error) {
      next(error);
    }
  }

  // Exporter les critiques (Admin seulement)
  static async exportReviews(req, res, next) {
    try {
      const {
        format = 'csv',
        book_id = '',
        rating = '',
        start_date,
        end_date
      } = req.query;

      const filters = {
        book_id: book_id.trim(),
        rating: rating ? parseInt(rating) : null,
        start_date,
        end_date
      };

      const result = await ReviewService.exportReviews(format, filters);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="reviews.${format}"`);
      res.send(result.data);
    } catch (error) {
      next(error);
    }
  }

  // Vérifier si un utilisateur peut critiquer un livre
  static async checkReviewEligibility(req, res, next) {
    try {
      const { bookId } = req.params;
      const { id: userId } = req.user;

      const eligibility = await ReviewService.checkReviewEligibility(userId, bookId);

      res.json(formatResponse(true, 'Éligibilité de critique vérifiée', eligibility));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ReviewController;