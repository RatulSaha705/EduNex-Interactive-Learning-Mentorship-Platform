// backend/middleware/roleMiddleware.js

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // user should already be set by `protect` middleware
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // If you haven't added `role` to User yet, this will be undefined.
    // For now we just check normally; once you add roles to the User model,
    // this will start enforcing properly.
    const userRole = req.user.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ message: "Forbidden: you do not have permission" });
    }

    next();
  };
};
