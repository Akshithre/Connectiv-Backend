const Notification = require('../models/notifications.model');

exports.notificationController = {
    createNotification: async (req, res) => {
        try {
            const { userId, title, message } = req.body;

            if (!userId) {
                return res.status(400).json({
                    status: false,
                    message: "User ID is required"
                });
            }

            const notification = await Notification.create({
                userId,
                title: title || '',
                message: message || ''
            });

            res.status(201).json({
                status: true,
                message: "Notification created successfully",
                data: notification
            });
        } catch (error) {
            console.error("Create Notification Error:", error);
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    updateNotification: async (req, res) => {
        try {
            const { notificationId, ...updateData } = req.body;

            if (!notificationId) {
                return res.status(400).json({
                    status: false,
                    message: "Notification ID is required"
                });
            }

            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!notification) {
                return res.status(404).json({
                    status: false,
                    message: "Notification not found"
                });
            }

            res.status(200).json({
                status: true,
                message: "Notification updated successfully",
                data: notification
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { notificationId } = req.body;
    
            if (!notificationId) {
                return res.status(400).json({
                    status: false,
                    message: "Notification ID is required"
                });
            }
    
            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { read: true },
                { new: true }
            );
    
            if (!notification) {
                return res.status(404).json({
                    status: false,
                    message: "Notification not found"
                });
            }
    
            res.status(200).json({
                status: true,
                message: "Notification marked as read",
                data: notification
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    getNotificationById: async (req, res) => {
        try {
            const { notificationId } = req.params;

            if (!notificationId) {
                return res.status(400).json({
                    status: false,
                    message: "Notification ID is required"
                });
            }

            const notification = await Notification.findById(notificationId);
            
            if (!notification) {
                return res.status(404).json({
                    status: false,
                    message: "Notification not found"
                });
            }

            res.status(200).json({
                status: true,
                data: notification
            });
        } catch (error) {
            console.error("Get Notification Error:", error);
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    getNotificationsByUserId: async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    status: false,
                    message: "User ID is required"
                });
            }

            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 }); // Sort by newest first

            res.status(200).json({
                status: true,
                data: notifications
            });
        } catch (error) {
            console.error("Get Notifications Error:", error);
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    deleteNotification: async (req, res) => {
        try {
            const { notificationId } = req.body;

            if (!notificationId) {
                return res.status(400).json({
                    status: false,
                    message: "Notification ID is required"
                });
            }

            const notification = await Notification.findByIdAndDelete(notificationId);
            
            if (!notification) {
                return res.status(404).json({
                    status: false,
                    message: "Notification not found"
                });
            }

            res.status(200).json({
                status: true,
                message: "Notification deleted successfully"
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    },

    getAllNotifications: async (req, res) => {
        try {
            const notifications = await Notification.find()
                .sort({ createdAt: -1 }); // Sort by newest first

            res.status(200).json({
                status: true,
                data: notifications
            });
        } catch (error) {
            console.error("Error in getAllNotifications:", error);
            res.status(500).json({
                status: false,
                message: error.message
            });
        }
    }
};