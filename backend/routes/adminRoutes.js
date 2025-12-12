// backend/routes/adminRoutes.js
import express from "express";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllCoursesForAdmin,
  updateCourseStatusAdmin,
  getAllContentReports,
  updateReportStatus,
  getSystemAnalytics,
} from "../controllers/adminController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

const requireAdmin = [protect, authorizeRoles("admin")];

// Users
router.get("/users", requireAdmin, getAllUsers);
router.patch("/users/:id/role", requireAdmin, updateUserRole);
router.delete("/users/:id", requireAdmin, deleteUser);

// Courses
router.get("/courses", requireAdmin, getAllCoursesForAdmin);
router.patch("/courses/:id/status", requireAdmin, updateCourseStatusAdmin);

// Reported content
router.get("/reports", requireAdmin, getAllContentReports);
router.patch("/reports/:id/status", requireAdmin, updateReportStatus);

router.get("/analytics", getSystemAnalytics);

export default router;
