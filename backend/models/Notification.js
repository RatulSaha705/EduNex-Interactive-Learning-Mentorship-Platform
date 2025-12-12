// backend/models/Notification.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    // Who this notification belongs to
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /**
     * What kind of notification this is.
     * You can extend this list later if needed.
     */
    type: {
      type: String,
      enum: [
        "question_reply",         // someone replied to my question
        "answer_marked_helpful",  // my answer was marked helpful
        "consultation_blocked",   // instructor turned off consultations
        "consultation_booked",    // a student booked a consultation
        "lesson_added",           // new lesson added in enrolled course
        "student_enrolled",
        "question_asked", 
        "content_reported",        // admin: someone reported something
        "course_created",          // admin: new course created
        "instructor_registered", 
      ],
      required: true,
    },

    // Short title shown in the notification list
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // More detailed message/body text
    message: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * Frontend route to open when the user clicks this notification.
     * Example: "/courses/123/discussion?questionId=456"
     */
    link: {
      type: String,
      trim: true,
    },

    // Has the user seen / opened this notification?
    isRead: {
      type: Boolean,
      default: false,
    },

    // When it was marked as read (optional)
    readAt: {
      type: Date,
    },

    /**
     * Optional references for convenience when querying:
     * (not strictly required, but useful if you want to jump back)
     */
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
    question: {
      type: Schema.Types.ObjectId,
      ref: "Question",
    },
    answer: {
      type: Schema.Types.ObjectId,
      ref: "Answer",
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

// Helpful indexes: quickly get notifications for a user
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
