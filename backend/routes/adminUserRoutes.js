// backend/routes/adminUserRoutes.js
import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
} from "../controllers/adminUserController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// All routes below are protected + admin-only
router.use(protect, authorizeRoles("admin"));

/**
 * @route   GET /api/admin/users
 * @desc    Get list of users with filters & pagination
 * @access  Admin
 */
router.get("/users", getAllUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get a single user by id
 * @access  Admin
 */
router.get("/users/:id", getUserById);

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Update a user's role (student / instructor / admin)
 * @access  Admin
 */
router.patch("/users/:id/role", updateUserRole);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Activate / deactivate a user (soft delete)
 * @access  Admin
 */
router.patch("/users/:id/status", updateUserStatus);

export default router;
