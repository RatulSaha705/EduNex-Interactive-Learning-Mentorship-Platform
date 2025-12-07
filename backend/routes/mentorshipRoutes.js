// backend/routes/mentorshipRoutes.js

import express from "express";
import {
  getMyAvailability,
  upsertAvailabilityForDate,
  deleteAvailabilityDay,
  getAvailableSlotsForCourse,
  bookSession,
  getTodaySessionsForInstructor,
  getMySessionsForStudent,
  cancelSessionByStudent,
} from "../controllers/mentorshipController.js";
import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------- Instructor: availability management ---------- */

// GET my availability (optionally in a date range)
router.get(
  "/availability/my",
  protect,
  authorizeRoles("instructor"),
  getMyAvailability
);

// Create or update availability for a specific date
router.post(
  "/availability",
  protect,
  authorizeRoles("instructor"),
  upsertAvailabilityForDate
);

// Delete a specific day's availability
router.delete(
  "/availability/:id",
  protect,
  authorizeRoles("instructor"),
  deleteAvailabilityDay
);

/* ---------- Student: view slots & book ---------- */

// Get free slots for a course's instructor on a date
router.get(
  "/available-slots",
  protect,
  authorizeRoles("student"),
  getAvailableSlotsForCourse
);

// Book a mentorship session
router.post(
  "/sessions",
  protect,
  authorizeRoles("student"),
  bookSession
);

// View all upcoming sessions for the student
router.get(
  "/sessions/my",
  protect,
  authorizeRoles("student"),
  getMySessionsForStudent
);

// Cancel a session (if >12 hours before start)
router.delete(
  "/sessions/:id",
  protect,
  authorizeRoles("student"),
  cancelSessionByStudent
);

/* ---------- Instructor: view today's sessions ---------- */

router.get(
  "/sessions/today",
  protect,
  authorizeRoles("instructor"),
  getTodaySessionsForInstructor
);

export default router;
