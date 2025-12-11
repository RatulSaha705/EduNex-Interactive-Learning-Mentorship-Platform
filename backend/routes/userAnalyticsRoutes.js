// backend/routes/userAnalyticsRoutes.js
import express from "express";
import {
  getMyLearningStats,
  getMyCourseLearningBreakdown,
} from "../controllers/userAnalyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/me/learning-stats
 * @desc    Get aggregated learning stats for the logged-in user
 * @access  Protected
 */
router.get("/learning-stats", protect, getMyLearningStats);

/**
 * @route   GET /api/me/learning-courses
 * @desc    Get per-course learning breakdown for the logged-in user
 * @access  Protected
 */
router.get("/learning-courses", protect, getMyCourseLearningBreakdown);

export default router;
