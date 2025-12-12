// frontend/src/pages/InstructorConsultationSchedule.jsx
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function InstructorConsultationSchedule() {
  const { auth } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [availability, setAvailability] = useState(null);
  const [timeRanges, setTimeRanges] = useState([]); // [{startTime, endTime, note}]
  const [dayNote, setDayNote] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isInstructor = auth?.user?.role === "instructor";

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate || !auth?.token) return;

    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const res = await axios.get(
          `http://localhost:5000/api/mentorship/availability/my?from=${selectedDate}&to=${selectedDate}`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );

        const dayData = res.data[0] || null;
        if (dayData) {
          setAvailability(dayData);
          setTimeRanges(dayData.timeRanges || []);
          setDayNote(dayData.dayNote || "");
          setIsBlocked(dayData.isBlocked || false);
        } else {
          setAvailability(null);
          setTimeRanges([]);
          setDayNote("");
          setIsBlocked(false);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch availability for this date.");
        setAvailability(null);
        setTimeRanges([]);
        setDayNote("");
        setIsBlocked(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, auth?.token]);

  // Add a new empty time range
  const addTimeRange = () => {
    setTimeRanges((prev) => [
      ...prev,
      { startTime: "", endTime: "", note: "" },
    ]);
  };

  // Remove a time range
  const removeTimeRange = (index) => {
    setTimeRanges((prev) => prev.filter((_, i) => i !== index));
  };

  // Update a time range
  const updateTimeRange = (index, key, value) => {
    setTimeRanges((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  // Save availability (POST /api/mentorship/availability)
  const handleSave = async () => {
    if (!selectedDate) {
      setError("Please select a date first.");
      return;
    }

    setError("");
    setMessage("");

    try {
      setSaving(true);

      const payload = {
        date: selectedDate,
        timeRanges,
        dayNote,
        isBlocked,
      };

      const res = await axios.post(
        "http://localhost:5000/api/mentorship/availability",
        payload,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      setAvailability(res.data);
      setMessage("Availability saved successfully.");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to save availability. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const hasExistingConfig = !!availability;

  // 🔐 Auth guards (AFTER hooks)
  if (!auth?.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-10 text-center">
        <p className="text-red-600 font-semibold">
          Please log in to manage consultation availability.
        </p>
      </div>
    );
  }

  if (!isInstructor) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-10 text-center">
        <p className="text-red-600 font-semibold">
          Only instructors can manage consultation schedules.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Consultation Availability
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Configure when students can book 1:1 mentorship sessions with you.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Logged in as{" "}
            <span className="font-semibold text-indigo-700">
              {auth.user.name}
            </span>{" "}
            (Instructor)
          </p>
        </div>
      </div>

      {/* Alerts */}
      {(error || message) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              {message}
            </div>
          )}
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-2xl shadow-md p-5 space-y-6">
        {/* Date picker */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-800">
            Select Date
          </label>
          <p className="text-xs text-gray-500">
            Set your availability for a specific day. Students will only see
            slots within your defined ranges.
          </p>
          <input
            type="date"
            className="mt-1 w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {loading && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
              <span className="inline-block h-3 w-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Loading existing availability…
            </p>
          )}

          {!loading && hasExistingConfig && (
            <p className="text-xs text-emerald-700 mt-1">
              Existing configuration found for this date. You can update it
              below.
            </p>
          )}

          {!loading && !hasExistingConfig && (
            <p className="text-xs text-gray-500 mt-1">
              No availability set for this date yet. Start by adding time ranges
              or blocking the day.
            </p>
          )}
        </div>

        {/* Block / Day note */}
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2">
            <input
              id="block-day"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              checked={isBlocked}
              onChange={(e) => setIsBlocked(e.target.checked)}
            />
            <label
              htmlFor="block-day"
              className="text-sm font-semibold text-gray-800"
            >
              Block this day for consultations
            </label>
          </div>
          <p className="text-xs text-gray-500">
            When blocked, students cannot book any consultation on this date.
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Day Note (optional)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Only available in the afternoon, or 'Exam week – limited slots'."
              value={dayNote}
              onChange={(e) => setDayNote(e.target.value)}
            />
          </div>
        </div>

        {/* Time ranges */}
        {!isBlocked && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">
                  Time Ranges
                </h4>
                <p className="text-xs text-gray-500">
                  Define windows during which students can book 15–30 minute
                  slots.
                </p>
              </div>
              <button
                type="button"
                onClick={addTimeRange}
                className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
              >
                + Add Time Range
              </button>
            </div>

            {timeRanges.length === 0 && (
              <p className="text-xs text-gray-500">
                No time ranges added yet for this day.
              </p>
            )}

            {timeRanges.length > 0 && (
              <div className="space-y-2">
                {timeRanges.map((range, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-2 md:items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          Start time
                        </label>
                        <input
                          type="time"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={range.startTime}
                          onChange={(e) =>
                            updateTimeRange(index, "startTime", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                          End time
                        </label>
                        <input
                          type="time"
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          value={range.endTime}
                          onChange={(e) =>
                            updateTimeRange(index, "endTime", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                        Note (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Morning focus, office hours, etc."
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={range.note}
                        onChange={(e) =>
                          updateTimeRange(index, "note", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex md:flex-col items-center justify-center mt-1 md:mt-0">
                      <button
                        type="button"
                        onClick={() => removeTimeRange(index)}
                        className="px-2 py-1 text-xs rounded bg-rose-100 text-rose-700 hover:bg-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </div>
    </div>
  );
}
