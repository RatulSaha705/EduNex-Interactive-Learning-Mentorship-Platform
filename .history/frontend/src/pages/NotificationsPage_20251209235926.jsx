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
        const res = await axios.get(
          "http://localhost:5000/api/notifications",
          {
            params: { limit: 50 },
            headers: { Authorization: `Bearer ${auth?.token}` },
          }
        );
        setNotifications(res.data.notifications || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load notifications"
        );
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
      <div className="container mt-4">
        <p>Please log in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>All Notifications</h3>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={handleMarkAllRead}
        >
          Mark all as read
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && notifications.length === 0 && (
        <p>You have no notifications yet.</p>
      )}

      <div className="list-group">
        {notifications.map((n) => (
          <button
            key={n._id}
            type="button"
            className={`list-group-item list-group-item-action ${
              !n.isRead ? "list-group-item-info" : ""
            }`}
            onClick={() => handleClickNotification(n)}
          >
            <div className="d-flex justify-content-between">
              <h6 className="mb-1">{n.title}</h6>
              {n.createdAt && (
                <small className="text-muted">
                  {new Date(n.createdAt).toLocaleString()}
                </small>
              )}
            </div>
            <p className="mb-1">{n.message}</p>
            {!n.isRead && (
              <small className="text-primary">Unread</small>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
