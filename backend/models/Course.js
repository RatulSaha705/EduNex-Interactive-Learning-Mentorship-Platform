
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    // Optionally a slug or short name (e.g. for URLs)
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // (Optional) list of lessons / modules inside course
    lessons: [
      {
        title: { type: String, required: true },
        content: { type: String },       // e.g. markdown / plain text / HTML / whatever you use
        // optionally: video URL, resources, etc.
        resources: [{ type: String }]   // Array of URLs or resource identifiers (optional)
      }
    ],
    // Students enrolled (optional — could also be separate Enrollment model)
    enrolledStudents: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    // Extra metadata
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date
    }
  },
  {
    timestamps: true  // will add createdAt and updatedAt automatically :contentReference[oaicite:1]{index=1}
  }
);

// (Optional) pre‑save hook to update updatedAt
courseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Course = model("Course", courseSchema);
export default Course;
