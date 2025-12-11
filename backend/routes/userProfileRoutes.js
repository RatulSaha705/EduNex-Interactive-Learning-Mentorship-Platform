// backend/routes/userProfileRoutes.js
import express from "express";
import {
  getMyProfile,
  updateMyInterests,
  updateMyProfile,
} from "../controllers/userProfileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/me/profile
 * @desc    Get profile of the logged-in user (including interests & stats)
 * @access  Protected
 */
router.get("/profile", protect, getMyProfile);

/**
 * @route   PATCH /api/me/interests
 * @desc    Update interests for the logged-in user (used for recommendations)
 * @access  Protected
 */
router.patch("/interests", protect, updateMyInterests);

/**
 * @route   PATCH /api/me/profile
 * @desc    Update basic profile info (e.g. name) for the logged-in user
 * @access  Protected
 */
router.patch("/profile", protect, updateMyProfile);

export default router;
