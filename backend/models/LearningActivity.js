// backend/models/LearningActivity.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const learningActivitySchema = new Schema(
  {
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
    lesson: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    activityType: {
      type: String,
      enum: ["lesson_completed"],
      default: "lesson_completed",
    },
    // For now we store an approximate duration in minutes.
    // You can later replace this with real tracked time.
    durationMinutes: {
      type: Number,
      default: 15,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one record per (student, course, lesson, activityType)
learningActivitySchema.index(
  { student: 1, course: 1, lesson: 1, activityType: 1 },
  { unique: true }
);

const LearningActivity = mongoose.model(
  "LearningActivity",
  learningActivitySchema
);

export default LearningActivity;
