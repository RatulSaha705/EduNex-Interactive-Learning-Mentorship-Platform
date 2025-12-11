// backend/routes/statsRoutes.js
import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getMyLearningStats } from "../controllers/statsController.js";

const router = express.Router();

// GET /api/stats/my  -> student learning stats & engagement
router.get("/my", protect, authorizeRoles("student"), getMyLearningStats);

export default router;
