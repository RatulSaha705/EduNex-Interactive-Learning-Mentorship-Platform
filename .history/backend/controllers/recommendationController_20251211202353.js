export const getMyCourseRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Number(req.query.limit) || 10;

    // 1. Load user interests
    const user = await User.findById(userId).select("interests");
    if (!user) return res.status(404).json({ message: "User not found" });

    const interestSet = new Set(
      (user.interests || []).map((t) => String(t).toLowerCase())
    );

    // 2. Get user enrollments
    const myEnrollments = await Enrollment.find({ user: userId })
      .populate("course")
      .lean();
    const enrolledCourseIds = new Set(
      myEnrollments.map((e) => String(e.course._id))
    );

    // 2a. Count enrolled categories
    const categoryCounts = {};
    for (const e of myEnrollments) {
      const cat = e.course.category || "other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    // 3. Candidate courses (not enrolled)
    const candidateCourses = await Course.find({})
      .select("title description tags category lessons")
      .lean();
    const filteredCandidates = candidateCourses.filter(
      (c) => !enrolledCourseIds.has(String(c._id))
    );
    if (!filteredCandidates.length) return res.json([]);

    const candidateIds = filteredCandidates.map((c) => c._id);

    // 4. Popularity & rating stats
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
    stats.forEach((s) =>
      statsMap.set(String(s._id), {
        avgRating: s.avgRating || 0,
        ratingCount: s.ratingCount || 0,
        enrollmentCount: s.enrollmentCount || 0,
      })
    );

    // 5. Compute score with category preference
    const INTEREST_WEIGHT = 2;
    const CATEGORY_WEIGHT = 2; // new weight for preferred categories
    const RATING_WEIGHT = 1;
    const POPULARITY_WEIGHT = 0.5;

    const scored = filteredCandidates.map((course) => {
      const courseIdStr = String(course._id);

      // interests match
      const tags = (course.tags || []).map((t) => String(t).toLowerCase());
      let interestsMatch = 0;
      tags.forEach((tag) => {
        if (interestSet.has(tag)) interestsMatch++;
      });

      // category preference
      const categoryScore = categoryCounts[course.category || "other"] || 0;

      // stats
      const stat = statsMap.get(courseIdStr) || {
        avgRating: 0,
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
          ratingCount: stat.ratingCount || 0,
          enrollmentCount: stat.enrollmentCount,
        },
      };
    });

    // 6. Sort & return top N
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
