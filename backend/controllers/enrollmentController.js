// backend/controllers/enrollmentController.js
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * Enroll current user into a course
 * POST /api/enrollments
 * Body: { courseId }
 * Access: Protected (student/instructor)
 */
export const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "courseId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid courseId" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // count lessons for initial totalLessonsCount
    const totalLessonsCount = Array.isArray(course.lessons)
      ? course.lessons.length
      : 0;

    // upsert enrollment so repeated requests do not break
    const enrollment = await Enrollment.findOneAndUpdate(
      { user: req.user._id, course: courseId },
      {
        $setOnInsert: {
          status: "enrolled",
          "progress.totalLessonsCount": totalLessonsCount,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );

    return res.status(201).json(enrollment);
  } catch (err) {
    console.error("Error enrolling in course:", err);
    return res
      .status(500)
      .json({ message: "Error enrolling in course", error: err.message });
  }
};

/**
 * Get enrollments for current user
 * GET /api/enrollments/my
 * Access: Protected
 */
export const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate("course", "title description")
      .sort({ createdAt: -1 });

    return res.json(enrollments);
  } catch (err) {
    console.error("Error fetching user enrollments:", err);
    return res
      .status(500)
      .json({ message: "Error fetching enrollments", error: err.message });
  }
};

/**
 * Update progress for a single enrollment
 * PATCH /api/enrollments/:id/progress
 * Body: {
 *   completedLessonsCount?,
 *   totalLearningMinutesIncrement?,
 *   status?
 * }
 * Access: Protected (owner of enrollment)
 */
export const updateEnrollmentProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      completedLessonsCount,
      totalLearningMinutesIncrement,
      status,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid enrollment id" });
    }

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // user can update only own enrollment
    if (enrollment.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not allowed to update this enrollment" });
    }

    // update progress fields
    if (typeof completedLessonsCount === "number") {
      enrollment.progress.completedLessonsCount = completedLessonsCount;
    }

    if (typeof totalLearningMinutesIncrement === "number") {
      enrollment.progress.totalLearningMinutes += totalLearningMinutesIncrement;
    }

    if (status) {
      enrollment.status = status;
    }

    enrollment.progress.lastAccessedAt = new Date();

    await enrollment.save();

    // update user-level learningStats aggregate
    const user = await User.findById(req.user._id);
    if (user) {
      // simple aggregate: add minutes from this update
      if (typeof totalLearningMinutesIncrement === "number") {
        user.learningStats.totalLearningMinutes += totalLearningMinutesIncrement;
      }

      // for now, number of completed courses = count of user's enrollments with status "completed"
      const completedCount = await Enrollment.countDocuments({
        user: req.user._id,
        status: "completed",
      });
      user.learningStats.completedCoursesCount = completedCount;

      // sum of completed lessons across all enrollments
      const agg = await Enrollment.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
        {
          $group: {
            _id: null,
            totalCompletedLessons: {
              $sum: "$progress.completedLessonsCount",
            },
          },
        },
      ]);

      user.learningStats.completedLessonsCount =
        agg[0]?.totalCompletedLessons || 0;

      user.learningStats.lastActiveAt = new Date();

      await user.save();
    }

    return res.json(enrollment);
  } catch (err) {
    console.error("Error updating enrollment progress:", err);
    return res.status(500).json({
      message: "Error updating enrollment progress",
      error: err.message,
    });
  }
};

/**
 * Rate a course via its enrollment
 * PATCH /api/enrollments/:id/rating
 * Body: { rating, review? }
 * Access: Protected (owner of enrollment)
 */
export const rateCourseFromEnrollment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid enrollment id" });
    }

    const enrollment = await Enrollment.findById(id);
    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (enrollment.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not allowed to rate this course" });
    }

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "rating must be a number between 1 and 5" });
    }

    enrollment.rating = rating;
    if (review !== undefined) {
      enrollment.review = review;
    }

    await enrollment.save();

    return res.json(enrollment);
  } catch (err) {
    console.error("Error rating course from enrollment:", err);
    return res
      .status(500)
      .json({ message: "Error rating course", error: err.message });
  }
};
