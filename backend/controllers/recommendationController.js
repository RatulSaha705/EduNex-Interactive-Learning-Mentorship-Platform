// backend/controllers/recommendationController.js
import mongoose from "mongoose";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";

/**
 * Recommend courses for the logged-in user.
 *
 * Logic:
 * 1. Get user interests (tags).
 * 2. Get courses the user is already enrolled in.
 * 3. Find candidate courses (not enrolled).
 * 4. Get popularity / rating stats per candidate course.
 * 5. Compute a score:
 *      score = interestsMatch * W1 + avgRating * W2 + popularity * W3
 * 6. Return top N.
 *
 * @route  GET /api/recommendations
 * @query  ?limit=10
 * @access Protected
 */
export const getMyCourseRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Number(req.query.limit) || 10;

    // 1. Load user with interests
    const user = await User.findById(userId).select("interests");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const interests = (user.interests || []).map((t) =>
      String(t).toLowerCase()
    );
    const interestSet = new Set(interests);

    // 2. Get courses the user is already enrolled in
    const myEnrollments = await Enrollment.find({ user: userId })
      .select("course")
      .lean();

    const enrolledCourseIds = new Set(
      myEnrollments.map((e) => String(e.course))
    );

    // 3. Candidate courses: not already enrolled
    const candidateCourses = await Course.find({})
      .select("title description tags lessons")
      .lean();

    const filteredCandidates = candidateCourses.filter(
      (c) => !enrolledCourseIds.has(String(c._id))
    );

    if (filteredCandidates.length === 0) {
      return res.json([]);
    }

    const candidateIds = filteredCandidates.map((c) => c._id);

    // 4. Popularity & rating stats for candidate courses
    const stats = await Enrollment.aggregate([
      {
        $match: {
          course: { $in: candidateIds },
        },
      },
      {
        $group: {
          _id: "$course",
          avgRating: { $avg: "$rating" },
          ratingCount: {
            $sum: {
              $cond: [{ $ifNull: ["$rating", false] }, 1, 0],
            },
          },
          enrollmentCount: { $sum: 1 },
        },
      },
    ]);

    const statsMap = new Map();
    for (const s of stats) {
      statsMap.set(String(s._id), {
        avgRating: s.avgRating || 0,
        ratingCount: s.ratingCount || 0,
        enrollmentCount: s.enrollmentCount || 0,
      });
    }

    // 5. Compute recommendation score
    const INTEREST_WEIGHT = 2;
    const RATING_WEIGHT = 1;
    const POPULARITY_WEIGHT = 0.5;

    const scored = filteredCandidates.map((course) => {
      const courseIdStr = String(course._id);

      const tags = (course.tags || []).map((t) =>
        String(t).toLowerCase()
      );
      let interestsMatch = 0;
      for (const tag of tags) {
        if (interestSet.has(tag)) interestsMatch += 1;
      }

      const stat = statsMap.get(courseIdStr) || {
        avgRating: 0,
        ratingCount: 0,
        enrollmentCount: 0,
      };

      const popularityScore =
        stat.enrollmentCount > 0
          ? Math.log10(stat.enrollmentCount + 1)
          : 0;

      const score =
        interestsMatch * INTEREST_WEIGHT +
        (stat.avgRating || 0) * RATING_WEIGHT +
        popularityScore * POPULARITY_WEIGHT;

      return {
        courseId: course._id,
        title: course.title,
        description: course.description,
        tags,
        score,
        stats: {
          avgRating: stat.avgRating,
          ratingCount: stat.ratingCount,
          enrollmentCount: stat.enrollmentCount,
        },
      };
    });

    // 6. Sort by score desc and return top N
    scored.sort((a, b) => b.score - a.score);

    return res.json(scored.slice(0, limit));
  } catch (err) {
    console.error("Error in getMyCourseRecommendations:", err);
    return res.status(500).json({
      message: "Error generating course recommendations",
      error: err.message,
    });
  }
};
