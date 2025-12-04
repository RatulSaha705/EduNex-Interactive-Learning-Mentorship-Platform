import Course from "../models/Course.js";
import Question from "../models/Question.js";

// Create a new question for a specific course (student only)
export const createQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, content } = req.body;

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ message: "Question content is required" });
    }

    // Make sure course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const question = await Question.create({
      course: courseId,
      user: req.user._id,
      title: title?.trim() || "",
      content: content.trim(),
    });

    // populate user basic info for immediate frontend use
    await question.populate("user", "name role");

    res.status(201).json(question);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all questions for a specific course
export const getCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;

    const questions = await Question.find({ course: courseId })
      .populate("user", "name role")
      .sort({ createdAt: -1 });

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: error.message });
  }
};
