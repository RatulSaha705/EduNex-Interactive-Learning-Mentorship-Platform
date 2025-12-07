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
// Upvote / un-upvote an answer (toggle, one user = one vote)
// Upvote / un-upvote an answer (toggle, one user = one vote)
export const upvoteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user._id.toString();

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // make sure array exists
    if (!Array.isArray(answer.upvotedBy)) {
      answer.upvotedBy = [];
    }

    // Check if this user already upvoted
    const index = answer.upvotedBy.findIndex(
      (u) => u.toString() === userId
    );

    let hasUpvoted;

    if (index === -1) {
      // ✅ First time click → add vote
      answer.upvotedBy.push(req.user._id);
      hasUpvoted = true;
    } else {
      // ✅ Second click → remove vote
      answer.upvotedBy.splice(index, 1);
      hasUpvoted = false;
    }

    // Count is just length of upvotedBy
    answer.upvotes = answer.upvotedBy.length;

    await answer.save();

    res.json({
      message: hasUpvoted
        ? "Answer upvoted successfully"
        : "Answer upvote removed",
      upvotes: answer.upvotes,
      hasUpvoted,
    });
  } catch (error) {
    console.error("Error upvoting answer:", error);
    res.status(500).json({ message: error.message });
  }
};

/// Mark / unmark an answer as helpful
// Rules:
// - ONLY the student who posted the question can do this
// - Multiple answers can be helpful for the same question
export const markAnswerHelpful = async (req, res) => {
  try {
    const { answerId } = req.params;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const question = await Question.findById(answer.question);
    if (!question) {
      return res.status(404).json({ message: "Parent question not found" });
    }

    // ✅ Only the question author can mark helpful
    if (question.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message:
          "Only the student who posted this question can mark answers as helpful",
      });
    }

    // ✅ Toggle helpful on this answer (no unmarking of others)
    answer.isMarkedHelpful = !answer.isMarkedHelpful;
    await answer.save();

    // Question is resolved if at least one helpful answer exists
    const anyHelpful = await Answer.exists({
      question: question._id,
      isMarkedHelpful: true,
    });

    question.isResolved = !!anyHelpful;
    await question.save();

    const populatedAnswer = await Answer.findById(answerId).populate(
      "user",
      "name role"
    );

    res.json({
      message: answer.isMarkedHelpful
        ? "Answer marked as helpful"
        : "Answer unmarked as helpful",
      answer: populatedAnswer,
    });
  } catch (error) {
    console.error("Error marking answer helpful:", error);
    res.status(500).json({ message: error.message });
  }
};
