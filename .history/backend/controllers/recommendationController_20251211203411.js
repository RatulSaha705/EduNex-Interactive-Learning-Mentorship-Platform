// backend/controllers/recommendationController.js
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import User from "../models/User.js";

/**
 * Recommend courses based on student's enrolled course categories
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
      // fallback: return popular courses if no enrollments
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

    // Sort categories by frequency (most enrolled first)
    const sortedCategories = Object.keys(categoryCount).sort(
      (a, b) => categoryCount[b] - categoryCount[a]
    );

    // 2. Candidate courses: published and not already enrolled
    const enrolledCourseIds = new Set(
      myEnrollments.map((e) => String(e.course._id))
    );
    const candidates = await Course.find({
      _id: { $nin: Array.from(enrolledCourseIds) },
      status: "published",
    }).lean();

    // 3. Score candidates based on matching most frequent categories
    const scored = candidates.map((course) => {
      let score = 0;
      const categoryIndex = sortedCategories.indexOf(course.category);
      if (categoryIndex !== -1) {
        // higher score for categories the student is more enrolled in
        score = sortedCategories.length - categoryIndex;
      }
      return { ...course, score };
    });

    // 4. Sort by score descending and return top N
    scored.sort((a, b) => b.score - a.score);

    res.json(scored.slice(0, limit));
  } catch (err) {
    console.error("Error in getMyCourseRecommendations:", err);
    res.status(500).json({
      message: "Error generating course recommendations",
      error: err.message,
    });
  }
};
