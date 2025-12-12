// frontend/src/components/NotificationsDropdown.js
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NotificationsDropdown() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔔 Fetch unread count for the badge
  useEffect(() => {
    const fetchUnread = async () => {
      if (!auth?.token) {
        setUnreadCount(0);
        setNotifications([]);
        return;
      }

      try {
        const res = await axios.get(
          "http://localhost:5000/api/notifications/unread-count",
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
        setUnreadCount(res.data.count || 0);
      } catch (err) {
        console.error("Failed to fetch unread count", err);
      }
    };

    fetchUnread();
  }, [auth?.token]);

  const loadNotifications = async () => {
    if (!auth?.token) return;
    setError("");
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/notifications", {
        params: { limit: 10 },
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      await loadNotifications();
    }
  };

  const handleClickNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await axios.patch(
          `http://localhost:5000/api/notifications/${notification._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${auth?.token}` } }
        );
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }

    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    try {
      await axios.patch(
        "http://localhost:5000/api/notifications/mark-all-read",
        {},
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const handleViewAll = () => {
    navigate("/notifications");
    setOpen(false);
  };

  if (!auth?.user) return null;

  return (
    <div className="relative inline-block mr-2">
      <button
        type="button"
        className="relative flex items-center gap-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm font-medium"
        onClick={toggleOpen}
      >
        <span>🔔</span>
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[0.7rem] rounded-full px-1.5 py-[1px] leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[60vh] bg-white shadow-lg rounded-xl overflow-hidden z-50 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 border-b bg-gray-50">
            <strong className="text-sm text-gray-800">Notifications</strong>
            <button
              type="button"
              className={`text-xs font-medium ${
                unreadCount === 0
                  ? "text-gray-400 cursor-default"
                  : "text-blue-600 hover:underline"
              }`}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[50vh]">
            {loading && (
              <div className="p-3 text-center text-gray-500 text-sm flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            )}

            {!loading && error && (
              <div className="p-3 text-red-500 text-sm">{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="p-3 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            )}

            {!loading &&
              !error &&
              notifications.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  className={`w-full text-left px-4 py-2 border-b text-sm transition ${
                    !n.isRead ? "bg-blue-50" : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => handleClickNotification(n)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <strong
                      className={`${
                        n.isRead ? "font-medium text-gray-800" : "text-gray-900"
                      }`}
                    >
                      {n.title}
                    </strong>
                    {!n.isRead && (
                      <span className="bg-blue-600 text-white text-[0.6rem] rounded-full px-1 mt-0.5">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-gray-700 text-xs mt-1">{n.message}</div>
                  {n.createdAt && (
                    <div className="text-gray-400 text-[0.65rem] mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  )}
                </button>
              ))}
          </div>

          {/* Footer */}
          <div className="text-center border-t p-2 bg-gray-50">
            <button
              type="button"
              className="text-xs text-blue-600 hover:underline font-medium"
              onClick={handleViewAll}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
