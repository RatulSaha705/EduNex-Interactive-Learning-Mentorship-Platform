// backend/server.js
import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js"; // ✅ Step 3: Import auth routes

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Step 3: Use auth routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("EduNex API is running...");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is connected!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
