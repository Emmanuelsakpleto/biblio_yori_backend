const express = require('express');
const router = express.Router();
const bookLikeController = require('../controllers/bookLike.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/books/:bookId/likes (public)
router.get('/:bookId/likes', bookLikeController.getLikes);
// POST /api/books/:bookId/like (authentifié)
router.post('/:bookId/like', authenticate, bookLikeController.addLike);

module.exports = router;
