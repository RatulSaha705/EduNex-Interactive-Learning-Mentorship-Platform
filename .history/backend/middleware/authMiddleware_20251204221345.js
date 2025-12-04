// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Protect routes
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Ensure decoded.id exists
      if (!decoded.id) {
        return res
          .status(401)
          .json({ message: "Invalid token: missing user id" });
      }

      // Fetch user from DB
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res
          .status(401)
          .json({ message: "User not found for this token" });
      }

      req.user = user; // attach user object
      next();
    } catch (err) {
      console.error("Auth error:", err.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Role-based access
export const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
