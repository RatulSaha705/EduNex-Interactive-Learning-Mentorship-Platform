import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createCourse,
  getCourses,
  getCourseById,
  enrollInCourse,
  getMyCourses,
  updateCourse,
} from "../controllers/courseController.js";

const router = express.Router();

// ----------------- INSTRUCTOR ----------------- //

// Create a new course
router.post("/", protect, authorizeRoles("instructor"), createCourse);

// Update an existing course
router.put("/:id", protect, authorizeRoles("instructor"), updateCourse);

// ----------------- STUDENT ----------------- //

// Get logged-in student’s courses
router.get("/my-courses", protect, authorizeRoles("student"), getMyCourses);

// Enroll in a course
router.post("/:id/enroll", protect, authorizeRoles("student"), enrollInCourse);

// ----------------- COMMON / PUBLIC ----------------- //

// Get all courses
router.get("/", protect, getCourses);

// Get single course by ID
router.get("/:id", protect, getCourseById);

export default router;
