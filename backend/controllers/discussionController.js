import Course from "../models/Course.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import Notification from "../models/Notification.js";

// Create a new question for a specific course (student only)
export const createQuestion = async (req, res) => {
  try {
    const { title, content } = req.body;
    const courseId = req.params.courseId || req.body.courseId;

    if (!courseId) {
      return res
        .status(400)
        .json({ message: "courseId is required to create a question" });
    }

    if (!title || !content) {
      return res
        .status(400)
        .json({ message: "Title and content are required" });
    }

    // 1) Find the course and check enrollment
    const course = await Course.findById(courseId).populate(
      "enrolledStudents",
      "_id"
    );

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const studentId = req.user._id || req.user.id;

    const isEnrolled = course.enrolledStudents.some(
      (s) => s._id.toString() === studentId.toString()
    );

    if (!isEnrolled) {
      return res.status(403).json({
        message: "You must be enrolled in this course to ask questions",
      });
    }

    // 2) Create the question
    const question = await Question.create({
      course: courseId,
      user: studentId,
      title: title.trim(),
      content: content.trim(),
    });

    const populatedQuestion = await question.populate("user", "name role");

    // 3)  Notification: instructor gets alert when a student asks a question
    try {
      const instructorUserId =
        course.instructor?._id || course.instructor;
      const courseTitle = course.title || "your course";
      const questionTitle = question.title || "a question";
      const studentName = req.user?.name || "A student";

      await Notification.create({
        user: instructorUserId, // instructor gets this
        type: "question_asked",
        title: "New question in your course",
        message: `${studentName} asked: "${questionTitle}" in "${courseTitle}".`,
        link: `/instructor/courses/${course._id}/discussion?questionId=${question._id}`,
        course: course._id,
        question: question._id,
      });
    } catch (notifyErr) {
      console.error(
        "Error creating notification for question asked:",
        notifyErr
      );
      // Do not fail the request if notification fails
    }

    res.status(201).json(populatedQuestion);
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
      .sort({isResolved: 1, createdAt: -1 });

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

    // 🔔 Notification: question owner gets alert when their question is replied
    try {
      // Don't notify if the same person answers their own question
      if (question.user.toString() !== req.user._id.toString()) {
        const course = await Course.findById(question.course).select("title");

        const questionTitle = question.title || "your question";
        const courseTitle = course ? course.title : "this course";
        const authorName =
          populatedAnswer?.user?.name || "Someone";

        await Notification.create({
          user: question.user, // student who asked
          type: "question_reply",
          title: "New reply to your question",
          message: `${authorName} replied to "${questionTitle}" in "${courseTitle}".`,
          link: `/student/courses/${question.course}/discussion?questionId=${question._id}`,
          course: question.course,
          question: question._id,
          answer: answer._id,
        });
      }
    } catch (notifyErr) {
      console.error(
        "Error creating notification for question reply:",
        notifyErr
      );
      // Don't break the main request if notification fails
    }

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
      .sort({ upvotes: -1, createdAt: 1 });

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

    // Keep old value so we know if we just marked helpful now
    const wasMarkedBefore = answer.isMarkedHelpful;

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

    // 🔔 Notification: answer author gets alert when their answer is marked helpful
    try {
      // We only notify when changing from "not helpful" -> "helpful"
      if (!wasMarkedBefore && answer.isMarkedHelpful) {
        // Don't notify if they marked their own answer as helpful (just in case)
        if (answer.user.toString() !== req.user._id.toString()) {
          const course = await Course.findById(question.course).select(
            "title"
          );

          const questionTitle = question.title || "this question";
          const courseTitle = course ? course.title : "this course";

          await Notification.create({
            user: answer.user, // author of the answer
            type: "answer_marked_helpful",
            title: "Your answer was marked helpful",
            message: `Your answer to "${questionTitle}" in "${courseTitle}" was marked helpful.`,
            link: `/student/courses/${question.course}/discussion?questionId=${question._id}`,
            course: question.course,
            question: question._id,
            answer: answer._id,
          });
        }
      }
    } catch (notifyErr) {
      console.error(
        "Error creating notification for answer marked helpful:",
        notifyErr
      );
    }

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

export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user._id || req.user.id;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const course = await Course.findById(question.course).select("instructor");
    if (!course) {
      return res.status(404).json({ message: "Parent course not found" });
    }

    const isOwner = question.user.toString() === userId.toString();
    const isInstructor =
      course.instructor.toString() === userId.toString();

    // author, course instructor, or admin
    if (!isOwner && !isInstructor && req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only the question author or the course instructor can delete this question",
      });
    }

    // delete all answers of this question
    await Answer.deleteMany({ question: question._id });

    await Question.findByIdAndDelete(question._id);

    res.json({ message: "Question and its answers deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const userId = req.user._id || req.user.id;

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const question = await Question.findById(answer.question);
    if (!question) {
      return res.status(404).json({ message: "Parent question not found" });
    }

    const course = await Course.findById(question.course).select("instructor");
    if (!course) {
      return res.status(404).json({ message: "Parent course not found" });
    }

    const isOwner = answer.user.toString() === userId.toString();
    const isInstructor =
      course.instructor.toString() === userId.toString();

    // author, course instructor, or admin
    if (!isOwner && !isInstructor && req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Only the answer author or the course instructor can delete this answer",
      });
    }

    const wasHelpful = answer.isMarkedHelpful;

    await Answer.findByIdAndDelete(answerId);

    // if this answer was helpful, update question.isResolved
    if (wasHelpful) {
      const anyHelpful = await Answer.exists({
        question: question._id,
        isMarkedHelpful: true,
      });
      question.isResolved = !!anyHelpful;
      await question.save();
    }

    res.json({ message: "Answer deleted successfully" });
  } catch (error) {
    console.error("Error deleting answer:", error);
    res.status(500).json({ message: error.message });
  }
};
