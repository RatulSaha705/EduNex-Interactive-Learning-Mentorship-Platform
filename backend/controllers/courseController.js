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

// Get all courses (any logged-in user)
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.json({ courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single course by ID
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

// Update course (instructor only & owner check)
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ----------------- STUDENT ----------------- //

// Enroll in a course (student only)
export const enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!course.enrolledStudents) course.enrolledStudents = [];

    // Add student if not already enrolled
    if (!course.enrolledStudents.includes(req.user.id)) {
      course.enrolledStudents.push(req.user.id);
      await course.save();
    }

    res.json({ message: "Enrolled successfully", course });
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
