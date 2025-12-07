// backend/server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";


import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js"; 
import reportRoutes from "./routes/reportRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes.js";
import userAnalyticsRoutes from "./routes/userAnalyticsRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import userProfileRoutes from "./routes/userProfileRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import courseAnalyticsRoutes from "./routes/courseAnalyticsRoutes.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());


// Routes
app.use("/api/auth", authRoutes); 
app.use("/api/courses", courseRoutes); 
app.use("/api/reports", reportRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/admin", adminAnalyticsRoutes);
app.use("/api/me", userAnalyticsRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/me", userProfileRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/courses", courseAnalyticsRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("EduNex API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
