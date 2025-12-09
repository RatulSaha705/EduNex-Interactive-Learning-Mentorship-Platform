import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createQuestion,
  getCourseQuestions,
  createAnswer,
  getQuestionAnswers,
  upvoteAnswer,
  markAnswerHelpful,
  deleteQuestion,
  deleteAnswer,
} from "../controllers/discussionController.js";

const router = express.Router();
// ------------------QUESTIONS-----------------------//

// Create a new question in a specific course (students only)
router.post(
  "/courses/:courseId/questions",
  protect,
  authorizeRoles("student"),
  createQuestion
);

// Get all questions for a specific course (any logged-in user)
router.get("/courses/:courseId/questions", protect, getCourseQuestions);

// -------------------- ANSWERS (REPLIES) -------------------- //

router.post(
  "/questions/:questionId/answers",
  protect,
  authorizeRoles("student", "instructor"),
  createAnswer
);

// Get all answers for a question (any logged-in user)
router.get("/questions/:questionId/answers", protect, getQuestionAnswers);


// Upvote an answer (any logged-in user)
router.post("/answers/:answerId/upvote", protect, upvoteAnswer);

// Mark an answer as helpful / best answer
router.post("/answers/:answerId/mark-helpful", protect, markAnswerHelpful);

// Delete a question (author or course instructor)
router.delete("/questions/:questionId", protect, deleteQuestion);

// Delete an answer (author or course instructor)
router.delete("/answers/:answerId", protect, deleteAnswer);



export default router;
