const express = require('express');
const BookController = require('../controllers/book.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { uploadBookCover, uploadBookPdf } = require('../middleware/upload.middleware');
const multer = require('multer');
const path = require('path');

// Create a custom upload middleware for books that handles multiple fields
const upload = multer({
  dest: path.join(__dirname, '../../uploads/books/'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 2
  }
});

const bookUpload = upload.fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'pdf_file', maxCount: 1 }
]);

const singleFileUpload = upload.single('file');
const { createBookSchema, updateBookSchema, searchBooksSchema } = require('../validators/book.validators');

const router = express.Router();

// Routes publiques (sans authentification)
router.get('/search', validate(searchBooksSchema, 'query'), BookController.searchBooks);
router.get('/popular', BookController.getPopularBooks);
router.get('/new', BookController.getNewBooks);
router.get('/categories', BookController.getCategories);
router.get('/category/:category', BookController.getBooksByCategory);
router.get('/:id', BookController.getBookById);
router.get('/:id/availability', BookController.checkAvailability);
router.get('/', BookController.getAllBooks);

// Routes nécessitant une authentification
router.use(authenticate);

// Routes utilisateur authentifié
router.get('/recommendations/me', BookController.getRecommendations);
router.post('/:id/reserve', BookController.reserveBook);
router.delete('/:id/reserve', BookController.cancelReservation);
router.get('/reservations/me', BookController.getUserReservations);
router.get('/:id/download', BookController.downloadPDF);
router.get('/:id/likes', BookController.getBookLikes);
router.post('/:id/like', BookController.toggleLike);

// Routes administrateur seulement
router.use(requireAdmin);

router.post('/', 
  bookUpload,
  validate(createBookSchema),
  BookController.createBook
);

router.put('/:id',
  bookUpload,
  validate(updateBookSchema),
  BookController.updateBook
);

router.delete('/:id', BookController.deleteBook);
router.get('/:id/stats', BookController.getBookStats);
router.patch('/:id/availability', BookController.updateAvailability);
router.get('/export/list', BookController.exportBooks);
router.post('/import/bulk', 
  singleFileUpload,
  BookController.importBooks
);

module.exports = router;