const express = require('express');
const LoanController = require('../controllers/loan.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  createLoanSchema,
  returnBookSchema,
  renewLoanSchema,
  searchLoansSchema,
  reserveLoanSlotSchema
} = require('../validators/loan.validators');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes utilisateur authentifié
router.post('/', validate(createLoanSchema), LoanController.createLoan);
router.get('/me', LoanController.getUserLoans);
router.get('/me/summary', LoanController.getUserLoanSummary);
router.get('/me/reservations', LoanController.getLoanReservations);
router.post('/reserve', validate(reserveLoanSlotSchema), LoanController.reserveLoanSlot);
router.get('/book/:bookId/eligibility', LoanController.checkLoanEligibility);
router.get('/book/:bookId/history', LoanController.getBookLoanHistory);
router.get('/search', validate(searchLoansSchema, 'query'), LoanController.searchLoans);
router.get('/popular', LoanController.getPopularLoans);

router.get('/:id', LoanController.getLoanById);
router.patch('/:id/return', validate(returnBookSchema), LoanController.returnBook);
router.get('/:id/penalty', LoanController.calculatePenalty);

// Routes administrateur seulement
router.get('/', requireAdmin, LoanController.getAllLoans);
router.patch('/:id/renew', requireAdmin, validate(renewLoanSchema), LoanController.renewLoan);
router.put('/:id/extend', requireAdmin, validate(renewLoanSchema), LoanController.renewLoan); // Alias pour compatibilité - Admin seulement
router.get('/overdue/list', requireAdmin, LoanController.getOverdueLoans);
router.get('/stats/summary', requireAdmin, LoanController.getLoanStats);
router.get('/reservations/all', requireAdmin, LoanController.getLoanReservations);
router.get('/export/data', requireAdmin, LoanController.exportLoans);


// Actions sur les emprunts (admin/étudiant)
router.patch('/:id/validate', requireAdmin, LoanController.validateLoan);
router.patch('/:id/overdue', requireAdmin, LoanController.markAsOverdue);
router.patch('/:id/penalty', requireAdmin, LoanController.applyPenalty);
router.patch('/:id/cancel', LoanController.cancelLoan); // étudiant
router.patch('/:id/refuse', requireAdmin, LoanController.refuseLoan); // admin
router.patch('/:id/remind', requireAdmin, LoanController.sendManualReminder); // admin
router.post('/reminders/send', requireAdmin, LoanController.sendReminders);

module.exports = router;