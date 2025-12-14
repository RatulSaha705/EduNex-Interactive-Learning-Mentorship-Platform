// backend/controllers/statsController.js
import Course from "../models/Course.js";
import LearningActivity from "../models/LearningActivity.js";
import Certificate from "../models/Certificate.js";

export const calculateLearningStats = async (studentId) => {
  // All courses where the student is enrolled
  const courses = await Course.find({
    enrolledStudents: studentId,
  }).populate("instructor", "name email");

  // All completed-lesson activities for this student
  const activities = await LearningActivity.find({
    student: studentId,
    activityType: "lesson_completed",
  });

  // Certificates for this student (to mark completed courses)
  const certificates = await Certificate.find({ student: studentId });

  const totalCourses = courses.length;

  const courseSummaries = courses.map((course) => {
    const totalLessons = course.lessons?.length || 0;

    const studentProgress = course.completedLessons?.find(
      (cl) => cl.student.toString() === studentId
    );

    const completedLessonIds = studentProgress?.lessons || [];
    const completedCount = completedLessonIds.length;

    const progress = totalLessons
      ? Math.floor((completedCount / totalLessons) * 100)
      : 0;

    const courseActivities = activities.filter(
      (act) => act.course.toString() === course._id.toString()
    );

    const learningMinutes = courseActivities.reduce(
      (sum, act) => sum + (act.durationMinutes || 0),
      0
    );

    const cert = certificates.find(
      (c) => c.course.toString() === course._id.toString()
    );

    return {
      courseId: course._id,
      title: course.title,
      category: course.category || "General",
      instructor: course.instructor?.name || "Unknown",
      lessonsTotal: totalLessons,
      lessonsCompleted: completedCount,
      progress,
      status: progress === 100 ? "Completed" : "In Progress",
      hasCertificate: !!cert,
      completionDate: cert?.completionDate,
      learningMinutes,
    };
  });

  const totalLessonsCompleted = courseSummaries.reduce(
    (sum, c) => sum + c.lessonsCompleted,
    0
  );

  const totalLearningMinutes = courseSummaries.reduce(
    (sum, c) => sum + c.learningMinutes,
    0
  );

  const completedCourses = courseSummaries.filter(
    (c) => c.status === "Completed"
  ).length;

  const summary = {
    totalCourses,
    completedCourses,
    inProgressCourses: totalCourses - completedCourses,
    totalLessonsCompleted,
    totalLearningMinutes,
    totalLearningHours: Number((totalLearningMinutes / 60).toFixed(1)),
  };

  // Simple "last 7 days" activity timeline
  const now = new Date();
  const activityLast7Days = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - i
    );
    const dayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - i + 1
    );

    const minutes = activities
      .filter((act) => act.completedAt >= dayStart && act.completedAt < dayEnd)
      .reduce((sum, act) => sum + (act.durationMinutes || 0), 0);

    activityLast7Days.push({
      date: dayStart.toISOString().slice(0, 10),
      minutes,
    });
  }

  // This is what both the API and PDF generator will use
  return {
    summary,
    perCourse: courseSummaries,
    activityLast7Days,
  };
};


export const getMyLearningStats = async (req, res) => {
  try {
    const studentId = req.user.id;
    const stats = await calculateLearningStats(studentId);
    res.json(stats);
  } catch (err) {
    console.error("Error in getMyLearningStats:", err);
    res.status(500).json({
      message: "Failed to load learning stats",
      error: err.message,
    });
  }
};
