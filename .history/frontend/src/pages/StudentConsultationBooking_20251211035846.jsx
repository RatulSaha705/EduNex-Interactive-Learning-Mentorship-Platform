import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

function getDateStringOffset(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default function StudentConsultationBooking() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getDateStringOffset(0));
  const [slots, setSlots] = useState([]);
  const [dayNote, setDayNote] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [duration, setDuration] = useState(15);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [studentNote, setStudentNote] = useState("");
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // --- Redirect if not logged in ---
  useEffect(() => {
    if (!auth?.token) {
      navigate("/"); // redirect to login
    }
  }, [auth?.token, navigate]);

  // --- Fetch course info ---
  useEffect(() => {
    if (!auth?.token) return;

    const fetchCourse = async () => {
      setLoadingCourse(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setCourse(res.data.course);
      } catch (err) {
        setError("Failed to load course details");
      } finally {
        setLoadingCourse(false);
      }
    };

    fetchCourse();
  }, [auth?.token, id]);

  // --- Fetch available slots for selected date ---
  const fetchSlots = async (date) => {
    if (!auth?.token) return;
    setError("");
    setMessage("");
    setLoadingSlots(true);
    setSelectedSlotIndex(null);

    try {
      const res = await axios.get(
        "http://localhost:5000/api/mentorship/available-slots",
        {
          params: { courseId: id, date },
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      setSlots(res.data.slots || []);
      setDayNote(res.data.dayNote || "");
      setIsBlocked(res.data.isBlocked || false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load slots");
      setSlots([]);
      setDayNote("");
      setIsBlocked(false);
    } finally {
      setLoadingSlots(false);
    }
  };

  // --- Auto fetch slots when date changes ---
  useEffect(() => {
    if (auth?.token) fetchSlots(selectedDate);
  }, [auth?.token, id, selectedDate]);

  // --- Filter slots for selected duration ---
  const baseSlots = slots
    .filter((slot) => slot.maxDurationMinutes >= duration)
    .sort((a, b) => {
      const [ah, am] = a.timeLabel.split(":").map(Number);
      const [bh, bm] = b.timeLabel.split(":").map(Number);
      return ah * 60 + am - (bh * 60 + bm);
    });

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

  // --- Date options: today + 3 days ---
  const dateOptions = [0, 1, 2, 3].map((offset) => {
    const value = getDateStringOffset(offset);
    const label =
      offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : `In ${offset} days`;
    return { value, label: `${label} (${value})` };
  });

  // --- Handlers ---
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

    try {
      setBooking(true);
      setError("");
      setMessage("");

      await axios.post(
        "http://localhost:5000/api/mentorship/sessions",
        {
          courseId: id,
          date: selectedDate,
          startTime: slot.timeLabel,
          durationMinutes: duration,
          studentNote,
        },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      setMessage("Consultation booked successfully!");
      setStudentNote("");
      setSelectedSlotIndex(null);

      await fetchSlots(selectedDate); // refresh slots
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book session");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 mt-6">
      <h3 className="text-2xl font-semibold mb-4">Book Consultation</h3>

      {loadingCourse ? (
        <p className="text-gray-600">Loading course info...</p>
      ) : course ? (
        <>
          <p>
            <strong>Course:</strong> {course.title}
          </p>
          <p>
            <strong>Instructor:</strong> {course.instructor?.name || "Unknown"}
          </p>
        </>
      ) : (
        <p className="text-red-600">Course not found.</p>
      )}

      <hr className="my-4" />

      {/* Step 1: Date */}
      <div className="mb-4">
        <label className="block mb-1 font-medium">
          Select Date (up to 3 days ahead)
        </label>
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

      {dayNote && (
        <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded mb-3">
          <strong>Note:</strong> {dayNote}
        </div>
      )}

      {isBlocked && (
        <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded mb-3">
          Instructor is not available on this day.
        </div>
      )}

      {error && <p className="text-red-600 font-medium mb-2">{error}</p>}
      {message && <p className="text-green-600 font-medium mb-2">{message}</p>}

      {/* Step 2: Duration */}
      <h5 className="mt-3 mb-2 font-medium">Session Length</h5>
      <div className="flex gap-3 mb-4">
        {[15, 30].map((d) => (
          <button
            key={d}
            className={`px-4 py-2 rounded ${
              duration === d
                ? "bg-blue-500 text-white"
                : "bg-white border border-blue-500 text-blue-500"
            }`}
            onClick={() => {
              setDuration(d);
              setSelectedSlotIndex(null);
              setMessage("");
              setError("");
            }}
          >
            {d} minutes
          </button>
        ))}
      </div>

      {/* Step 3: Available slots */}
      <h5 className="mb-2 font-medium">Available Slots</h5>
      {loadingSlots ? (
        <p className="text-gray-600">Loading slots...</p>
      ) : slots.length === 0 ? (
        <p className="text-gray-500">No free slots available for this date.</p>
      ) : filteredSlots.length === 0 ? (
        <p className="text-gray-500">
          No free slots available for a {duration}-minute session on this date.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
          {filteredSlots.map((slot, index) => (
            <button
              key={`${slot.timeLabel}-${index}`}
              type="button"
              className={`px-3 py-2 border rounded text-center ${
                selectedSlotIndex === index
                  ? "bg-blue-500 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => handleSelectSlot(index)}
            >
              <div className="font-medium">{slot.timeLabel}</div>
              {slot.rangeNote && (
                <div className="text-xs text-gray-500">({slot.rangeNote})</div>
              )}
              <div className="text-xs mt-1">session: {duration} min</div>
            </button>
          ))}
        </div>
      )}

      {selectedSlotIndex !== null && (
        <>
          <div className="mb-4">
            <label className="block mb-1 font-medium">
              Optional note (what you want to discuss)
            </label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
            />
          </div>

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
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
