// backend/routes/notificationRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// Get notifications for logged-in user
router.get("/", protect, getNotifications);

// Get unread count for badge
router.get("/unread-count", protect, getUnreadCount);

// Mark a single notification as read
router.patch("/:id/read", protect, markNotificationAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", protect, markAllNotificationsAsRead);

export default router;
