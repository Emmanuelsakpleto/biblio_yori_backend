const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadProfileImage } = require('../middleware/upload.middleware');

const router = express.Router();

// Routes d'authentification modernes et simplifiées
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/verify', authenticate, AuthController.verifyToken);
router.post('/logout', authenticate, AuthController.logout);

// Routes de profil
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, AuthController.updateProfile);
router.post('/profile-image', authenticate, uploadProfileImage, AuthController.updateProfile);
router.put('/change-password', authenticate, AuthController.changePassword);
router.delete('/delete-account', authenticate, AuthController.deleteAccount);

module.exports = router;
