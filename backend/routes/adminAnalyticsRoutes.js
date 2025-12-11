// backend/routes/adminAnalyticsRoutes.js
import express from "express";
import {
  getAdminDashboardOverview,
  getTopRatedCourses,
  getSystemUsageTrends,
} from "../controllers/adminAnalyticsController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/admin/overview
 * @desc    High-level admin dashboard metrics
 * @access  Admin
 */
router.get(
  "/overview",
  protect,
  authorizeRoles("admin"),
  getAdminDashboardOverview
);

/**
 * @route   GET /api/admin/top-rated-courses?limit=5
 * @desc    Top-rated courses (avg rating + count)
 * @access  Admin
 */
router.get(
  "/top-rated-courses",
  protect,
  authorizeRoles("admin"),
  getTopRatedCourses
);

/**
 * @route   GET /api/admin/system-usage?days=7
 * @desc    Basic system usage trends (users & enrollments per day)
 * @access  Admin
 */
router.get(
  "/system-usage",
  protect,
  authorizeRoles("admin"),
  getSystemUsageTrends
);

export default router;
