import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function getDateStringOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function StudentConsultationBooking() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams(); // courseId from URL

  const [course, setCourse] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getDateStringOffset(0));
  const [slots, setSlots] = useState([]);
  const [dayNote, setDayNote] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  const [duration, setDuration] = useState(15); // 15 or 30
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [studentNote, setStudentNote] = useState("");

  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch course info
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/courses/${id}`,
          {
            headers: { Authorization: `Bearer ${auth?.token}` },
          }
        );
        setCourse(res.data.course);
      } catch (err) {
        setError("Failed to load course details");
      } finally {
        setLoadingCourse(false);
      }
    };

    if (auth?.token) {
      fetchCourse();
    }
  }, [auth?.token, id]);

  // Fetch available slots for selected date
  useEffect(() => {
    const fetchSlots = async () => {
      setError("");
      setMessage("");
      setLoadingSlots(true);
      setSelectedSlotIndex(null);

      try {
        const res = await axios.get(
          "http://localhost:5000/api/mentorship/available-slots",
          {
            params: { courseId: id, date: selectedDate },
            headers: { Authorization: `Bearer ${auth?.token}` },
          }
        );

        setSlots(res.data.slots || []);
        setDayNote(res.data.dayNote || "");
        setIsBlocked(res.data.isBlocked || false);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load available slots"
        );
      } finally {
        setLoadingSlots(false);
      }
    };

    if (auth?.token) {
      fetchSlots();
    }
  }, [auth?.token, id, selectedDate]);

  // Only show slots that can support the chosen duration
  // only slots that can support chosen duration
const baseSlots = slots
  .filter((slot) => slot.maxDurationMinutes >= duration)
  // make sure slots are in time order
  .sort((a, b) => {
    const [ah, am] = a.timeLabel.split(":").map(Number);
    const [bh, bm] = b.timeLabel.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });

/**
 * We only keep slots spaced by at least `duration` minutes.
 * - If duration = 15 => 15 min steps
 * - If duration = 30 => 30 min steps
 */
const filteredSlots = [];
let lastMinutes = null;

for (const slot of baseSlots) {
  const [h, m] = slot.timeLabel.split(":").map(Number);
  const mins = h * 60 + m;

  if (lastMinutes === null || mins - lastMinutes >= duration) {
    filteredSlots.push(slot);
    lastMinutes = mins;
  }
}


  const dateOptions = [0, 1, 2, 3].map((offset) => {
    const value = getDateStringOffset(offset);
    const label =
      offset === 0
        ? "Today"
        : offset === 1
        ? "Tomorrow"
        : `In ${offset} days`;
    return {
      value,
      label: `${label} (${value})`,
    };
  });

  const handleSelectSlot = (index) => {
    setSelectedSlotIndex(index);
    setMessage("");
    setError("");
  };

  const handleBookSession = async () => {
    if (selectedSlotIndex === null) {
      setError("Please select a time slot first.");
      return;
    }

    const slot = filteredSlots[selectedSlotIndex];
    if (!slot) return;

    if (![15, 30].includes(duration)) {
      setError("Duration must be 15 or 30 minutes.");
      return;
    }

    try {
      setError("");
      setMessage("");
      setBooking(true);

      await axios.post(
        "http://localhost:5000/api/mentorship/sessions",
        {
          courseId: id,
          date: selectedDate,
          startTime: slot.timeLabel, // "HH:mm"
          durationMinutes: duration,
          studentNote,
        },
        {
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );

      setMessage("Consultation booked successfully!");
      setStudentNote("");
      setSelectedSlotIndex(null);

      // Reload slots after booking
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/available-slots",
        {
          params: { courseId: id, date: selectedDate },
          headers: { Authorization: `Bearer ${auth?.token}` },
        }
      );
      setSlots(res.data.slots || []);
      setDayNote(res.data.dayNote || "");
      setIsBlocked(res.data.isBlocked || false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book session");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="container mt-4">
      <h3>Book Consultation</h3>

      {loadingCourse ? (
        <p>Loading course info...</p>
      ) : course ? (
        <>
          <p>
            <strong>Course:</strong> {course.title}
          </p>
          <p>
            <strong>Instructor:</strong>{" "}
            {course.instructor?.name || "Unknown"}
          </p>
        </>
      ) : (
        <p className="text-danger">Course not found.</p>
      )}

      <hr />

      {/* Step 1: Date */}
      <div className="mb-3">
        <label className="form-label">Select Date (up to 3 days ahead)</label>
        <select
          className="form-select"
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

      {dayNote && (
        <div className="alert alert-info py-2">
          <strong>Note:</strong> {dayNote}
        </div>
      )}

      {isBlocked && (
        <div className="alert alert-warning">
          Instructor is not available on this day.
        </div>
      )}

      {error && <p className="text-danger">{error}</p>}
      {message && <p className="text-success">{message}</p>}

      {/* Step 2: Duration */}
      <h5 className="mt-3">Session Length</h5>
      <div className="btn-group mb-3" role="group">
        <button
          type="button"
          className={`btn ${
            duration === 15 ? "btn-info" : "btn-outline-info"
          }`}
          onClick={() => {
            setDuration(15);
            setSelectedSlotIndex(null);
            setMessage("");
            setError("");
          }}
        >
          15 minutes
        </button>
        <button
          type="button"
          className={`btn ${
            duration === 30 ? "btn-info" : "btn-outline-info"
          }`}
          onClick={() => {
            setDuration(30);
            setSelectedSlotIndex(null);
            setMessage("");
            setError("");
          }}
        >
          30 minutes
        </button>
      </div>

      {/* Step 3: Available slots */}
      <h5>Available Slots</h5>
      {loadingSlots ? (
        <p>Loading slots...</p>
      ) : slots.length === 0 ? (
        <p>No free slots available for this date.</p>
      ) : filteredSlots.length === 0 ? (
        <p>
          No free slots available for a {duration}-minute session on this
          date.
        </p>
      ) : (
        <div className="list-group mb-3">
          {filteredSlots.map((slot, index) => (
            <button
              key={`${slot.timeLabel}-${index}`}
              type="button"
              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                selectedSlotIndex === index ? "active" : ""
              }`}
              onClick={() => handleSelectSlot(index)}
            >
              <div>
                <strong>{slot.timeLabel}</strong>
                {slot.rangeNote && (
                  <span className="ms-2 text-muted">({slot.rangeNote})</span>
                )}
              </div>
              <small>session: {duration} min</small>
            </button>
          ))}
        </div>
      )}

      {selectedSlotIndex !== null && (
        <>
          <div className="mb-3">
            <label className="form-label">
              Optional note (what you want to discuss)
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
            />
          </div>

          <button
            className="btn btn-info"
            onClick={handleBookSession}
            disabled={booking}
          >
            {booking ? "Booking..." : "Confirm Booking"}
          </button>
        </>
      )}
    </div>
  );
}
