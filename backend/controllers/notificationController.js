// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";


export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { unreadOnly, limit = 20, page = 1 } = req.query;

    const query = { user: userId };
    if (unreadOnly === "true") {
      query.isRead = false;
    }

    const pageSize = Math.min(Number(limit) || 20, 50);
    const currentPage = Math.max(Number(page) || 1, 1);
    const skip = (currentPage - 1) * pageSize;

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      Notification.countDocuments(query),
    ]);

    res.json({
      notifications,
      total,
      page: currentPage,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    res
      .status(500)
      .json({ message: "Server error fetching notifications" });
  }
};


export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    res
      .status(500)
      .json({ message: "Server error fetching unread count" });
  }
};


export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json(notification);
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    res
      .status(500)
      .json({ message: "Server error marking notification as read" });
  }
};


export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
    res
      .status(500)
      .json({ message: "Server error marking notifications as read" });
  }
};
