const LoanService = require('../services/loan.service');
const NotificationService = require('../services/notification.service');
const EmailService = require('../services/email.service');
const { AppError, formatResponse, paginate } = require('../utils/helpers');

class LoanController {

  // Annuler une réservation (étudiant)
  static async cancelLoan(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const loan = await LoanService.cancelLoan(id, userId, role);
      // Créer une notification pour l'utilisateur et l'admin
      try {
        await NotificationService.create({
          user_id: loan.user_id,
          type: 'reservation_cancelled',
          title: `Réservation annulée : ${loan.book_title}`,
          message: `Votre réservation pour le livre "${loan.book_title}" a été annulée.`,
          related_entity_type: 'loan',
          related_entity_id: loan.id
        });
      } catch (notificationError) {
        console.warn('Erreur lors de la notification d\'annulation:', notificationError.message);
      }
      res.json(formatResponse(true, 'Réservation annulée avec succès', loan));
    } catch (error) {
      next(error);
    }
  }

  // Refuser une réservation (admin)
  static async refuseLoan(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const loan = await LoanService.refuseLoan(id, adminId);
      // Créer une notification pour l'utilisateur
      try {
        await NotificationService.create({
          user_id: loan.user_id,
          type: 'reservation_refused',
          title: `Réservation refusée : ${loan.book_title}`,
          message: `Votre réservation pour le livre "${loan.book_title}" a été refusée par l'administrateur.`,
          related_entity_type: 'loan',
          related_entity_id: loan.id
        });
        // Envoi email refus à l'étudiant
        const user = loan.user || loan.borrower; // selon structure
        const book = loan.book || { title: loan.book_title, author: loan.book_author };
        await EmailService.sendLoanRefusedNotification(user, book, loan, loan.refusal_reason || '');
      } catch (notificationError) {
        console.warn('Erreur lors de la notification de refus:', notificationError.message);
      }
      res.json(formatResponse(true, 'Réservation refusée', loan));
    } catch (error) {
      next(error);
    }
  }

  // Envoyer un rappel manuel (admin)
  static async sendManualReminder(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const loan = await LoanService.sendManualReminder(id, adminId);
      // Créer une notification de rappel
      try {
        await NotificationService.create({
          user_id: loan.user_id,
          type: 'admin_reminder',
          title: `Rappel administrateur : ${loan.book_title}`,
          message: `Un rappel a été envoyé par l'administrateur concernant l'emprunt du livre "${loan.book_title}".`,
          related_entity_type: 'loan',
          related_entity_id: loan.id
        });
      } catch (notificationError) {
        console.warn('Erreur lors de la notification de rappel:', notificationError.message);
      }
      res.json(formatResponse(true, 'Rappel envoyé', loan));
    } catch (error) {
      next(error);
    }
  }
  // Créer un nouvel emprunt
  static async createLoan(req, res, next) {
    try {
      const { book_id, notes, duration_days = 14 } = req.body;
      const { id: userId } = req.user;
      // Créer l'emprunt (opération critique)
      const loan = await LoanService.createLoan({
        user_id: userId,
        book_id,
        notes,
        duration_days
      });
      // Créer une notification (opération secondaire - ne doit pas faire planter le processus)
      try {
        await NotificationService.createLoanNotification({
          user_id: userId,
          book_title: loan.book_title || loan.title,
          loan_date: loan.loan_date,
          due_date: loan.due_date,
          loan_id: loan.id,
          type: 'loan_created'
        });
        // Notifier l'admin par email (demande d'emprunt)
        const admin = await LoanService.getAdminForNotification(); // à adapter selon votre logique
        const user = req.user;
        const book = loan.book || { title: loan.book_title, author: loan.book_author };
        await EmailService.sendLoanRequestAdminNotification(admin, user, book, loan);
      } catch (notificationError) {
        console.warn('Erreur lors de la notification d\'emprunt:', notificationError.message);
      }
      res.status(201).json(formatResponse(true, 'Emprunt créé avec succès', loan));
    } catch (error) {
      next(error);
    }
  }

  // Valider une réservation (admin)
  static async validateLoan(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const result = await LoanService.validateLoan(id, adminId);
      // Envoyer une notification à l'étudiant (géré dans le service)
      res.json(formatResponse(true, 'Réservation validée avec succès', result));
    } catch (error) {
      next(error);
    }
  }
  // Créer un nouvel emprunt
  static async createLoan(req, res, next) {
    try {
      const { book_id, notes, duration_days = 14 } = req.body;
      const { id: userId } = req.user;

      // Créer l'emprunt (opération critique)
      const loan = await LoanService.createLoan({
        user_id: userId,
        book_id,
        notes,
        duration_days
      });

      // Créer une notification (opération secondaire - ne doit pas faire planter le processus)
      try {
        await NotificationService.createLoanNotification({
          user_id: userId,
          book_title: loan.book_title || loan.title,
          loan_date: loan.loan_date,
          due_date: loan.due_date,
          loan_id: loan.id,
          type: 'loan_created'
        });
      } catch (notificationError) {
        // Logger l'erreur de notification mais ne pas faire planter la requête
        console.warn('Erreur lors de la création de la notification d\'emprunt:', notificationError.message);
      }

      res.status(201).json(formatResponse(true, 'Emprunt créé avec succès', loan));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir tous les emprunts (avec filtres)
  static async getAllLoans(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        status = '',
        user_id = '',
        book_id = '',
        overdue_only = 'false',
        sort_by = 'loan_date',
        sort_order = 'DESC'
      } = req.query;

      // Validation et conversion sécurisée des paramètres
      const options = {
        status: status && status.trim() ? status.trim() : null,
        user_id: user_id && user_id.trim() ? parseInt(user_id.trim()) || null : null,
        book_id: book_id && book_id.trim() ? parseInt(book_id.trim()) || null : null,
        overdue_only: overdue_only === 'true',
        page: Math.max(1, parseInt(page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(limit) || 20)),
        sort_by: sort_by || 'loan_date',
        sort_order: (sort_order || 'DESC').toUpperCase()
      };

      const result = await LoanService.getAllLoans(options);

      res.json(formatResponse(true, 'Emprunts récupérés avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir un emprunt par ID
  static async getLoanById(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;

      const loan = await LoanService.getLoanById(id);

      if (!loan) {
        throw new AppError('Emprunt non trouvé', 404);
      }

      // Vérifier les permissions (utilisateur peut voir ses propres emprunts, admin peut tout voir)
      if (role !== 'admin' && loan.user_id !== userId) {
        throw new AppError('Accès non autorisé à cet emprunt', 403);
      }

      res.json(formatResponse(true, 'Emprunt récupéré avec succès', loan));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les emprunts d'un utilisateur
  static async getUserLoans(req, res, next) {
    try {
      const { id: userId } = req.user;
      const {
        page = 1,
        limit = 20,
        status = '',
        include_history = 'false'
      } = req.query;

      const options = {
        status: status.trim(),
        include_history: include_history === 'true',
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await LoanService.getUserLoans(userId, options);

      res.json(formatResponse(true, 'Emprunts utilisateur récupérés avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Retourner un livre
  static async returnBook(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const { condition, notes } = req.body;
      // Récupérer l'emprunt pour vérifier les permissions
      const existingLoan = await LoanService.getLoanById(id);
      if (!existingLoan) {
        throw new AppError('Emprunt non trouvé', 404);
      }
      if (role !== 'admin' && existingLoan.user_id !== userId) {
        throw new AppError(`Vous ne pouvez retourner que vos propres emprunts. Cet emprunt (ID: ${id}) appartient à l'utilisateur ID: ${existingLoan.user_id}, mais vous êtes l'utilisateur ID: ${userId}`, 403);
      }
      // Retourner le livre (opération critique)
      const loan = await LoanService.returnBook(id, {
        condition,
        notes,
        returned_by: userId
      });
      // Créer une notification (opération secondaire - ne doit pas faire planter le processus)
      try {
        await NotificationService.createLoanNotification({
          user_id: loan.user_id,
          book_title: loan.title || existingLoan.title, // Utiliser le titre du livre
          loan_id: loan.id,
          type: 'loan_returned'
        });
        // Email confirmation retour à l'étudiant
        const user = loan.user || req.user;
        const book = loan.book || { title: loan.title, author: loan.book_author };
        await EmailService.sendReturnNotification(user, book, loan);
        // Email info retour à l'admin
        const admin = await LoanService.getAdminForNotification();
        await EmailService.sendReturnAdminNotification(admin, user, book, loan);
      } catch (notificationError) {
        console.warn('Erreur lors de la notification de retour:', notificationError.message);
      }
      res.json(formatResponse(true, 'Livre retourné avec succès', loan));
    } catch (error) {
      next(error);
    }
  }

  // Renouveler un emprunt
  static async renewLoan(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      const { duration_days, extension_days } = req.body;
      const extensionDays = duration_days || extension_days || 14;
      const existingLoan = await LoanService.getLoanById(id);
      if (!existingLoan) {
        throw new AppError('Emprunt non trouvé', 404);
      }
      if (role !== 'admin') {
        throw new AppError('Seuls les administrateurs peuvent prolonger des emprunts', 403);
      }
      const loan = await LoanService.renewLoan(id, userId, extensionDays, true); // true = isAdmin
      try {
        await NotificationService.createLoanNotification({
          user_id: loan.user_id,
          book_title: loan.title || loan.book_title || existingLoan.title,
          loan_date: loan.loan_date,
          due_date: loan.due_date,
          loan_id: loan.id,
          type: 'loan_renewed'
        });
        // Email confirmation renouvellement à l'étudiant
        const user = loan.user || req.user;
        const book = loan.book || { title: loan.title, author: loan.book_author };
        await EmailService.sendRenewalNotification(user, book, loan);
      } catch (notificationError) {
        console.warn('Erreur lors de la notification de renouvellement:', notificationError.message);
      }
      res.json(formatResponse(true, 'Emprunt renouvelé avec succès', loan));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les emprunts en retard
  static async getOverdueLoans(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        days_overdue = '',
        user_id = ''
      } = req.query;

      const filters = {
        days_overdue: days_overdue ? parseInt(days_overdue) : null,
        user_id: user_id.trim()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await LoanService.getOverdueLoans(filters, pagination);

      res.json(formatResponse(true, 'Emprunts en retard récupérés avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Marquer un emprunt comme en retard (Admin seulement)
  static async markAsOverdue(req, res, next) {
    try {
      const { id } = req.params;
      const { penalty_amount, notes } = req.body;
      const loan = await LoanService.markAsOverdue(id, {
        penalty_amount,
        notes
      });
      await NotificationService.createLoanNotification({
        user_id: loan.user_id,
        book_title: loan.book_title,
        due_date: loan.due_date,
        loan_id: loan.id,
        type: 'loan_overdue'
      });
      // Email de retard à l'étudiant
      const user = loan.user;
      const book = loan.book || { title: loan.book_title, author: loan.book_author };
      const daysOverdue = loan.late_days || 1;
      await EmailService.sendOverdueNotification(user, book, loan, daysOverdue);
      // Email de retard à l'admin
      const admin = await LoanService.getAdminForNotification();
      await EmailService.sendOverdueAdminNotification(admin, user, book, loan, daysOverdue);
      res.json(formatResponse(true, 'Emprunt marqué comme en retard', loan));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les statistiques des emprunts
  static async getLoanStats(req, res, next) {
    try {
      const {
        period = 'month',
        start_date,
        end_date,
        user_id = ''
      } = req.query;

      const filters = {
        period,
        start_date,
        end_date,
        user_id: user_id.trim()
      };

      const stats = await LoanService.getLoanStats(filters);

      res.json(formatResponse(true, 'Statistiques des emprunts récupérées', stats));
    } catch (error) {
      next(error);
    }
  }

  // Rechercher des emprunts
  static async searchLoans(req, res, next) {
    try {
      const {
        q: query = '',
        page = 1,
        limit = 20,
        status = '',
        date_range = ''
      } = req.query;

      if (!query.trim()) {
        throw new AppError('Terme de recherche requis', 400);
      }

      const filters = {
        search: query.trim(),
        status: status.trim(),
        date_range: date_range.trim()
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await LoanService.searchLoans(filters, pagination);

      res.json(formatResponse(true, 'Recherche d\'emprunts effectuée', result));
    } catch (error) {
      next(error);
    }
  }

  // Envoyer des rappels pour les emprunts
  static async sendReminders(req, res, next) {
    try {
      const { days_before_due = 3, include_overdue = true } = req.body;

      const result = await LoanService.sendReminders({
        days_before_due: parseInt(days_before_due),
        include_overdue
      });

      res.json(formatResponse(true, 'Rappels envoyés avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir l'historique des emprunts d'un livre
  static async getBookLoanHistory(req, res, next) {
    try {
      const { bookId } = req.params;
      const {
        page = 1,
        limit = 20,
        include_active = 'true'
      } = req.query;

      const options = {
        include_active: include_active === 'true'
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await LoanService.getBookLoanHistory(bookId, options, pagination);

      res.json(formatResponse(true, 'Historique des emprunts du livre récupéré', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les emprunts populaires
  static async getPopularLoans(req, res, next) {
    try {
      const {
        period = 'month',
        limit = 10
      } = req.query;

      const result = await LoanService.getPopularLoans(period, parseInt(limit));

      res.json(formatResponse(true, 'Emprunts populaires récupérés', result));
    } catch (error) {
      next(error);
    }
  }

  // Exporter les emprunts (Admin seulement)
  static async exportLoans(req, res, next) {
    try {
      const {
        format = 'csv',
        status = '',
        start_date,
        end_date
      } = req.query;

      const filters = {
        status: status.trim(),
        start_date,
        end_date
      };

      const result = await LoanService.exportLoans(format, filters);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="loans.${format}"`);
      res.send(result.data);
    } catch (error) {
      next(error);
    }
  }

  // Calculer les pénalités pour un emprunt
  static async calculatePenalty(req, res, next) {
    try {
      const { id } = req.params;

      const penalty = await LoanService.calculatePenalty(id);

      res.json(formatResponse(true, 'Pénalité calculée', penalty));
    } catch (error) {
      next(error);
    }
  }

  // Appliquer une pénalité (Admin seulement)
  static async applyPenalty(req, res, next) {
    try {
      const { id } = req.params;
      const { amount, reason, waive = false } = req.body;

      const result = await LoanService.applyPenalty(id, {
        amount: parseFloat(amount),
        reason,
        waive
      });

      res.json(formatResponse(true, 'Pénalité appliquée avec succès', result));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir le résumé des emprunts pour un utilisateur
  static async getUserLoanSummary(req, res, next) {
    try {
      const { id: userId } = req.user;

      const summary = await LoanService.getUserLoanSummary(userId);

      res.json(formatResponse(true, 'Résumé des emprunts récupéré', summary));
    } catch (error) {
      next(error);
    }
  }

  // Vérifier si un utilisateur peut emprunter un livre
  static async checkLoanEligibility(req, res, next) {
    try {
      const { bookId } = req.params;
      const { id: userId } = req.user;

      const eligibility = await LoanService.checkLoanEligibility(userId, bookId);

      res.json(formatResponse(true, 'Éligibilité d\'emprunt vérifiée', eligibility));
    } catch (error) {
      next(error);
    }
  }

  // Réserver un créneau d'emprunt
  static async reserveLoanSlot(req, res, next) {
    try {
      const { book_id, preferred_date } = req.body;
      const { id: userId } = req.user;

      const reservation = await LoanService.reserveLoanSlot({
        user_id: userId,
        book_id,
        preferred_date
      });

      res.status(201).json(formatResponse(true, 'Créneau d\'emprunt réservé', reservation));
    } catch (error) {
      next(error);
    }
  }

  // Obtenir les réservations d'emprunts
  static async getLoanReservations(req, res, next) {
    try {
      const { id: userId, role } = req.user;
      const {
        page = 1,
        limit = 20,
        status = 'active',
        user_id = ''
      } = req.query;

      // Si ce n'est pas un admin, limiter aux réservations de l'utilisateur
      const targetUserId = role === 'admin' && user_id ? user_id : userId;

      const filters = {
        status: status.trim(),
        user_id: targetUserId
      };

      const pagination = paginate(parseInt(page), parseInt(limit));
      const result = await LoanService.getLoanReservations(filters, pagination);

      res.json(formatResponse(true, 'Réservations d\'emprunts récupérées', result));
    } catch (error) {
      next(error);
    }
  }
}
module.exports = LoanController;