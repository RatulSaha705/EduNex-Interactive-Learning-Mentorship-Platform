// backend/controllers/adminAnalyticsController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Report from "../models/Report.js";

/**
 * @desc   High-level admin overview:
 *         - total users (by role)
 *         - total courses
 *         - enrollments & learning minutes
 *         - open reports
 * @route  GET /api/admin/overview
 * @access Admin (enforced in routes with authorizeRoles("admin"))
 */
export const getAdminDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      totalEnrollments,
      learningMinutesAgg,
      openReportsCount,
      totalReports,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "instructor" }),
      User.countDocuments({ role: "admin" }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      User.aggregate([
        {
          $group: {
            _id: null,
            totalMinutes: {
              $sum: "$learningStats.totalLearningMinutes",
            },
          },
        },
      ]),
      Report.countDocuments({ status: { $in: ["open", "in_review"] } }),
      Report.countDocuments(),
    ]);

    const totalLearningMinutes =
      learningMinutesAgg.length > 0 ? learningMinutesAgg[0].totalMinutes : 0;

    return res.json({
      users: {
        total: totalUsers,
        students: totalStudents,
        instructors: totalInstructors,
        admins: totalAdmins,
      },
      courses: {
        total: totalCourses,
      },
      enrollments: {
        total: totalEnrollments,
      },
      learning: {
        totalLearningMinutes,
      },
      reports: {
        open: openReportsCount,
        total: totalReports,
      },
    });
  } catch (err) {
    console.error("Error in getAdminDashboardOverview:", err);
    return res.status(500).json({
      message: "Error fetching admin overview",
      error: err.message,
    });
  }
};

/**
 * @desc   Top-rated courses (for admin / analytics):
 *         - average rating & number of ratings
 *         - joined with course title
 * @route  GET /api/admin/top-rated-courses?limit=5
 * @access Admin
 */
export const getTopRatedCourses = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;

    const pipeline = [
      {
        $match: {
          rating: { $gte: 1 }, // only rated enrollments
        },
      },
      {
        $group: {
          _id: "$course",
          avgRating: { $avg: "$rating" },
          ratingsCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          avgRating: -1,
          ratingsCount: -1,
        },
      },
      { $limit: limit },
      {
        $lookup: {
          from: "courses", // Mongoose pluralises 'Course' -> 'courses'
          localField: "_id",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: "$course" },
      {
        $project: {
          _id: 0,
          courseId: "$course._id",
          title: "$course.title",
          description: "$course.description",
          avgRating: { $round: ["$avgRating", 2] },
          ratingsCount: 1,
        },
      },
    ];

    const results = await Enrollment.aggregate(pipeline);
    return res.json(results);
  } catch (err) {
    console.error("Error in getTopRatedCourses:", err);
    return res.status(500).json({
      message: "Error fetching top rated courses",
      error: err.message,
    });
  }
};

/**
 * @desc   System usage trends (basic):
 *         - new users per day
 *         - new enrollments per day
 *         last N days (default 7)
 * @route  GET /api/admin/system-usage?days=7
 * @access Admin
 */
export const getSystemUsageTrends = async (req, res) => {
  try {
    const days = Number(req.query.days) || 7;
    const now = new Date();
    const since = new Date();
    since.setDate(now.getDate() - (days - 1)); // include today

    // Helper pipeline builder for "per day" counts
    const buildPerDayPipeline = (dateField) => [
      {
        $match: {
          [dateField]: { $gte: since },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: `$${dateField}`,
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const [usersPerDay, enrollmentsPerDay] = await Promise.all([
      User.aggregate(buildPerDayPipeline("createdAt")),
      Enrollment.aggregate(buildPerDayPipeline("createdAt")),
    ]);

    return res.json({
      range: {
        from: since.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
        days,
      },
      usersPerDay,
      enrollmentsPerDay,
    });
  } catch (err) {
    console.error("Error in getSystemUsageTrends:", err);
    return res.status(500).json({
      message: "Error fetching system usage trends",
      error: err.message,
    });
  }
};
