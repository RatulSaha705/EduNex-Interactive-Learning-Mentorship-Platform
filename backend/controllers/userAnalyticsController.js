// backend/controllers/userAnalyticsController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";

/**
 * @desc   Get aggregated learning stats for the logged-in user
 *         Uses User.learningStats plus a quick sanity aggregate
 * @route  GET /api/me/learning-stats
 * @access Protected
 */
export const getMyLearningStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get latest user-level stats
    const user = await User.findById(userId).select(
      "learningStats name email role"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Optionally cross-check with enrollments for consistency
    const aggregates = await Enrollment.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          totalLearningMinutes: {
            $sum: "$progress.totalLearningMinutes",
          },
          totalCompletedLessons: {
            $sum: "$progress.completedLessonsCount",
          },
          completedCoursesCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const fromEnrollments = aggregates[0] || {
      totalLearningMinutes: 0,
      totalCompletedLessons: 0,
      completedCoursesCount: 0,
    };

    return res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      learningStats: {
        stored: user.learningStats || {},
        recomputed: {
          totalLearningMinutes: fromEnrollments.totalLearningMinutes,
          completedLessonsCount: fromEnrollments.totalCompletedLessons,
          completedCoursesCount: fromEnrollments.completedCoursesCount,
        },
      },
    });
  } catch (err) {
    console.error("Error in getMyLearningStats:", err);
    return res.status(500).json({
      message: "Error fetching learning stats",
      error: err.message,
    });
  }
};

/**
 * @desc   Get per-course learning breakdown for logged-in user
 *         - course title
 *         - status
 *         - minutes spent
 *         - lessons completed / total
 *         This powers a "My learning analytics" page.
 * @route  GET /api/me/learning-courses
 * @access Protected
 */
export const getMyCourseLearningBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;

    const enrollments = await Enrollment.find({ user: userId })
      .populate("course", "title description")
      .sort({ "progress.lastAccessedAt": -1 });

    const data = enrollments.map((en) => ({
      enrollmentId: en._id,
      courseId: en.course?._id,
      courseTitle: en.course?.title,
      courseDescription: en.course?.description,
      status: en.status,
      totalLearningMinutes: en.progress.totalLearningMinutes || 0,
      completedLessonsCount: en.progress.completedLessonsCount || 0,
      totalLessonsCount: en.progress.totalLessonsCount || 0,
      lastAccessedAt: en.progress.lastAccessedAt,
      createdAt: en.createdAt,
    }));

    return res.json(data);
  } catch (err) {
    console.error("Error in getMyCourseLearningBreakdown:", err);
    return res.status(500).json({
      message: "Error fetching course learning breakdown",
      error: err.message,
    });
  }
};
