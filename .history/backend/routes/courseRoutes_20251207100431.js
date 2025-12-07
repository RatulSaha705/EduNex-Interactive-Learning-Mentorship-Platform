import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  createCourse,
  getCourses,
  getCourseById,
  enrollInCourse,
  getMyCourses,
  updateCourse,
  addLessonToCourse,
  deleteLesson,
  completeLesson,
  updateCourseStatus,
  setEstimatedDuration, // ✅ add this
} from "../controllers/courseController.js";

const router = express.Router();

// ----------------- INSTRUCTOR ----------------- //

// Create course
router.post("/", protect, authorizeRoles("instructor"), createCourse);

// Update course
router.put("/:id", protect, authorizeRoles("instructor"), updateCourse);

// ✅ Add lesson to course
router.post(
  "/:id/lessons",
  protect,
  authorizeRoles("instructor"),
  addLessonToCourse
);

// ✅ Delete lesson
router.delete(
  "/:courseId/lessons/:lessonId",
  protect,
  authorizeRoles("instructor"),
  deleteLesson
);

// ----------------- STUDENT ----------------- //

// Get student's enrolled courses
router.get("/my-courses", protect, authorizeRoles("student"), getMyCourses);

// Enroll
router.post("/:id/enroll", protect, authorizeRoles("student"), enrollInCourse);

// ✅ Mark lesson as completed
router.post(
  "/:courseId/lessons/:lessonId/complete",
  protect,
  authorizeRoles("student"),
  completeLesson
);
// ✅ Publish / Unpublish course
router.put(
  "/:id/status",
  protect,
  authorizeRoles("instructor"),
  updateCourseStatus
);
router.put("/courses/:id/duration", authMiddleware, setEstimatedDuration);

// ----------------- COMMON ----------------- //

// Get all courses
router.get("/", protect, getCourses);

// Get course by id
router.get("/:id", protect, getCourseById);

export default router;
