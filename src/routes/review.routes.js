const express = require('express');
const ReviewController = require('../controllers/review.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  createReviewSchema,
  updateReviewSchema,
  markHelpfulSchema,
  reportReviewSchema,
  searchReviewsSchema
} = require('../validators/review.validators');

const router = express.Router();

// Routes publiques (sans authentification)
router.get('/recent', ReviewController.getRecentReviews);
router.get('/top', ReviewController.getTopReviews);
router.get('/book/:bookId', ReviewController.getBookReviews);
router.get('/book/:bookId/stats', ReviewController.getBookReviewStats);
router.get('/search', validate(searchReviewsSchema, 'query'), ReviewController.searchReviews);

// Routes nécessitant une authentification
router.use(authenticate);

// Routes utilisateur authentifié
router.post('/', validate(createReviewSchema), ReviewController.createReview);
router.get('/me', ReviewController.getMyReviews);
router.get('/book/:bookId/eligibility', ReviewController.checkReviewEligibility);

router.get('/:id', ReviewController.getReviewById);
router.put('/:id', validate(updateReviewSchema), ReviewController.updateReview);
router.delete('/:id', ReviewController.deleteReview);
router.post('/:id/helpful', validate(markHelpfulSchema), ReviewController.markReviewHelpful);
router.post('/:id/report', validate(reportReviewSchema), ReviewController.reportReview);

// Routes pour voir les critiques d'autres utilisateurs (admin ou propriétaire)
router.get('/user/:userId', ReviewController.getUserReviews);

// Routes administrateur seulement
router.use(requireAdmin);

router.get('/', ReviewController.getAllReviews);
router.get('/reports/list', ReviewController.getReportedReviews);
router.get('/stats/summary', ReviewController.getReviewStats);
router.get('/export/data', ReviewController.exportReviews);

router.patch('/:id/moderate', ReviewController.moderateReview);
router.patch('/reports/:id/process', ReviewController.processReport);

module.exports = router;