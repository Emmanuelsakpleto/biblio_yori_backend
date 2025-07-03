const database = require('../config/database');
const { generateUUID, logger } = require('../utils/helpers');
const { LOAN_STATUS } = require('../utils/constants');

class AuthService {
  /**
   * Créer une nouvelle session utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {string} refreshToken - Token de rafraîchissement
   * @param {Object} req - Objet de requête Express
   * @returns {Promise<string>} - ID de session
   */
  static async createSession(userId, refreshToken, req) {
    try {
      const userAgent = req.get('User-Agent') || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours

      const sql = `
        INSERT INTO user_sessions (user_id, refresh_token, user_agent, ip_address, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `;

      const result = await database.query(sql, [userId, refreshToken, userAgent, ipAddress, expiresAt]);
      
      logger.info(`Session créée pour l'utilisateur ${userId}: ${result.insertId}`);
      return result.insertId;
    } catch (error) {
      logger.error('Erreur lors de la création de session:', error);
      throw error;
    }
  }

  /**
   * Valider une session existante
   * @param {number} userId - ID de l'utilisateur
   * @param {string} refreshToken - Token de rafraîchissement
   * @returns {Promise<boolean>} - True si valide
   */
  static async validateSession(userId, refreshToken) {
    try {
      const sql = `
        SELECT id FROM user_sessions 
        WHERE user_id = ? AND refresh_token = ? AND expires_at > NOW() AND is_active = 1
      `;

      const [session] = await database.query(sql, [userId, refreshToken]);
      return !!session;
    } catch (error) {
      logger.error('Erreur lors de la validation de session:', error);
      return false;
    }
  }

  /**
   * Invalider une session spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} token - Token ou ID de session
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async invalidateSession(userId, token) {
    try {
      // For logout, we invalidate all active sessions for the user
      // since we only have the access token, not the refresh token
      const sql = `
        UPDATE user_sessions 
        SET is_active = 0
        WHERE user_id = ? AND is_active = 1
      `;

      const result = await database.query(sql, [userId]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur lors de l\'invalidation de session:', error);
      throw error;
    }
  }

  /**
   * Invalider toutes les sessions d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<number>} - Nombre de sessions invalidées
   */
  static async invalidateAllUserSessions(userId) {
    try {
      const sql = `
        UPDATE user_sessions 
        SET is_active = 0
        WHERE user_id = ? AND is_active = 1
      `;

      const result = await database.query(sql, [userId]);
      logger.info(`${result.affectedRows} sessions invalidées pour l'utilisateur ${userId}`);
      return result.affectedRows;
    } catch (error) {
      logger.error('Erreur lors de l\'invalidation des sessions:', error);
      throw error;
    }
  }

  /**
   * Obtenir les sessions actives d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Array>} - Liste des sessions actives
   */
  static async getActiveSessions(userId) {
    try {
      const sql = `
        SELECT id, user_agent, ip_address, created_at, last_activity
        FROM user_sessions 
        WHERE user_id = ? AND is_active = 1 AND expires_at > NOW()
        ORDER BY last_activity DESC
      `;

      const sessions = await database.query(sql, [userId]);
      return sessions;
    } catch (error) {
      logger.error('Erreur lors de la récupération des sessions:', error);
      throw error;
    }
  }

  /**
   * Terminer une session spécifique
   * @param {number} userId - ID de l'utilisateur
   * @param {string} sessionId - ID de la session
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async terminateSession(userId, sessionId) {
    try {
      const sql = `
        UPDATE user_sessions 
        SET is_active = 0
        WHERE user_id = ? AND id = ?
      `;

      const result = await database.query(sql, [userId, sessionId]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur lors de la fermeture de session:', error);
      throw error;
    }
  }

  /**
   * Terminer toutes les autres sessions sauf la courante
   * @param {number} userId - ID de l'utilisateur
   * @param {string} currentToken - Token de la session courante
   * @returns {Promise<number>} - Nombre de sessions fermées
   */
  static async terminateAllOtherSessions(userId, currentToken) {
    try {
      const sql = `
        UPDATE user_sessions 
        SET is_active = 0
        WHERE user_id = ? AND refresh_token != ? AND is_active = 1
      `;

      const result = await database.query(sql, [userId, currentToken]);
      return result.affectedRows;
    } catch (error) {
      logger.error('Erreur lors de la fermeture des autres sessions:', error);
      throw error;
    }
  }

  /**
   * Générer un token de réinitialisation de mot de passe
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<string>} - Token de réinitialisation
   */
  static async generatePasswordResetToken(userId) {
    try {
      const token = generateUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      // Invalider les anciens tokens
      await database.query(
        'UPDATE password_reset_tokens SET is_used = 1 WHERE user_id = ? AND is_used = 0',
        [userId]
      );

      // Créer le nouveau token
      const sql = `
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `;

      await database.query(sql, [userId, token, expiresAt]);
      
      logger.info(`Token de réinitialisation généré pour l'utilisateur ${userId}`);
      return token;
    } catch (error) {
      logger.error('Erreur lors de la génération du token de réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Valider et utiliser un token de réinitialisation
   * @param {string} token - Token de réinitialisation
   * @returns {Promise<number|null>} - ID de l'utilisateur ou null
   */
  static async validatePasswordResetToken(token) {
    try {
      return await database.transaction(async (connection) => {
        // Vérifier le token
        const [resetToken] = await connection.execute(`
          SELECT user_id FROM password_reset_tokens 
          WHERE token = ? AND is_used = 0 AND expires_at > NOW()
        `, [token]);

        if (!resetToken.length) {
          return null;
        }

        const userId = resetToken[0].user_id;

        // Marquer le token comme utilisé
        await connection.execute(
          'UPDATE password_reset_tokens SET is_used = 1 WHERE token = ?',
          [token]
        );

        return userId;
      });
    } catch (error) {
      logger.error('Erreur lors de la validation du token de réinitialisation:', error);
      throw error;
    }
  }

  /**
   * Générer un token de vérification d'email
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<string>} - Token de vérification
   */
  static async generateEmailVerificationToken(userId) {
    try {
      const token = generateUUID();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 heures

      // Invalider les anciens tokens
      await database.query(
        'UPDATE email_verification_tokens SET is_used = 1 WHERE user_id = ? AND is_used = 0',
        [userId]
      );

      // Créer le nouveau token
      const sql = `
        INSERT INTO email_verification_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
      `;

      await database.query(sql, [userId, token, expiresAt]);
      return token;
    } catch (error) {
      logger.error('Erreur lors de la génération du token de vérification:', error);
      throw error;
    }
  }

  /**
   * Vérifier et utiliser un token de vérification d'email
   * @param {string} token - Token de vérification
   * @returns {Promise<boolean>} - Succès de la vérification
   */
  static async verifyEmailToken(token) {
    try {
      return await database.transaction(async (connection) => {
        // Vérifier le token
        const [verificationToken] = await connection.execute(`
          SELECT user_id FROM email_verification_tokens 
          WHERE token = ? AND is_used = 0 AND expires_at > NOW()
        `, [token]);

        if (!verificationToken.length) {
          return false;
        }

        const userId = verificationToken[0].user_id;

        // Marquer l'email comme vérifié
        await connection.execute(
          'UPDATE users SET email_verified = 1, email_verified_at = NOW() WHERE id = ?',
          [userId]
        );

        // Marquer le token comme utilisé
        await connection.execute(
          'UPDATE email_verification_tokens SET is_used = 1 WHERE token = ?',
          [token]
        );

        return true;
      });
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'email:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Statistiques utilisateur
   */
  static async getUserStats(userId) {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM loans WHERE user_id = ?) as total_loans,
          (SELECT COUNT(*) FROM loans WHERE user_id = ? AND status = ?) as active_loans,
          (SELECT COUNT(*) FROM loans WHERE user_id = ? AND status = ?) as returned_loans,
          (SELECT COUNT(*) FROM loans WHERE user_id = ? AND status = ? AND due_date < NOW()) as overdue_loans,
          (SELECT COUNT(*) FROM reviews WHERE user_id = ?) as total_reviews,
          (SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0) as unread_notifications
      `;

      const [stats] = await database.query(sql, [
        userId, // total_loans
        userId, LOAN_STATUS.ACTIVE, // active_loans
        userId, LOAN_STATUS.RETURNED, // returned_loans
        userId, LOAN_STATUS.ACTIVE, // overdue_loans
        userId, // total_reviews
        userId // unread_notifications
      ]);

      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques utilisateur:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un utilisateur a des emprunts actifs
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} - True si des emprunts actifs existent
   */
  static async hasActiveLoans(userId) {
    try {
      const sql = `
        SELECT COUNT(*) as count 
        FROM loans 
        WHERE user_id = ? AND status = ?
      `;

      const [{ count }] = await database.query(sql, [userId, LOAN_STATUS.ACTIVE]);
      return count > 0;
    } catch (error) {
      logger.error('Erreur lors de la vérification des emprunts actifs:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les sessions expirées
   * @returns {Promise<number>} - Nombre de sessions nettoyées
   */
  static async cleanupExpiredSessions() {
    try {
      const sql = `
        DELETE FROM user_sessions 
        WHERE expires_at < NOW() OR (is_active = 0 AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
      `;

      const result = await database.query(sql);
      
      if (result.affectedRows > 0) {
        logger.info(`${result.affectedRows} sessions expirées nettoyées`);
      }
      
      return result.affectedRows;
    } catch (error) {
      logger.error('Erreur lors du nettoyage des sessions:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les tokens expirés
   * @returns {Promise<number>} - Nombre de tokens nettoyés
   */
  static async cleanupExpiredTokens() {
    try {
      let totalCleaned = 0;

      // Nettoyer les tokens de réinitialisation
      const resetResult = await database.query(`
        DELETE FROM password_reset_tokens 
        WHERE expires_at < NOW() OR is_used = 1
      `);
      totalCleaned += resetResult.affectedRows;

      // Nettoyer les tokens de vérification d'email
      const verificationResult = await database.query(`
        DELETE FROM email_verification_tokens 
        WHERE expires_at < NOW() OR is_used = 1
      `);
      totalCleaned += verificationResult.affectedRows;

      if (totalCleaned > 0) {
        logger.info(`${totalCleaned} tokens expirés nettoyés`);
      }

      return totalCleaned;
    } catch (error) {
      logger.error('Erreur lors du nettoyage des tokens:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'authentification
   * @returns {Promise<Object>} - Statistiques globales
   */
  static async getAuthStats() {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_active = 1) as total_users,
          (SELECT COUNT(*) FROM user_sessions WHERE is_active = 1 AND expires_at > NOW()) as active_sessions,
          (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_users_today,
          (SELECT COUNT(*) FROM user_sessions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_sessions_today,
          (SELECT COUNT(*) FROM password_reset_tokens WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as password_resets_today
      `;

      const [stats] = await database.query(sql);
      return stats;
    } catch (error) {
      logger.error('Erreur lors de la récupération des statistiques d\'authentification:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour l'activité de session
   * @param {string} sessionId - ID de la session
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  static async updateSessionActivity(sessionId) {
    try {
      const sql = `
        UPDATE user_sessions 
        SET last_activity = CURRENT_TIMESTAMP
        WHERE id = ? AND is_active = 1
      `;

      const result = await database.query(sql, [sessionId]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'activité de session:', error);
      return false;
    }
  }
}

module.exports = AuthService;