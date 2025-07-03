const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

/**
 * Classe d'erreur personnalisée pour l'application
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Configuration du logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.prettyPrint()
  ),
  defaultMeta: { service: 'yori-backend' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Ajouter console transport en développement
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * Hasher un mot de passe
 * @param {string} password - Mot de passe en texte brut
 * @returns {Promise<string>} - Mot de passe hashé
 */
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Vérifier un mot de passe
 * @param {string} password - Mot de passe en texte brut
 * @param {string} hash - Hash stocké
 * @returns {Promise<boolean>} - Résultat de la vérification
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Générer un token JWT
 * @param {Object} payload - Données à encoder
 * @param {string} expiresIn - Durée d'expiration
 * @returns {string} - Token JWT
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Vérifier un token JWT
 * @param {string} token - Token à vérifier
 * @returns {Object} - Payload décodé
 */
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Générer un token de refresh
 * @param {Object} payload - Données à encoder
 * @returns {string} - Token de refresh
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

/**
 * Vérifier un refresh token
 * @param {string} token - Token à vérifier
 * @returns {Object} - Payload décodé
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Formatage de réponse API standardisé
 * @param {boolean} success - Statut de succès
 * @param {string} message - Message de réponse
 * @param {*} data - Données à retourner
 * @param {number} statusCode - Code de statut HTTP
 * @returns {Object} - Réponse formatée
 */
const formatResponse = (success, message, data = null, statusCode = 200) => {
  return {
    success,
    message,
    data,
    statusCode,
    timestamp: new Date().toISOString()
  };
};

/**
 * Formatage d'erreur standardisé
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code de statut HTTP
 * @param {*} details - Détails supplémentaires
 * @returns {Object} - Erreur formatée
 */
const formatError = (message, statusCode = 500, details = null) => {
  return {
    success: false,
    message,
    statusCode,
    details,
    timestamp: new Date().toISOString()
  };
};

/**
 * Calcul simple de pagination (pour les requêtes)
 * @param {number} page - Numéro de page (base 1)
 * @param {number} limit - Nombre d'éléments par page
 * @returns {Object} - Paramètres de pagination de base
 */
const paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    offset
  };
};

/**
 * Pagination des résultats
 * @param {number} page - Numéro de page
 * @param {number} limit - Nombre d'éléments par page
 * @param {number} total - Total d'éléments
 * @returns {Object} - Informations de pagination
 */
const getPagination = (page = 1, limit = 10, total = 0) => {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total: parseInt(total),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    offset
  };
};

/**
 * Validation d'email
 * @param {string} email - Email à valider
 * @returns {boolean} - Résultat de la validation
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Génération d'un identifiant unique
 * @returns {string} - UUID
 */
const generateUUID = () => {
  return uuidv4();
};

/**
 * Calcul de la date de retour
 * @param {number} days - Nombre de jours d'emprunt
 * @returns {Date} - Date de retour
 */
const calculateReturnDate = (days = 14) => {
  return moment().add(days, 'days').toDate();
};

/**
 * Vérification si un emprunt est en retard
 * @param {Date} returnDate - Date de retour prévue
 * @returns {boolean} - True si en retard
 */
const isOverdue = (returnDate) => {
  return moment().isAfter(moment(returnDate));
};

/**
 * Calcul des jours de retard
 * @param {Date} returnDate - Date de retour prévue
 * @returns {number} - Nombre de jours de retard
 */
const getOverdueDays = (returnDate) => {
  const today = moment();
  const due = moment(returnDate);
  return today.isAfter(due) ? today.diff(due, 'days') : 0;
};

/**
 * Nettoyage et formatage d'une chaîne
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} - Chaîne nettoyée
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
};

/**
 * Génération d'un mot de passe aléatoire
 * @param {number} length - Longueur du mot de passe
 * @returns {string} - Mot de passe généré
 */
const generateRandomPassword = (length = 12) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Validation d'un ISBN
 * @param {string} isbn - ISBN à valider
 * @returns {boolean} - Résultat de la validation
 */
const isValidISBN = (isbn) => {
  const isbnRegex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;
  return isbnRegex.test(isbn.replace(/[^0-9X]/gi, ''));
};

/**
 * Formatage d'une date
 * @param {Date} date - Date à formater
 * @param {string} format - Format désiré
 * @returns {string} - Date formatée
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

/**
 * Extraction du nom de fichier sécurisé
 * @param {string} originalName - Nom original du fichier
 * @returns {string} - Nom de fichier sécurisé
 */
const generateSecureFileName = (originalName) => {
  const extension = originalName.split('.').pop();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}_${random}.${extension}`;
};

/**
 * Validation de la taille de fichier
 * @param {number} size - Taille du fichier en bytes
 * @param {number} maxSize - Taille maximale autorisée
 * @returns {boolean} - Résultat de la validation
 */
const isValidFileSize = (size, maxSize = 5 * 1024 * 1024) => {
  return size <= maxSize;
};

/**
 * Masquer les informations sensibles d'un objet utilisateur
 * @param {Object} user - Objet utilisateur
 * @returns {Object} - Utilisateur sans informations sensibles
 */
const sanitizeUser = (user) => {
  const { password, refresh_token, ...sanitizedUser } = user;
  return sanitizedUser;
};

module.exports = {
  AppError,
  logger,
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken,
  formatResponse,
  formatError,
  paginate,
  getPagination,
  isValidEmail,
  generateUUID,
  calculateReturnDate,
  isOverdue,
  getOverdueDays,
  sanitizeString,
  generateRandomPassword,
  isValidISBN,
  formatDate,
  generateSecureFileName,
  isValidFileSize,
  sanitizeUser
};