// backend/middleware/roleMiddleware.js

/**
 * Role-based authorization middleware.
 *
 * Usage:
 *   router.get(
 *     "/admin-only",
 *     protect,
 *     authorizeRoles("admin"),
 *     handler
 *   );
 *
 *   router.post(
 *     "/instructor-or-admin",
 *     protect,
 *     authorizeRoles("instructor", "admin"),
 *     handler
 *   );
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // `protect` middleware should already have set `req.user`
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userRole = req.user.role;

    // If somehow no role is set on the user, treat as forbidden
    if (!userRole) {
      return res
        .status(403)
        .json({ message: "Forbidden: role not set for this user" });
    }

    // Check if the user's role is in the allowed roles
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Forbidden: you do not have permission to access this resource",
      });
    }

    next();
  };
};
