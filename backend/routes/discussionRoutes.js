import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createQuestion,
  getCourseQuestions,
} from "../controllers/discussionController.js";

const router = express.Router();

// Create a new question in a specific course (students only)
router.post(
  "/courses/:courseId/questions",
  protect,
  authorizeRoles("student"),
  createQuestion
);

// Get all questions for a specific course (any logged-in user)
router.get("/courses/:courseId/questions", protect, getCourseQuestions);

export default router;
