const { body, query, param } = require('express-validator');

const createUserSchema = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('role')
    .optional()
    .isIn(['student', 'librarian', 'admin'])
    .withMessage('Rôle invalide'),
  body('student_id')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Le numéro étudiant ne peut pas dépasser 20 caractères'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le département ne peut pas dépasser 100 caractères'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numéro de téléphone invalide')
];

const updateUserSchema = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('student_id')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Le numéro étudiant ne peut pas dépasser 20 caractères'),
  body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Le département ne peut pas dépasser 100 caractères'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Numéro de téléphone invalide')
];

const userStatusSchema = [
  body('is_active')
    .isBoolean()
    .withMessage('Le statut doit être un booléen'),
  body('reason')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La raison ne peut pas dépasser 255 caractères')
];

const resetPasswordSchema = [
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('send_notification')
    .optional()
    .isBoolean()
    .withMessage('send_notification doit être un booléen')
];

const searchUsersSchema = [
  query('q')
    .isLength({ min: 2 })
    .withMessage('Le terme de recherche doit contenir au moins 2 caractères'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100')
];

const getUsersSchema = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un nombre positif')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100')
    .toInt(),
  query('role')
    .optional()
    .isIn(['student', 'librarian', 'admin'])
    .withMessage('Rôle invalide'),
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Statut invalide'),
  query('sort_by')
    .optional()
    .isIn(['created_at', 'updated_at', 'first_name', 'last_name', 'email'])
    .withMessage('Champ de tri invalide'),
  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Ordre de tri invalide'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 0 })
    .withMessage('Le terme de recherche ne peut pas être vide')
];

module.exports = {
  createUserSchema,
  updateUserSchema,
  userStatusSchema,
  resetPasswordSchema,
  searchUsersSchema,
  getUsersSchema
};
