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
      const res = await axios.get(
        "http://localhost:5000/api/notifications",
        {
          params: { limit: 10 },
          headers: { Authorization: `Bearer ${auth.token}` },
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
          {
            headers: { Authorization: `Bearer ${auth?.token}` },
          }
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
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
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

  if (!auth?.user) return null; // no notifications if not logged in

  return (
    <div className="position-relative d-inline-block me-2">
      {/* Button next to logout / dashboards */}
      <button
        type="button"
        className="btn btn-info position-relative"
        onClick={toggleOpen}
      >
        Notifications
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.7rem" }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="card shadow position-absolute end-0 mt-2"
          style={{
            minWidth: "280px",
            maxWidth: "360px",
            maxHeight: "60vh",
            zIndex: 1000,
          }}
        >
          <div className="card-header d-flex justify-content-between align-items-center">
            <strong>Notifications</strong>
            <button
              type="button"
              className="btn btn-sm btn-link p-0"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          </div>

          <div
            className="card-body p-0"
            style={{ maxHeight: "50vh", overflowY: "auto" }}
          >
            {loading && (
              <div className="p-3 text-center">
                <small>Loading...</small>
              </div>
            )}

            {!loading && error && (
              <div className="p-3 text-danger">
                <small>{error}</small>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="p-3 text-center">
                <small>No notifications yet.</small>
              </div>
            )}

            {!loading &&
              !error &&
              notifications.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  className="w-100 text-start border-0 bg-transparent"
                  onClick={() => handleClickNotification(n)}
                >
                  <div
                    className={`p-2 border-bottom ${
                      !n.isRead ? "bg-light" : ""
                    }`}
                  >
                    <div className="d-flex justify-content-between">
                      <strong
                        style={{
                          fontWeight: n.isRead ? "normal" : "bold",
                        }}
                      >
                        {n.title}
                      </strong>
                      {!n.isRead && (
                        <span
                          className="badge rounded-pill bg-primary"
                          style={{ fontSize: "0.6rem" }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8rem" }}>{n.message}</div>
                    {n.createdAt && (
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.7rem" }}
                      >
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </button>
              ))}
          </div>

          <div className="card-footer text-center">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
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
