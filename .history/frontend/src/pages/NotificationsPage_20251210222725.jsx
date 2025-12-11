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
      try {
        const res = await axios.get("http://localhost:5000/api/notifications", {
          params: { limit: 50 },
          headers: { Authorization: `Bearer ${auth?.token}` },
        });
        setNotifications(res.data.notifications || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) {
      fetchAll();
    }
  }, [auth?.token]);

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

  if (!auth?.user) {
    return (
      <div className="max-w-3xl mx-auto mt-4 p-4">
        <p>Please log in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-4 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold">All Notifications</h3>
        <button
          type="button"
          className="px-3 py-1 border border-gray-400 rounded text-sm hover:bg-gray-100 transition"
          onClick={handleMarkAllRead}
        >
          Mark all as read
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && notifications.length === 0 && (
        <p>You have no notifications yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((n) => (
          <button
            key={n._id}
            type="button"
            className={`text-left p-4 rounded border border-gray-200 transition hover:bg-gray-50 ${
              !n.isRead ? "bg-blue-50 border-blue-200" : "bg-white"
            }`}
            onClick={() => handleClickNotification(n)}
          >
            <div className="flex justify-between items-center mb-1">
              <h6 className="font-medium">{n.title}</h6>
              {n.createdAt && (
                <small className="text-gray-500 text-xs">
                  {new Date(n.createdAt).toLocaleString()}
                </small>
              )}
            </div>
            <p className="text-gray-700">{n.message}</p>
            {!n.isRead && (
              <small className="text-blue-600 font-medium">Unread</small>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
