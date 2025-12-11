import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function InstructorConsultationSchedule() {
  const { auth } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [timeRanges, setTimeRanges] = useState([]);
  const [dayNote, setDayNote] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load availability for selected date
  const loadAvailability = async (date) => {
    try {
      setError("");
      setMessage("");
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/mentorship/availability/my",
        {
          params: { from: date, to: date },
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );

      const list = res.data || [];
      if (list.length > 0) {
        const av = list[0];
        setTimeRanges(av.timeRanges || []);
        setDayNote(av.dayNote || "");
        setIsBlocked(av.isBlocked || false);
      } else {
        setTimeRanges([]);
        setDayNote("");
        setIsBlocked(false);
      }
    } catch {
      setError("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      loadAvailability(selectedDate);
    }
  }, [auth?.token, selectedDate]);

  const handleAddRange = () => {
    setTimeRanges([
      ...timeRanges,
      { startTime: "10:00", endTime: "10:30", note: "" },
    ]);
  };

  const handleRangeChange = (index, field, value) => {
    const updated = [...timeRanges];
    updated[index] = { ...updated[index], [field]: value };
    setTimeRanges(updated);
  };

  const handleRemoveRange = (index) => {
    const updated = [...timeRanges];
    updated.splice(index, 1);
    setTimeRanges(updated);
  };

  const handleSave = async () => {
    try {
      setError("");
      setMessage("");
      setSaving(true);

      // Always POST to backend; it will upsert by date
      await axios.post(
        "http://localhost:5000/api/mentorship/availability",
        {
          date: selectedDate,
          timeRanges,
          dayNote,
          isBlocked,
        },
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );

      setMessage("Availability saved.");
      loadAvailability(selectedDate);
    } catch {
      setError("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDay = async () => {
    try {
      setError("");
      setMessage("");
      // Get current availability first
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/availability/my",
        {
          params: { from: selectedDate, to: selectedDate },
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );

      const list = res.data || [];
      if (!list.length) {
        setError("No availability to delete for this day.");
        return;
      }

      const availabilityId = list[0]._id;
      if (!window.confirm("Delete all availability for this day?")) return;

      await axios.delete(
        `http://localhost:5000/api/mentorship/availability/${availabilityId}`,
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );

      setMessage("Availability deleted.");
      setTimeRanges([]);
      setDayNote("");
      setIsBlocked(false);
    } catch {
      setError("Failed to delete availability");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6">
      <h3 className="text-2xl font-semibold text-gray-800">
        Consultation Schedule
      </h3>
      <p className="text-gray-600 mb-4">
        Configure your one-on-one consultation times.
      </p>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Select Date</label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-600 mb-2">Loading availability...</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}
      {message && <p className="text-green-600 mb-2">{message}</p>}

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="isBlockedSwitch"
          checked={isBlocked}
          onChange={(e) => setIsBlocked(e.target.checked)}
          className="mr-2 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isBlockedSwitch" className="text-gray-700">
          Block this day (no consultations allowed)
        </label>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-1">Day Note (optional)</label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          value={dayNote}
          onChange={(e) => setDayNote(e.target.value)}
          placeholder="e.g., Only short slots today, or I'm partially unavailable."
        />
      </div>

      {!isBlocked && (
        <>
          <h5 className="text-lg font-semibold mb-2">Available Time Ranges</h5>
          {timeRanges.length === 0 && (
            <p className="text-gray-500 mb-2">No ranges defined yet.</p>
          )}

          {timeRanges.map((range, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center mb-2 border rounded p-2"
            >
              <div className="md:col-span-3">
                <label className="block text-gray-700 text-sm mb-1">
                  Start
                </label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={range.startTime}
                  onChange={(e) =>
                    handleRangeChange(index, "startTime", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-gray-700 text-sm mb-1">End</label>
                <input
                  type="time"
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={range.endTime}
                  onChange={(e) =>
                    handleRangeChange(index, "endTime", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-gray-700 text-sm mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={range.note || ""}
                  onChange={(e) =>
                    handleRangeChange(index, "note", e.target.value)
                  }
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button
                  type="button"
                  className="mt-2 px-2 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition"
                  onClick={() => handleRemoveRange(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="px-3 py-1 border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition mt-2"
            onClick={handleAddRange}
          >
            Add Time Range
          </button>
        </>
      )}

      <hr className="my-4" />

      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Availability"}
        </button>

        <button
          className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition"
          onClick={handleDeleteDay}
        >
          Delete This Day
        </button>
      </div>
    </div>
  );
}
