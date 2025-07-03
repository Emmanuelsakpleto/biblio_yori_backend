const express = require('express');
const NotificationController = require('../controllers/notification.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const {
  createCustomNotificationSchema,
  createBulkNotificationSchema,
  updateNotificationSettingsSchema
} = require('../validators/notification.validators');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Routes utilisateur authentifié
router.get('/me', NotificationController.getMyNotifications);
router.get('/me/unread-count', NotificationController.getUnreadCount);
router.get('/me/realtime', NotificationController.getRealtimeNotifications);
router.get('/me/settings', NotificationController.getNotificationSettings);
router.put('/me/settings', validate(updateNotificationSettingsSchema), NotificationController.updateNotificationSettings);
router.patch('/me/mark-all-read', NotificationController.markAllAsRead);
router.get('/stream', NotificationController.streamNotifications); // SSE

router.post('/custom', validate(createCustomNotificationSchema), NotificationController.createCustomNotification);

router.get('/:id', NotificationController.getNotificationById);
router.patch('/:id/read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.deleteNotification);

// Routes administrateur seulement
router.use(requireAdmin);

router.get('/', NotificationController.getAllNotifications);
router.get('/type/:type', NotificationController.getNotificationsByType);
router.get('/stats/summary', NotificationController.getNotificationStats);
router.get('/export/data', NotificationController.exportNotifications);

router.post('/bulk', validate(createBulkNotificationSchema), NotificationController.createBulkNotification);
router.post('/system-wide', NotificationController.createSystemWideNotification);
router.post('/loan-reminders', NotificationController.sendLoanReminders);
router.post('/test-email', NotificationController.testEmailNotification);
router.delete('/cleanup', NotificationController.cleanupOldNotifications);

module.exports = router;