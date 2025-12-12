// backend/models/ContentReport.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const contentReportSchema = new Schema(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // What is being reported
    targetType: {
      type: String,
      enum: ["course", "question", "answer", "user"],
      required: true,
    },

    // Link to the actual thing (only one of these will be set)
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    question: { type: Schema.Types.ObjectId, ref: "Question" },
    answer: { type: Schema.Types.ObjectId, ref: "Answer" },
    user: { type: Schema.Types.ObjectId, ref: "User" },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ContentReport", contentReportSchema);
