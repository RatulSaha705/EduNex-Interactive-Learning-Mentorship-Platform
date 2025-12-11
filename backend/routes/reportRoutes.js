// backend/routes/reportRoutes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { generateProgressReport } from "../controllers/reportController.js";

const router = express.Router();

// GET /api/reports/progress  -> returns PDF
router.get(
  "/progress",
  protect,
  authorizeRoles("student"),
  generateProgressReport
);

export default router;
