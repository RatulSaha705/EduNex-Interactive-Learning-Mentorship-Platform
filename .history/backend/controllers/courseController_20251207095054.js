import Course from "../models/Course.js";
import User from "../models/User.js";

// ----------------- INSTRUCTOR ----------------- //

// Create course (instructor only)
export const createCourse = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Course title is required" });
    }

    const newCourse = new Course({
      title: title.trim(),
      description: description?.trim() || "",
      category: category?.trim() || "",
      instructor: req.user.id,
      status: "draft", // ✅ NEW: default to draft
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

    // ✅ Only published courses for students
    if (req.user.role === "student") {
      filter.status = "published";
    }

    if (category) {
      filter.category = { $regex: category, $options: "i" }; // case-insensitive match
    }

    if (instructor) {
      // Find instructors whose name matches
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

    // ✅ Students cannot access draft or archived courses
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
    const { title, description, category } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;

    await course.save();
    res.json({ message: "Course updated successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Set Estimated Duration
export const setEstimatedDuration = async (req, res) => {
  try {
    const { duration } = req.body; // e.g., "6 weeks" or "12 hours"
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    course.estimatedDuration = duration;
    await course.save();
    res.status(200).json({ message: "Duration updated", course });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    res.json({ message: "Lesson added successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE LESSON (optional but useful)
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

// ----------------- STUDENT ----------------- //

// Enroll in a course
export const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!course.enrolledStudents.includes(req.user.id)) {
      course.enrolledStudents.push(req.user.id);
      await course.save();
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

// Mark lesson as completed
export const completeLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const studentId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Find existing student progress
    let studentProgress = course.completedLessons.find(
      (cl) => cl.student.toString() === studentId
    );

    if (!studentProgress) {
      studentProgress = { student: studentId, lessons: [] };
      course.completedLessons.push(studentProgress);
    }

    // Add lesson if not already completed
    if (!studentProgress.lessons.includes(lessonId)) {
      studentProgress.lessons.push(lessonId);
      await course.save();
    }

    // Calculate progress %
    const progress = Math.floor(
      (studentProgress.lessons.length / course.lessons.length) * 100
    );

    res.json({ message: "Lesson marked as completed", progress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ----------------- PUBLISH WORKFLOW (NEW) ----------------- //

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
