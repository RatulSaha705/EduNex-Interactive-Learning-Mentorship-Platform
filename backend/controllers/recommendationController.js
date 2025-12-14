// backend/controllers/recommendationController.js
import Course from "../models/Course.js";

export const getMyCourseRecommendations = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;

    const myCourses = await Course.find({
      enrolledStudents: studentId,
    }).select("category title");

    const categoryCounts = {};
    myCourses.forEach((course) => {
      let cat = (course.category || "").trim();
      if (!cat) cat = "General";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    let preferredCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1]) // highest count first
      .map(([cat]) => cat);

    let recommendations = [];
    let basedOnCategories = [];

    //If we have history, use top categories (e.g. top 2)
    if (preferredCategories.length > 0) {
      basedOnCategories = preferredCategories.slice(0, 2);

      let candidateCourses = await Course.find({
        status: "published",
        category: { $in: basedOnCategories },
        // not already enrolled
        enrolledStudents: { $nin: [studentId] },
      })
        .select(
          "title description category instructor enrolledStudents startDate endDate status"
        )
        .populate("instructor", "name email");

      // Sort by popularity (most enrolled first)
      candidateCourses.sort(
        (a, b) =>
          (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0)
      );

      recommendations = candidateCourses.slice(0, 8);
    }

    // if no history OR no candidates, show popular courses in general
    if (recommendations.length === 0) {
      let fallbackCourses = await Course.find({
        status: "published",
        enrolledStudents: { $nin: [studentId] },
      })
        .select(
          "title description category instructor enrolledStudents startDate endDate status"
        )
        .populate("instructor", "name email");

      fallbackCourses.sort(
        (a, b) =>
          (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0)
      );

      recommendations = fallbackCourses.slice(0, 8);
      basedOnCategories = [];
    }

    // Shape JSON nicely for frontend
    const formatted = recommendations.map((c) => ({
      _id: c._id,
      title: c.title,
      description: c.description,
      category: c.category || "General",
      instructor: c.instructor
        ? { _id: c.instructor._id, name: c.instructor.name }
        : null,
      totalEnrolled: c.enrolledStudents ? c.enrolledStudents.length : 0,
      status: c.status,
      startDate: c.startDate,
      endDate: c.endDate,
    }));

    return res.json({
      basedOnCategories,
      recommendations: formatted,
    });
  } catch (err) {
    console.error("Error in getMyCourseRecommendations:", err);
    return res.status(500).json({
      message: "Failed to load course recommendations",
      error: err.message,
    });
  }
};
