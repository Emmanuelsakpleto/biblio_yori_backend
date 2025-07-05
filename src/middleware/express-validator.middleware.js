const { validationResult } = require('express-validator');

/**
 * Middleware pour traiter les erreurs de validation express-validator
 */
const validate = (validations, source = 'body') => {
  return async (req, res, next) => {
    // Exécuter les validations
    if (Array.isArray(validations)) {
      await Promise.all(validations.map(validation => validation.run(req)));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array().map(error => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value
        }))
      });
    }

    next();
  };
};

module.exports = { validate };
