const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes d'authentification modernes et simplifiées
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/verify', authenticate, AuthController.verifyToken);
router.post('/logout', authenticate, AuthController.logout);

module.exports = router;
