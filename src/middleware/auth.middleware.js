const { verifyToken, logger } = require('../utils/helpers');
const { USER_ROLES } = require('../utils/constants');
const { unauthorizedError, forbiddenError } = require('./error.middleware');
const UserModel = require('../models/user.model');

/**
 * Middleware d'authentification JWT
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw unauthorizedError('Token d\'authentification manquant');
    }

    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      throw unauthorizedError('Format de token invalide');
    }

    // Vérifier et décoder le token
    const decoded = verifyToken(token);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await UserModel.findById(decoded.id);
    
    if (!user) {
      throw unauthorizedError('Utilisateur non trouvé');
    }

    if (!user.is_active) {
      throw unauthorizedError('Compte utilisateur désactivé');
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    
    logger.info(`Utilisateur authentifié: ${user.email} (ID: ${user.id})`);
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(unauthorizedError('Token invalide'));
    } else if (error.name === 'TokenExpiredError') {
      next(unauthorizedError('Token expiré'));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware d'authentification optionnel
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    // Vérifier et décoder le token
    const decoded = verifyToken(token);
    
    // Récupérer l'utilisateur
    const user = await UserModel.findById(decoded.id);
    
    if (user && user.is_active) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur
    next();
  }
};

/**
 * Middleware d'autorisation par rôle
 * @param {...string} allowedRoles - Rôles autorisés
 * @returns {Function} - Middleware d'autorisation
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw unauthorizedError('Authentification requise');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw forbiddenError('Permissions insuffisantes');
      }

      logger.info(`Autorisation accordée pour le rôle: ${req.user.role}`);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est admin
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const requireAdmin = authorize(USER_ROLES.ADMIN);

/**
 * Middleware pour vérifier si l'utilisateur est bibliothécaire ou admin
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const requireLibrarianOrAdmin = authorize(USER_ROLES.LIBRARIAN, USER_ROLES.ADMIN);

/**
 * Middleware pour vérifier si l'utilisateur peut accéder à sa propre ressource
 * @param {string} paramName - Nom du paramètre contenant l'ID utilisateur
 * @returns {Function} - Middleware de vérification
 */
const requireOwnershipOrAdmin = (paramName = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw unauthorizedError('Authentification requise');
      }

      const resourceUserId = parseInt(req.params[paramName]);
      const currentUserId = req.user.id;

      // Admin peut accéder à toutes les ressources
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }

      // Utilisateur peut accéder à ses propres ressources
      if (currentUserId === resourceUserId) {
        return next();
      }

      throw forbiddenError('Accès autorisé uniquement à vos propres ressources');
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour vérifier si l'utilisateur peut modifier une ressource
 * @param {Function} getResourceOwner - Fonction pour obtenir le propriétaire de la ressource
 * @returns {Function} - Middleware de vérification
 */
const requireResourceOwnership = (getResourceOwner) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw unauthorizedError('Authentification requise');
      }

      // Admin peut modifier toutes les ressources
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }

      // Obtenir le propriétaire de la ressource
      const resourceOwnerId = await getResourceOwner(req);
      
      if (req.user.id !== resourceOwnerId) {
        throw forbiddenError('Vous ne pouvez modifier que vos propres ressources');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour limiter les requêtes par utilisateur
 * @param {number} maxRequests - Nombre maximum de requêtes
 * @param {number} windowMs - Fenêtre de temps en millisecondes
 * @returns {Function} - Middleware de limitation
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Nettoyer les anciens enregistrements
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    }

    // Obtenir les requêtes actuelles de l'utilisateur
    const currentRequests = userRequests.get(userId) || [];

    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes, veuillez réessayer plus tard',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Ajouter la requête actuelle
    currentRequests.push(now);
    userRequests.set(userId, currentRequests);

    next();
  };
};

/**
 * Middleware pour vérifier les permissions sur les livres
 * @param {string} action - Action à vérifier (read, write, delete)
 * @returns {Function} - Middleware de vérification
 */
const checkBookPermissions = (action) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw unauthorizedError('Authentification requise');
      }

      const userRole = req.user.role;

      switch (action) {
        case 'read':
          // Tous les utilisateurs authentifiés peuvent lire
          break;
        
        case 'write':
          // Seuls les bibliothécaires et admins peuvent écrire
          if (![USER_ROLES.LIBRARIAN, USER_ROLES.ADMIN].includes(userRole)) {
            throw forbiddenError('Permission d\'écriture requise');
          }
          break;
        
        case 'delete':
          // Seuls les admins peuvent supprimer
          if (userRole !== USER_ROLES.ADMIN) {
            throw forbiddenError('Permission d\'administrateur requise');
          }
          break;
        
        default:
          throw new Error('Action non reconnue');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware pour extraire l'ID utilisateur depuis différentes sources
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const extractUserId = (req, res, next) => {
  // Priorité : paramètre d'URL > body > query > utilisateur authentifié
  req.targetUserId = 
    req.params.userId || 
    req.body.user_id || 
    req.query.user_id || 
    (req.user ? req.user.id : null);
  
  next();
};

/**
 * Middleware de validation de session
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction next d'Express
 */
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Vérifier si l'utilisateur existe toujours et est actif
    const currentUser = await UserModel.findById(req.user.id);
    
    if (!currentUser || !currentUser.is_active) {
      throw unauthorizedError('Session invalide');
    }

    // Mettre à jour les informations utilisateur si nécessaire
    req.user = currentUser;
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  requireAdmin,
  requireLibrarianOrAdmin,
  requireOwnershipOrAdmin,
  requireResourceOwnership,
  rateLimitByUser,
  checkBookPermissions,
  extractUserId,
  validateSession
};