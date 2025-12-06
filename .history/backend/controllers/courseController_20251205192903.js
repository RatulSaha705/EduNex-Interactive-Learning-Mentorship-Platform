import Course from "../models/Course.js";

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
    const { category, instructor } = req.query; // optional filters
    let filter = {};

    if (category) filter.category = category;
    if (instructor) filter.instructor = instructor;

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
