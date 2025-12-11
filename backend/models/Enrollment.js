// backend/models/Enrollment.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * Enrollment model
 * ----------------
 * Links a user to a course and stores:
 *  - enrollment status
 *  - progress metrics (lessons completed, minutes spent)
 *  - timestamps for analytics/recommendations
 */
const enrollmentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    /**
     * Status of this enrollment:
     *  - "enrolled"    : user has joined but not finished
     *  - "in_progress" : user is actively working on the course
     *  - "completed"   : user finished (all lessons or final criteria)
     *  - "dropped"     : user left the course
     */
    status: {
      type: String,
      enum: ["enrolled", "in_progress", "completed", "dropped"],
      default: "enrolled",
      index: true,
    },

    /**
     * Progress metrics — these will power:
     *  - Track Learning Stats (for each student)
     *  - System Analytics (aggregated across users/courses)
     */
    progress: {
      completedLessonsCount: {
        type: Number,
        default: 0,
      },
      totalLessonsCount: {
        type: Number,
        default: 0, // you can set this when enrolling based on course lessons.length
      },
      totalLearningMinutes: {
        type: Number,
        default: 0,
      },
      lastAccessedAt: {
        type: Date,
      },
    },

    // Optional: rating/review for the course by this user
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

/**
 * Ensure a user can have only one active enrollment per course.
 * This makes querying much simpler for stats.
 */
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

const Enrollment = model("Enrollment", enrollmentSchema);

export default Enrollment;
