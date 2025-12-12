// backend/controllers/contentReportController.js
import ContentReport from "../models/ContentReport.js";
import Course from "../models/Course.js";
import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import User from "../models/User.js";

/**
 * POST /api/reports/content
 * Body: { targetType, targetId, reason }
 * targetType: "course" | "question" | "answer" | "user"
 */
export const createContentReport = async (req, res) => {
  try {
    const reporterId = req.user.id || req.user._id;
    const { targetType, targetId, reason } = req.body;

    if (!targetType || !targetId) {
      return res
        .status(400)
        .json({ message: "targetType and targetId are required." });
    }

    const allowedTypes = ["course", "question", "answer", "user"];
    if (!allowedTypes.includes(targetType)) {
      return res.status(400).json({ message: "Invalid targetType." });
    }

    const reportData = {
      reportedBy: reporterId,
      targetType,
      reason: (reason || "").trim(),
    };

    // Attach the specific field based on targetType
    if (targetType === "course") {
      reportData.course = targetId;
    } else if (targetType === "question") {
      reportData.question = targetId;
    } else if (targetType === "answer") {
      reportData.answer = targetId;
    } else if (targetType === "user") {
      reportData.user = targetId;
    }

    const report = await ContentReport.create(reportData);

    return res.status(201).json({
      message: "Report submitted. Thank you for helping keep EduNex safe.",
      reportId: report._id,
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

    const reports = await ContentReport.find({ reportedBy: reporterId })
      .sort({ createdAt: -1 })
      .populate("course", "title category")
      .populate("question", "title content")
      .populate("answer", "content")
      .populate("user", "name email role")
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
 * GET /api/admin/reports
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

    const reports = await ContentReport.find(filter)
      .sort({ createdAt: -1 })
      .populate("reportedBy", "name email role")
      .populate("reviewedBy", "name email role")
      .populate("course", "title category")
      .populate("question", "title content")
      .populate("answer", "content")
      .populate("user", "name email role")
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
 * PATCH /api/admin/reports/:id
 * Body: { status?, resolutionNote? }
 */
export const adminUpdateReportStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;
    const { status, resolutionNote } = req.body;

    const allowedStatuses = ["open", "in_review", "resolved", "dismissed"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const report = await ContentReport.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (status) report.status = status;
    if (resolutionNote !== undefined) report.resolutionNote = resolutionNote;

    report.reviewedBy = req.user._id || req.user.id;
    report.reviewedAt = new Date();

    await report.save();

    const populated = await report
      .populate("reportedBy", "name email role")
      .populate("reviewedBy", "name email role")
      .populate("course", "title category")
      .populate("question", "title content")
      .populate("answer", "content")
      .populate("user", "name email role");

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
