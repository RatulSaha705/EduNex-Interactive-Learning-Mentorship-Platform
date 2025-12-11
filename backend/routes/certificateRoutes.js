// backend/routes/certificateRoutes.js

import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  getMyCertificates,
  getCourseCertificates,
  getCertificateById,
  issueCertificateManually,
  revokeCertificate,
} from "../controllers/certificateController.js";

const router = express.Router();

/* --------- STUDENT ROUTES --------- */

// GET /api/certificates/my
// Logged-in student sees all of their certificates
router.get("/my", protect, authorizeRoles("student"), getMyCertificates);

/* ----- INSTRUCTOR / ADMIN ROUTES ----- */

// GET /api/certificates/course/:courseId
// Instructor/Admin can see all certificates for a course
router.get(
  "/course/:courseId",
  protect,
  authorizeRoles("instructor", "admin"),
  getCourseCertificates
);

// POST /api/certificates/course/:courseId/students/:studentId
// Instructor/Admin can manually issue (or re-issue) a certificate
router.post(
  "/course/:courseId/students/:studentId",
  protect,
  authorizeRoles("instructor", "admin"),
  issueCertificateManually
);

/* ------------- COMMON ------------- */

// PATCH /api/certificates/:id/revoke
// Admin/Instructor can revoke a certificate
router.patch(
  "/:id/revoke",
  protect,
  authorizeRoles("admin", "instructor"),
  revokeCertificate
);

// GET /api/certificates/:id
// Fetch single certificate (ownership / access checked in controller)
router.get("/:id", protect, getCertificateById);

export default router;
