// backend/routes/recommendationRoutes.js
import express from "express";
import { getMyCourseRecommendations } from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/recommendations
 * @desc    Get recommended courses for the logged-in user
 * @access  Protected
 */
router.get("/", protect, getMyCourseRecommendations);

export default router;
