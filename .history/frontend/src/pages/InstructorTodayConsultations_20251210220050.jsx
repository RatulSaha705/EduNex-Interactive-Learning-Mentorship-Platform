// frontend/src/pages/InstructorTodayConsultations.jsx
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString();
}

export default function InstructorTodayConsultations() {
  const { auth } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSessions = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/sessions/today",
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );
      setSessions(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load today's consultations"
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

  return (
    <div className="container mt-4">
      <h3>Today's Consultations</h3>
      <p>Here are your one-on-one sessions scheduled for today.</p>

      {loading && <p>Loading...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && sessions.length === 0 && (
        <p>No consultations scheduled for today.</p>
      )}

      <div className="list-group">
        {sessions.map((session) => (
          <div
            key={session._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <h5 className="mb-1">{session.course?.title || "Course"}</h5>
              <p className="mb-1">
                <strong>Student:</strong> {session.student?.name || "Unknown"}
              </p>
              <p className="mb-1">
                <strong>Date:</strong> {formatDate(session.startTime)}{" "}
                <strong>Time:</strong> {formatTime(session.startTime)} (
                {session.durationMinutes} min)
              </p>
              <small className="text-muted">Status: {session.status}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
