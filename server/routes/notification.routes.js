import express from 'express';
import Notification from '../Schema/Notification.js';
import { verifyJWT } from '../middleware/auth.js';

const router = express.Router();

// Get new notifications count
router.get("/new-notifications", verifyJWT, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ 
            recipient: req.user.id,
            read: false 
        });

        return res.status(200).json({ 
            hasNewNotifications: count > 0,
            count
        });
    } catch (error) {
        console.error('Error fetching new notifications:', error);
        return res.status(500).json({ 
            error: "Failed to fetch notifications"
        });
    }
});

// Get all notifications
router.get("/notifications", verifyJWT, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .populate('sender', 'personal_info.fullname personal_info.profile_img')
            .populate('blog', 'title');

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

export default router;