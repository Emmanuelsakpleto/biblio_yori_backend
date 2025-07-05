const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Middlewares personnalisés
const { errorHandler } = require('./middleware/error.middleware');
const { logger } = require('./utils/helpers');

// Routes
const routes = require('./routes');

// Jobs système
const CleanupJobs = require('./jobs/cleanup.jobs');
const NotificationJobs = require('./jobs/notification.jobs');
const StatisticsJobs = require('./jobs/statistics.jobs');

// Création de l'application Express
const app = express();

// Configuration des middlewares de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Permettre les requêtes sans origin (applications mobiles, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Middleware de compression
app.use(compression());

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 2000, // limite de requêtes par IP (augmentée)
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limite de 10 tentatives de connexion par IP
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.'
  },
  skipSuccessfulRequests: true,
});

// Rate limiting plus permissif pour les likes
const likesLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 30 : 100, // 30 likes par minute en production, 100 en dev
  message: {
    error: 'Trop de likes envoyés, veuillez patienter un moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/books/:id/like', likesLimiter);
app.use('/api/books/:id/likes', likesLimiter);

// Parsing des données
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Middleware de logging des requêtes
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    if (res.statusCode >= 400) {
      logger.warn('Requête HTTP', logData);
    } else {
      logger.info('Requête HTTP', logData);
    }
  });
  
  next();
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Serveur LECTURA en fonctionnement',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Route des métriques système
app.get('/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external
    },
    cpu: process.cpuUsage(),
    nodeVersion: process.version,
    platform: process.platform
  });
});

// Route d'information sur l'API
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'LECTURA API',
    version: '1.0.0',
    description: 'API REST pour la plateforme de gestion de bibliothèque LECTURA',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      loans: '/api/loans',
      reviews: '/api/reviews',
      notifications: '/api/notifications',
      admin: '/api/admin'
    }
  });
});

// Routes de l'API
app.use('/api', routes);

// Démarrer les tâches programmées si en production
if (process.env.NODE_ENV === 'production') {
  logger.info('🚀 Démarrage des tâches programmées en production...');
  
  // Démarrer toutes les tâches de nettoyage
  CleanupJobs.startAllCleanupJobs();
  
  // Démarrer toutes les tâches de notification
  NotificationJobs.startAllNotificationJobs();
  
  // Démarrer toutes les tâches statistiques
  StatisticsJobs.startAllStatisticsJobs();
  
  logger.info('✅ Toutes les tâches programmées sont démarrées');
} else {
  logger.info('🔧 Mode développement: les tâches programmées sont désactivées');
}

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Middleware de gestion d'erreurs
app.use(errorHandler);

module.exports = app;