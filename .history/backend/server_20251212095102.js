// backend/server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js"; // ✅ import courses

import discussionRoutes from "./routes/discussionRoutes.js";
import mentorshipRoutes from "./routes/mentorshipRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes); // All auth routes prefixed with /api/auth
app.use("/api/courses", courseRoutes); // ✅ mount course routes
app.use("/api/discussions", discussionRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("EduNex API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
