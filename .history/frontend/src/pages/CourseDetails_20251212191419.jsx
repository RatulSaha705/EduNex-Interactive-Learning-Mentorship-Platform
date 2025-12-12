import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ReportButton from "../components/ReportButton";

export default function CourseDetails() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollMsg, setEnrollMsg] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [certificateError, setCertificateError] = useState("");

  // 🔹 prerequisites state
  const [prerequisiteProgress, setPrerequisiteProgress] = useState([]);
  const [missingPrereqs, setMissingPrereqs] = useState([]);

  const isStudent = auth?.user?.role === "student";
  const isInstructor = auth?.user?.role === "instructor";

  // ---------- Fetch course ----------
  useEffect(() => {
    if (!auth?.token) return;

    const fetchCourse = async () => {
      try {
        setError("");
        setEnrollMsg("");

        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        // Backend may return { course, prerequisiteProgress }
        const apiCourse = res.data.course || res.data;
        const prereqProg = res.data.prerequisiteProgress || [];

        if (isStudent && apiCourse.status !== "published") {
          setError("This course is not available for students");
        } else {
          setCourse(apiCourse);
          setAnnouncements(apiCourse.announcements || []);
          setPrerequisiteProgress(prereqProg);
          setMissingPrereqs([]);
        }
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load course details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, auth?.token, isStudent]);

  // ---------- Fetch certificate (student only) ----------
  useEffect(() => {
    if (!auth?.token || !isStudent || !course) return;

    const fetchCertificateForCourse = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/certificates/my",
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
        const certs = res.data.certificates || [];
        const found = certs.find(
          (c) => c.course && c.course._id?.toString() === id
        );
        if (found) {
          setCertificate(found);
          setCertificateError("");
        }
      } catch (err) {
        console.error(err);
        setCertificateError(
          err.response?.data?.message || "Failed to load certificate info"
        );
      }
    };

    fetchCertificateForCourse();
  }, [auth?.token, isStudent, course, id]);

  // ---------- YouTube API script ----------
  useEffect(() => {
    if (typeof window !== "undefined" && !window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

  // ---------- Navigation helpers ----------
  const handleBack = () => {
    if (!auth?.user) {
      navigate("/");
      return;
    }
    if (auth.user.role === "student") navigate("/student/courses");
    else if (auth.user.role === "instructor") navigate("/instructor");
    else if (auth.user.role === "admin") navigate("/admin");
    else navigate("/");
  };

  // ---------- Enroll ----------
  const handleEnroll = async () => {
    try {
      setEnrollMsg("");
      setMissingPrereqs([]);

      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setEnrollMsg(res.data.message || "Enrolled successfully");
      setCourse(res.data.course);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to enroll";
      setEnrollMsg(msg);
      setMissingPrereqs(err.response?.data?.missingPrerequisites || []);
    }
  };

  // ---------- Lesson completion ----------
  const handleCompleteLesson = async (lessonId) => {
    try {
      const studentProgress = course.completedLessons?.find(
        (cl) => cl.student.toString() === auth.user.id
      );

      const alreadyCompleted = studentProgress?.lessons?.some(
        (lId) => lId.toString() === lessonId.toString()
      );
      if (alreadyCompleted) return;

      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/lessons/${lessonId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      // If backend returns certificate when progress hits 100%
      if (res.data?.certificate) {
        setCertificate(res.data.certificate);
        setCertificateError("");
      }

      setCourse((prevCourse) => {
        if (!prevCourse) return prevCourse;

        const updatedCompletedLessons = [
          ...(prevCourse.completedLessons || []),
        ];
        const existingStudent = updatedCompletedLessons.find(
          (cl) => cl.student.toString() === auth.user.id
        );

        if (existingStudent) {
          const updatedLessonIds = new Set(
            (existingStudent.lessons || []).map((l) => l.toString())
          );
          updatedLessonIds.add(lessonId.toString());
          existingStudent.lessons = Array.from(updatedLessonIds);
        } else {
          updatedCompletedLessons.push({
            student: auth.user.id,
            lessons: [lessonId],
          });
        }

        return { ...prevCourse, completedLessons: updatedCompletedLessons };
      });
    } catch (err) {
      console.log(
        err.response?.data?.message || "Failed to mark lesson complete"
      );
    }
  };

  // ---------- Lesson content rendering ----------
  const getYouTubeEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (
        urlObj.hostname.includes("youtube.com") &&
        urlObj.searchParams.has("v")
      ) {
        return `https://www.youtube.com/embed/${urlObj.searchParams.get("v")}`;
      }
      if (urlObj.hostname === "youtu.be") {
        return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const renderLessonContent = () => {
    if (!selectedLesson) return null;

    switch (selectedLesson.contentType) {
      case "video": {
        const embedUrl =
          selectedLesson.url.includes("youtube.com") ||
          selectedLesson.url.includes("youtu.be")
            ? getYouTubeEmbedUrl(selectedLesson.url)
            : selectedLesson.url;

        if (embedUrl.includes("youtube.com/embed")) {
          return (
            <iframe
              key={selectedLesson._id}
              id="youtube-player"
              width="100%"
              height="400"
              src={embedUrl + "?enablejsapi=1"}
              title={selectedLesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => handleCompleteLesson(selectedLesson._id)}
              className="rounded-xl shadow-sm"
            />
          );
        }

        return (
          <video
            key={selectedLesson._id}
            width="100%"
            height="400"
            controls
            onEnded={() => handleCompleteLesson(selectedLesson._id)}
            className="rounded-xl shadow-sm"
          >
            <source src={selectedLesson.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );
      }

      case "pdf":
        return (
          <iframe
            key={selectedLesson._id}
            width="100%"
            height="500"
            src={selectedLesson.url}
            title={selectedLesson.title}
            frameBorder="0"
            onLoad={() => handleCompleteLesson(selectedLesson._id)}
            className="rounded-xl shadow-sm"
          />
        );

      case "doc":
        return (
          <a
            key={selectedLesson._id}
            href={selectedLesson.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm text-sm font-semibold"
            onClick={() => handleCompleteLesson(selectedLesson._id)}
          >
            Open Document
          </a>
        );

      default:
        return <p className="text-sm text-gray-600">Unknown lesson type</p>;
    }
  };

  // ---------- Locking logic ----------
  const isLessonLocked = (lessonIndex) => {
    if (!course || !auth?.user) return false;
    if (lessonIndex === 0) return false;

    const studentProgress = course.completedLessons?.find(
      (cl) => cl.student.toString() === auth.user.id
    );
    if (!studentProgress) return true;

    const prevLessonId = course.lessons[lessonIndex - 1]._id.toString();
    const hasPrevCompleted = studentProgress.lessons?.some(
      (lId) => lId.toString() === prevLessonId
    );

    return !hasPrevCompleted;
  };

  // ---------- Announcements ----------
  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/announcements`,
        { content: newAnnouncement },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setAnnouncements(res.data.announcements);
      setNewAnnouncement("");
    } catch (err) {
      console.log(err.response?.data?.message || "Failed to add announcement");
    }
  };

  // ---------- Derived values ----------
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-3 justify-center">
          <span className="inline-block h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!auth?.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-red-600 font-semibold mb-3">
            Please login to view course details.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">{error}</p>
          <button
            onClick={handleBack}
            className="mt-3 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <p className="text-gray-700 font-semibold">Course not found.</p>
          <button
            onClick={handleBack}
            className="mt-3 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const alreadyEnrolled =
    course.enrolledStudents?.some(
      (studentId) => studentId.toString() === auth.user.id
    ) || false;

  // progress
  let progress = 0;
  if (alreadyEnrolled) {
    const totalLessons = course.lessons?.length || 1;
    const studentCompleted = course.completedLessons?.find(
      (cl) => cl.student.toString() === auth.user?.id
    );
    const completedCount =
      studentCompleted?.lessons.filter((lessonId) =>
        course.lessons.some((l) => l._id.toString() === lessonId.toString())
      ).length || 0;
    progress = Math.floor((completedCount / totalLessons) * 100);
  }

  const isNew = (date) => {
    if (!date) return false;
    const created = new Date(date);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  const hasPrereqCourses =
    Array.isArray(course.prerequisites) && course.prerequisites.length > 0;

  const getPrereqStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "not_started":
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const safePrereqId = (pre) =>
    pre?._id || pre?.id || (typeof pre === "string" ? pre : "");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
        >
          ← Back to courses
        </button>
        {auth.user && (
          <div className="flex items-center gap-2">
            <ReportButton
              targetType="course"
              targetId={course._id}
              label="Report course"
              small
            />
          </div>
        )}
      </div>

      {/* Course hero */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-gray-900">{course.title}</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {course.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                  {course.category}
                </span>
              )}
              {course.level && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  Level: {course.level}
                </span>
              )}
              {course.status && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold capitalize">
                  {course.status}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">
            {course.description}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-gray-600 mt-1">
            <span>
              <span className="font-semibold">Instructor:</span>{" "}
              {course.instructor?.name || "Unknown"}
            </span>
            {course.category && (
              <span>
                <span className="font-semibold">Category:</span>{" "}
                {course.category}
              </span>
            )}
            {course.startDate && course.endDate && (
              <span>
                <span className="font-semibold">Duration:</span>{" "}
                {new Date(course.startDate).toLocaleDateString()} –{" "}
                {new Date(course.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Side summary */}
        <div className="w-full md:w-64 bg-slate-50 rounded-xl border border-slate-100 p-4 flex flex-col gap-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            Course Overview
          </div>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Lessons</span>
              <span className="font-semibold">
                {course.lessons?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Enrolled</span>
              <span className="font-semibold">
                {course.enrolledStudents?.length || 0}
              </span>
            </div>
            {course.endDate && (
              <div className="flex justify-between">
                <span>Ends on</span>
                <span className="font-semibold">
                  {new Date(course.endDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {alreadyEnrolled && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Your progress
              </p>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-gray-600 text-right">
                {progress}% complete
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prerequisite Courses */}
      {hasPrereqCourses && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              🔗 Prerequisite Courses
            </h4>
            {isStudent && (
              <span className="text-xs text-gray-500">
                You must complete these before enrolling.
              </span>
            )}
          </div>

          <div className="space-y-2">
            {course.prerequisites.map((pre) => {
              const preId = safePrereqId(pre);
              const progressInfo =
                prerequisiteProgress?.find(
                  (p) =>
                    p.courseId === preId?.toString() ||
                    p.courseId === pre?._id?.toString()
                ) || {};
              const progressValue = progressInfo.progress ?? 0;
              const status = progressInfo.status || "not_started";

              return (
                <div
                  key={preId}
                  className="border rounded-xl px-3 py-2 flex flex-col gap-1 bg-slate-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {pre?.title || "Prerequisite course"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pre?.category || "General"}
                      </p>
                    </div>
                    {isStudent && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getPrereqStatusBadge(
                          status
                        )}`}
                      >
                        {status === "completed"
                          ? "Completed"
                          : status === "in_progress"
                          ? "In progress"
                          : "Not started"}
                      </span>
                    )}
                  </div>

                  {isStudent && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${progressValue}%` }}
                        ></div>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {progressValue}% completed
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isStudent && missingPrereqs.length > 0 && (
            <div className="mt-2 p-2 border border-amber-300 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-800 font-medium">
                You must complete these before enrolling:
              </p>
              <ul className="list-disc list-inside text-xs text-amber-900 mt-1">
                {missingPrereqs.map((m) => (
                  <li key={m._id}>{m.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Important Dates */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2">
        <h4 className="text-lg font-semibold text-gray-900">Important Dates</h4>
        {course.endDate ? (
          <div className="bg-gray-50 border rounded-xl p-3">
            <p className="text-gray-500 mb-1 text-sm">
              {new Date(course.endDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <h6 className="font-medium text-gray-900 text-sm mb-1">
              Course ends
            </h6>
            <p className="text-gray-600 text-sm">
              After the course ends, the course content may be archived or
              restricted by the instructor.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No important date information is available.
          </p>
        )}
      </div>

      {/* Progress & Certificate (for enrolled students) */}
      {alreadyEnrolled && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h5 className="font-semibold text-gray-900 text-sm">
            Your Course Progress
          </h5>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 text-right">{progress}%</p>

          {/* Certificate banner when course is fully completed */}
          {progress === 100 && (
            <div className="mt-3 p-3 border border-green-300 bg-green-50 rounded-xl">
              {certificate ? (
                <>
                  <p className="font-medium text-green-800 text-sm">
                    🎉 Congratulations! You’ve completed this course.
                  </p>

                  {certificate.certificateCode && (
                    <p className="text-xs text-green-700 mt-1">
                      Certificate Code:{" "}
                      <span className="font-mono font-semibold">
                        {certificate.certificateCode}
                      </span>
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      to="/student/certificates"
                      className="px-3 py-1.5 text-xs border border-green-700 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      View All Certificates
                    </Link>

                    {certificate.pdfUrl && certificate.status === "issued" && (
                      <a
                        href={certificate.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Download Certificate
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-green-800">
                  🎉 Course completed! Your certificate will appear in{" "}
                  <Link
                    to="/student/certificates"
                    className="underline font-medium"
                  >
                    My Certificates
                  </Link>{" "}
                  once it is issued.
                </p>
              )}

              {certificateError && (
                <p className="text-[11px] text-red-600 mt-1">
                  {certificateError}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action bar (Enroll / Consultation / Discussion) */}
      <div className="flex flex-wrap gap-2 items-center">
        {isStudent && (
          <>
            {!alreadyEnrolled ? (
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm text-sm font-semibold"
                onClick={handleEnroll}
              >
                Enroll in this course
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg shadow-sm text-sm font-semibold cursor-default"
                disabled
              >
                Already Enrolled
              </button>
            )}

            {alreadyEnrolled && (
              <Link
                to={`/student/courses/${id}/consultation`}
                className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 shadow-sm text-sm font-semibold"
              >
                Book Consultation
              </Link>
            )}

            <Link
              to={`/student/courses/${id}/discussion`}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm text-sm font-semibold"
            >
              Discussion Board
            </Link>

            {enrollMsg && (
              <span
                className={`text-xs ${
                  enrollMsg.toLowerCase().includes("success") ||
                  enrollMsg.toLowerCase().includes("enrolled")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {enrollMsg}
              </span>
            )}
          </>
        )}
      </div>

      {/* Announcements */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            🔔 Announcements
          </h4>
          {isInstructor && (
            <span className="text-xs text-gray-500">
              Post updates for your learners.
            </span>
          )}
        </div>

        {isInstructor && (
          <div className="flex flex-col md:flex-row gap-2 items-stretch">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Share an important update with your students..."
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm text-sm font-semibold"
              onClick={handleAddAnnouncement}
            >
              Post
            </button>
          </div>
        )}

        {announcements.length === 0 ? (
          <p className="text-sm text-gray-500">No announcements yet.</p>
        ) : (
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li
                key={a._id || a.createdAt}
                className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex justify-between items-center"
              >
                <div className="text-sm text-gray-800">{a.content}</div>
                {isNew(a.createdAt) && (
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2">
                    NEW
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lessons */}
      {alreadyEnrolled && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
          <h4 className="text-lg font-semibold text-gray-900">Lessons</h4>
          {course.lessons?.length === 0 && (
            <p className="text-sm text-gray-500">No lessons added yet.</p>
          )}

          {course.lessons?.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4">
              {/* Lesson list */}
              <div className="md:w-1/3 border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden">
                {course.lessons.map((lesson, index) => {
                  const studentProgress = course.completedLessons?.find(
                    (cl) => cl.student.toString() === auth.user.id
                  );
                  const completed = studentProgress?.lessons?.some(
                    (lId) => lId.toString() === lesson._id.toString()
                  );
                  const locked = isLessonLocked(index);

                  return (
                    <button
                      key={lesson._id}
                      type="button"
                      className={`w-full flex justify-between items-center px-3 py-2 text-left text-sm transition ${
                        selectedLesson?._id === lesson._id
                          ? "bg-indigo-50 font-semibold"
                          : "bg-white"
                      } ${
                        locked
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (!locked) setSelectedLesson(lesson);
                        else alert("Complete previous lesson first 🔒");
                      }}
                    >
                      <span className="flex-1">
                        {index + 1}. {lesson.title} ({lesson.contentType})
                      </span>
                      <span className="flex gap-1 items-center text-[10px]">
                        {completed && (
                          <span className="bg-green-500 text-white px-2 py-0.5 rounded-full">
                            Completed
                          </span>
                        )}
                        {locked && (
                          <span className="bg-gray-400 text-white px-2 py-0.5 rounded-full">
                            🔒
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Lesson viewer */}
              <div className="md:w-2/3">
                <h5 className="font-medium text-gray-900 mb-2 text-sm">
                  Lesson Viewer
                </h5>
                <div className="border border-gray-100 rounded-xl p-3 min-h-[260px] flex items-center justify-center bg-slate-50">
                  {!selectedLesson && (
                    <p className="text-sm text-gray-500">
                      Select a lesson from the list to start learning.
                    </p>
                  )}
                  {selectedLesson && (
                    <div className="w-full bg-white rounded-xl p-2 shadow-sm">
                      {renderLessonContent()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
