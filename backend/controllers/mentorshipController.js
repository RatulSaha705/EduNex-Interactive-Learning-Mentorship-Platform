// backend/controllers/mentorshipController.js

import InstructorAvailability from "../models/InstructorAvailability.js";
import MentorshipSession from "../models/MentorshipSession.js";
import Course from "../models/Course.js";
import Notification from "../models/Notification.js";

/* ---------- Helper functions ---------- */

const timeStringToMinutes = (timeStr) => {
  // "HH:mm" -> minutes from midnight
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTimeString = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

const combineDateAndTimeToDate = (dateStr, timeStr) => {
  // interpret date + time in server's local timezone (no trailing Z)
  return new Date(`${dateStr}T${timeStr}:00`);
};

const isValidYyyyMmDd = (dateStr) =>
  typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

/**
 * Add time slots of length 10–30 mins (multiples of 5) inside a free interval.
 * Pushes into slotsArray objects:
 *  { startTime (Date), timeLabel ("HH:mm"), maxDurationMinutes, rangeNote }
 */
const addSlotsFromInterval = (
  intervalStartMinutes,
  intervalEndMinutes,
  date,
  rangeNote,
  slotsArray,
  now
) => {
  const MIN_DURATION = 15; // minutes
  const MAX_DURATION = 30; // minutes

  for (let t = intervalStartMinutes; t + MIN_DURATION <= intervalEndMinutes; t += 5) {
    const maxDurPossible = intervalEndMinutes - t;
    let maxDuration = Math.min(MAX_DURATION, maxDurPossible);

    // round down to nearest multiple of 5
    maxDuration = Math.floor(maxDuration / 5) * 5;

    if (maxDuration < MIN_DURATION) continue;

    const timeStr = minutesToTimeString(t);
    const startDateTime = combineDateAndTimeToDate(date, timeStr);

    // Skip past slots if date is today and this time has already passed
    if (startDateTime <= now) continue;

    slotsArray.push({
      startTime: startDateTime,
      timeLabel: timeStr,
      maxDurationMinutes: maxDuration,
      rangeNote: rangeNote || "",
    });
  }
};

/* ---------- Instructor: manage availability ---------- */

/**
 * GET /api/mentorship/availability/my?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Get the logged-in instructor's availability in a date range.
 */
export const getMyAvailability = async (req, res) => {
  try {
    const instructorId = req.user._id || req.user.id;
    const { from, to } = req.query;

    const filter = { instructor: instructorId };

    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    } else if (from) {
      filter.date = { $gte: from };
    } else if (to) {
      filter.date = { $lte: to };
    }

    const availability = await InstructorAvailability.find(filter).sort({ date: 1 });

    res.json(availability);
  } catch (error) {
    console.error("Error in getMyAvailability:", error);
    res.status(500).json({ message: "Server error fetching availability" });
  }
};

/**
 * POST /api/mentorship/availability
 * Body: { date, timeRanges: [{startTime, endTime, note?}], dayNote?, isBlocked? }
 * Upsert (create or update) availability for a specific date for the instructor.
 */
export const upsertAvailabilityForDate = async (req, res) => {
  try {
    const instructorId = req.user._id || req.user.id;
    const { date, timeRanges = [], dayNote, isBlocked } = req.body;

    if (!date || !isValidYyyyMmDd(date)) {
      return res
        .status(400)
        .json({ message: "Valid 'date' (YYYY-MM-DD) is required" });
    }

    // Validate time ranges (start < end)
    for (const range of timeRanges) {
      if (!range.startTime || !range.endTime) {
        return res
          .status(400)
          .json({ message: "Each time range needs startTime and endTime" });
      }
      const start = timeStringToMinutes(range.startTime);
      const end = timeStringToMinutes(range.endTime);
      if (isNaN(start) || isNaN(end) || start >= end) {
        return res
          .status(400)
          .json({ message: "Invalid time range: startTime must be < endTime" });
      }
    }

    // Upsert availability for this date
    const updated = await InstructorAvailability.findOneAndUpdate(
      { instructor: instructorId, date },
      {
        instructor: instructorId,
        date,
        timeRanges,
        dayNote: dayNote || "",
        isBlocked: !!isBlocked,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    // 🔔 If instructor blocked this day, cancel upcoming sessions and notify all enrolled students
    if (isBlocked) {
      const now = new Date();
      const dayEnd = new Date(`${date}T23:59:59.999`);

      // All *booked* sessions on that date in the future
      const [sessions, coursesTaught] = await Promise.all([
        MentorshipSession.find({
          instructor: instructorId,
          startTime: { $gte: now, $lte: dayEnd },
          status: "booked",
        }).populate("student course", "name title"),
        Course.find({ instructor: instructorId }).select(
          "title enrolledStudents"
        ),
      ]);

      // Cancel those sessions
      if (sessions.length > 0) {
        await MentorshipSession.updateMany(
          {
            instructor: instructorId,
            startTime: { $gte: now, $lte: dayEnd },
            status: "booked",
          },
          { $set: { status: "cancelledByInstructor" } }
        );
      }

      // All students enrolled in any of this instructor's courses
      const allStudentIdsSet = new Set();
      coursesTaught.forEach((course) => {
        (course.enrolledStudents || []).forEach((sid) =>
          allStudentIdsSet.add(String(sid))
        );
      });

      // Students who actually had a session on that day
      const studentsWithSessionSet = new Set(
        sessions.map((s) =>
          s.student?._id ? s.student._id.toString() : s.student.toString()
        )
      );

      const allStudentIds = [...allStudentIdsSet];

      const instructorName = req.user?.name || "Your instructor";
      const formattedDate = date;
      const noteText = dayNote ? ` Note: ${dayNote}` : "";

      const notifications = allStudentIds.map((studentId) => {
        const hadSession = studentsWithSessionSet.has(studentId);
        const extra = hadSession
          ? " Any consultation you booked on this day has been cancelled."
          : "";
        return {
          user: studentId,
          type: "consultation_blocked",
          title: "Consultations unavailable",
          message: `${instructorName} is not available for consultations on ${formattedDate}.${noteText}${extra}`,
          link: "/student/consultations",
        };
      });

      if (notifications.length > 0) {
        try {
          await Notification.insertMany(notifications);
        } catch (notifyErr) {
          console.error(
            "Error creating notifications for blocked consultation day:",
            notifyErr
          );
        }
      }
    }

    res.json(updated);
  } catch (error) {
    console.error("Error in upsertAvailabilityForDate:", error);
    res.status(500).json({ message: "Server error updating availability" });
  }
};



/**
 * DELETE /api/mentorship/availability/:id
 * Delete a specific availability document for the instructor.
 */
export const deleteAvailabilityDay = async (req, res) => {
  try {
    const instructorId = req.user._id || req.user.id;
    const { id } = req.params;

    const deleted = await InstructorAvailability.findOneAndDelete({
      _id: id,
      instructor: instructorId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Availability not found" });
    }

    const date = deleted.date;

    if (date) {
      const now = new Date();
      const dayEnd = new Date(`${date}T23:59:59.999`);

      // All *booked* sessions for that date
      const [sessions, coursesTaught] = await Promise.all([
        MentorshipSession.find({
          instructor: instructorId,
          startTime: { $gte: now, $lte: dayEnd },
          status: "booked",
        }).populate("student course", "name title"),
        Course.find({ instructor: instructorId }).select(
          "title enrolledStudents"
        ),
      ]);

      // Cancel them
      if (sessions.length > 0) {
        await MentorshipSession.updateMany(
          {
            instructor: instructorId,
            startTime: { $gte: now, $lte: dayEnd },
            status: "booked",
          },
          { $set: { status: "cancelledByInstructor" } }
        );
      }

      // All students enrolled in any of this instructor's courses
      const allStudentIdsSet = new Set();
      coursesTaught.forEach((course) => {
        (course.enrolledStudents || []).forEach((sid) =>
          allStudentIdsSet.add(String(sid))
        );
      });

      const studentsWithSessionSet = new Set(
        sessions.map((s) =>
          s.student?._id ? s.student._id.toString() : s.student.toString()
        )
      );

      const allStudentIds = [...allStudentIdsSet];

      const instructorName = req.user?.name || "Your instructor";
      const formattedDate = date;

      const notifications = allStudentIds.map((studentId) => {
        const hadSession = studentsWithSessionSet.has(studentId);
        const extra = hadSession
          ? " Any consultation you booked on this day has been cancelled."
          : "";
        return {
          user: studentId,
          type: "consultation_blocked",
          title: "Consultations unavailable",
          message: `${instructorName} is not available for consultations on ${formattedDate}.${extra}`,
          link: "/student/consultations",
        };
      });

      if (notifications.length > 0) {
        try {
          await Notification.insertMany(notifications);
        } catch (notifyErr) {
          console.error(
            "Error creating notifications for deleted consultation day:",
            notifyErr
          );
        }
      }
    }

    res.json({
      message:
        "Availability deleted and upcoming sessions for this day were cancelled",
    });
  } catch (error) {
    console.error("Error in deleteAvailabilityDay:", error);
    res.status(500).json({ message: "Server error deleting availability" });
  }
};


/* ---------- Student: view free slots & book ---------- */

/**
 * GET /api/mentorship/available-slots?courseId=...&date=YYYY-MM-DD
 * Return free slots for a course's instructor on a given date,
 * only if the current user is enrolled in that course.
 */
export const getAvailableSlotsForCourse = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { courseId, date } = req.query;

    if (!courseId || !date) {
      return res
        .status(400)
        .json({ message: "courseId and date (YYYY-MM-DD) are required" });
    }

    if (!isValidYyyyMmDd(date)) {
      return res
        .status(400)
        .json({ message: "date must be in YYYY-MM-DD format" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if student is enrolled in this course
    const isEnrolled = course.enrolledStudents.some(
      (id) => id.toString() === studentId.toString()
    );
    if (!isEnrolled) {
      return res
        .status(403)
        .json({ message: "You must be enrolled in this course to view slots" });
    }

    const instructorId = course.instructor._id || course.instructor;

    const availability = await InstructorAvailability.findOne({
      instructor: instructorId,
      date,
    });

    if (!availability) {
      return res.json({
        courseId,
        instructor: instructorId,
        date,
        dayNote: null,
        isBlocked: false,
        slots: [],
      });
    }

    if (availability.isBlocked) {
      return res.json({
        courseId,
        instructor: instructorId,
        date,
        dayNote: availability.dayNote || "Instructor is not available",
        isBlocked: true,
        slots: [],
      });
    }

    // Get already-booked sessions for this instructor on this date
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);

    const bookedSessions = await MentorshipSession.find({
      instructor: instructorId,
      status: "booked",
      startTime: { $gte: dayStart, $lte: dayEnd },
    });

    const bookedIntervals = bookedSessions.map((s) => {
      const start =
        s.startTime.getHours() * 60 + s.startTime.getMinutes();
      const end = s.endTime.getHours() * 60 + s.endTime.getMinutes();
      return [start, end];
    });
    

    const now = new Date();
    const slots = [];

    // For each availability range, subtract booked intervals to get free intervals
    availability.timeRanges.forEach((range) => {
      const rangeStart = timeStringToMinutes(range.startTime);
      const rangeEnd = timeStringToMinutes(range.endTime);

      // All booked intervals that overlap this availability range
      const overlapping = bookedIntervals
        .filter(
          ([bStart, bEnd]) => bEnd > rangeStart && bStart < rangeEnd
        )
        .sort((a, b) => a[0] - b[0]);

      let currentStart = rangeStart;

      overlapping.forEach(([bStart, bEnd]) => {
        // free gap before this booking
        if (bStart > currentStart) {
          addSlotsFromInterval(
            currentStart,
            bStart,
            date,
            range.note,
            slots,
            now
          );
        }
        if (bEnd > currentStart) {
          currentStart = Math.max(currentStart, bEnd);
        }
      });

      // remaining free interval after last booking
      if (currentStart < rangeEnd) {
        addSlotsFromInterval(
          currentStart,
          rangeEnd,
          date,
          range.note,
          slots,
          now
        );
      }
    });

    res.json({
      courseId,
      instructor: instructorId,
      date,
      dayNote: availability.dayNote,
      isBlocked: false,
      slots,
    });
  } catch (error) {
    console.error("Error in getAvailableSlotsForCourse:", error);
    res.status(500).json({ message: "Server error fetching available slots" });
  }
};

/**
 * POST /api/mentorship/sessions
 * Body: { courseId, date (YYYY-MM-DD), startTime ("HH:mm"), durationMinutes, studentNote? }
 * Book a mentorship session for the logged-in student.
 */
export const bookSession = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { courseId, date, startTime, durationMinutes, studentNote } = req.body;

    if (!courseId || !date || !startTime || !durationMinutes) {
      return res.status(400).json({
        message:
          "courseId, date (YYYY-MM-DD), startTime (HH:mm), durationMinutes are required",
      });
    }

    if (!isValidYyyyMmDd(date)) {
      return res
        .status(400)
        .json({ message: "date must be in YYYY-MM-DD format" });
    }

    const duration = Number(durationMinutes);
    if (Number.isNaN(duration) || ![15, 30].includes(duration)) {
      return res.status(400).json({
        message: "Duration must be either 15 or 30 minutes",
      });
    }

    const now = new Date();
    const startDateTime = combineDateAndTimeToDate(date, startTime);
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    if (startDateTime <= now) {
      return res
        .status(400)
        .json({ message: "Start time must be in the future" });
    }

    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const diffMs = startDateTime.getTime() - now.getTime();
    if (diffMs > threeDaysMs) {
      return res.status(400).json({
        message: "You can only book consultations up to 3 days in advance",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const isEnrolled = course.enrolledStudents.some(
      (id) => id.toString() === studentId.toString()
    );
    if (!isEnrolled) {
      return res
        .status(403)
        .json({ message: "You must be enrolled in this course to book" });
    }

    const instructorId = course.instructor._id || course.instructor;

    const availability = await InstructorAvailability.findOne({
      instructor: instructorId,
      date,
    });

    if (!availability || availability.isBlocked) {
      return res
        .status(400)
        .json({ message: "Instructor is not available on this date" });
    }

    const startMinutes = timeStringToMinutes(startTime);
    const endMinutes = startMinutes + duration;

    const fitsInRange = availability.timeRanges.some((range) => {
      const rStart = timeStringToMinutes(range.startTime);
      const rEnd = timeStringToMinutes(range.endTime);
      return startMinutes >= rStart && endMinutes <= rEnd;
    });

    if (!fitsInRange) {
      return res.status(400).json({
        message: "Selected time does not fit within the instructor's availability",
      });
    }

    const overlapping = await MentorshipSession.findOne({
      instructor: instructorId,
      status: "booked",
      startTime: { $lt: endDateTime },
      endTime: { $gt: startDateTime },
    });

    if (overlapping) {
      return res
        .status(409)
        .json({ message: "This time slot has already been booked" });
    }

    const session = await MentorshipSession.create({
      instructor: instructorId,
      student: studentId,
      course: courseId,
      startTime: startDateTime,
      endTime: endDateTime,
      durationMinutes: duration,
      studentNote: studentNote || "",
    });

    await session.populate([
      { path: "instructor", select: "name email" },
      { path: "student", select: "name email" },
      { path: "course", select: "title" },
    ]);

    // 🔔 Notification: instructor gets alert when a student books a session
    try {
      const instructorUserId =
        session.instructor?._id || session.instructor;
      const studentName = session.student?.name || "A student";
      const courseTitle = session.course?.title || "a course";
      const startStr = session.startTime.toLocaleString();

      await Notification.create({
        user: instructorUserId,
        type: "consultation_booked",
        title: "New consultation booked",
        message: `${studentName} booked a ${session.durationMinutes}-minute consultation on ${startStr} for "${courseTitle}".`,
        link: "/instructor/consultations/today",
        course: session.course?._id || session.course,
      });
    } catch (notifyErr) {
      console.error(
        "Error creating notification for booked session:",
        notifyErr
      );
    }

    res.status(201).json(session);
  } catch (error) {
    console.error("Error in bookSession:", error);
    res.status(500).json({ message: "Server error booking session" });
  }
};

/* ---------- Instructor: view today's sessions ---------- */

/**
 * GET /api/mentorship/sessions/today
 * Get today's booked sessions for the logged-in instructor.
 */
export const getTodaySessionsForInstructor = async (req, res) => {
  try {
    const instructorId = req.user._id || req.user.id;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await MentorshipSession.find({
      instructor: instructorId,
      status: "booked",                // only booked
      startTime: { $gte: now, $lte: endOfDay }, // only upcoming today
    })
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ startTime: 1 });

    res.json(sessions);
  } catch (error) {
    console.error("Error in getTodaySessionsForInstructor:", error);
    res
      .status(500)
      .json({ message: "Server error fetching today's sessions" });
  }
};


/* ---------- Student: view & cancel their own sessions ---------- */

/**
 * GET /api/mentorship/sessions/my
 * Get all upcoming sessions for the logged-in student.
 */
export const getMySessionsForStudent = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const now = new Date();

    const sessions = await MentorshipSession.find({
      student: studentId,
      status: "booked",            // only booked
      startTime: { $gte: now },    // only upcoming
    })
      .populate("instructor", "name email")
      .populate("course", "title")
      .sort({ startTime: 1 });     // earliest first

    res.json(sessions);
  } catch (error) {
    console.error("Error in getMySessionsForStudent:", error);
    res.status(500).json({ message: "Server error fetching sessions" });
  }
};


/**
 * DELETE /api/mentorship/sessions/:id
 * Student cancels a booked session (only if more than 12 hours before start).
 */
export const cancelSessionByStudent = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;
    const { id } = req.params;

    const session = await MentorshipSession.findById(id)
      .populate({ path: "instructor", select: "name email" })
      .populate({ path: "course", select: "title" });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.student.toString() !== studentId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only cancel your own sessions" });
    }

    if (session.status !== "booked") {
      return res
        .status(400)
        .json({ message: "This session cannot be cancelled" });
    }

    const now = new Date();
    const diffMs = session.startTime.getTime() - now.getTime();
    const twelveHoursMs = 12 * 60 * 60 * 1000;

    if (diffMs < twelveHoursMs) {
      return res.status(400).json({
        message: "You can only cancel a session more than 12 hours in advance",
      });
    }

    session.status = "cancelledByStudent";
    await session.save();

    res.json(session);
  } catch (error) {
    console.error("Error in cancelSessionByStudent:", error);
    res.status(500).json({ message: "Server error cancelling session" });
  }
};
