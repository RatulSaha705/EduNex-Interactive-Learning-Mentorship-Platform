// backend/controllers/contentReportController.js
import ContentReport from "../models/ContentReport.js";

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
 * OPTIONAL: list reports created by the logged-in user
 * GET /api/reports/my-content
 */
export const getMyContentReports = async (req, res) => {
  try {
    const reporterId = req.user.id || req.user._id;

    const reports = await ContentReport.find({ reportedBy: reporterId })
      .sort({ createdAt: -1 })
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
