// backend/models/Certificate.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const certificateSchema = new Schema(
  {
    // Student who earned the certificate
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Course that was completed
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // When the student actually completed the course
    completionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Optional: instructor or admin who issued/approved it
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Optional: human-friendly certificate code / serial
    certificateCode: {
      type: String,
      unique: true,
      sparse: true, // allows nulls
      trim: true,
    },

    // Optional: link to generated PDF/image
    pdfUrl: {
      type: String,
      trim: true,
    },

    // For future moderation (e.g. revoke a certificate)
    status: {
      type: String,
      enum: ["issued", "revoked"],
      default: "issued",
    },
  },
  {
    timestamps: true, // createdAt = issue time, updatedAt for later changes
  }
);

// Ensure one certificate per student per course
certificateSchema.index(
  { student: 1, course: 1 },
  { unique: true }
);

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;
