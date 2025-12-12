// backend/controllers/adminController.js
import User from "../models/User.js";
import Course from "../models/Course.js";
import Report from "../models/Report.js";

/* ===================== USERS ===================== */

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    res.status(500).json({
      message: "Failed to load users",
      error: err.message,
    });
  }
};

// PATCH /api/admin/users/:id/role  { role }
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["student", "instructor", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Prevent admin from demoting themselves to avoid locking out all admins
    if (req.user.id === id && role !== "admin") {
      return res.status(400).json({
        message: "You cannot change your own role away from admin.",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select("name email role createdAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User role updated",
      user,
    });
  } catch (err) {
    console.error("Error in updateUserRole:", err);
    res.status(500).json({
      message: "Failed to update user role",
      error: err.message,
    });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account." });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error in deleteUser:", err);
    res.status(500).json({
      message: "Failed to delete user",
      error: err.message,
    });
  }
};

/* ===================== COURSES ===================== */

// GET /api/admin/courses
export const getAllCoursesForAdmin = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    const formatted = courses.map((c) => ({
      _id: c._id,
      title: c.title,
      category: c.category || "General",
      status: c.status,
      enrolledCount: c.enrolledStudents ? c.enrolledStudents.length : 0,
      instructor: c.instructor
        ? {
            _id: c.instructor._id,
            name: c.instructor.name,
            email: c.instructor.email,
          }
        : null,
      createdAt: c.createdAt,
    }));

    res.json({ courses: formatted });
  } catch (err) {
    console.error("Error in getAllCoursesForAdmin:", err);
    res.status(500).json({
      message: "Failed to load courses",
      error: err.message,
    });
  }
};

// PATCH /api/admin/courses/:id/status  { status }
export const updateCourseStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["draft", "published", "archived"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid course status" });
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("instructor", "name email");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({
      message: "Course status updated",
      course,
    });
  } catch (err) {
    console.error("Error in updateCourseStatusAdmin:", err);
    res.status(500).json({
      message: "Failed to update course status",
      error: err.message,
    });
  }
};

/* ===================== REPORTED CONTENT ===================== */

// GET /api/admin/reports
export const getAllContentReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    const formatted = reports.map((r) => {
      // Prefer the stored snapshot
      let targetLabel = r.targetSummary || "";

      // Fallbacks if targetSummary is missing
      if (!targetLabel) {
        if (r.targetType === "course" && r.course) {
          targetLabel = `Course: ${r.course.title}`;
        } else if (r.targetType === "question") {
          targetLabel = "Question (details not available)";
        } else if (r.targetType === "answer") {
          targetLabel = "Answer (details not available)";
        } else if (r.targetType === "user") {
          targetLabel = "User account";
        } else {
          targetLabel = "Reported item";
        }
      }

      return {
        _id: r._id,
        targetType: r.targetType,
        targetLabel,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
        // AdminPage expects `reportedBy`, but our model field is `reporter`
        reportedBy: r.reporter
          ? {
              _id: r.reporter._id,
              name: r.reporter.name,
              email: r.reporter.email,
            }
          : null,
      };
    });

    res.json({ reports: formatted });
  } catch (err) {
    console.error("Error in getAllContentReports:", err);
    res.status(500).json({
      message: "Failed to load reported content",
      error: err.message,
    });
  }
};

// PATCH /api/admin/reports/:id/status  { status }
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["open", "in_review", "resolved", "dismissed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid report status" });
    }

    const report = await Report.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({
      message: "Report status updated",
      report,
    });
  } catch (err) {
    console.error("Error in updateReportStatus:", err);
    res.status(500).json({
      message: "Failed to update report status",
      error: err.message,
    });
  }
};
