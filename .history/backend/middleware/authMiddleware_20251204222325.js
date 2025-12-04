// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// ✅ Protect routes: verify JWT token
export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // decode token (contains id and role)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded; // attach user info to request
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, invalid token" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// ✅ Role-based access control
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // check if user exists and role is allowed
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient permissions" });
    }
    next();
  };
};
