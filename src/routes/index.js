const express = require('express');
const authRoutes = require('./auth.routes');
const bookRoutes = require('./book.routes');
const loanRoutes = require('./loan.routes');
const reviewRoutes = require('./review.routes');
const notificationRoutes = require('./notification.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

// Middleware de log pour toutes les routes API
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes des livres
router.use('/books', bookRoutes);

// Routes des emprunts
router.use('/loans', loanRoutes);

// Routes des avis
router.use('/reviews', reviewRoutes);

// Routes des notifications
router.use('/notifications', notificationRoutes);

// Routes d'administration
router.use('/admin', adminRoutes);

// Route de test de l'API
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API LECTURA fonctionnelle',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Documentation des endpoints disponibles
router.get('/docs', (req, res) => {
  res.json({
    name: 'LECTURA API Documentation',
    version: '1.0.0',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      authentication: {
        login: 'POST /auth/login',
        register: 'POST /auth/register',
        logout: 'POST /auth/logout',
        refresh: 'POST /auth/refresh',
        forgotPassword: 'POST /auth/forgot-password',
        resetPassword: 'POST /auth/reset-password',
        profile: 'GET /auth/profile',
        updateProfile: 'PUT /auth/profile'
      },
      books: {
        list: 'GET /books',
        search: 'GET /books/search',
        create: 'POST /books',
        details: 'GET /books/:id',
        update: 'PUT /books/:id',
        delete: 'DELETE /books/:id',
        categories: 'GET /books/categories',
        authors: 'GET /books/authors'
      },
      loans: {
        list: 'GET /loans',
        create: 'POST /loans',
        details: 'GET /loans/:id',
        return: 'POST /loans/:id/return',
        renew: 'POST /loans/:id/renew',
        history: 'GET /loans/history',
        overdue: 'GET /loans/overdue'
      },
      reviews: {
        list: 'GET /reviews',
        create: 'POST /reviews',
        details: 'GET /reviews/:id',
        update: 'PUT /reviews/:id',
        delete: 'DELETE /reviews/:id',
        bookReviews: 'GET /books/:id/reviews'
      },
      notifications: {
        list: 'GET /notifications',
        markAsRead: 'PUT /notifications/:id/read',
        markAllAsRead: 'PUT /notifications/read-all',
        delete: 'DELETE /notifications/:id',
        preferences: 'GET /notifications/preferences',
        updatePreferences: 'PUT /notifications/preferences'
      },
      admin: {
        users: 'GET /admin/users',
        userDetails: 'GET /admin/users/:id',
        updateUser: 'PUT /admin/users/:id',
        deleteUser: 'DELETE /admin/users/:id',
        statistics: 'GET /admin/statistics',
        loans: 'GET /admin/loans',
        books: 'GET /admin/books'
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer {token}',
      description: 'Obtenez un token via POST /auth/login'
    },
    errorCodes: {
      400: 'Bad Request - Données invalides',
      401: 'Unauthorized - Authentification requise',
      403: 'Forbidden - Permissions insuffisantes',
      404: 'Not Found - Ressource non trouvée',
      409: 'Conflict - Conflit de données',
      429: 'Too Many Requests - Limite de taux atteinte',
      500: 'Internal Server Error - Erreur serveur'
    },
    dataFormats: {
      dates: 'ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
      pagination: {
        page: 'Numéro de page (défaut: 1)',
        limit: 'Éléments par page (défaut: 10, max: 100)',
        total: 'Nombre total d\'éléments',
        pages: 'Nombre total de pages'
      }
    }
  });
});

module.exports = router;