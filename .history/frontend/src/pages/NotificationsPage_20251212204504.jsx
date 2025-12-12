// frontend/src/pages/NotificationsPage.jsx
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      if (!auth?.token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/notifications", {
          params: { limit: 50 },
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setNotifications(res.data.notifications || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [auth?.token]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    try {
      await axios.patch(
        "http://localhost:5000/api/notifications/mark-all-read",
        {},
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  // 🔐 Auth guard
  if (!auth?.user) {
    return (
      <div className="max-w-3xl mx-auto mt-10 px-4 text-center">
        <p className="text-red-600 font-semibold">
          Please log in to view notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Notifications</h3>
          <p className="text-sm text-gray-600">
            Stay updated with course activity, certificates, and mentorship
            updates.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-gray-500">
            Unread:{" "}
            <span className="font-semibold text-indigo-700">{unreadCount}</span>
          </span>
          <button
            type="button"
            className={`px-3 py-1 rounded text-xs font-medium border ${
              unreadCount === 0
                ? "border-gray-200 text-gray-400 cursor-default bg-gray-50"
                : "border-gray-400 text-gray-700 hover:bg-gray-100"
            }`}
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Loading / error / empty states */}
      {loading && (
        <p className="text-gray-600 text-sm flex items-center gap-2">
          <span className="inline-block h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading notifications...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && !error && notifications.length === 0 && (
        <p className="text-sm text-gray-500">You have no notifications yet.</p>
      )}

      {/* Notification list */}
      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <button
            key={n._id}
            type="button"
            className={`text-left p-4 rounded-xl border transition flex flex-col gap-1 ${
              !n.isRead
                ? "bg-blue-50 border-blue-200"
                : "bg-white border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => handleClickNotification(n)}
          >
            <div className="flex justify-between items-center gap-2">
              <h6 className="font-semibold text-gray-900">{n.title}</h6>
              {n.createdAt && (
                <small className="text-gray-500 text-xs">
                  {new Date(n.createdAt).toLocaleString()}
                </small>
              )}
            </div>
            <p className="text-sm text-gray-700">{n.message}</p>
            {!n.isRead && (
              <small className="text-xs text-blue-700 font-semibold">
                ● Unread
              </small>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
