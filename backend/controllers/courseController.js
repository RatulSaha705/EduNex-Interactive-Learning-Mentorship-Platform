import Course from "../models/Course.js";

// @desc    Create a new course
// @route   POST /api/courses
// @access  Protected (instructor/admin)
export const createCourse = async (req, res) => {
  try {
    const { title, description, slug, lessons } = req.body;
    const instructor = req.user._id;  // assume auth middleware sets req.user

    const course = new Course({
      title,
      description,
      slug,
      lessons,
      instructor
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ message: "Error creating course", error: err.message });
  }
};

// @desc    Get all courses (or optionally filter/paginate)
// @route   GET /api/courses
// @access  Public (or protected depending on design)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("instructor", "name email")  // populate instructor basic info
      .select("-lessons.resources");         // optionally exclude heavy resource data
    res.json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    res.status(500).json({ message: "Error fetching courses", error: err.message });
  }
};

// @desc    Get single course by ID (or slug)
// @route   GET /api/courses/:id
// @access  Public
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    console.error("Error fetching course:", err);
    res.status(500).json({ message: "Error fetching course", error: err.message });
  }
};

// @desc    Update a course by ID
// @route   PUT /api/courses/:id
// @access  Protected (only instructor who owns it or admin)
export const updateCourse = async (req, res) => {
  try {
    const updates = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Optionally: check if req.user is instructor or admin and owns the course
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this course" });
    }

    Object.assign(course, updates);
    await course.save();
    res.json(course);
  } catch (err) {
    console.error("Error updating course:", err);
    res.status(500).json({ message: "Error updating course", error: err.message });
  }
};

// @desc    Delete a course by ID
// @route   DELETE /api/courses/:id
// @access  Protected (only instructor who owns it or admin)
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this course" });
    }

    await course.remove();
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ message: "Error deleting course", error: err.message });
  }
};
