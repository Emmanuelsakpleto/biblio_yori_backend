const Joi = require('joi');

// Schéma pour la création d'un emprunt
const createLoanSchema = Joi.object({
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

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Les notes ne doivent pas dépasser 500 caractères'
    }),

  duration_days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(14)
    .optional()
    .messages({
      'number.base': 'La durée doit être un nombre',
      'number.integer': 'La durée doit être un entier',
      'number.min': 'La durée doit être d\'au moins 1 jour',
      'number.max': 'La durée ne peut pas dépasser 365 jours'
    })
});

// Schéma pour le retour d'un livre
const returnBookSchema = Joi.object({
  condition: Joi.string()
    .valid('excellent', 'good', 'fair', 'poor', 'damaged')
    .default('good')
    .optional()
    .messages({
      'any.only': 'État du livre invalide (excellent, good, fair, poor, damaged)'
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Les notes ne doivent pas dépasser 500 caractères'
    }),

  late_fee_paid: Joi.boolean()
    .default(false)
    .optional(),

  damage_fee: Joi.number()
    .min(0)
    .max(10000)
    .optional()
    .messages({
      'number.base': 'Les frais de dommage doivent être un nombre',
      'number.min': 'Les frais de dommage ne peuvent pas être négatifs',
      'number.max': 'Les frais de dommage ne peuvent pas dépasser 10000'
    })
});

// Schéma pour le renouvellement d'un emprunt
const renewLoanSchema = Joi.object({
  duration_days: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .default(14)
    .optional()
    .messages({
      'number.base': 'La durée de renouvellement doit être un nombre',
      'number.integer': 'La durée de renouvellement doit être un entier',
      'number.min': 'La durée de renouvellement doit être d\'au moins 1 jour',
      'number.max': 'La durée de renouvellement ne peut pas dépasser 30 jours'
    }),

  extension_days: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .default(14)
    .optional()
    .messages({
      'number.base': 'La durée d\'extension doit être un nombre',
      'number.integer': 'La durée d\'extension doit être un entier',
      'number.min': 'La durée d\'extension doit être d\'au moins 1 jour',
      'number.max': 'La durée d\'extension ne peut pas dépasser 30 jours'
    }),

  reason: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La raison ne doit pas dépasser 255 caractères'
    })
});

// Schéma pour la recherche d'emprunts
const searchLoansSchema = Joi.object({
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

  status: Joi.string()
    .valid('', 'active', 'completed', 'overdue', 'cancelled')
    .default('')
    .optional(),

  date_range: Joi.string()
    .valid('', 'today', 'week', 'month', 'year', 'custom')
    .default('')
    .optional(),

  start_date: Joi.date()
    .iso()
    .optional()
    .when('date_range', {
      is: 'custom',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  end_date: Joi.date()
    .iso()
    .min(Joi.ref('start_date'))
    .optional()
    .when('date_range', {
      is: 'custom',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'date.min': 'La date de fin doit être postérieure à la date de début'
    }),

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

// Schéma pour les filtres d'emprunts
const loanFiltersSchema = Joi.object({
  status: Joi.string()
    .valid('', 'active', 'completed', 'overdue', 'cancelled')
    .default('')
    .optional(),

  user_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow('')
    .messages({
      'number.base': 'ID utilisateur doit être un nombre',
      'number.integer': 'ID utilisateur doit être un entier',
      'number.positive': 'ID utilisateur doit être positif'
    }),

  book_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow('')
    .messages({
      'number.base': 'ID livre doit être un nombre',
      'number.integer': 'ID livre doit être un entier',
      'number.positive': 'ID livre doit être positif'
    }),

  overdue_only: Joi.string()
    .valid('true', 'false')
    .default('false')
    .optional(),

  days_overdue: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Le nombre de jours de retard doit être un nombre',
      'number.integer': 'Le nombre de jours de retard doit être un entier',
      'number.min': 'Le nombre de jours de retard ne peut pas être négatif'
    }),

  sort_by: Joi.string()
    .valid('loan_date', 'due_date', 'return_date', 'user_name', 'book_title')
    .default('loan_date')
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

// Schéma pour marquer un emprunt comme en retard
const markOverdueSchema = Joi.object({
  penalty_amount: Joi.number()
    .min(0)
    .max(1000)
    .default(0)
    .optional()
    .messages({
      'number.base': 'Le montant de la pénalité doit être un nombre',
      'number.min': 'Le montant de la pénalité ne peut pas être négatif',
      'number.max': 'Le montant de la pénalité ne peut pas dépasser 1000'
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Les notes ne doivent pas dépasser 500 caractères'
    }),

  notify_user: Joi.boolean()
    .default(true)
    .optional()
});

// Schéma pour l'application d'une pénalité
const applyPenaltySchema = Joi.object({
  amount: Joi.number()
    .min(0)
    .max(1000)
    .required()
    .messages({
      'number.base': 'Le montant doit être un nombre',
      'number.min': 'Le montant ne peut pas être négatif',
      'number.max': 'Le montant ne peut pas dépasser 1000',
      'any.required': 'Le montant est requis'
    }),

  reason: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'La raison est requise',
      'string.min': 'La raison doit contenir au moins 1 caractère',
      'string.max': 'La raison ne doit pas dépasser 255 caractères',
      'any.required': 'La raison est requise'
    }),

  waive: Joi.boolean()
    .default(false)
    .optional(),

  notify_user: Joi.boolean()
    .default(true)
    .optional()
});

// Schéma pour l'envoi de rappels
const sendRemindersSchema = Joi.object({
  days_before_due: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .default(3)
    .optional()
    .messages({
      'number.base': 'Le nombre de jours doit être un nombre',
      'number.integer': 'Le nombre de jours doit être un entier',
      'number.min': 'Le nombre de jours doit être d\'au moins 1',
      'number.max': 'Le nombre de jours ne peut pas dépasser 30'
    }),

  include_overdue: Joi.boolean()
    .default(true)
    .optional(),

  custom_message: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Le message personnalisé ne doit pas dépasser 1000 caractères'
    })
});

// Schéma pour la réservation d'un créneau d'emprunt
const reserveLoanSlotSchema = Joi.object({
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

  preferred_date: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.base': 'Date préférée invalide',
      'date.min': 'La date préférée doit être dans le futur',
      'any.required': 'Date préférée requise'
    }),

  notes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Les notes ne doivent pas dépasser 500 caractères'
    }),

  duration_days: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .default(14)
    .optional()
    .messages({
      'number.base': 'La durée doit être un nombre',
      'number.integer': 'La durée doit être un entier',
      'number.min': 'La durée doit être d\'au moins 1 jour',
      'number.max': 'La durée ne peut pas dépasser 30 jours'
    })
});

// Schéma pour les statistiques d'emprunts
const loanStatsSchema = Joi.object({
  period: Joi.string()
    .valid('day', 'week', 'month', 'year')
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
    }),

  user_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow('')
    .messages({
      'number.base': 'ID utilisateur doit être un nombre',
      'number.integer': 'ID utilisateur doit être un entier',
      'number.positive': 'ID utilisateur doit être positif'
    })
});

// Validation des paramètres d'URL
const loanIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID d\'emprunt doit être un nombre',
      'number.integer': 'ID d\'emprunt doit être un entier',
      'number.positive': 'ID d\'emprunt doit être positif',
      'any.required': 'ID d\'emprunt requis'
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

module.exports = {
  createLoanSchema,
  returnBookSchema,
  renewLoanSchema,
  searchLoansSchema,
  loanFiltersSchema,
  markOverdueSchema,
  applyPenaltySchema,
  sendRemindersSchema,
  reserveLoanSlotSchema,
  loanStatsSchema,
  loanIdSchema,
  bookIdSchema
};