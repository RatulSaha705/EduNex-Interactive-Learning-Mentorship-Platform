// frontend/src/pages/StudentMyConsultations.jsx
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function formatDateTime(isoString) {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentMyConsultations() {
  const { auth } = useContext(AuthContext);

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load user's sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!auth?.token) {
        setLoading(false);
        return;
      }

      try {
        setError("");
        setMessage("");
        setLoading(true);

        const res = await axios.get(
          "http://localhost:5000/api/mentorship/sessions/my",
          { headers: { Authorization: `Bearer ${auth.token}` } }
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

    fetchSessions();
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
      // update state locally instead of a full refetch
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel session");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "booked":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // 🔐 Auth guard
  if (!auth?.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-10 text-center">
        <p className="text-red-600 font-semibold">
          Please log in to view your consultations.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mt-8 space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h3 className="text-2xl font-semibold text-gray-800">
            My Consultations
          </h3>
          <p className="text-gray-600 text-sm">
            These are your upcoming and recent mentorship sessions.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            You can cancel a booked session up to{" "}
            <span className="font-semibold">12 hours</span> before the start
            time.
          </p>
        </div>
      </div>

      {/* Messages */}
      {loading && (
        <p className="text-gray-600 text-sm flex items-center gap-2">
          <span className="inline-block h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading your consultations...
        </p>
      )}

      {error && (
        <p className="text-red-600 font-medium text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {message && (
        <p className="text-green-600 font-medium text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      {!loading && sessions.length === 0 && !error && (
        <p className="text-gray-500 text-sm">
          You have no consultations scheduled yet. Book one from a course page
          that supports mentorship.
        </p>
      )}

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session._id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="mb-2 sm:mb-0 space-y-1">
              <h5 className="text-lg font-semibold text-gray-800">
                {session.course?.title || "Course"}
              </h5>
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">Instructor:</span>{" "}
                {session.instructor?.name || "Unknown"}
              </p>
              <p className="text-gray-700 text-sm">
                <span className="font-semibold">When:</span>{" "}
                {formatDateTime(session.startTime)} ({session.durationMinutes}{" "}
                min)
              </p>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(
                    session.status
                  )}`}
                >
                  {session.status}
                </span>
              </div>
            </div>

            <div className="mt-2 sm:mt-0">
              {canCancel(session) && (
                <button
                  className="px-3 py-1.5 border border-red-500 text-red-500 rounded-lg text-sm hover:bg-red-500 hover:text-white transition"
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
