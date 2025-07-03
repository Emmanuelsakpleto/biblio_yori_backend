const Joi = require('joi');

// 🚀 VALIDATEURS MODERNES POUR LES LIVRES

// Schéma pour la création d'un livre
const createBookSchema = Joi.object({
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

  author: Joi.string()
    .trim()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'L\'auteur est requis',
      'string.min': 'L\'auteur doit contenir au moins 1 caractère',
      'string.max': 'L\'auteur ne doit pas dépasser 255 caractères',
      'any.required': 'L\'auteur est requis'
    }),

  isbn: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!value) return value; // Optionnel
      
      // Supprimer tous les espaces, tirets et caractères non-alphanumériques
      const cleanIsbn = value.replace(/[^0-9X]/gi, '');
      
      // Vérifier la longueur : ISBN-10 (10 caractères) ou ISBN-13 (13 caractères)
      if (cleanIsbn.length === 10) {
        // ISBN-10: 9 chiffres + 1 chiffre de contrôle (peut être X)
        if (!/^[0-9]{9}[0-9X]$/i.test(cleanIsbn)) {
          return helpers.error('string.pattern.base');
        }
      } else if (cleanIsbn.length === 13) {
        // ISBN-13: doit commencer par 978 ou 979 + 10 chiffres
        if (!/^(978|979)[0-9]{10}$/.test(cleanIsbn)) {
          return helpers.error('string.pattern.base');
        }
      } else {
        return helpers.error('string.pattern.base');
      }
      
      return value; // Retourner la valeur originale (avec tirets)
    })
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Format ISBN invalide. Utilisez un ISBN-10 (10 caractères) ou ISBN-13 (13 caractères, commençant par 978 ou 979)'
    }),

  description: Joi.string()
    .trim()
    .max(2000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La description ne doit pas dépasser 2000 caractères'
    }),

  category: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.empty': 'La catégorie est requise',
      'string.min': 'La catégorie doit contenir au moins 1 caractère',
      'string.max': 'La catégorie ne doit pas dépasser 100 caractères',
      'any.required': 'La catégorie est requise'
    }),

  publisher: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'L\'éditeur ne doit pas dépasser 255 caractères'
    }),

  publication_year: Joi.number()
    .integer()
    .min(1000)
    .max(new Date().getFullYear() + 1)
    .optional()
    .messages({
      'number.base': 'L\'année de publication doit être un nombre',
      'number.integer': 'L\'année de publication doit être un entier',
      'number.min': 'L\'année de publication doit être supérieure à 1000',
      'number.max': `L\'année de publication ne peut pas dépasser ${new Date().getFullYear() + 1}`
    }),

  language: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'La langue ne doit pas dépasser 50 caractères'
    }),

  pages: Joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Le nombre de pages doit être un nombre',
      'number.integer': 'Le nombre de pages doit être un entier',
      'number.min': 'Le nombre de pages doit être supérieur à 0'
    }),

  // 📚 Champs de gestion des copies
  total_copies: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(1)
    .optional()
    .messages({
      'number.base': 'Le nombre total de copies doit être un nombre',
      'number.integer': 'Le nombre total de copies doit être un entier',
      'number.min': 'Le nombre total de copies doit être d\'au moins 1',
      'number.max': 'Le nombre total de copies ne peut pas dépasser 1000'
    }),

  available_copies: Joi.number()
    .integer()
    .min(0)
    .max(1000)
    .optional()
    .messages({
      'number.base': 'Le nombre de copies disponibles doit être un nombre',
      'number.integer': 'Le nombre de copies disponibles doit être un entier',
      'number.min': 'Le nombre de copies disponibles ne peut pas être négatif',
      'number.max': 'Le nombre de copies disponibles ne peut pas dépasser 1000'
    }),

  // 📍 Localisation
  location: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'L\'emplacement ne doit pas dépasser 100 caractères'
    }),

  // 🎨 Fichiers multimédias
  cover_image: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Le nom du fichier image ne doit pas dépasser 255 caractères'
    }),

  pdf_file: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Le nom du fichier PDF ne doit pas dépasser 255 caractères'
    })
});

// Schéma pour la mise à jour d'un livre (tous les champs optionnels)
const updateBookSchema = createBookSchema.fork(
  ['title', 'author', 'category'], 
  (schema) => schema.optional()
);

// Schéma pour la recherche de livres
const searchBooksSchema = Joi.object({
  q: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  author: Joi.string().trim().optional(),
  publisher: Joi.string().trim().optional(),
  language: Joi.string().trim().optional(),
  available_only: Joi.boolean().default(false).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional(),
  sort_by: Joi.string().valid('title', 'author', 'publication_year', 'created_at').default('created_at').optional(),
  sort_order: Joi.string().valid('ASC', 'DESC').default('DESC').optional()
}).custom((value, helpers) => {
  // Au moins un critère de recherche requis
  const { q, category, author, publisher } = value;
  
  if (!q && !category && !author && !publisher) {
    return helpers.error('search.criteria.required');
  }
  
  return value;
}).messages({
  'search.criteria.required': 'Au moins un critère de recherche est requis (q, category, author, ou publisher)'
});

// Schéma pour les paramètres de pagination
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional()
});

// Schéma pour les filtres de livres
const bookFiltersSchema = Joi.object({
  category: Joi.string().trim().optional(),
  author: Joi.string().trim().optional(),
  publisher: Joi.string().trim().optional(),
  language: Joi.string().trim().optional(),
  available_only: Joi.boolean().default(false).optional(),
  publication_year_min: Joi.number().integer().min(1000).optional(),
  publication_year_max: Joi.number().integer().max(new Date().getFullYear() + 1).optional(),
  pages_min: Joi.number().integer().min(1).optional(),
  pages_max: Joi.number().integer().max(10000).optional()
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  searchBooksSchema,
  paginationSchema,
  bookFiltersSchema
};
