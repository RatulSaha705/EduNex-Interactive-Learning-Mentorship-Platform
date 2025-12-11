import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function InstructorConsultationSchedule() {
  const { auth } = useContext(AuthContext);

  const [selectedDate, setSelectedDate] = useState(""); // "YYYY-MM-DD"
  const [availability, setAvailability] = useState(null);
  const [timeRanges, setTimeRanges] = useState([]); // [{startTime, endTime, note}]
  const [dayNote, setDayNote] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate) return;

    const fetchAvailability = async () => {
      try {
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
        alert("Failed to fetch availability");
      }
    };

    fetchAvailability();
  }, [selectedDate, auth.token]);

  // Add a new empty time range
  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { startTime: "", endTime: "", note: "" }]);
  };

  // Remove a time range
  const removeTimeRange = (index) => {
    const updated = [...timeRanges];
    updated.splice(index, 1);
    setTimeRanges(updated);
  };

  // Update a time range
  const updateTimeRange = (index, key, value) => {
    const updated = [...timeRanges];
    updated[index][key] = value;
    setTimeRanges(updated);
  };

  // Save availability (POST /api/mentorship/availability)
  const handleSave = async () => {
    if (!selectedDate) {
      alert("Select a date first");
      return;
    }

    try {
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
      alert("Availability saved!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save availability");
    }
  };

  return (
    <div className="container p-3">
      <h2>Instructor Consultation Schedule</h2>

      {/* Date Picker */}
      <div className="mb-3">
        <label>Select Date:</label>
        <input
          type="date"
          className="form-control"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {/* Block/Unblock Day */}
      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          checked={isBlocked}
          onChange={(e) => setIsBlocked(e.target.checked)}
        />
        <label className="form-check-label">Block this day</label>
      </div>

      {/* Day Note */}
      <div className="mb-3">
        <label>Day Note:</label>
        <input
          type="text"
          className="form-control"
          value={dayNote}
          onChange={(e) => setDayNote(e.target.value)}
        />
      </div>

      {/* Time Ranges */}
      {!isBlocked && (
        <div>
          <h5>Time Ranges</h5>
          {timeRanges.map((range, index) => (
            <div key={index} className="d-flex mb-2 gap-2">
              <input
                type="time"
                className="form-control"
                value={range.startTime}
                onChange={(e) =>
                  updateTimeRange(index, "startTime", e.target.value)
                }
              />
              <input
                type="time"
                className="form-control"
                value={range.endTime}
                onChange={(e) =>
                  updateTimeRange(index, "endTime", e.target.value)
                }
              />
              <input
                type="text"
                className="form-control"
                placeholder="Note"
                value={range.note}
                onChange={(e) => updateTimeRange(index, "note", e.target.value)}
              />
              <button
                className="btn btn-danger"
                onClick={() => removeTimeRange(index)}
              >
                Remove
              </button>
            </div>
          ))}

          <button className="btn btn-primary mb-3" onClick={addTimeRange}>
            Add Time Range
          </button>
        </div>
      )}

      <div>
        <button className="btn btn-success" onClick={handleSave}>
          Save Availability
        </button>
      </div>
    </div>
  );
}
