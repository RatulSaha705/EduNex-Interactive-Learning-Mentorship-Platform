// frontend/src/pages/InstructorConsultationSchedule.jsx
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function InstructorConsultationSchedule() {
  const { auth } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [availabilityId, setAvailabilityId] = useState(null);
  const [timeRanges, setTimeRanges] = useState([]);
  const [dayNote, setDayNote] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
        setAvailabilityId(av._id);
        setTimeRanges(av.timeRanges || []);
        setDayNote(av.dayNote || "");
        setIsBlocked(av.isBlocked || false);
      } else {
        setAvailabilityId(null);
        setTimeRanges([]);
        setDayNote("");
        setIsBlocked(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load availability"
      );
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
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to save availability"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDay = async () => {
    if (!availabilityId) {
      setError("No availability to delete for this day.");
      return;
    }
    if (!window.confirm("Delete all availability for this day?")) return;

    try {
      setError("");
      setMessage("");
      await axios.delete(
        `http://localhost:5000/api/mentorship/availability/${availabilityId}`,
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );
      setMessage("Availability deleted.");
      setAvailabilityId(null);
      setTimeRanges([]);
      setDayNote("");
      setIsBlocked(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete availability"
      );
    }
  };

  return (
    <div className="container mt-4">
      <h3>Consultation Schedule</h3>
      <p>Configure your one-on-one consultation times.</p>

      <div className="mb-3">
        <label className="form-label">Select Date</label>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {loading && <p>Loading availability...</p>}
      {error && <p className="text-danger">{error}</p>}
      {message && <p className="text-success">{message}</p>}

      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="isBlockedSwitch"
          checked={isBlocked}
          onChange={(e) => setIsBlocked(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="isBlockedSwitch">
          Block this day (no consultations allowed)
        </label>
      </div>

      <div className="mb-3">
        <label className="form-label">Day Note (optional)</label>
        <textarea
          className="form-control"
          rows={2}
          value={dayNote}
          onChange={(e) => setDayNote(e.target.value)}
          placeholder="e.g., Only short slots today, or I'm partially unavailable."
        />
      </div>

      {!isBlocked && (
        <>
          <h5>Available Time Ranges</h5>
          {timeRanges.length === 0 && (
            <p className="text-muted">No ranges defined yet.</p>
          )}

          {timeRanges.map((range, index) => (
            <div
              key={index}
              className="row g-2 align-items-center mb-2 border rounded p-2"
            >
              <div className="col-md-3">
                <label className="form-label mb-0">Start</label>
                <input
                  type="time"
                  className="form-control"
                  value={range.startTime}
                  onChange={(e) =>
                    handleRangeChange(index, "startTime", e.target.value)
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label mb-0">End</label>
                <input
                  type="time"
                  className="form-control"
                  value={range.endTime}
                  onChange={(e) =>
                    handleRangeChange(index, "endTime", e.target.value)
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label mb-0">Note (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={range.note || ""}
                  onChange={(e) =>
                    handleRangeChange(index, "note", e.target.value)
                  }
                />
              </div>
              <div className="col-md-2 text-end">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm mt-3"
                  onClick={() => handleRemoveRange(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline-primary mt-2"
            onClick={handleAddRange}
          >
            Add Time Range
          </button>
        </>
      )}

      <hr />

      <button
        className="btn btn-primary me-2"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Availability"}
      </button>

      <button
        className="btn btn-outline-danger"
        onClick={handleDeleteDay}
        disabled={!availabilityId}
      >
        Delete This Day
      </button>
    </div>
  );
}
