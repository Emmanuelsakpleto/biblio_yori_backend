const Joi = require('joi');

// Schéma pour la création d'une critique
const createReviewSchema = Joi.object({
  book_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID de livre doit être un nombre',
      'number.integer': 'ID de livre doit être un entier',
      'number.positive': 'ID de livre doit être positif',
      'any.required': 'ID de livre requis'
    }),

  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.base': 'La note doit être un nombre',
      'number.integer': 'La note doit être un entier',
      'number.min': 'La note doit être comprise entre 1 et 5',
      'number.max': 'La note doit être comprise entre 1 et 5',
      'any.required': 'La note est requise'
    }),

  comment: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Le commentaire est requis',
      'string.min': 'Le commentaire doit contenir au moins 10 caractères',
      'string.max': 'Le commentaire ne doit pas dépasser 2000 caractères',
      'any.required': 'Le commentaire est requis'
    }),

  is_anonymous: Joi.boolean()
    .default(false)
    .optional()
});

// Schéma pour la mise à jour d'une critique
const updateReviewSchema = Joi.object({
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.base': 'La note doit être un nombre',
      'number.integer': 'La note doit être un entier',
      'number.min': 'La note doit être comprise entre 1 et 5',
      'number.max': 'La note doit être comprise entre 1 et 5'
    }),

  comment: Joi.string()
    .trim()
    .min(10)
    .max(2000)
    .optional()
    .messages({
      'string.empty': 'Le commentaire ne peut pas être vide',
      'string.min': 'Le commentaire doit contenir au moins 10 caractères',
      'string.max': 'Le commentaire ne doit pas dépasser 2000 caractères'
    }),

  is_anonymous: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

// Schéma pour marquer une critique comme utile
const markHelpfulSchema = Joi.object({
  is_helpful: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'is_helpful doit être un booléen',
      'any.required': 'is_helpful est requis'
    })
});

// Schéma pour signaler une critique
const reportReviewSchema = Joi.object({
  reason: Joi.string()
    .valid(
      'inappropriate_content',
      'spam',
      'harassment',
      'fake_review',
      'copyright_violation',
      'other'
    )
    .required()
    .messages({
      'any.only': 'Raison de signalement invalide',
      'any.required': 'La raison du signalement est requise'
    }),

  details: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Les détails ne doivent pas dépasser 1000 caractères'
    })
});

// Schéma pour la recherche de critiques
const searchReviewsSchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Le terme de recherche est requis',
      'string.min': 'Le terme de recherche doit contenir au moins 1 caractère',
      'string.max': 'Le terme de recherche ne doit pas dépasser 255 caractères',
      'any.required': 'Le terme de recherche est requis'
    }),

  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.base': 'La note doit être un nombre',
      'number.integer': 'La note doit être un entier',
      'number.min': 'La note doit être comprise entre 1 et 5',
      'number.max': 'La note doit être comprise entre 1 et 5'
    }),

  book_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID de livre doit être un nombre',
      'number.integer': 'ID de livre doit être un entier',
      'number.positive': 'ID de livre doit être positif'
    }),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .messages({
      'number.base': 'Le numéro de page doit être un nombre',
      'number.integer': 'Le numéro de page doit être un entier',
      'number.min': 'Le numéro de page doit être supérieur à 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional()
    .messages({
      'number.base': 'La limite doit être un nombre',
      'number.integer': 'La limite doit être un entier',
      'number.min': 'La limite doit être supérieure à 0',
      'number.max': 'La limite ne peut pas dépasser 100'
    })
});

// Schéma pour les filtres de critiques
const reviewFiltersSchema = Joi.object({
  book_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID de livre doit être un nombre',
      'number.integer': 'ID de livre doit être un entier',
      'number.positive': 'ID de livre doit être positif'
    }),

  user_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'ID utilisateur doit être un nombre',
      'number.integer': 'ID utilisateur doit être un entier',
      'number.positive': 'ID utilisateur doit être positif'
    }),

  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.base': 'La note doit être un nombre',
      'number.integer': 'La note doit être un entier',
      'number.min': 'La note doit être comprise entre 1 et 5',
      'number.max': 'La note doit être comprise entre 1 et 5'
    }),

  sort_by: Joi.string()
    .valid('created_at', 'rating', 'helpful_count', 'updated_at')
    .default('created_at')
    .optional(),

  sort_order: Joi.string()
    .valid('ASC', 'DESC', 'asc', 'desc')
    .default('DESC')
    .optional(),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .optional(),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .optional()
});

// Schéma pour la modération de critiques
const moderateReviewSchema = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject', 'hide')
    .required()
    .messages({
      'any.only': 'Action de modération invalide (approve, reject, hide)',
      'any.required': 'Action de modération requise'
    }),

  reason: Joi.string()
    .trim()
    .max(500)
    .when('action', {
      is: Joi.valid('reject', 'hide'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.max': 'La raison ne doit pas dépasser 500 caractères',
      'any.required': 'La raison est requise pour rejeter ou masquer une critique'
    })
});

// Schéma pour traiter un signalement
const processReportSchema = Joi.object({
  action: Joi.string()
    .valid('dismiss', 'warning', 'remove_review', 'suspend_user')
    .required()
    .messages({
      'any.only': 'Action invalide (dismiss, warning, remove_review, suspend_user)',
      'any.required': 'Action requise'
    }),

  admin_notes: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Les notes administrateur ne doivent pas dépasser 1000 caractères'
    })
});

// Schéma pour les statistiques de critiques
const reviewStatsSchema = Joi.object({
  period: Joi.string()
    .valid('day', 'week', 'month', 'year', 'all')
    .default('month')
    .optional(),

  start_date: Joi.date()
    .iso()
    .optional(),

  end_date: Joi.date()
    .iso()
    .min(Joi.ref('start_date'))
    .optional()
    .messages({
      'date.min': 'La date de fin doit être postérieure à la date de début'
    })
});

// Validation des paramètres d'URL
const reviewIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID de critique doit être un nombre',
      'number.integer': 'ID de critique doit être un entier',
      'number.positive': 'ID de critique doit être positif',
      'any.required': 'ID de critique requis'
    })
});

const bookIdSchema = Joi.object({
  bookId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID de livre doit être un nombre',
      'number.integer': 'ID de livre doit être un entier',
      'number.positive': 'ID de livre doit être positif',
      'any.required': 'ID de livre requis'
    })
});

const userIdSchema = Joi.object({
  userId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID utilisateur doit être un nombre',
      'number.integer': 'ID utilisateur doit être un entier',
      'number.positive': 'ID utilisateur doit être positif',
      'any.required': 'ID utilisateur requis'
    })
});

// Schéma pour les paramètres de requête des critiques populaires
const topReviewsSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .messages({
      'number.base': 'La limite doit être un nombre',
      'number.integer': 'La limite doit être un entier',
      'number.min': 'La limite doit être supérieure à 0',
      'number.max': 'La limite ne peut pas dépasser 50'
    }),

  period: Joi.string()
    .valid('week', 'month', 'year', 'all')
    .default('all')
    .optional()
});

// Schéma pour les paramètres de requête des critiques récentes
const recentReviewsSchema = Joi.object({
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .messages({
      'number.base': 'La limite doit être un nombre',
      'number.integer': 'La limite doit être un entier',
      'number.min': 'La limite doit être supérieure à 0',
      'number.max': 'La limite ne peut pas dépasser 50'
    })
});

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  markHelpfulSchema,
  reportReviewSchema,
  searchReviewsSchema,
  reviewFiltersSchema,
  moderateReviewSchema,
  processReportSchema,
  reviewStatsSchema,
  reviewIdSchema,
  bookIdSchema,
  userIdSchema,
  topReviewsSchema,
  recentReviewsSchema
};
