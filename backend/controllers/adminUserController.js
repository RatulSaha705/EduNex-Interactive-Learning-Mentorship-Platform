// backend/controllers/adminUserController.js
import mongoose from "mongoose";
import User from "../models/User.js";

/**
 * @desc   Get all users (admin)
 *         Supports filters:
 *           ?role=student|instructor|admin
 *           ?isActive=true|false
 *           ?search=keyword  (matches name/email)
 *           ?page=1&limit=20
 * @route  GET /api/admin/users
 * @access Admin (via authorizeRoles in routes)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (isActive === "true" || isActive === "false") {
      query.isActive = isActive === "true";
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};

/**
 * @desc   Get single user by id (admin)
 * @route  GET /api/admin/users/:id
 * @access Admin
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error in getUserById:", err);
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
};

/**
 * @desc   Update a user's role (admin)
 * @body   { role: "student" | "instructor" | "admin" }
 * @route  PATCH /api/admin/users/:id/role
 * @access Admin
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["student", "instructor", "admin"];
    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "role must be one of: student, instructor, admin",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // prevent an admin from demoting themselves out of admin
    if (
      req.user &&
      req.user._id.toString() === user._id.toString() &&
      req.user.role === "admin" &&
      role !== "admin"
    ) {
      return res.status(400).json({
        message: "You cannot change your own role from admin to another role",
      });
    }

    user.role = role;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({
      message: "User role updated successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("Error in updateUserRole:", err);
    res
      .status(500)
      .json({ message: "Error updating user role", error: err.message });
  }
};

/**
 * @desc   Activate / deactivate a user (soft delete)
 * @body   { isActive: boolean }
 * @route  PATCH /api/admin/users/:id/status
 * @access Admin
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive must be a boolean value" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // optional: prevent admin from deactivating themselves
    if (
      req.user &&
      req.user._id.toString() === user._id.toString() &&
      isActive === false
    ) {
      return res.status(400).json({
        message: "You cannot deactivate your own account",
      });
    }

    user.isActive = isActive;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({
      message: "User status updated successfully",
      user: safeUser,
    });
  } catch (err) {
    console.error("Error in updateUserStatus:", err);
    res.status(500).json({
      message: "Error updating user status",
      error: err.message,
    });
  }
};
