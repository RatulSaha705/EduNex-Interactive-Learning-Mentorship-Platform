// backend/routes/courseAnalyticsRoutes.js
import express from "express";
import { getCourseAnalytics } from "../controllers/courseAnalyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/courses/:id/analytics
 * @desc    Get analytics for a single course
 * @access  Protected (instructor for that course or admin)
 */
router.get(
  "/:id/analytics",
  protect,
  authorizeRoles("instructor", "admin"),
  getCourseAnalytics
);

export default router;
