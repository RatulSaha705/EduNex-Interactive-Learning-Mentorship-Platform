// backend/routes/reportRoutes.js
import express from "express";
import { generateProgressReport } from "../controllers/reportController.js";
import {
  createContentReport,
  getMyContentReports,
  adminGetReports,
  adminUpdateReportStatus,
} from "../controllers/contentReportController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 🔹 Progress report PDF (student)
 * GET /api/reports/progress
 */
router.get("/progress", protect, generateProgressReport);

/**
 * 🔹 Create a new content report (any logged-in user)
 * POST /api/reports/content  (used by ReportButton)
 * Also available as POST /api/reports for flexibility
 */
router.post("/content", protect, createContentReport);
router.post("/", protect, createContentReport);

/**
 * 🔹 Logged-in user: list their own content reports
 * GET /api/reports/my-content
 */
router.get("/my-content", protect, getMyContentReports);

/**
 * 🔹 Admin: list all reports (optionally filter ?status=&targetType=)
 * GET /api/reports
 */
router.get("/", protect, authorizeRoles("admin"), adminGetReports);

/**
 * 🔹 Admin: update status of a report
 * PATCH /api/reports/:id/status
 */
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  adminUpdateReportStatus
);

export default router;
