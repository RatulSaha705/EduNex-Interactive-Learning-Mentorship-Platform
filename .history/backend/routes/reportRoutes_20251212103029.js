// backend/routes/reportRoutes.js
import express from "express";
import { generateProgressReport } from "../controllers/reportController.js";
import {
  createContentReport,
  getMyContentReports,
} from "../controllers/contentReportController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 Progress report PDF (student only)
router.get(
  "/progress",
  protect,
  authorizeRoles("student"),
  generateProgressReport
);

// 🔹 Create a content report (any logged-in user)
router.post("/content", protect, createContentReport);

// 🔹 (Optional) List reports created by the logged-in user
router.get("/my-content", protect, getMyContentReports);

export default router;
