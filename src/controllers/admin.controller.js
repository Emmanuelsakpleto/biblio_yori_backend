const UserService = require('../services/user.service');
const BookService = require('../services/book.service');
const LoanService = require('../services/loan.service');
const StatisticsService = require('../services/statistics.service');
const NotificationService = require('../services/notification.service');
const { AppError, formatResponse, paginate } = require('../utils/helpers');

class AdminController {
  // Dashboard principal de l'administrateur
  static async getDashboard(req, res, next) {
    try {
      const dashboard = await StatisticsService.getAdminDashboard();
      
      res.json(formatResponse(true, 'Dashboard administrateur récupéré', dashboard));
    } catch (error) {
      next(error);
    }
  }

  // Gestion des utilisateurs - Obtenir tous les utilisateurs
  static async getAllUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        role = '',
        status = '',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const filters = {
        search: search ? search.trim() : '',
        role: role ? role.trim() : '',
        status: status ? status.trim() : '',
        sort_by,
        sort_order: sort_order ? sort_order.toUpperCase() : 'DESC'
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await UserService.getAllUsers(filters, pagination);

      res.json(formatResponse(true, 'Utilisateurs récupérés avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir un utilisateur spécifique
  static async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const { include_stats = 'false' } = req.query;

      const user = await UserService.getUserById(id);
      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      let userWithStats = user;
      if (include_stats === 'true') {
        const stats = await StatisticsService.getUserStats(id);
        userWithStats = { ...user, stats };
      }

      res.json(formatResponse(true, 'Utilisateur récupéré avec succès', userWithStats));
    } catch (error) {
      next(error);
    }
  }

  // Mettre à jour un utilisateur
  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier que l'utilisateur existe
      const existingUser = await UserService.getUserById(id);
      if (!existingUser) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      const user = await UserService.updateUserProfile(id, updateData);

      res.json(formatResponse(true, 'Utilisateur mis à jour avec succès', user));
    } catch (error) {
      next(error);
    }
  }

  // Activer/Désactiver un utilisateur
  static async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { is_active, reason } = req.body;

      const user = await UserService.toggleUserStatus(id, is_active, reason);

      // Créer une notification pour l'utilisateur
      if (!is_active) {
        await NotificationService.createSystemNotification({
          user_id: id,
          type: 'account_suspended',
          customTitle: 'Compte suspendu',
          customMessage: reason || 'Votre compte a été suspendu par un administrateur.'
        });
      } else {
        await NotificationService.createSystemNotification({
          user_id: id,
          type: 'account_reactivated',
          customTitle: 'Compte réactivé',
          customMessage: 'Votre compte a été réactivé par un administrateur.'
        });
      }

      res.json(formatResponse(true, 'Statut utilisateur modifié avec succès', user));
    } catch (error) {
      next(error);
    }
  }

  // Supprimer un utilisateur
  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const { transfer_data_to } = req.body;

      // Vérifier que l'utilisateur existe
      const existingUser = await UserService.getUserById(id);
      if (!existingUser) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      // Vérifier s'il a des emprunts actifs
      const activeLoans = await LoanService.getUserActiveLoans(id);
      if (activeLoans.length > 0) {
        throw new AppError('Impossible de supprimer un utilisateur avec des emprunts actifs', 400);
      }

      await UserService.deleteUser(id, transfer_data_to);

      res.json(formatResponse(true, 'Utilisateur supprimé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Promouvoir un utilisateur en administrateur
  static async promoteToAdmin(req, res, next) {
    try {
      const { id } = req.params;
      const { permissions = [] } = req.body;

      const user = await UserService.changeUserRole(id, 'admin', permissions);

      // Créer une notification pour l'utilisateur
      await NotificationService.createSystemNotification({
        user_id: id,
        type: 'role_changed',
        customTitle: 'Promotion administrateur',
        customMessage: 'Vous avez été promu administrateur de la bibliothèque.'
      });

      res.json(formatResponse(true, 'Utilisateur promu administrateur', user));
    } catch (error) {
      next(error);
    }
  }

  // Rétrograder un administrateur
  static async demoteFromAdmin(req, res, next) {
    try {
      const { id } = req.params;

      const user = await UserService.changeUserRole(id, 'user');

      // Créer une notification pour l'utilisateur
      await NotificationService.createSystemNotification({
        user_id: id,
        type: 'role_changed',
        customTitle: 'Changement de rôle',
        customMessage: 'Votre rôle d\'administrateur a été retiré.'
      });

      res.json(formatResponse(true, 'Administrateur rétrogradé', user));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques générales du système
  static async getSystemStats(req, res, next) {
    try {
      const stats = await StatisticsService.getSystemStats();
      res.json(formatResponse(true, 'Statistiques système récupérées', stats));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques par période
  static async getStatsByPeriod(req, res, next) {
    try {
      const {
        period = 'month',
        start_date,
        end_date
      } = req.query;

      const stats = await StatisticsService.getStatsByPeriod(period, start_date, end_date);
      res.json(formatResponse(true, 'Statistiques par période récupérées', stats));
    } catch (error) {
      next(error);
    }
  }

  // Gestion des livres en lot
  static async bulkUpdateBooks(req, res, next) {
    try {
      const { book_ids, updates } = req.body;

      if (!Array.isArray(book_ids) || book_ids.length === 0) {
        throw new AppError('Liste d\'IDs de livres requise', 400);
      }

      const results = await BookService.bulkUpdateBooks(book_ids, updates);

      res.json(formatResponse(true, 'Livres mis à jour en lot', results));
    } catch (error) {
      next(error);
    }
  }

  // Supprimer des livres en lot
  static async bulkDeleteBooks(req, res, next) {
    try {
      const { book_ids, force = false } = req.body;

      if (!Array.isArray(book_ids) || book_ids.length === 0) {
        throw new AppError('Liste d\'IDs de livres requise', 400);
      }

      const results = await BookService.bulkDeleteBooks(book_ids, force);

      res.json(formatResponse(true, 'Livres supprimés en lot', results));
    } catch (error) {
      next(error);
    }
  }

  // Gestion des emprunts - Actions en lot
  static async bulkUpdateLoans(req, res, next) {
    try {
      const { loan_ids, action, data = {} } = req.body;

      if (!Array.isArray(loan_ids) || loan_ids.length === 0) {
        throw new AppError('Liste d\'IDs d\'emprunts requise', 400);
      }

      let results;
      switch (action) {
        case 'mark_overdue':
          results = await LoanService.bulkMarkOverdue(loan_ids, data);
          break;
        case 'extend_due_date':
          results = await LoanService.bulkExtendDueDate(loan_ids, data.days);
          break;
        case 'cancel':
          results = await LoanService.bulkCancelLoans(loan_ids, data.reason);
          break;
        default:
          throw new AppError('Action non supportée', 400);
      }

      res.json(formatResponse(true, 'Emprunts mis à jour en lot', results));
    } catch (error) {
      next(error);
    }
  }

  // Envoyer des notifications en lot
  static async sendBulkNotifications(req, res, next) {
    try {
      const {
        user_ids,
        type,
        title,
        message,
        priority = 'normal',
        send_email = false
      } = req.body;

      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        throw new AppError('Liste d\'IDs d\'utilisateurs requise', 400);
      }

      const result = await NotificationService.createBulkNotification({
        user_ids,
        type,
        title,
        message,
        priority,
        send_email
      });

      res.json(formatResponse(true, 'Notifications envoyées en lot', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les activités récentes du système
  static async getRecentActivities(req, res, next) {
    try {
      const {
        limit = 50,
        type = '',
        user_id = ''
      } = req.query;

      const activities = await StatisticsService.getRecentActivities({
        limit: parseInt(limit),
        type: type.trim(),
        user_id: user_id.trim()
      });

      res.json(formatResponse(true, 'Activités récentes récupérées', activities));
    } catch (error) {
      next(error);
    }
  }

  // Gérer les paramètres du système
  static async getSystemSettings(req, res, next) {
    try {
      const settings = await UserService.getSystemSettings();
      res.json(formatResponse(true, 'Paramètres système récupérés', settings));
    } catch (error) {
      next(error);
    }
  }

  static async updateSystemSettings(req, res, next) {
    try {
      const settings = req.body;
      const updatedSettings = await UserService.updateSystemSettings(settings);

      res.json(formatResponse(true, 'Paramètres système mis à jour', updatedSettings));
    } catch (error) {
      next(error);
    }
  }

  // Exporter des données
  static async exportData(req, res, next) {
    try {
      const {
        type = 'users',
        format = 'csv',
        filters = {}
      } = req.query;

      let result;
      switch (type) {
        case 'users':
          result = await UserService.exportUsers(format, filters);
          break;
        case 'books':
          result = await BookService.exportBooks(format, filters);
          break;
        case 'loans':
          result = await LoanService.exportLoans(format, filters);
          break;
        default:
          throw new AppError('Type d\'export non supporté', 400);
      }

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${type}.${format}"`);
      res.send(result.data);
    } catch (error) {
      next(error);
    }
  }

  // Sauvegarder la base de données
  static async backupDatabase(req, res, next) {
    try {
      const { include_files = false } = req.body;
      
      const backup = await UserService.createDatabaseBackup(include_files);

      res.json(formatResponse(true, 'Sauvegarde créée avec succès', backup));
    } catch (error) {
      next(error);
    }
  }

  // Restaurer la base de données
  static async restoreDatabase(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('Fichier de sauvegarde requis', 400);
      }

      const result = await UserService.restoreDatabase(req.file.path);

      res.json(formatResponse(true, 'Base de données restaurée avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Nettoyer les données anciennes
  static async cleanupOldData(req, res, next) {
    try {
      const {
        days_old = 365,
        types = ['notifications', 'logs', 'sessions']
      } = req.body;

      const results = await UserService.cleanupOldData(parseInt(days_old), types);

      res.json(formatResponse(true, 'Nettoyage effectué avec succès', results));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les logs du système
  static async getSystemLogs(req, res, next) {
    try {
      const {
        page = 1,
        limit = 50,
        level = '',
        start_date,
        end_date
      } = req.query;

      const filters = {
        level: level.trim(),
        start_date,
        end_date
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await UserService.getSystemLogs(filters, pagination);

      res.json(formatResponse(true, 'Logs système récupérés', result));
    } catch (error) {
      next(error);
    }
  }

  // Gérer les réservations en attente
  static async getPendingReservations(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        book_id = '',
        user_id = ''
      } = req.query;

      const filters = {
        book_id: book_id.trim(),
        user_id: user_id.trim()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await BookService.getPendingReservations(filters, pagination);

      res.json(formatResponse(true, 'Réservations en attente récupérées', result));
    } catch (error) {
      next(error);
    }
  }

  // Approuver/Rejeter une réservation
  static async processReservation(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!['approve', 'reject'].includes(action)) {
        throw new AppError('Action invalide (approve ou reject)', 400);
      }

      const result = await BookService.processReservation(id, action, reason);

      // Créer une notification pour l'utilisateur
      await NotificationService.createBookNotification({
        user_id: result.user_id,
        book_title: result.book_title,
        book_id: result.book_id,
        type: action === 'approve' ? 'reservation_approved' : 'reservation_rejected'
      });

      res.json(formatResponse(true, `Réservation ${action === 'approve' ? 'approuvée' : 'rejetée'}`, result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir le rapport mensuel
  static async getMonthlyReport(req, res, next) {
    try {
      const {
        year = new Date().getFullYear(),
        month = new Date().getMonth() + 1
      } = req.query;

      const report = await StatisticsService.getMonthlyReport(parseInt(year), parseInt(month));

      res.json(formatResponse(true, 'Rapport mensuel généré', report));
    } catch (error) {
      next(error);
    }
  }

  // Maintenance du système
  static async performMaintenance(req, res, next) {
    try {
      const {
        tasks = ['cleanup_sessions', 'optimize_database', 'update_statistics']
      } = req.body;

      const results = await UserService.performMaintenance(tasks);

      res.json(formatResponse(true, 'Maintenance effectuée', results));
    } catch (error) {
      next(error);
    }
  }

  // Créer un nouvel utilisateur (Admin seulement)
  static async createUser(req, res, next) {
    try {
      const userData = req.body;
      
      // Hash du mot de passe si fourni
      if (userData.password) {
        const bcrypt = require('bcrypt');
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const user = await UserService.createUser(userData);

      // Créer une notification de bienvenue pour le nouvel utilisateur
      await NotificationService.createSystemNotification({
        user_id: user.id,
        type: 'welcome',
        customTitle: 'Bienvenue !',
        customMessage: 'Votre compte a été créé par un administrateur. Bienvenue dans la bibliothèque YORI !'
      });

      res.status(201).json(formatResponse(true, 'Utilisateur créé avec succès', user));
    } catch (error) {
      next(error);
    }
  }

  // Rechercher des utilisateurs
  static async searchUsers(req, res, next) {
    try {
      const { q: searchTerm, limit = 10 } = req.query;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        throw new AppError('Le terme de recherche doit contenir au moins 2 caractères', 400);
      }
      
      const users = await UserService.searchUsers(searchTerm.trim(), parseInt(limit));
      
      res.json(formatResponse(true, 'Recherche effectuée', users));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques d'un utilisateur
  static async getUserStats(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await UserService.getUserById(id);
      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404);
      }
      
      const stats = await UserService.getUserStats(id);
      
      res.json(formatResponse(true, 'Statistiques utilisateur récupérées', stats));
    } catch (error) {
      next(error);
    }
  }

  // Export des données utilisateurs (CSV/Excel)
  static async exportUsers(req, res, next) {
    try {
      const { format = 'csv', filters = {} } = req.query;
      
      // Récupérer tous les utilisateurs avec les filtres
      const result = await UserService.getAllUsers(filters, { page: 1, limit: 10000 });
      
      if (format === 'csv') {
        const csv = UserService.exportToCSV(result.users);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.send(csv);
      } else {
        res.json(formatResponse(true, 'Données utilisateurs exportées', result.users));
      }
    } catch (error) {
      next(error);
    }
  }

  // Réinitialiser le mot de passe d'un utilisateur
  static async resetUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { new_password, send_notification = true } = req.body;
      
      const user = await UserService.getUserById(id);
      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404);
      }
      
      // Hash du nouveau mot de passe
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(new_password, 10);
      
      await UserService.updateUserProfile(id, { password: hashedPassword });
      
      // Envoyer une notification si demandé
      if (send_notification) {
        await NotificationService.createSystemNotification({
          user_id: id,
          type: 'password_changed',
          customTitle: 'Mot de passe réinitialisé',
          customMessage: 'Votre mot de passe a été réinitialisé par un administrateur. Pensez à le changer lors de votre prochaine connexion.'
        });
      }
      
      res.json(formatResponse(true, 'Mot de passe réinitialisé avec succès'));
    } catch (error) {
      next(error);
    }
  }

  // Maintenance du système
  static async performMaintenance(req, res, next) {
    try {
      const {
        tasks = ['cleanup_sessions', 'optimize_database', 'update_statistics']
      } = req.body;

      const results = await UserService.performMaintenance(tasks);

      res.json(formatResponse(true, 'Maintenance effectuée', results));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;