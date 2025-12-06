import Course from "../models/Course.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";

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

    const isEnrolled =
      course.enrolledStudents &&
      course.enrolledStudents.some(
        (studentId) =>
          studentId.toString() === req.user._id.toString()
      );

    if (!isEnrolled) {
      return res
        .status(403)
        .json({
          message: "You must be enrolled in this course to ask a question",
        });
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

// -------------------- ANSWERS (REPLIES) -------------------- //

// Create a reply (answer) to a question
export const createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ message: "Answer content is required" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const answer = await Answer.create({
      question: questionId,
      user: req.user._id,
      content: content.trim(),
    });

    const populatedAnswer = await answer.populate("user", "name role");

    res.status(201).json(populatedAnswer);
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all answers for a specific question
export const getQuestionAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;

    const answers = await Answer.find({ question: questionId })
      .populate("user", "name role")
      .sort({ createdAt: 1 });

    res.json(answers);
  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({ message: error.message });
  }
};

// -------------------- UPVOTE & MARK HELPFUL -------------------- //

// Upvote an answer (any logged-in user)
export const upvoteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Simple implementation: each request +1 (no per-user tracking)
    answer.upvotes += 1;
    await answer.save();

    res.json({
      message: "Answer upvoted successfully",
      upvotes: answer.upvotes,
    });
  } catch (error) {
    console.error("Error upvoting answer:", error);
    res.status(500).json({ message: error.message });
  }
};

// Mark an answer as helpful / best answer
export const markAnswerHelpful = async (req, res) => {
  try {
    const { answerId } = req.params;

    // Load answer with its question
    const answer = await Answer.findById(answerId).populate("question");
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const question = await Question.findById(answer.question._id);
    if (!question) {
      return res.status(404).json({ message: "Parent question not found" });
    }

    // Permission rule:
    // Only the question owner OR an instructor/admin can mark helpful
    const isQuestionOwner =
      question.user.toString() === req.user._id.toString();
    const isInstructorOrAdmin =
      req.user.role === "instructor" || req.user.role === "admin";

    if (!isQuestionOwner && !isInstructorOrAdmin) {
      return res.status(403).json({
        message:
          "Only the question author or an instructor/admin can mark an answer as helpful",
      });
    }

    // Unmark other answers for this question
    await Answer.updateMany(
      { question: question._id },
      { $set: { isMarkedHelpful: false } }
    );

    // Mark this answer as helpful
    answer.isMarkedHelpful = true;
    await answer.save();

    // Mark the question as resolved
    question.isResolved = true;
    await question.save();

    const populatedAnswer = await Answer.findById(answerId).populate(
      "user",
      "name role"
    );

    res.json({
      message: "Answer marked as helpful",
      answer: populatedAnswer,
    });
  } catch (error) {
    console.error("Error marking answer helpful:", error);
    res.status(500).json({ message: error.message });
  }
};