// backend/server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js"; // ✅ import courses

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes); // All auth routes prefixed with /api/auth
app.use("/api/courses", courseRoutes); // ✅ mount course routes

// Test route
app.get("/", (req, res) => {
  res.send("EduNex API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
