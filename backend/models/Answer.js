import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔹 NEW: who has upvoted this answer
    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // numeric count (derived from upvotedBy.length)
    upvotes: {
      type: Number,
      default: 0,
    },
    isMarkedHelpful: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;