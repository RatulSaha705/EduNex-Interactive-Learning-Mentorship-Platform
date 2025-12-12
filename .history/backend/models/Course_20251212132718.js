// backend/models/Course.js
import mongoose from "mongoose";

/**
 * LESSON SUB-DOCUMENT
 * Matches how lessons are created in courseController:
 *   course.lessons.push({ title, contentType, url })
 */
const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      enum: ["video", "pdf", "doc"],
      required: true,
    },
    url: { type: String, required: true },
    durationMinutes: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
  },
  { _id: true }
);

/**
 * ANNOUNCEMENT SUB-DOCUMENT
 * Matches how you use it in:
 *  - addAnnouncement (title + content)
 *  - CourseDetails UI (a.content, a.createdAt)
 */
const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true }, // ✅ was "message" before
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // ✅ make optional so old data doesn't break
    },
  },
  { timestamps: true } // gives createdAt / updatedAt -> used in isNew()
);

/**
 * COMPLETED LESSONS PER STUDENT
 */
const completedLessonSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * MAIN COURSE SCHEMA
 */
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🆕 Prerequisite courses – student must complete these first
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    lessons: [lessonSchema],

    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    completedLessons: [completedLessonSchema],

    announcements: [announcementSchema],

    // Optional schedule (for estimated duration / calendar)
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    // Auto-calculated duration in days
    duration: { type: Number, default: null },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
