// backend/controllers/recommendationController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

/**
 * Recommend courses for the logged-in user based on:
 * 1. Most enrolled categories
 * 2. User interests (tags)
 * 3. Average ratings
 * 4. Popularity (enrollment count)
 *
 * @route  GET /api/recommendations
 * @query  ?limit=10
 * @access Protected
 */
export const getMyCourseRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Number(req.query.limit) || 10;

    // 1. Load user interests
    const user = await User.findById(userId).select("interests");
    if (!user) return res.status(404).json({ message: "User not found" });

    const interests = (user.interests || []).map((t) =>
      String(t).toLowerCase()
    );
    const interestSet = new Set(interests);

    // 2. Courses the user is already enrolled in
    const myEnrollments = await Enrollment.find({ user: userId })
      .select("course")
      .lean();
    const enrolledCourseIds = new Set(
      myEnrollments.map((e) => String(e.course))
    );

    // 3. Get categories the student enrolled most
    const enrolledCourses = await Course.find({
      _id: { $in: Array.from(enrolledCourseIds) },
    })
      .select("category")
      .lean();
    const categoryCount = {};
    enrolledCourses.forEach((c) => {
      if (c.category)
        categoryCount[c.category.toLowerCase()] =
          (categoryCount[c.category.toLowerCase()] || 0) + 1;
    });

    // 4. Candidate courses: not enrolled
    const candidateCourses = await Course.find({
      _id: { $nin: Array.from(enrolledCourseIds) },
      status: "published",
    })
      .select("title description tags category lessons")
      .lean();

    if (!candidateCourses.length) return res.json([]);

    const candidateIds = candidateCourses.map((c) => c._id);

    // 5. Popularity & rating stats
    const stats = await Enrollment.aggregate([
      { $match: { course: { $in: candidateIds } } },
      {
        $group: {
          _id: "$course",
          avgRating: { $avg: "$rating" },
          ratingCount: {
            $sum: { $cond: [{ $ifNull: ["$rating", false] }, 1, 0] },
          },
          enrollmentCount: { $sum: 1 },
        },
      },
    ]);

    const statsMap = new Map();
    stats.forEach((s) => {
      statsMap.set(String(s._id), {
        avgRating: s.avgRating || 0,
        ratingCount: s.ratingCount || 0,
        enrollmentCount: s.enrollmentCount || 0,
      });
    });

    // 6. Compute recommendation score
    const INTEREST_WEIGHT = 2;
    const CATEGORY_WEIGHT = 3;
    const RATING_WEIGHT = 1;
    const POPULARITY_WEIGHT = 0.5;

    const scored = candidateCourses.map((course) => {
      const courseIdStr = String(course._id);

      // Tag match
      const tags = (course.tags || []).map((t) => String(t).toLowerCase());
      let interestsMatch = 0;
      tags.forEach((tag) => {
        if (interestSet.has(tag)) interestsMatch += 1;
      });

      // Category match
      const cat = course.category?.toLowerCase();
      const categoryScore = cat && categoryCount[cat] ? categoryCount[cat] : 0;

      // Stats
      const stat = statsMap.get(courseIdStr) || {
        avgRating: 0,
        ratingCount: 0,
        enrollmentCount: 0,
      };
      const popularityScore =
        stat.enrollmentCount > 0 ? Math.log10(stat.enrollmentCount + 1) : 0;

      const score =
        interestsMatch * INTEREST_WEIGHT +
        categoryScore * CATEGORY_WEIGHT +
        (stat.avgRating || 0) * RATING_WEIGHT +
        popularityScore * POPULARITY_WEIGHT;

      return {
        courseId: course._id,
        title: course.title,
        description: course.description,
        tags,
        category: course.category,
        score,
        stats: {
          avgRating: stat.avgRating,
          ratingCount: stat.ratingCount,
          enrollmentCount: stat.enrollmentCount,
        },
      };
    });

    // 7. Sort by score descending and return top N
    scored.sort((a, b) => b.score - a.score);
    return res.json(scored.slice(0, limit));
  } catch (err) {
    console.error("Error in getMyCourseRecommendations:", err);
    return res
      .status(500)
      .json({
        message: "Error generating course recommendations",
        error: err.message,
      });
  }
};
