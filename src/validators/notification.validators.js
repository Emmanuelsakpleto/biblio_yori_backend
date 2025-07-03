const Joi = require('joi');

// Schéma pour la création d'une notification personnalisée
const createCustomNotificationSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Le titre est requis',
      'string.min': 'Le titre doit contenir au moins 1 caractère',
      'string.max': 'Le titre ne doit pas dépasser 255 caractères',
      'any.required': 'Le titre est requis'
    }),

  message: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Le message est requis',
      'string.min': 'Le message doit contenir au moins 1 caractère',
      'string.max': 'Le message ne doit pas dépasser 1000 caractères',
      'any.required': 'Le message est requis'
    }),

  priority: Joi.string()
    .valid('low', 'normal', 'high')
    .default('normal')
    .optional()
    .messages({
      'any.only': 'La priorité doit être low, normal ou high'
    })
});

// Schéma pour la création de notifications en lot
const createBulkNotificationSchema = Joi.object({
  user_ids: Joi.array()
    .items(
      Joi.string()
        .uuid()
        .messages({
          'string.guid': 'ID utilisateur invalide'
        })
    )
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.min': 'Au moins un utilisateur doit être spécifié',
      'array.max': 'Maximum 1000 utilisateurs par lot',
      'any.required': 'Liste d\'utilisateurs requise'
    }),

  type: Joi.string()
    .valid('system', 'announcement', 'maintenance', 'update', 'custom')
    .required()
    .messages({
      'any.only': 'Type de notification invalide',
      'any.required': 'Type de notification requis'
    }),

  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Le titre est requis',
      'string.min': 'Le titre doit contenir au moins 1 caractère',
      'string.max': 'Le titre ne doit pas dépasser 255 caractères',
      'any.required': 'Le titre est requis'
    }),

  message: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Le message est requis',
      'string.min': 'Le message doit contenir au moins 1 caractère',
      'string.max': 'Le message ne doit pas dépasser 1000 caractères',
      'any.required': 'Le message est requis'
    }),

  priority: Joi.string()
    .valid('low', 'normal', 'high')
    .default('normal')
    .optional()
    .messages({
      'any.only': 'La priorité doit être low, normal ou high'
    }),

  send_email: Joi.boolean()
    .default(false)
    .optional()
});

// Schéma pour la création de notifications système pour tous
const createSystemWideNotificationSchema = Joi.object({
  title: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Le titre est requis',
      'string.min': 'Le titre doit contenir au moins 1 caractère',
      'string.max': 'Le titre ne doit pas dépasser 255 caractères',
      'any.required': 'Le titre est requis'
    }),

  message: Joi.string()
    .trim()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Le message est requis',
      'string.min': 'Le message doit contenir au moins 1 caractère',
      'string.max': 'Le message ne doit pas dépasser 1000 caractères',
      'any.required': 'Le message est requis'
    }),

  priority: Joi.string()
    .valid('low', 'normal', 'high')
    .default('normal')
    .optional()
    .messages({
      'any.only': 'La priorité doit être low, normal ou high'
    }),

  send_email: Joi.boolean()
    .default(false)
    .optional(),

  exclude_user_ids: Joi.array()
    .items(
      Joi.string()
        .uuid()
        .messages({
          'string.guid': 'ID utilisateur invalide'
        })
    )
    .optional()
    .default([])
});

// Schéma pour les paramètres de notification utilisateur
const updateNotificationSettingsSchema = Joi.object({
  email_notifications: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'email_notifications doit être un booléen'
    }),

  push_notifications: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'push_notifications doit être un booléen'
    }),

  loan_reminders: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'loan_reminders doit être un booléen'
    }),

  new_book_alerts: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'new_book_alerts doit être un booléen'
    }),

  system_announcements: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'system_announcements doit être un booléen'
    }),

  review_responses: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'review_responses doit être un booléen'
    }),

  marketing_emails: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'marketing_emails doit être un booléen'
    }),

  notification_frequency: Joi.string()
    .valid('immediate', 'daily', 'weekly', 'never')
    .optional()
    .messages({
      'any.only': 'Fréquence invalide (immediate, daily, weekly, never)'
    }),

  quiet_hours_start: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Format d\'heure invalide (HH:MM)'
    }),

  quiet_hours_end: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Format d\'heure invalide (HH:MM)'
    })
}).min(1).messages({
  'object.min': 'Au moins un paramètre doit être fourni pour la mise à jour'
});

// Schéma pour l'envoi de rappels d'emprunts
const sendLoanRemindersSchema = Joi.object({
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
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Le message personnalisé ne doit pas dépasser 500 caractères'
    })
});

// Schéma pour le test d'email de notification
const testEmailNotificationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Adresse email invalide',
      'any.required': 'Adresse email requise'
    }),

  notification_type: Joi.string()
    .valid('welcome', 'loan_reminder', 'loan_overdue', 'book_available', 'test')
    .default('test')
    .optional()
    .messages({
      'any.only': 'Type de notification invalide'
    }),

  test_data: Joi.object()
    .optional()
    .default({})
});

// Schéma pour le nettoyage des anciennes notifications
const cleanupNotificationsSchema = Joi.object({
  days_old: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .default(30)
    .optional()
    .messages({
      'number.base': 'Le nombre de jours doit être un nombre',
      'number.integer': 'Le nombre de jours doit être un entier',
      'number.min': 'Le nombre de jours doit être d\'au moins 1',
      'number.max': 'Le nombre de jours ne peut pas dépasser 365'
    })
});

// Schéma pour les filtres de notifications
const notificationFiltersSchema = Joi.object({
  unread_only: Joi.string()
    .valid('true', 'false')
    .default('false')
    .optional(),

  type: Joi.string()
    .valid('', 'system', 'loan', 'book', 'review', 'announcement', 'maintenance', 'custom')
    .default('')
    .optional(),

  priority: Joi.string()
    .valid('', 'low', 'normal', 'high')
    .default('')
    .optional(),

  user_id: Joi.string()
    .uuid()
    .optional()
    .allow('')
    .messages({
      'string.guid': 'ID utilisateur invalide'
    }),

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

// Schéma pour les statistiques de notifications
const notificationStatsSchema = Joi.object({
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
    })
});

// Validation des paramètres d'URL
const notificationIdSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'ID de notification invalide',
      'any.required': 'ID de notification requis'
    })
});

const notificationTypeSchema = Joi.object({
  type: Joi.string()
    .valid('system', 'loan', 'book', 'review', 'announcement', 'maintenance', 'custom')
    .required()
    .messages({
      'any.only': 'Type de notification invalide',
      'any.required': 'Type de notification requis'
    })
});

// Schéma pour les paramètres de requête temps réel
const realtimeNotificationsSchema = Joi.object({
  last_notification_id: Joi.string()
    .uuid()
    .optional()
    .allow('')
    .messages({
      'string.guid': 'ID de dernière notification invalide'
    })
});

module.exports = {
  createCustomNotificationSchema,
  createBulkNotificationSchema,
  createSystemWideNotificationSchema,
  updateNotificationSettingsSchema,
  sendLoanRemindersSchema,
  testEmailNotificationSchema,
  cleanupNotificationsSchema,
  notificationFiltersSchema,
  notificationStatsSchema,
  notificationIdSchema,
  notificationTypeSchema,
  realtimeNotificationsSchema
};
