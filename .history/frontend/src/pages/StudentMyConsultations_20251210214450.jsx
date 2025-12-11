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
        { headers: { Authorization: `Bearer ${auth?.token}` } }
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
    if (auth?.token) fetchSessions();
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
    if (!window.confirm("Are you sure you want to cancel this session?"))
      return;
    try {
      setError("");
      setMessage("");
      await axios.delete(
        `http://localhost:5000/api/mentorship/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setMessage("Session cancelled.");
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel session");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6">
      <h3 className="text-2xl font-semibold mb-2">My Consultations</h3>
      <p className="mb-4 text-gray-600">
        These are your upcoming mentorship sessions.
      </p>

      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-600 font-medium">{error}</p>}
      {message && <p className="text-green-600 font-medium">{message}</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-gray-500">You have no upcoming consultations.</p>
      )}

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session._id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow border"
          >
            <div className="mb-2 sm:mb-0">
              <h5 className="text-lg font-semibold">
                {session.course?.title || "Course"}
              </h5>
              <p className="text-gray-700">
                <strong>Instructor:</strong>{" "}
                {session.instructor?.name || "Unknown"}
              </p>
              <p className="text-gray-700">
                <strong>When:</strong> {formatDateTime(session.startTime)} (
                {session.durationMinutes} min)
              </p>
              <small className="text-gray-500">Status: {session.status}</small>
            </div>
            <div>
              {canCancel(session) && (
                <button
                  className="px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition"
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
