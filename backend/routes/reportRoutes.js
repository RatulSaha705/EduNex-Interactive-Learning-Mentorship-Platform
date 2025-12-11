// backend/routes/reportRoutes.js
import express from "express";
import {
  createReport,
  getMyReports,
  getAllReports,
  getReportById,
  updateReportStatus,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/reports
 * @desc    Create a new report (any logged-in user)
 */
router.post("/", protect, createReport);

/**
 * @route   GET /api/reports/my
 * @desc    Get reports created by the logged-in user
 */
router.get("/my", protect, getMyReports);

/**
 * @route   GET /api/reports
 * @desc    Get all reports (admin)
 */
router.get("/", protect, authorizeRoles("admin"), getAllReports);

/**
 * @route   GET /api/reports/:id
 * @desc    Get a single report by id (admin)
 */
router.get("/:id", protect, authorizeRoles("admin"), getReportById);

/**
 * @route   PATCH /api/reports/:id
 * @desc    Update report status / resolution (admin)
 */
router.patch("/:id", protect, authorizeRoles("admin"), updateReportStatus);

export default router;
