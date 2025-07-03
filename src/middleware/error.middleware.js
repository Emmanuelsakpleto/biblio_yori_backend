const { logger, formatError } = require('../utils/helpers');
const { ERROR_MESSAGES } = require('../utils/constants');

/**
 * Middleware de gestion d'erreurs global
 * @param {Error} error - Erreur capturée
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = ERROR_MESSAGES.INTERNAL_ERROR;
  let details = null;

  // Log de l'erreur
  logger.error('Erreur capturée par le middleware:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Gestion des différents types d'erreurs
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = ERROR_MESSAGES.VALIDATION_ERROR;
    details = error.details || error.message;
  } else if (error.name === 'UnauthorizedError' || error.message.includes('jwt')) {
    statusCode = 401;
    message = ERROR_MESSAGES.UNAUTHORIZED;
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = ERROR_MESSAGES.FORBIDDEN;
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = ERROR_MESSAGES.NOT_FOUND;
  } else if (error.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Conflit : cette ressource existe déjà';
    details = 'Données dupliquées';
  } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Référence invalide';
    details = 'La ressource référencée n\'existe pas';
  } else if (error.code && error.code.startsWith('ER_')) {
    statusCode = 500;
    message = ERROR_MESSAGES.DATABASE_ERROR;
    details = process.env.NODE_ENV === 'development' ? error.message : null;
  } else if (error.message) {
    // Erreurs personnalisées avec message explicite
    statusCode = error.statusCode || 400;
    message = error.message;
  }

  // Formatage de la réponse d'erreur
  const errorResponse = formatError(message, statusCode, details);

  // Ajout d'informations supplémentaires en développement
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.originalError = error.message;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware pour capturer les erreurs asynchrones
 * @param {Function} fn - Fonction asynchrone à wrapper
 * @returns {Function} - Fonction wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware de validation des erreurs 404
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.name = 'NotFoundError';
  next(error);
};

/**
 * Créer une erreur personnalisée
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code de statut HTTP
 * @returns {Error} - Erreur personnalisée
 */
const createError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Erreur de validation
 * @param {string} message - Message d'erreur
 * @param {Object} details - Détails de validation
 * @returns {Error} - Erreur de validation
 */
const validationError = (message, details = null) => {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 400;
  error.details = details;
  return error;
};

/**
 * Erreur d'autorisation
 * @param {string} message - Message d'erreur
 * @returns {Error} - Erreur d'autorisation
 */
const unauthorizedError = (message = ERROR_MESSAGES.UNAUTHORIZED) => {
  const error = new Error(message);
  error.name = 'UnauthorizedError';
  error.statusCode = 401;
  return error;
};

/**
 * Erreur d'accès interdit
 * @param {string} message - Message d'erreur
 * @returns {Error} - Erreur d'accès interdit
 */
const forbiddenError = (message = ERROR_MESSAGES.FORBIDDEN) => {
  const error = new Error(message);
  error.name = 'ForbiddenError';
  error.statusCode = 403;
  return error;
};

/**
 * Erreur de ressource non trouvée
 * @param {string} message - Message d'erreur
 * @returns {Error} - Erreur de ressource non trouvée
 */
const notFoundError = (message = ERROR_MESSAGES.NOT_FOUND) => {
  const error = new Error(message);
  error.name = 'NotFoundError';
  error.statusCode = 404;
  return error;
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  createError,
  validationError,
  unauthorizedError,
  forbiddenError,
  notFoundError
};