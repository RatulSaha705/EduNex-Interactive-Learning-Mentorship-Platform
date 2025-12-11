// backend/controllers/recommendationController.js
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

/**
 * Recommend courses based on student's most enrolled categories
 */
export const getMyCourseRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Number(req.query.limit) || 10;

    // 1. Get all courses the student is enrolled in
    const myEnrollments = await Enrollment.find({ user: userId })
      .populate("course", "category")
      .lean();

    const enrolledCategories = myEnrollments
      .map((e) => e.course?.category)
      .filter(Boolean);

    if (!enrolledCategories.length) {
      // Fallback: return popular courses if no enrollments
      const popularCourses = await Course.find({ status: "published" }).limit(
        limit
      );
      return res.json(popularCourses);
    }

    // Count frequency of each category
    const categoryCount = {};
    enrolledCategories.forEach((cat) => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // Find the most enrolled category (highest frequency)
    const maxCount = Math.max(...Object.values(categoryCount));
    const topCategories = Object.keys(categoryCount).filter(
      (cat) => categoryCount[cat] === maxCount
    );

    // 2. Candidate courses: published, not already enrolled, and in top categories
    const enrolledCourseIds = new Set(
      myEnrollments.map((e) => String(e.course._id))
    );

    const candidates = await Course.find({
      _id: { $nin: Array.from(enrolledCourseIds) },
      status: "published",
      category: { $in: topCategories }, // only courses from top categories
    }).lean();

    res.json(candidates.slice(0, limit));
  } catch (err) {
    console.error("Error in getMyCourseRecommendations:", err);
    res.status(500).json({
      message: "Error generating course recommendations",
      error: err.message,
    });
  }
};
