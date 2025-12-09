import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["video", "pdf", "doc"],
      default: "video",
    },
    url: { type: String },
  },
  { timestamps: true }
);

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isNew: { type: Boolean, default: true }, // highlights new announcements
  },
  { _id: false } // optional, prevents creating separate _id for each announcement
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, default: "" },

    // ✅ NEW: publish workflow
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
    lessons: [lessonSchema],
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    completedLessons: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        lessons: [{ type: mongoose.Schema.Types.ObjectId }],
      },
    ],

    // ✅ NEW: Course date range
    startDate: { type: Date },
    endDate: { type: Date },

    // ✅ NEW: Course Announcements
    announcements: [announcementSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
