// backend/controllers/reportController.js
import Report from "../models/Report.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new report (by logged-in user)
 * @route   POST /api/reports
 * @access  Protected (any authenticated user)
 */
export const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({
        message: "targetType, targetId and reason are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid targetId" });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      details,
    });

    return res.status(201).json(report);
  } catch (err) {
    console.error("Error creating report:", err);
    return res
      .status(500)
      .json({ message: "Error creating report", error: err.message });
  }
};

/**
 * @desc    Get reports submitted by the logged-in user
 * @route   GET /api/reports/my
 * @access  Protected (user)
 */
export const getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id }).sort({
      createdAt: -1,
    });

    return res.json(reports);
  } catch (err) {
    console.error("Error fetching user reports:", err);
    return res
      .status(500)
      .json({ message: "Error fetching reports", error: err.message });
  }
};

/**
 * @desc    Get all reports (for admin dashboard)
 *          Supports optional filters & pagination:
 *          - ?status=open
 *          - ?targetType=course
 *          - ?page=1&limit=20
 * @route   GET /api/reports
 * @access  Protected + Admin (enforced via middleware)
 */
export const getAllReports = async (req, res) => {
  try {
    const { status, targetType, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("reporter", "name email")
        .populate("resolvedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(query),
    ]);

    return res.json({
      data: reports,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("Error fetching all reports:", err);
    return res
      .status(500)
      .json({ message: "Error fetching reports", error: err.message });
  }
};

/**
 * @desc    Get a single report by ID
 * @route   GET /api/reports/:id
 * @access  Protected (admin in most cases, but you can allow reporter)
 */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const report = await Report.findById(id)
      .populate("reporter", "name email")
      .populate("resolvedBy", "name email");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json(report);
  } catch (err) {
    console.error("Error fetching report:", err);
    return res
      .status(500)
      .json({ message: "Error fetching report", error: err.message });
  }
};

/**
 * @desc    Update report status / resolution (admin)
 *          Body can include:
 *          - status: "open" | "in_review" | "resolved" | "dismissed"
 *          - resolutionNotes: string
 * @route   PATCH /api/reports/:id
 * @access  Protected + Admin (enforced via middleware)
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (status) {
      report.status = status;

      // If moving to a terminal state, record who and when
      if (status === "resolved" || status === "dismissed") {
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();
      }
    }

    if (resolutionNotes !== undefined) {
      report.resolutionNotes = resolutionNotes;
    }

    await report.save();

    const populatedReport = await report
      .populate("reporter", "name email")
      .populate("resolvedBy", "name email");

    return res.json(populatedReport);
  } catch (err) {
    console.error("Error updating report status:", err);
    return res.status(500).json({
      message: "Error updating report status",
      error: err.message,
    });
  }
};
