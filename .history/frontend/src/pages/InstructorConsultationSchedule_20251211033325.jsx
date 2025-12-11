import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

// helper: get date string YYYY-MM-DD offset from today
function getDateStringOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function InstructorConsultationSchedule() {
  const { auth } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(getDateStringOffset(0));
  const [timeRanges, setTimeRanges] = useState([]); // {startTime, endTime, note}
  const [dayNote, setDayNote] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  const [availabilityId, setAvailabilityId] = useState(null); // for PUT updates

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // load existing availability for selected date
  const loadAvailability = async (date) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/availability/my",
        {
          params: { from: date, to: date },
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );

      if (res.data.length > 0) {
        const avail = res.data[0];
        setAvailabilityId(avail._id);
        setTimeRanges(avail.timeRanges || []);
        setDayNote(avail.dayNote || "");
        setIsBlocked(avail.isBlocked || false);
      } else {
        setAvailabilityId(null);
        setTimeRanges([]);
        setDayNote("");
        setIsBlocked(false);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load availability");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) loadAvailability(selectedDate);
  }, [auth?.token, selectedDate]);

  // add a new time range
  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { startTime: "", endTime: "", note: "" }]);
  };

  // update a time range
  const updateTimeRange = (index, key, value) => {
    const newRanges = [...timeRanges];
    newRanges[index][key] = value;
    setTimeRanges(newRanges);
  };

  // remove a time range
  const removeTimeRange = (index) => {
    const newRanges = [...timeRanges];
    newRanges.splice(index, 1);
    setTimeRanges(newRanges);
  };

  // save availability (POST or PUT)
  const handleSave = async () => {
    if (!selectedDate) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = { date: selectedDate, timeRanges, dayNote, isBlocked };

      if (availabilityId) {
        // update existing
        await axios.put(
          `http://localhost:5000/api/mentorship/availability/${availabilityId}`,
          payload,
          { headers: { Authorization: `Bearer ${auth?.token}` } }
        );
      } else {
        // create new
        const res = await axios.post(
          "http://localhost:5000/api/mentorship/availability",
          payload,
          { headers: { Authorization: `Bearer ${auth?.token}` } }
        );
        setAvailabilityId(res.data._id); // save for future updates
      }

      setMessage("Availability saved successfully.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const dateOptions = [0, 1, 2, 3].map((offset) => {
    const value = getDateStringOffset(offset);
    const label =
      offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : `In ${offset} days`;
    return { value, label: `${label} (${value})` };
  });

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6">
      <h3 className="text-2xl font-semibold mb-4">
        Manage Consultation Schedule
      </h3>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Select Date</label>
        <select
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        >
          {dateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading availability...</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Day Note</label>
            <input
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={dayNote}
              onChange={(e) => setDayNote(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
              />
              Block this day
            </label>
          </div>

          <div className="mb-4">
            <h5 className="font-medium mb-2">Time Ranges</h5>
            {timeRanges.map((range, index) => (
              <div
                key={index}
                className="flex items-center gap-2 mb-2 flex-wrap"
              >
                <input
                  type="time"
                  className="border border-gray-300 rounded px-2 py-1"
                  value={range.startTime}
                  onChange={(e) =>
                    updateTimeRange(index, "startTime", e.target.value)
                  }
                />
                <span>to</span>
                <input
                  type="time"
                  className="border border-gray-300 rounded px-2 py-1"
                  value={range.endTime}
                  onChange={(e) =>
                    updateTimeRange(index, "endTime", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Optional note"
                  className="border border-gray-300 rounded px-2 py-1 flex-1"
                  value={range.note}
                  onChange={(e) =>
                    updateTimeRange(index, "note", e.target.value)
                  }
                />
                <button
                  className="px-2 py-1 bg-red-500 text-white rounded"
                  onClick={() => removeTimeRange(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="px-4 py-2 bg-green-500 text-white rounded mt-2"
              onClick={addTimeRange}
            >
              Add Time Range
            </button>
          </div>

          {error && <p className="text-red-600 mb-2">{error}</p>}
          {message && <p className="text-green-600 mb-2">{message}</p>}

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Availability"}
          </button>
        </>
      )}
    </div>
  );
}
