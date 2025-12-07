// backend/controllers/courseAnalyticsController.js
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Report from "../models/Report.js";

/**
 * @desc   Get analytics for a single course:
 *         - total enrollments
 *         - completed enrollments + completion rate
 *         - total learning minutes across all students
 *         - average rating + rating count
 *         - open & total reports against this course
 *
 * @route  GET /api/courses/:id/analytics
 * @access Protected (typically instructor for this course or admin)
 */
export const getCourseAnalytics = async (req, res) => {
  try {
    const { id: courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }

    // 1. Ensure course exists
    const course = await Course.findById(courseId).populate(
      "instructor",
      "name email role"
    );
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Optional: access control at controller level
    // In routes, you should already use:
    //  - protect
    //  - authorizeRoles("instructor", "admin")
    //
    // If you want to restrict instructors to only their own courses:
    if (
      req.user.role === "instructor" &&
      course.instructor &&
      course.instructor._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not allowed to view analytics for this course" });
    }

    const courseObjectId = new mongoose.Types.ObjectId(courseId);

    // 2. Aggregate enrollment-based stats for this course
    const enrollmentAgg = await Enrollment.aggregate([
      { $match: { course: courseObjectId } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          completedEnrollments: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          totalLearningMinutes: {
            $sum: "$progress.totalLearningMinutes",
          },
          avgRating: { $avg: "$rating" },
          ratingCount: {
            $sum: {
              $cond: [{ $ifNull: ["$rating", false] }, 1, 0],
            },
          },
        },
      },
    ]);

    const agg = enrollmentAgg[0] || {
      totalEnrollments: 0,
      completedEnrollments: 0,
      totalLearningMinutes: 0,
      avgRating: null,
      ratingCount: 0,
    };

    const completionRate =
      agg.totalEnrollments > 0
        ? agg.completedEnrollments / agg.totalEnrollments
        : 0;

    // 3. Report stats for this course
    const [openReportsCount, totalReportsCount] = await Promise.all([
      Report.countDocuments({
        targetType: "course",
        targetId: courseObjectId,
        status: { $in: ["open", "in_review"] },
      }),
      Report.countDocuments({
        targetType: "course",
        targetId: courseObjectId,
      }),
    ]);

    return res.json({
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        tags: course.tags,
        status: course.status,
        instructor: course.instructor
          ? {
            _id: course.instructor._id,
            name: course.instructor.name,
            email: course.instructor.email,
            role: course.instructor.role,
          }
          : null,
      },
      stats: {
        totalEnrollments: agg.totalEnrollments,
        completedEnrollments: agg.completedEnrollments,
        completionRate, // 0–1; front-end can show as percentage
        totalLearningMinutes: agg.totalLearningMinutes,
        avgRating: agg.avgRating, // may be null if no ratings yet
        ratingCount: agg.ratingCount,
      },
      reports: {
        open: openReportsCount,
        total: totalReportsCount,
      },
    });
  } catch (err) {
    console.error("Error in getCourseAnalytics:", err);
    return res.status(500).json({
      message: "Error fetching course analytics",
      error: err.message,
    });
  }
};
