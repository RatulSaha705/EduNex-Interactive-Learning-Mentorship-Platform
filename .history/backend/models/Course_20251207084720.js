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
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
