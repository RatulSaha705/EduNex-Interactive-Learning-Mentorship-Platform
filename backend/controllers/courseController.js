import Course from "../models/Course.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
// backend/controllers/courseController.js
import { issueCertificateOnCourseCompletion } from "./certificateController.js";

// ----------------- INSTRUCTOR ----------------- //

// ----------------- INSTRUCTOR -----------------

// Create course (instructor only)
export const createCourse = async (req, res) => {
  try {
    const { title, description, category, startDate, endDate } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Course title is required" });
    }

    const newCourse = new Course({
      title: title.trim(),
      description: description?.trim() || "",
      category: category?.trim() || "",
      instructor: req.user.id,
      status: "draft", // ✅ default to draft
      startDate: startDate || null,
      endDate: endDate || null,
      duration:
        startDate && endDate
          ? Math.ceil(
              (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
            )
          : null,
    });

    await newCourse.save();
    res
      .status(201)
      .json({ message: "Course created successfully", course: newCourse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all courses with optional filters
export const getCourses = async (req, res) => {
  try {
    const { category, instructor } = req.query;
    let filter = {};

    if (req.user.role === "student") {
      filter.status = "published";
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" };
    }

    if (instructor) {
      const instructors = await User.find({
        name: { $regex: instructor, $options: "i" },
      }).select("_id");
      filter.instructor = { $in: instructors.map((u) => u._id) };
    }

    const courses = await Course.find(filter).populate(
      "instructor",
      "name email"
    );
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single course
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "name email"
    );

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.user.role === "student" && course.status !== "published") {
      return res
        .status(403)
        .json({ message: "This course is not published yet" });
    }

    res.json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { title, description, category, startDate, endDate } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.startDate = startDate || course.startDate;
    course.endDate = endDate || course.endDate;

    if (course.startDate && course.endDate) {
      course.duration = Math.ceil(
        (new Date(course.endDate) - new Date(course.startDate)) /
          (1000 * 60 * 60 * 24)
      );
    }

    await course.save();
    res.json({ message: "Course updated successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ ADD LESSON TO COURSE (Instructor Only)
export const addLessonToCourse = async (req, res) => {
  try {
    const { title, contentType, url } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    course.lessons.push({
      title,
      contentType,
      url,
    });

    await course.save();

    // 🔔 Notification: all enrolled students get alert about the new lesson
    try {
      if (course.enrolledStudents && course.enrolledStudents.length > 0) {
        const notifications = course.enrolledStudents.map((studentId) => ({
          user: studentId,
          type: "lesson_added",
          title: `New lesson in ${course.title}`,
          message: `Lesson "${title}" has been added by ${req.user.name} in "${course.title}".`,
          link: `/student/courses/${course._id}`,
          course: course._id,
        }));

        await Notification.insertMany(notifications);
      }
    } catch (notifyErr) {
      console.error("Error creating notifications for new lesson:", notifyErr);
      // don't block main response if notifications fail
    }

    res.json({ message: "Lesson added successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE LESSON
export const deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    course.lessons = course.lessons.filter(
      (lesson) => lesson._id.toString() !== lessonId
    );

    await course.save();
    res.json({ message: "Lesson deleted", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------- STUDENT -----------------

export const enrollInCourse = async (req, res) => {
  try {
    // populate instructor so we can notify them
    const course = await Course.findById(req.params.id).populate(
      "instructor",
      "name email"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    let newlyEnrolled = false;

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!course.enrolledStudents.includes(req.user.id)) {
      course.enrolledStudents.push(req.user.id);
      newlyEnrolled = true;
      await course.save();
    }

    // 🔔 Notify instructor only when this is a NEW enrollment
    if (newlyEnrolled) {
      try {
        const instructorUserId = course.instructor?._id || course.instructor;
        const courseTitle = course.title || "your course";
        const studentName = req.user?.name || "A student";

        await Notification.create({
          user: instructorUserId, // instructor gets this
          type: "student_enrolled",
          title: "New course enrollment",
          message: `${studentName} enrolled in your course "${courseTitle}".`,
          link: `/instructor/courses/${course._id}`,
          course: course._id,
        });
      } catch (notifyErr) {
        console.error("Error creating notification for enrollment:", notifyErr);
        // don't block enrollment if notification fails
      }
    }

    res.json({ message: "Enrolled successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logged-in student's courses
export const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.user.id,
    }).populate("instructor", "name email");

    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    let studentProgress = course.completedLessons.find(
      (cl) => cl.student.toString() === studentId
    );

    if (!studentProgress) {
      studentProgress = { student: studentId, lessons: [] };
      course.completedLessons.push(studentProgress);
    }

    if (!studentProgress.lessons.includes(lessonId)) {
      studentProgress.lessons.push(lessonId);
      await course.save();
    }

    const progress = Math.floor(
      (studentProgress.lessons.length / course.lessons.length) * 100
    );

    // 🔹 NEW: auto-generate certificate when course is fully completed
    let certificate = null;
    if (progress === 100) {
      certificate = await issueCertificateOnCourseCompletion(course, studentId);
    }

    res.json({
      message: "Lesson marked as completed",
      progress,
      certificate, // will be null until 100% completion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ----------------- PUBLISH WORKFLOW -----------------

export const updateCourseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    course.status = status;
    await course.save();

    res.json({
      message: `Course ${status} successfully`,
      course,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const canAccessLesson = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const lessons = course.lessons;
    const lessonIndex = lessons.findIndex((l) => l._id.toString() === lessonId);

    if (lessonIndex === -1)
      return res.status(404).json({ message: "Lesson not found" });

    if (lessonIndex === 0) return next(); // First lesson always accessible

    const studentProgress = course.completedLessons.find(
      (cl) => cl.student.toString() === studentId
    );

    const prevLessonId = lessons[lessonIndex - 1]._id.toString();

    if (!studentProgress?.lessons.includes(prevLessonId)) {
      return res
        .status(403)
        .json({ message: "Complete previous lesson first" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------- ANNOUNCEMENTS -----------------

// Add announcement (Instructor Only)
export const addAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Content is required" });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Set default title if missing
    const newAnnouncement = {
      title: title?.trim() || "Announcement",
      content: content.trim(),
      createdAt: new Date(),
    };

    // Initialize announcements array if undefined
    course.announcements = course.announcements || [];
    course.announcements.push(newAnnouncement);

    await course.save();

    res.status(201).json({
      message: "Announcement added",
      announcements: course.announcements,
      announcement: newAnnouncement,
    });
  } catch (error) {
    console.error("Add announcement error:", error);
    res.status(500).json({ message: "Failed to add announcement" });
  }
};

// Get announcements (Student & Instructor)
export const getAnnouncements = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.status(200).json({ announcements: course.announcements || [] });
  } catch (error) {
    res.status(500).json({ message: "Failed to get announcements" });
  }
};
