const UserModel = require('../models/user.model');
const NotificationModel = require('../models/notification.model');
const {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  formatResponse,
  sanitizeUser,
  logger
} = require('../utils/helpers');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../utils/constants');
const EmailService = require('../services/email.service');
const AuthService = require('../services/auth.service');

class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(req, res) {
    try {
      const {
        first_name,
        last_name,
        email,
        password,
        phone,
        student_id,
        department,
        role
      } = req.body;

      // Vérifier si l'email existe déjà
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json(formatResponse(
          false,
          ERROR_MESSAGES.EMAIL_EXISTS,
          null,
          409
        ));
      }

      // Vérifier si le numéro étudiant existe déjà (s'il est fourni)
      if (student_id) {
        const existingStudentId = await UserModel.findByStudentId(student_id);
        if (existingStudentId) {
          return res.status(409).json(formatResponse(
            false,
            'Ce numéro étudiant est déjà utilisé',
            null,
            409
          ));
        }
      }

      // Créer l'utilisateur
      const userData = {
        first_name,
        last_name,
        email,
        password,
        phone,
        student_id,
        department,
        role
      };

      const user = await UserModel.create(userData);
      const sanitizedUser = sanitizeUser(user);

      // Générer les tokens
      const accessToken = generateToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id });

      // Créer une notification de bienvenue
      await NotificationModel.createWelcomeNotification(
        user.id,
        `${user.first_name} ${user.last_name}`
      );

      // Envoyer un email de bienvenue (optionnel)
      try {
        await EmailService.sendWelcomeEmail(user);
      } catch (emailError) {
        logger.warn('Erreur envoi email de bienvenue:', emailError);
      }

      logger.info(`Nouvel utilisateur inscrit: ${email} (ID: ${user.id})`);

      res.status(201).json(formatResponse(
        true,
        SUCCESS_MESSAGES.USER_CREATED,
        {
          user: sanitizedUser,
          tokens: {
            accessToken,
            refreshToken
          }
        },
        201
      ));
    } catch (error) {
      logger.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Trouver l'utilisateur par email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json(formatResponse(
          false,
          ERROR_MESSAGES.INVALID_CREDENTIALS,
          null,
          401
        ));
      }

      // Vérifier le mot de passe
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json(formatResponse(
          false,
          ERROR_MESSAGES.INVALID_CREDENTIALS,
          null,
          401
        ));
      }

      // Vérifier si le compte est actif
      if (!user.is_active) {
        return res.status(401).json(formatResponse(
          false,
          'Compte désactivé',
          null,
          401
        ));
      }

      const sanitizedUser = sanitizeUser(user);

      // Générer les tokens
      const accessToken = generateToken({ id: user.id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user.id });

      // Enregistrer la session
      await AuthService.createSession(user.id, refreshToken, req);

      logger.info(`Utilisateur connecté: ${email} (ID: ${user.id})`);

      res.json(formatResponse(
        true,
        SUCCESS_MESSAGES.LOGIN_SUCCESS,
        {
          user: sanitizedUser,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      ));
    } catch (error) {
      logger.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Déconnexion d'un utilisateur
   */
  static async logout(req, res) {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!req.user || !req.user.id) {
        return res.status(401).json(formatResponse(
          false,
          'Utilisateur non authentifié',
          null,
          'UNAUTHENTICATED'
        ));
      }

      const userId = req.user.id;
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(' ')[1] : null;

      // Invalider le token/session
      if (token) {
        await AuthService.invalidateSession(userId, token);
      }

      logger.info(`Utilisateur déconnecté: ${req.user.email} (ID: ${userId})`);

      res.json(formatResponse(
        true,
        'Déconnexion réussie'
      ));
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
      res.status(500).json(formatResponse(
        false,
        'Erreur lors de la déconnexion',
        null,
        'LOGOUT_ERROR'
      ));
    }
  }

  /**
   * Rafraîchissement du token d'accès
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json(formatResponse(
          false,
          'Token de rafraîchissement requis',
          null,
          401
        ));
      }

      // Vérifier le refresh token
      const decoded = verifyRefreshToken(refreshToken);
      const user = await UserModel.findById(decoded.id);

      if (!user || !user.is_active) {
        return res.status(401).json(formatResponse(
          false,
          ERROR_MESSAGES.UNAUTHORIZED,
          null,
          401
        ));
      }

      // Vérifier si la session existe
      const isValidSession = await AuthService.validateSession(user.id, refreshToken);
      if (!isValidSession) {
        return res.status(401).json(formatResponse(
          false,
          'Session invalide',
          null,
          401
        ));
      }

      // Générer un nouveau token d'accès
      const newAccessToken = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      res.json(formatResponse(
        true,
        'Token rafraîchi avec succès',
        {
          accessToken: newAccessToken
        }
      ));
    } catch (error) {
      logger.error('Erreur lors du rafraîchissement:', error);
      return res.status(401).json(formatResponse(
        false,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      ));
    }
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe
        return res.json(formatResponse(
          true,
          'Si cet email existe, un lien de réinitialisation a été envoyé'
        ));
      }

      // Générer un token de réinitialisation
      const resetToken = await AuthService.generatePasswordResetToken(user.id);

      // Envoyer l'email de réinitialisation
      await EmailService.sendPasswordResetEmail(user, resetToken);

      logger.info(`Demande de réinitialisation pour: ${email}`);

      res.json(formatResponse(
        true,
        'Si cet email existe, un lien de réinitialisation a été envoyé'
      ));
    } catch (error) {
      logger.error('Erreur lors de la demande de réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  static async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      // Valider et utiliser le token de réinitialisation
      const userId = await AuthService.validatePasswordResetToken(token);
      if (!userId) {
        return res.status(400).json(formatResponse(
          false,
          'Token de réinitialisation invalide ou expiré',
          null,
          400
        ));
      }

      // Mettre à jour le mot de passe
      await UserModel.updatePassword(userId, password);

      // Invalider toutes les sessions de l'utilisateur
      await AuthService.invalidateAllUserSessions(userId);

      logger.info(`Mot de passe réinitialisé pour l'utilisateur ID: ${userId}`);

      res.json(formatResponse(
        true,
        'Mot de passe réinitialisé avec succès'
      ));
    } catch (error) {
      logger.error('Erreur lors de la réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Changement de mot de passe
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Récupérer l'utilisateur avec le mot de passe
      const user = await UserModel.findByEmail(req.user.email);
      
      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json(formatResponse(
          false,
          'Mot de passe actuel incorrect',
          null,
          400
        ));
      }

      // Mettre à jour le mot de passe
      await UserModel.updatePassword(userId, newPassword);

      logger.info(`Mot de passe changé pour l'utilisateur: ${req.user.email}`);

      res.json(formatResponse(
        true,
        'Mot de passe modifié avec succès'
      ));
    } catch (error) {
      logger.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  }

  /**
   * Récupération du profil utilisateur
   */
  static async getProfile(req, res) {
    try {
      const user = sanitizeUser(req.user);
      
      // Ajouter des statistiques utilisateur
      const stats = await AuthService.getUserStats(req.user.id);

      res.json(formatResponse(
        true,
        'Profil récupéré avec succès',
        {
          user,
          stats
        }
      ));
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  /**
   * Mise à jour du profil utilisateur
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = { ...req.body };

      // Ajouter l'image de profil si uploadée
      if (req.file) {
        updateData.profile_image = req.file.url;
      }

      // Vérifier l'unicité de l'email si modifié
      if (updateData.email && updateData.email !== req.user.email) {
        const emailExists = await UserModel.emailExists(updateData.email, userId);
        if (emailExists) {
          return res.status(409).json(formatResponse(
            false,
            ERROR_MESSAGES.EMAIL_EXISTS,
            null,
            409
          ));
        }
      }

      // Vérifier l'unicité du numéro étudiant si modifié
      if (updateData.student_id) {
        const studentIdExists = await UserModel.studentIdExists(updateData.student_id, userId);
        if (studentIdExists) {
          return res.status(409).json(formatResponse(
            false,
            'Ce numéro étudiant est déjà utilisé',
            null,
            409
          ));
        }
      }

      const updatedUser = await UserModel.update(userId, updateData);
      const sanitizedUser = sanitizeUser(updatedUser);

      logger.info(`Profil mis à jour pour l'utilisateur: ${req.user.email}`);

      res.json(formatResponse(
        true,
        SUCCESS_MESSAGES.PROFILE_UPDATED,
        { user: sanitizedUser }
      ));
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  /**
   * Suppression du compte utilisateur
   */
  static async deleteAccount(req, res) {
    try {
      const userId = req.user.id;

      // Vérifier s'il y a des emprunts actifs
      const hasActiveLoans = await AuthService.hasActiveLoans(userId);
      if (hasActiveLoans) {
        return res.status(400).json(formatResponse(
          false,
          'Impossible de supprimer le compte: emprunts actifs en cours',
          null,
          400
        ));
      }

      // Désactiver le compte plutôt que de le supprimer
      await UserModel.deactivate(userId);

      // Invalider toutes les sessions
      await AuthService.invalidateAllUserSessions(userId);

      logger.info(`Compte supprimé pour l'utilisateur: ${req.user.email}`);

      res.json(formatResponse(
        true,
        'Compte supprimé avec succès'
      ));
    } catch (error) {
      logger.error('Erreur lors de la suppression du compte:', error);
      throw error;
    }
  }

  /**
   * Vérification d'email
   */
  static async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      const isValid = await AuthService.verifyEmailToken(token);
      if (!isValid) {
        return res.status(400).json(formatResponse(
          false,
          'Token de vérification invalide ou expiré',
          null,
          400
        ));
      }

      res.json(formatResponse(
        true,
        'Email vérifié avec succès'
      ));
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'email:', error);
      throw error;
    }
  }

  /**
   * Renvoyer l'email de vérification
   */
  static async resendVerificationEmail(req, res) {
    try {
      const user = req.user;

      if (user.email_verified) {
        return res.status(400).json(formatResponse(
          false,
          'Email déjà vérifié',
          null,
          400
        ));
      }

      const verificationToken = await AuthService.generateEmailVerificationToken(user.id);
      await EmailService.sendVerificationEmail(user, verificationToken);

      res.json(formatResponse(
        true,
        'Email de vérification renvoyé'
      ));
    } catch (error) {
      logger.error('Erreur lors du renvoi de l\'email de vérification:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un email existe
   */
  static async checkEmailExists(req, res) {
    try {
      const { email } = req.body;
      const exists = await UserModel.emailExists(email);

      res.json(formatResponse(
        true,
        'Vérification terminée',
        { exists }
      ));
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'email:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un numéro étudiant existe
   */
  static async checkStudentIdExists(req, res) {
    try {
      const { student_id } = req.body;
      const exists = await UserModel.studentIdExists(student_id);

      res.json(formatResponse(
        true,
        'Vérification terminée',
        { exists }
      ));
    } catch (error) {
      logger.error('Erreur lors de la vérification du numéro étudiant:', error);
      throw error;
    }
  }

  /**
   * Lister les sessions actives
   */
  static async getActiveSessions(req, res) {
    try {
      const userId = req.user.id;
      const sessions = await AuthService.getActiveSessions(userId);

      res.json(formatResponse(
        true,
        'Sessions récupérées avec succès',
        { sessions }
      ));
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions:', error);
      throw error;
    }
  }

  /**
   * Terminer une session spécifique
   */
  static async terminateSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      await AuthService.terminateSession(userId, sessionId);

      res.json(formatResponse(
        true,
        'Session terminée avec succès'
      ));
    } catch (error) {
      logger.error('Erreur lors de la fermeture de session:', error);
      throw error;
    }
  }

  /**
   * Terminer toutes les autres sessions
   */
  static async terminateAllOtherSessions(req, res) {
    try {
      const userId = req.user.id;
      const currentToken = req.headers.authorization?.split(' ')[1];

      await AuthService.terminateAllOtherSessions(userId, currentToken);

      res.json(formatResponse(
        true,
        'Autres sessions terminées avec succès'
      ));
    } catch (error) {
      logger.error('Erreur lors de la fermeture des sessions:', error);
      throw error;
    }
  }

  /**
   * Vérifier la validité du token JWT et renvoyer les informations utilisateur
   */
  static async verifyToken(req, res) {
    try {
      // Si la requête atteint cette fonction, c'est que le token a déjà été vérifié par le middleware auth
      const user = sanitizeUser(req.user);
      
      res.json(formatResponse(
        true,
        'Token valide',
        { user }
      ));
    } catch (error) {
      logger.error('Erreur lors de la vérification du token:', error);
      return res.status(401).json(formatResponse(
        false,
        ERROR_MESSAGES.UNAUTHORIZED,
        null,
        401
      ));
    }
  }
}

module.exports = AuthController;