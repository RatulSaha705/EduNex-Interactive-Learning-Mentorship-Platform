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
    } catch {
      setError("Failed to load today's consultations");
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
    <div className="max-w-4xl mx-auto px-4 mt-6">
      <h3 className="text-2xl font-semibold text-gray-800">
        Today's Consultations
      </h3>
      <p className="text-gray-600 mb-4">
        Here are your one-on-one sessions scheduled for today.
      </p>

      {loading && <p className="text-gray-600 mb-2">Loading...</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      {!loading && sessions.length === 0 && (
        <p className="text-gray-500">No consultations scheduled for today.</p>
      )}

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session._id}
            className="border rounded p-4 flex justify-between items-start bg-white shadow-sm"
          >
            <div>
              <h5 className="text-lg font-semibold mb-1">
                {session.course?.title || "Course"}
              </h5>
              <p className="text-gray-700 mb-1">
                <strong>Student:</strong> {session.student?.name || "Unknown"}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Date:</strong> {formatDate(session.startTime)}{" "}
                <strong>Time:</strong> {formatTime(session.startTime)} (
                {session.durationMinutes} min)
              </p>
              <small className="text-gray-500">Status: {session.status}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
