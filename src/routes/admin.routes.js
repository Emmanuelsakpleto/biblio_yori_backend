const express = require('express');
const AdminController = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/express-validator.middleware');
const { 
  createUserSchema, 
  updateUserSchema, 
  userStatusSchema, 
  resetPasswordSchema, 
  searchUsersSchema,
  getUsersSchema
} = require('../validators/user.validators');
const multer = require('multer');
const path = require('path');

// Create upload middleware for backup files
const backupUpload = multer({
  dest: path.join(__dirname, '../../uploads/backups/'),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB for backup files
  }
});

const router = express.Router();

// Toutes les routes admin nécessitent une authentification et le rôle admin
router.use(authenticate);
router.use(requireAdmin);

// Dashboard et statistiques
router.get('/dashboard', AdminController.getDashboard);
router.get('/stats/system', AdminController.getSystemStats);
router.get('/stats/period', AdminController.getStatsByPeriod);
router.get('/activities/recent', AdminController.getRecentActivities);
router.get('/reports/monthly', AdminController.getMonthlyReport);

// Gestion des utilisateurs
router.get('/users', validate(getUsersSchema, 'query'), AdminController.getAllUsers);
router.post('/users', validate(createUserSchema), AdminController.createUser);
router.get('/users/search', validate(searchUsersSchema, 'query'), AdminController.searchUsers);
router.get('/users/export', AdminController.exportUsers);
router.get('/users/:id', AdminController.getUserById);
router.get('/users/:id/stats', AdminController.getUserStats);
router.put('/users/:id', validate(updateUserSchema), AdminController.updateUser);
router.patch('/users/:id/status', validate(userStatusSchema), AdminController.toggleUserStatus);
router.patch('/users/:id/password', validate(resetPasswordSchema), AdminController.resetUserPassword);
router.delete('/users/:id', AdminController.deleteUser);
router.patch('/users/:id/promote', AdminController.promoteToAdmin);
router.patch('/users/:id/demote', AdminController.demoteFromAdmin);

// Gestion des livres en lot
router.patch('/books/bulk-update', AdminController.bulkUpdateBooks);
router.delete('/books/bulk-delete', AdminController.bulkDeleteBooks);

// Gestion des emprunts en lot
router.patch('/loans/bulk-update', AdminController.bulkUpdateLoans);

// Gestion des réservations
router.get('/reservations/pending', AdminController.getPendingReservations);
router.patch('/reservations/:id/process', AdminController.processReservation);

// Notifications en lot
router.post('/notifications/bulk-send', AdminController.sendBulkNotifications);

// Paramètres système
router.get('/settings', AdminController.getSystemSettings);
router.put('/settings', AdminController.updateSystemSettings);

// Export de données
router.get('/export/data', AdminController.exportData);

// Sauvegarde et restauration
router.post('/backup/create', AdminController.backupDatabase);
router.post('/backup/restore', 
  backupUpload.single('backup_file'),
  AdminController.restoreDatabase
);

// Maintenance
router.post('/maintenance/cleanup', AdminController.cleanupOldData);
router.post('/maintenance/perform', AdminController.performMaintenance);

// Logs système
router.get('/logs', AdminController.getSystemLogs);

module.exports = router;