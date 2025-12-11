// backend/models/Report.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Report model
 * ------------
 * Used when a user reports:
 *  - a course
 *  - another user
 *  - a review / comment / other content
 *
 * This supports:
 *  - Report management (admin reviewing & resolving)
 *  - Admin dashboard (list/filter by status/type)
 *  - System analytics (counts, trends, top reported items)
 */
const reportSchema = new Schema(
  {
    // Who created the report
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /**
     * What is being reported
     * "course"   – a course in your Course collection
     * "user"     – another user account
     * "review"   – a review entity (future)
     * "comment"  – a comment/discussion post (future)
     * "other"    – anything else
     */
    targetType: {
      type: String,
      enum: ["course", "user", "review", "comment", "other"],
      required: true,
      index: true,
    },

    /**
     * ID of the thing being reported.
     * For "course" or "user" this will be the ObjectId from those collections.
     * For "review"/"comment"/"other" you can still store an ObjectId or any
     * identifier you use for that content.
     */
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    // Short reason shown in admin lists
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // Optional longer description from the user
    details: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    /**
     * Workflow status:
     *  - "open"       : newly created, not reviewed yet
     *  - "in_review"  : an admin is actively looking at it
     *  - "resolved"   : action taken (e.g. content removed, user warned)
     *  - "dismissed"  : report found to be invalid / no action required
     */
    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "dismissed"],
      default: "open",
      index: true,
    },

    // Admin who handled the report (optional, only for resolved/dismissed)
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    resolvedAt: {
      type: Date,
    },

    // Notes explaining the decision (for audit trail / future reference)
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

/**
 * Index for fast admin queries:
 * e.g. "all open course reports", "all reports for this course"
 */
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });

const Report = model("Report", reportSchema);

export default Report;
