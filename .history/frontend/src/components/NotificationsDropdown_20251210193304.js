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

  // Fetch unread count for the badge
  useEffect(() => {
    if (!auth?.token) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    const fetchUnread = async () => {
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
    if (nextOpen) await loadNotifications();
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
        className="relative bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        onClick={toggleOpen}
      >
        Notifications
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-red-600 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[60vh] bg-white shadow-lg rounded overflow-hidden z-50 flex flex-col">
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <strong>Notifications</strong>
            <button
              type="button"
              className="text-blue-500 text-sm hover:underline"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          </div>

          <div className="overflow-y-auto max-h-[50vh]">
            {loading && (
              <div className="p-3 text-center text-gray-500 text-sm">
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
                  className={`w-full text-left px-4 py-2 border-b ${
                    !n.isRead ? "bg-gray-100" : "bg-white"
                  }`}
                  onClick={() => handleClickNotification(n)}
                >
                  <div className="flex justify-between items-start">
                    <strong
                      className={`${n.isRead ? "font-normal" : "font-bold"}`}
                    >
                      {n.title}
                    </strong>
                    {!n.isRead && (
                      <span className="bg-blue-500 text-white text-[0.6rem] rounded-full px-1 ml-2">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-gray-700 text-sm">{n.message}</div>
                  {n.createdAt && (
                    <div className="text-gray-400 text-xs mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  )}
                </button>
              ))}
          </div>

          <div className="text-center border-t p-2">
            <button
              type="button"
              className="text-sm text-blue-500 hover:underline"
              onClick={handleViewAll}
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
