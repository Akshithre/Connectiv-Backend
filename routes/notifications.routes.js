const express = require('express');
const router = express.Router();
const { notificationController } = require('../controllers/notifications.controller');

// Basic CRUD operations
router.post('/create', notificationController.createNotification);
router.post('/update', notificationController.updateNotification);
router.get('/get-notification/:notificationId', notificationController.getNotificationById);
router.get('/get-user-notifications/:userId', notificationController.getNotificationsByUserId);
router.delete('/delete', notificationController.deleteNotification);
router.get('/get-all', notificationController.getAllNotifications);


router.post('/mark-as-read', notificationController.markAsRead);

module.exports = router;