// backend/models/Report.js
import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // "course" | "question" | "answer" | "user"
    targetType: {
      type: String,
      required: true,
      enum: ["course", "question", "answer", "user"],
    },

    // ID of the thing being reported
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Optional: which course the content belongs to (helps filtering)
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },

    // Short snapshot of what was reported (title / content snippet)
    targetSummary: {
      type: String,
    },

    // Why the user reported it
    reason: {
      type: String,
      required: true,
    },

    // Optional longer explanation
    details: {
      type: String,
    },

    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "dismissed"],
      default: "open",
    },

    resolutionNotes: {
      type: String,
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
