// frontend/src/pages/StudentMyConsultations.jsx
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString();
}

export default function StudentMyConsultations() {
  const { auth } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchSessions = async () => {
    try {
      setError("");
      setMessage("");
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/sessions/my",
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );
      setSessions(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load your consultations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      fetchSessions();
    }
  }, [auth?.token]);

  const canCancel = (session) => {
    if (session.status !== "booked") return false;
    const now = new Date();
    const start = new Date(session.startTime);
    const diffMs = start.getTime() - now.getTime();
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    return diffMs >= twelveHoursMs;
  };

  const handleCancel = async (sessionId) => {
    if (!window.confirm("Are you sure you want to cancel this session?")) {
      return;
    }
    try {
      setError("");
      setMessage("");
      await axios.delete(
        `http://localhost:5000/api/mentorship/sessions/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );
      setMessage("Session cancelled.");
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel session");
    }
  };

  return (
    <div className="container mt-4">
      <h3>My Consultations</h3>
      <p>These are your upcoming mentorship sessions.</p>

      {loading && <p>Loading...</p>}
      {error && <p className="text-danger">{error}</p>}
      {message && <p className="text-success">{message}</p>}

      {!loading && sessions.length === 0 && (
        <p>You have no upcoming consultations.</p>
      )}

      <div className="list-group">
        {sessions.map((session) => (
          <div
            key={session._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 className="mb-1">
                {session.course?.title || "Course"}
              </h5>
              <p className="mb-1">
                <strong>Instructor:</strong>{" "}
                {session.instructor?.name || "Unknown"}
              </p>
              <p className="mb-1">
                <strong>When:</strong>{" "}
                {formatDateTime(session.startTime)} (
                {session.durationMinutes} min)
              </p>
              <small className="text-muted">
                Status: {session.status}
              </small>
            </div>
            <div>
              {canCancel(session) && (
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleCancel(session._id)}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
