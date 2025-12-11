import mongoose from "mongoose";

const learningStatsSchema = new mongoose.Schema(
  {
    totalLearningMinutes: {
      type: Number,
      default: 0,
    },
    completedCoursesCount: {
      type: Number,
      default: 0,
    },
    completedLessonsCount: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
    },
  },
  { _id: false } // embedded subdocument
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["student", "instructor", "admin"],
      default: "student",
    },

    // for course recommendations
    interests: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // for learning stats + system analytics
    learningStats: {
      type: learningStatsSchema,
      default: () => ({}),
    },

    // optional flag if you ever want to deactivate accounts
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
