// backend/controllers/certificateController.js
import Certificate from "../models/Certificate.js";
import Course from "../models/Course.js";
import User from "../models/User.js";


// ---------- helpers ----------

// Simple human-readable certificate code
const generateCertificateCode = () => {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `EDUNEX-${timestamp}-${rand}`;
};

// Shared helper used by manual + automatic issuing flows
export const issueCertificateInternal = async ({
  studentId,
  courseId,
  issuedById,
}) => {
  if (!studentId || !courseId) return null;

  // If certificate already exists, just return it
  let cert = await Certificate.findOne({
    student: studentId,
    course: courseId,
  });

  if (cert) {
    // If it was revoked, issuing again re-activates it
    if (cert.status === "revoked") {
      cert.status = "issued";
      cert.completionDate = new Date();
      cert.issuedBy = issuedById || cert.issuedBy;
      await cert.save();
    }
    return cert;
  }

  cert = await Certificate.create({
    student: studentId,
    course: courseId,
    completionDate: new Date(),
    issuedBy: issuedById || studentId,
    certificateCode: generateCertificateCode(),
  });

  return cert;
};

// ============ STUDENT ============


export const getMyCertificates = async (req, res) => {
  try {
    const studentId = req.user._id || req.user.id;

    const certificates = await Certificate.find({ student: studentId })
      .populate({
        path: "course",
        select: "title category instructor",
        populate: { path: "instructor", select: "name email" },
      })
      .populate("issuedBy", "name email");

    res.json({ certificates });
  } catch (error) {
    console.error("Error in getMyCertificates:", error);
    res.status(500).json({
      message: "Error fetching certificates",
      error: error.message,
    });
  }
};

// ============ INSTRUCTOR / ADMIN ============


export const getCourseCertificates = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Instructors can only see certificates for their own courses
    if (
      user.role === "instructor" &&
      course.instructor.toString() !== user.id
    ) {
      return res
        .status(403)
        .json({ message: "You are not the instructor of this course" });
    }

    const certificates = await Certificate.find({ course: courseId })
      .populate("student", "name email")
      .populate("issuedBy", "name email");

    res.json({ courseId, certificates });
  } catch (error) {
    console.error("Error in getCourseCertificates:", error);
    res.status(500).json({
      message: "Error fetching course certificates",
      error: error.message,
    });
  }
};


export const issueCertificateManually = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const issuer = req.user;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Instructors can only issue certificates for their own course
    if (
      issuer.role === "instructor" &&
      course.instructor.toString() !== issuer.id
    ) {
      return res
        .status(403)
        .json({ message: "You are not the instructor of this course" });
    }

    // Make sure student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Make sure student is enrolled in the course
    const isEnrolled = (course.enrolledStudents || []).some(
      (id) => id.toString() === studentId.toString()
    );
    if (!isEnrolled) {
      return res.status(400).json({
        message: "Student is not enrolled in this course",
      });
    }

    const certificate = await issueCertificateInternal({
      studentId,
      courseId,
      issuedById: issuer.id,
    });

    res.status(201).json({
      message: "Certificate issued successfully",
      certificate,
    });
  } catch (error) {
    console.error("Error in issueCertificateManually:", error);
    res.status(500).json({
      message: "Error issuing certificate",
      error: error.message,
    });
  }
};


export const revokeCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const cert = await Certificate.findById(id);
    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    const course = await Course.findById(cert.course);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Admin can revoke anything; instructor only their own courses
    if (
      user.role === "instructor" &&
      course.instructor.toString() !== user.id
    ) {
      return res
        .status(403)
        .json({ message: "You are not the instructor of this course" });
    }

    cert.status = "revoked";
    await cert.save();

    res.json({
      message: "Certificate revoked successfully",
      certificate: cert,
    });
  } catch (error) {
    console.error("Error in revokeCertificate:", error);
    res.status(500).json({
      message: "Error revoking certificate",
      error: error.message,
    });
  }
};


export const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const cert = await Certificate.findById(id)
      .populate("student", "name email")
      .populate({
        path: "course",
        select: "title category instructor",
        populate: { path: "instructor", select: "name email" },
      })
      .populate("issuedBy", "name email");

    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    const isOwner = cert.student._id.toString() === user.id;
    const isAdmin = user.role === "admin";
    let isInstructorForCourse = false;

    if (user.role === "instructor") {
      const courseInstructorId =
        cert.course.instructor._id?.toString() ||
        cert.course.instructor.toString();
      isInstructorForCourse = courseInstructorId === user.id;
    }

    if (!isOwner && !isAdmin && !isInstructorForCourse) {
      return res.status(403).json({
        message: "You are not allowed to view this certificate",
      });
    }

    res.json({ certificate: cert });
  } catch (error) {
    console.error("Error in getCertificateById:", error);
    res.status(500).json({
      message: "Error fetching certificate",
      error: error.message,
    });
  }
};

// ============ AUTOMATIC ISSUING ============


export const issueCertificateOnCourseCompletion = async (course, studentId) => {
  try {
    if (!course || !studentId) return null;

    const totalLessons = course.lessons?.length || 0;
    if (totalLessons === 0) return null;

    const studentProgress = (course.completedLessons || []).find(
      (cl) => cl.student.toString() === studentId.toString()
    );
    if (!studentProgress) return null;

    const completedCount = studentProgress.lessons?.length || 0;
    if (completedCount < totalLessons) {
      // not 100% complete yet
      return null;
    }

    const cert = await issueCertificateInternal({
      studentId,
      courseId: course._id,
      issuedById: course.instructor,
    });

    return cert;
  } catch (error) {
    console.error(
      "Error in issueCertificateOnCourseCompletion helper:",
      error
    );
    return null;
  }
};
