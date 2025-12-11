// backend/models/MentorshipSession.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const mentorshipSessionSchema = new Schema(
  {
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    /**
     * Actual start datetime of the consultation (ISO Date).
     * We'll use this for:
     *  - filtering "today's sessions"
     *  - enforcing 3-days-ahead rule
     *  - enforcing 12-hour cancellation rule
     */
    startTime: {
      type: Date,
      required: true,
    },

    /**
     * End datetime of the consultation.
     * Normally startTime + durationMinutes.
     */
    endTime: {
      type: Date,
      required: true,
    },

    /**
     * Duration in minutes.
     * Your business rule: 10–30, and must be a multiple of 5.
     * We'll also re‑validate this in controllers.
     */
    durationMinutes: {
      type: Number,
      required: true,
      enum: [15, 30],
    },
    

    /**
     * Current status of the session.
     * - booked: active booking
     * - cancelledByStudent / cancelledByInstructor: for history
     * - completed: after the session is done (optional future feature)
     */
    status: {
      type: String,
      enum: ["booked", "cancelledByStudent", "cancelledByInstructor", "completed"],
      default: "booked",
    },

    // Optional: short note student can leave about the topic they want to discuss
    studentNote: {
      type: String,
      trim: true,
    },

    // Optional: internal note from instructor after the session
    instructorNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful indexes for queries
mentorshipSessionSchema.index({ instructor: 1, startTime: 1 });
mentorshipSessionSchema.index({ student: 1, startTime: 1 });
mentorshipSessionSchema.index({ course: 1, startTime: 1 });

const MentorshipSession = mongoose.model(
  "MentorshipSession",
  mentorshipSessionSchema
);

export default MentorshipSession;
