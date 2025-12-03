
import express from "express";
import {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse
} from "../controllers/courseController.js";
import { protect } from "../middleware/authMiddleware.js";
// optionally role‑based middleware if you implement it
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// @route   POST /api/courses
// @desc    Create a new course — only instructors or admins
router.post(
  "/",
  protect,
  authorizeRoles("instructor", "admin"),
  createCourse
);

// @route   GET /api/courses
// @desc    Get all courses — public or optionally protected
router.get("/", getAllCourses);

// @route   GET /api/courses/:id
// @desc    Get a single course by ID
router.get("/:id", getCourseById);

// @route   PUT /api/courses/:id
// @desc    Update a course — only owner instructor or admin
router.put(
  "/:id",
  protect,
  authorizeRoles("instructor", "admin"),
  updateCourse
);

// @route   DELETE /api/courses/:id
// @desc    Delete a course — only owner instructor or admin
router.delete(
  "/:id",
  protect,
  authorizeRoles("instructor", "admin"),
  deleteCourse
);

export default router;
