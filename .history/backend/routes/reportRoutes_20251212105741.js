import express from "express";
import {
  generateProgressReport,
  createContentReport,
  adminGetReports,
  adminUpdateReportStatus,
} from "../controllers/reportController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 Progress report PDF (student)
router.get("/progress", protect, generateProgressReport);

// 🔹 Create a new content report (any logged-in user)
router.post("/", protect, createContentReport);

// 🔹 Admin: list all reports (optionally filter ?status=open)
router.get("/", protect, authorizeRoles("admin"), adminGetReports);

// 🔹 Admin: update status of a report
router.patch(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  adminUpdateReportStatus
);

export default router;
