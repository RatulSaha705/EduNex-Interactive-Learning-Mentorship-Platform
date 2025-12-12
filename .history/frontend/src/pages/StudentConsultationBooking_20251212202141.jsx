// frontend/src/pages/StudentConsultationBooking.jsx
import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
      navigate("/"); // or "/login" based on your routing
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
        setCourse(res.data.course || res.data);
      } catch (err) {
        console.error(err);
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
      console.error(err);
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
      console.error(err);
      setError(err.response?.data?.message || "Failed to book session");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
            Book 1:1 Consultation
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Select a suitable time to meet your instructor for this course.
          </p>
          {course && (
            <p className="text-xs text-gray-500 mt-1">
              Course:{" "}
              <span className="font-medium text-indigo-700">
                {course.title}
              </span>{" "}
              · Instructor:{" "}
              <span className="font-medium">
                {course.instructor?.name || "Unknown"}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            ← Back
          </button>
          <Link
            to={`/student/courses/${id}`}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            View Course
          </Link>
        </div>
      </div>

      {/* Course Loading State */}
      {loadingCourse && (
        <div className="bg-white rounded-xl shadow-sm p-4 text-sm text-gray-500 flex items-center gap-2">
          <span className="inline-block h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading course info…
        </div>
      )}

      {!loadingCourse && !course && (
        <div className="bg-white rounded-xl shadow-md p-4 text-sm text-red-600">
          Course not found.
        </div>
      )}

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

      {/* Booking Steps Card */}
      <div className="bg-white rounded-2xl shadow-md p-5 space-y-6">
        {/* Step 1: Date */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">
            1. Choose a date
          </h4>
          <p className="text-xs text-gray-500">
            You can book up to 3 days in advance.
          </p>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            {dateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {dayNote && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
              <span className="font-semibold">Note from instructor:</span>{" "}
              {dayNote}
            </div>
          )}

          {isBlocked && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              The instructor is not available on this day. Please choose another
              date.
            </div>
          )}
        </div>

        {/* Step 2: Duration */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">
            2. Select session length
          </h4>
          <div className="flex flex-wrap gap-3">
            {[15, 30].map((d) => (
              <button
                key={d}
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition ${
                  duration === d
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
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
        </div>

        {/* Step 3: Slots */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-800">
            3. Pick an available time
          </h4>

          {loadingSlots ? (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="inline-block h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              Loading available slots…
            </p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-500">
              No free slots available for this date.
            </p>
          ) : filteredSlots.length === 0 ? (
            <p className="text-sm text-gray-500">
              No free slots available for a {duration}-minute session on this
              date. Try a different length or date.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredSlots.map((slot, index) => (
                <button
                  key={`${slot.timeLabel}-${index}`}
                  type="button"
                  className={`px-3 py-2 border rounded-lg text-center text-sm transition ${
                    selectedSlotIndex === index
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectSlot(index)}
                >
                  <div className="font-semibold">{slot.timeLabel}</div>
                  {slot.rangeNote && (
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      ({slot.rangeNote})
                    </div>
                  )}
                  <div className="text-[11px] text-gray-400 mt-1">
                    Session: {duration} min
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Note + Confirm */}
        {selectedSlotIndex !== null && filteredSlots[selectedSlotIndex] && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-gray-800">
                4. Add a note (optional)
              </h4>
              <p className="text-xs text-gray-500">
                Tell your instructor what you’d like to focus on during this
                session.
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                value={studentNote}
                onChange={(e) => setStudentNote(e.target.value)}
                placeholder="Example: Help with assignment 2, and clarify topic X..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                onClick={handleBookSession}
                disabled={booking}
              >
                {booking ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
