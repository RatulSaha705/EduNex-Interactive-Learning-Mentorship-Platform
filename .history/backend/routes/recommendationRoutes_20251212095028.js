// backend/routes/recommendationRoutes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getMyCourseRecommendations } from "../controllers/recommendationController.js";

const router = express.Router();

// GET /api/recommendations/my
router.get(
  "/my",
  protect,
  authorizeRoles("student"),
  getMyCourseRecommendations
);

export default router;
