// backend/routes/enrollmentRoutes.js
import express from "express";
import {
  enrollInCourse,
  getMyEnrollments,
  updateEnrollmentProgress,
  rateCourseFromEnrollment,
} from "../controllers/enrollmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/enrollments
 * @desc    Enroll current user into a course
 * @access  Protected
 */
router.post("/", protect, enrollInCourse);

/**
 * @route   GET /api/enrollments/my
 * @desc    Get all enrollments for current user
 * @access  Protected
 */
router.get("/my", protect, getMyEnrollments);

/**
 * @route   PATCH /api/enrollments/:id/progress
 * @desc    Update progress (lessons, minutes, status) for one enrollment
 * @access  Protected (owner of enrollment)
 */
router.patch("/:id/progress", protect, updateEnrollmentProgress);

/**
 * @route   PATCH /api/enrollments/:id/rating
 * @desc    Rate a course and optionally add a review via its enrollment
 * @access  Protected (owner of enrollment)
 */
router.patch("/:id/rating", protect, rateCourseFromEnrollment);

export default router;
