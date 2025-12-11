// backend/models/InstructorAvailability.js
import mongoose from "mongoose";

const { Schema } = mongoose;

// Subdocument for a single available time range within a day
const timeRangeSchema = new Schema(
  {
    // "HH:mm" in 24-hour format, e.g. "10:00"
    startTime: {
      type: String,
      required: true,
      trim: true,
    },
    // "HH:mm" in 24-hour format, e.g. "12:30"
    endTime: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional note specific to this time range
    note: {
      type: String,
      trim: true,
    },
  },
  {
    _id: false, // we don't really need separate _id for each range
  }
);

const instructorAvailabilitySchema = new Schema(
  {
    instructor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /**
     * Date for this availability in "YYYY-MM-DD" format, e.g. "2025-12-08".
     * We keep it as a string to keep things simple and avoid timezone confusion.
     */
    date: {
      type: String,
      required: true,
      trim: true,
    },

    /**
     * List of free time ranges on this date.
     * The booking logic will subtract booked sessions from these ranges.
     */
    timeRanges: {
      type: [timeRangeSchema],
      default: [],
    },

    /**
     * Optional note for the whole day, e.g. "Conference today, limited slots"
     */
    dayNote: {
      type: String,
      trim: true,
    },

    /**
     * If true, this day is fully blocked (no bookings allowed),
     * even if there are timeRanges defined. Can be used for emergencies.
     */
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Make sure one instructor has at most one availability document per day.
instructorAvailabilitySchema.index(
  { instructor: 1, date: 1 },
  { unique: true }
);

const InstructorAvailability = mongoose.model(
  "InstructorAvailability",
  instructorAvailabilitySchema
);

export default InstructorAvailability;
