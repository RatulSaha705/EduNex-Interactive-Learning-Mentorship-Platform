// backend/controllers/contentReportController.js
import Report from "../models/Report.js";
import Course from "../models/Course.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

/**
 * POST /api/reports/content   (also wired as POST /api/reports)
 * Body: { targetType, targetId, reason, details? }
 * targetType: "course" | "question" | "answer" | "user"
 * Auth: any logged-in user
 */
export const createContentReport = async (req, res) => {
  try {
    const reporterId = req.user.id || req.user._id;
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason || !reason.trim()) {
      return res.status(400).json({
        message: "targetType, targetId and a non-empty reason are required.",
      });
    }

    const allowedTypes = ["course", "question", "answer", "user"];
    if (!allowedTypes.includes(targetType)) {
      return res.status(400).json({ message: "Invalid targetType." });
    }

    let courseId = null;
    let targetSummary = "";

    if (targetType === "course") {
      const course = await Course.findById(targetId).select(
        "title description"
      );
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      courseId = course._id;
      targetSummary = `${course.title} – ${
        course.description?.slice(0, 120) || ""
      }`.trim();
    } else if (targetType === "question") {
      const question = await Question.findById(targetId).select(
        "title content course"
      );
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      courseId = question.course || null;
      targetSummary = `${question.title || "Question"} – ${
        question.content?.slice(0, 120) || ""
      }`.trim();
    } else if (targetType === "answer") {
      const answer = await Answer.findById(targetId)
        .select("content question")
        .populate("question", "course");
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      courseId = answer.question?.course || null;
      targetSummary = answer.content?.slice(0, 140) || "Answer";
    } else if (targetType === "user") {
      const reportedUser = await User.findById(targetId).select(
        "name email role"
      );
      if (!reportedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      targetSummary = `User: ${reportedUser.name} (${reportedUser.email}) – role: ${reportedUser.role}`;
    }

    const report = await Report.create({
      reporter: reporterId,
      targetType,
      targetId,
      course: courseId,
      targetSummary,
      reason: reason.trim(),
      details,
    });


    // 🔔 Notify admins: new content report submitted (do not block main flow)
try {
  const admins = await User.find({ role: "admin" }).select("_id");

  if (admins.length > 0) {
    const safeSummary = (targetSummary || "").slice(0, 120);
    const safeReason = (reason || "").trim().slice(0, 160);

    const notifications = admins.map((a) => ({
      user: a._id,
      type: "content_reported",
      title: "New report submitted",
      message: `A ${targetType} was reported. Reason: ${safeReason}${
        safeSummary ? ` • Target: ${safeSummary}` : ""
      }`,
      link: "/admin",
      ...(courseId ? { course: courseId } : {}),
    }));

    await Notification.insertMany(notifications);
  }
} catch (notifyErr) {
  console.error("Error notifying admins about new report:", notifyErr);
}



    return res.status(201).json({
      message: "Report submitted. Thank you for helping keep EduNex safe.",
      reportId: report._id,
      report,
    });
  } catch (err) {
    console.error("Error in createContentReport:", err);
    return res.status(500).json({
      message: "Failed to submit report",
      error: err.message,
    });
  }
};

/**
 * GET /api/reports/my-content
 * List reports created by the logged-in user
 */
export const getMyContentReports = async (req, res) => {
  try {
    const reporterId = req.user.id || req.user._id;

    const reports = await Report.find({ reporter: reporterId })
      .sort({ createdAt: -1 })
      .populate("course", "title category")
      .populate("reporter", "name email role")
      .populate("resolvedBy", "name email role")
      .lean();

    res.json({ reports });
  } catch (err) {
    console.error("Error in getMyContentReports:", err);
    res.status(500).json({
      message: "Failed to load your reports",
      error: err.message,
    });
  }
};

/**
 * GET /api/reports
 * Admin: list all content reports (with optional filters)
 * Query: ?status=open|in_review|resolved|dismissed&targetType=course|question|answer|user
 */
export const adminGetReports = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { status, targetType } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate("reporter", "name email role")
      .populate("resolvedBy", "name email role")
      .populate("course", "title category")
      .lean();

    res.json({ reports });
  } catch (err) {
    console.error("Error in adminGetReports:", err);
    res.status(500).json({
      message: "Failed to load reports",
      error: err.message,
    });
  }
};

/**
 * PATCH /api/reports/:id/status
 * Body: { status?, resolutionNotes? }  (also accepts resolutionNote for convenience)
 * Admin only
 */
export const adminUpdateReportStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;
    const { status, resolutionNote, resolutionNotes } = req.body;

    const allowedStatuses = ["open", "in_review", "resolved", "dismissed"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (status) report.status = status;

    const notes = resolutionNotes ?? resolutionNote;
    if (typeof notes === "string") {
      report.resolutionNotes = notes;
    }

    report.resolvedBy = req.user._id || req.user.id;

    await report.save();

    const populated = await Report.findById(id)
      .populate("reporter", "name email role")
      .populate("resolvedBy", "name email role")
      .populate("course", "title category")
      .lean();

    res.json({
      message: "Report updated successfully",
      report: populated,
    });
  } catch (err) {
    console.error("Error in adminUpdateReportStatus:", err);
    res.status(500).json({
      message: "Failed to update report",
      error: err.message,
    });
  }
};
