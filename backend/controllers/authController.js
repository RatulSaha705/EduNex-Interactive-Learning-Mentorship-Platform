import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Notification from "../models/Notification.js";

// helper to generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// ✅ Register user
export const registerUser = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    // normalize email
    email = email.toLowerCase().trim();

    // check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // only allow "student" or "instructor"
    const assignedRole = role === "instructor" ? "instructor" : "student";

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    });

    await newUser.save();

    // 🔔 Notify admins: new instructor registered (do not block main flow)
if (newUser.role === "instructor") {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");

    if (admins.length > 0) {
      const notifications = admins.map((a) => ({
        user: a._id,
        type: "instructor_registered",
        title: "New instructor registered",
        message: `Instructor "${newUser.name}" has registered (${newUser.email}).`,
        link: "/admin",
      }));

      await Notification.insertMany(notifications);
    }
  } catch (notifyErr) {
    console.error("Error notifying admins about new instructor:", notifyErr);
  }
}



    const token = generateToken(newUser);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Error registering user", error });
  }
};

// ✅ Login user
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    // normalize email
    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};
