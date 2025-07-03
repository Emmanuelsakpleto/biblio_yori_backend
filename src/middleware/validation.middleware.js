const Joi = require('joi');
const { validationError } = require('./error.middleware');
const { REGEX_PATTERNS, USER_ROLES, LIMITS } = require('../utils/constants');

/**
 * Middleware de validation générique
 * @param {Object} schema - Schéma Joi de validation
 * @param {string} source - Source des données (body, params, query)
 * @returns {Function} - Middleware de validation
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[source];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));
      
      throw validationError('Erreur de validation', details);
    }

    // Remplacer les données par les valeurs validées et nettoyées
    req[source] = value;
    next();
  };
};

// Schémas de validation pour l'authentification
const authSchemas = {
  register: Joi.object({
    first_name: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'Le prénom doit contenir au moins 2 caractères',
        'string.max': 'Le prénom ne peut pas dépasser 50 caractères',
        'any.required': 'Le prénom est requis'
      }),
    
    last_name: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'Le nom doit contenir au moins 2 caractères',
        'string.max': 'Le nom ne peut pas dépasser 50 caractères',
        'any.required': 'Le nom est requis'
      }),
    
    email: Joi.string().email().lowercase().required()
      .messages({
        'string.email': 'Format d\'email invalide',
        'any.required': 'L\'email est requis'
      }),
    
    password: Joi.string().min(LIMITS.PASSWORD_MIN_LENGTH).pattern(REGEX_PATTERNS.PASSWORD).required()
      .messages({
        'string.min': `Le mot de passe doit contenir au moins ${LIMITS.PASSWORD_MIN_LENGTH} caractères`,
        'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
        'any.required': 'Le mot de passe est requis'
      }),
    
    phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]{8,15}$/).optional()
      .messages({
        'string.pattern.base': 'Format de téléphone invalide'
      }),
    
    student_id: Joi.string().trim().min(5).max(20).optional()
      .messages({
        'string.min': 'Le numéro étudiant doit contenir au moins 5 caractères',
        'string.max': 'Le numéro étudiant ne peut pas dépasser 20 caractères'
      }),
    
    department: Joi.string().trim().max(100).optional()
      .messages({
        'string.max': 'Le département ne peut pas dépasser 100 caractères'
      }),
    
    role: Joi.string().valid(...Object.values(USER_ROLES)).default(USER_ROLES.STUDENT)
  }),

  login: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Format d\'email invalide',
        'any.required': 'L\'email est requis'
      }),
    
    password: Joi.string().required()
      .messages({
        'any.required': 'Le mot de passe est requis'
      })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Format d\'email invalide',
        'any.required': 'L\'email est requis'
      })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required()
      .messages({
        'any.required': 'Le token de réinitialisation est requis'
      }),
    
    password: Joi.string().min(LIMITS.PASSWORD_MIN_LENGTH).pattern(REGEX_PATTERNS.PASSWORD).required()
      .messages({
        'string.min': `Le mot de passe doit contenir au moins ${LIMITS.PASSWORD_MIN_LENGTH} caractères`,
        'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
        'any.required': 'Le mot de passe est requis'
      })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required()
      .messages({
        'any.required': 'Le mot de passe actuel est requis'
      }),
    
    newPassword: Joi.string().min(LIMITS.PASSWORD_MIN_LENGTH).pattern(REGEX_PATTERNS.PASSWORD).required()
      .messages({
        'string.min': `Le nouveau mot de passe doit contenir au moins ${LIMITS.PASSWORD_MIN_LENGTH} caractères`,
        'string.pattern.base': 'Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre',
        'any.required': 'Le nouveau mot de passe est requis'
      })
  })
};

// Schémas de validation pour les livres
const bookSchemas = {
  create: Joi.object({
    title: Joi.string().trim().min(1).max(200).required()
      .messages({
        'string.min': 'Le titre est requis',
        'string.max': 'Le titre ne peut pas dépasser 200 caractères',
        'any.required': 'Le titre est requis'
      }),
    
    author: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.min': 'L\'auteur est requis',
        'string.max': 'L\'auteur ne peut pas dépasser 100 caractères',
        'any.required': 'L\'auteur est requis'
      }),
    
    isbn: Joi.string().pattern(REGEX_PATTERNS.ISBN).optional()
      .messages({
        'string.pattern.base': 'Format ISBN invalide'
      }),
    
    description: Joi.string().trim().max(1000).optional()
      .messages({
        'string.max': 'La description ne peut pas dépasser 1000 caractères'
      }),
    
    publisher: Joi.string().trim().max(100).optional()
      .messages({
        'string.max': 'L\'éditeur ne peut pas dépasser 100 caractères'
      }),
    
    publication_year: Joi.number().integer().min(1000).max(new Date().getFullYear() + 1).optional()
      .messages({
        'number.min': 'Année de publication invalide',
        'number.max': 'L\'année de publication ne peut pas être dans le futur'
      }),
    
    category: Joi.string().trim().max(50).optional()
      .messages({
        'string.max': 'La catégorie ne peut pas dépasser 50 caractères'
      }),
    
    language: Joi.string().trim().max(10).default('fr')
      .messages({
        'string.max': 'La langue ne peut pas dépasser 10 caractères'
      }),
    
    pages: Joi.number().integer().positive().optional()
      .messages({
        'number.positive': 'Le nombre de pages doit être positif'
      }),
    
    quantity: Joi.number().integer().positive().default(1)
      .messages({
        'number.positive': 'La quantité doit être positive'
      })
  }),

  update: Joi.object({
    title: Joi.string().trim().min(1).max(200).optional(),
    author: Joi.string().trim().min(1).max(100).optional(),
    isbn: Joi.string().pattern(REGEX_PATTERNS.ISBN).optional(),
    description: Joi.string().trim().max(1000).optional(),
    publisher: Joi.string().trim().max(100).optional(),
    publication_year: Joi.number().integer().min(1000).max(new Date().getFullYear() + 1).optional(),
    category: Joi.string().trim().max(50).optional(),
    language: Joi.string().trim().max(10).optional(),
    pages: Joi.number().integer().positive().optional(),
    quantity: Joi.number().integer().positive().optional(),
    status: Joi.string().valid('available', 'borrowed', 'reserved', 'maintenance', 'lost').optional()
  }).min(1).messages({
    'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
  }),

  search: Joi.object({
    q: Joi.string().trim().max(100).optional(),
    category: Joi.string().trim().max(50).optional(),
    author: Joi.string().trim().max(100).optional(),
    language: Joi.string().trim().max(10).optional(),
    available_only: Joi.boolean().default(false),
    sort: Joi.string().valid('title', 'author', 'newest', 'rating', 'relevance').default('relevance'),
    page: Joi.number().integer().positive().default(1),
    limit: Joi.number().integer().positive().max(100).default(10)
  })
};

// Schémas de validation pour les emprunts
const loanSchemas = {
  create: Joi.object({
    book_id: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'ID de livre invalide',
        'any.required': 'L\'ID du livre est requis'
      }),
    
    user_id: Joi.number().integer().positive().optional(),
    
    loan_period_days: Joi.number().integer().positive().max(90).default(14)
      .messages({
        'number.positive': 'La durée d\'emprunt doit être positive',
        'number.max': 'La durée d\'emprunt ne peut pas dépasser 90 jours'
      }),
    
    notes: Joi.string().trim().max(500).optional()
      .messages({
        'string.max': 'Les notes ne peuvent pas dépasser 500 caractères'
      })
  }),

  return: Joi.object({
    notes: Joi.string().trim().max(500).optional(),
    condition_on_return: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'damaged').default('good')
  }),

  renew: Joi.object({
    extension_days: Joi.number().integer().positive().max(30).default(14)
      .messages({
        'number.positive': 'L\'extension doit être positive',
        'number.max': 'L\'extension ne peut pas dépasser 30 jours'
      })
  })
};

// Schémas de validation pour les avis
const reviewSchemas = {
  create: Joi.object({
    book_id: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'ID de livre invalide',
        'any.required': 'L\'ID du livre est requis'
      }),
    
    rating: Joi.number().integer().min(1).max(5).required()
      .messages({
        'number.min': 'La note doit être entre 1 et 5',
        'number.max': 'La note doit être entre 1 et 5',
        'any.required': 'La note est requise'
      }),
    
    comment: Joi.string().trim().max(1000).optional()
      .messages({
        'string.max': 'Le commentaire ne peut pas dépasser 1000 caractères'
      }),
    
    is_anonymous: Joi.boolean().default(false)
  }),

  update: Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional(),
    comment: Joi.string().trim().max(1000).optional(),
    is_anonymous: Joi.boolean().optional()
  }).min(1).messages({
    'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
  })
};

// Schémas de validation pour les paramètres
const paramSchemas = {
  id: Joi.object({
    id: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'ID invalide',
        'any.required': 'ID requis'
      })
  }),

  userId: Joi.object({
    userId: Joi.number().integer().positive().required()
      .messages({
        'number.positive': 'ID utilisateur invalide',
        'any.required': 'ID utilisateur requis'
      })
  })
};

// Schémas de validation pour les requêtes de pagination
const paginationSchema = Joi.object({
  page: Joi.number().integer().positive().default(1)
    .messages({
      'number.positive': 'Le numéro de page doit être positif'
    }),
  
  limit: Joi.number().integer().positive().max(100).default(10)
    .messages({
      'number.positive': 'La limite doit être positive',
      'number.max': 'La limite ne peut pas dépasser 100'
    }),
  
  search: Joi.string().trim().max(100).optional()
    .messages({
      'string.max': 'La recherche ne peut pas dépasser 100 caractères'
    }),
  
  sort: Joi.string().optional(),
  
  order: Joi.string().valid('asc', 'desc').default('desc').optional()
});

// Middleware de validation pour les uploads de fichiers
const validateFileUpload = (options = {}) => {
  const {
    maxSize = LIMITS.MAX_FILE_SIZE,
    allowedTypes = ['jpg', 'jpeg', 'png', 'pdf'],
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      throw validationError('Fichier requis');
    }

    if (req.file) {
      // Vérifier la taille
      if (req.file.size > maxSize) {
        throw validationError(`Fichier trop volumineux. Taille maximale: ${maxSize / (1024 * 1024)}MB`);
      }

      // Vérifier le type
      const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        throw validationError(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
      }
    }

    next();
  };
};

// Middleware de nettoyage des données
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
        // Échapper les caractères HTML dangereux
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

module.exports = {
  validate,
  authSchemas,
  bookSchemas,
  loanSchemas,
  reviewSchemas,
  paramSchemas,
  paginationSchema,
  validateFileUpload,
  sanitizeInput
};