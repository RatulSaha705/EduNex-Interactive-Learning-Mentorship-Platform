import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ReportButton from "../components/ReportButton";

export default function CourseDetails() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollMsg, setEnrollMsg] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [certificateError, setCertificateError] = useState("");

  // 🔹 NEW: prerequisites state
  const [prerequisiteProgress, setPrerequisiteProgress] = useState([]);
  const [missingPrereqs, setMissingPrereqs] = useState([]);

  const isStudent = auth?.user?.role === "student";
  const isInstructor = auth?.user?.role === "instructor";

  useEffect(() => {
    if (!auth?.token) return;

    const fetchCourse = async () => {
      try {
        setError("");
        setEnrollMsg("");

        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        // Backend now returns { course, prerequisiteProgress } for students
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

  // 🔹 Load certificate info for this course (student only)
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

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

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
            existingStudent.lessons.map((l) => l.toString())
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
              className="rounded shadow"
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
            className="rounded shadow"
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
            className="rounded shadow"
          />
        );

      case "doc":
        return (
          <a
            key={selectedLesson._id}
            href={selectedLesson.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
            onClick={() => handleCompleteLesson(selectedLesson._id)}
          >
            Open Document
          </a>
        );

      default:
        return <p>Unknown lesson type</p>;
    }
  };

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

  if (loading)
    return <p className="text-center text-gray-500 mt-4">Loading course...</p>;
  if (!auth?.user)
    return (
      <p className="text-center text-red-500 mt-4">
        Please login to view course details
      </p>
    );
  if (error) return <p className="text-center text-red-600 mt-4">{error}</p>;
  if (!course) return <p className="text-center mt-4">Course not found</p>;

  const alreadyEnrolled =
    course.enrolledStudents?.some(
      (studentId) => studentId.toString() === auth.user.id
    ) || false;

  // Progress calculation
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

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Course Header with Report button */}
      <div className="bg-white shadow rounded p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">{course.title}</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {course.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                  {course.category}
                </span>
              )}
              {course.status && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold capitalize">
                  {course.status}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Instructor:{" "}
              <span className="font-medium">
                {course.instructor?.name || "Unknown"}
              </span>
            </p>
          </div>

          {/* 🚩 Report course button (small, top-right) */}
          {auth.user && (
            <div className="flex items-start gap-2">
              <ReportButton
                targetType="course"
                targetId={course._id}
                label="Report course"
                small
              />
            </div>
          )}
        </div>

        <p className="text-gray-700 mt-1">{course.description}</p>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
          <span>
            <strong>Category:</strong> {course.category || "N/A"}
          </span>
          <span>
            <strong>Instructor:</strong> {course.instructor?.name || "Unknown"}
          </span>
          <span>
            <strong>Duration:</strong>{" "}
            {course.startDate && course.endDate
              ? `${new Date(
                  course.startDate
                ).toLocaleDateString()} - ${new Date(
                  course.endDate
                ).toLocaleDateString()}`
              : "N/A"}
          </span>
        </div>
      </div>

      {/* 🔗 Prerequisite Courses */}
      {hasPrereqCourses && (
        <div className="bg-white shadow rounded p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              🔗 Prerequisite Courses
            </h4>
            {isStudent && (
              <span className="text-xs text-gray-500">
                You need to complete these before enrolling.
              </span>
            )}
          </div>

          <div className="space-y-2">
            {course.prerequisites.map((pre) => {
              const progressInfo =
                prerequisiteProgress?.find(
                  (p) =>
                    p.courseId === pre._id?.toString() || p.courseId === pre._id
                ) || {};
              const progressValue = progressInfo.progress ?? 0;
              const status = progressInfo.status || "not_started";

              return (
                <div
                  key={pre._id}
                  className="border rounded p-2 flex flex-col gap-1 bg-slate-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">
                        {pre.title || "Untitled course"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pre.category || "General"}
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
                      <div className="w-full bg-gray-200 h-2 rounded-full">
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
            <div className="mt-2 p-2 border border-amber-300 bg-amber-50 rounded">
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
      <div className="bg-white shadow rounded p-4 space-y-2">
        <h4 className="text-xl font-semibold">Important Dates</h4>
        {course.endDate ? (
          <div className="bg-gray-50 border rounded p-3">
            <p className="text-gray-500 mb-1">
              {new Date(course.endDate).toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
            <h6 className="font-medium mb-1">Course ends</h6>
            <p className="text-gray-600">
              After the course ends, the course content will be archived.
            </p>
          </div>
        ) : (
          <p>No important dates available.</p>
        )}
      </div>

      {/* Progress & Enrollment */}
      {alreadyEnrolled && (
        <div className="bg-white shadow rounded p-4">
          <h5 className="mb-2 font-medium">Course Progress: {progress}%</h5>
          <div className="w-full bg-gray-200 h-4 rounded-full">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Certificate banner when course is fully completed */}
          {progress === 100 && (
            <div className="mt-4 p-3 border border-green-300 bg-green-50 rounded">
              {certificate ? (
                <>
                  <p className="font-medium text-green-800">
                    🎉 Congratulations! You’ve completed this course.
                  </p>

                  {certificate.certificateCode && (
                    <p className="text-sm text-green-700 mt-1">
                      Certificate Code:{" "}
                      <span className="font-mono font-semibold">
                        {certificate.certificateCode}
                      </span>
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      to="/student/certificates"
                      className="px-3 py-1 text-sm border border-green-700 text-green-700 rounded hover:bg-green-100"
                    >
                      View All Certificates
                    </Link>

                    {certificate.pdfUrl && certificate.status === "issued" && (
                      <a
                        href={certificate.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Download Certificate
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-green-800">
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
                <p className="text-xs text-red-600 mt-1">{certificateError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {isStudent && (
        <div className="flex flex-wrap gap-2 items-center">
          {!alreadyEnrolled ? (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
              onClick={handleEnroll}
            >
              Enroll
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded shadow"
              disabled
            >
              Already Enrolled
            </button>
          )}
          {alreadyEnrolled && (
            <Link
              to={`/student/courses/${id}/consultation`}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 shadow"
            >
              Book Consultation
            </Link>
          )}

          {enrollMsg && (
            <span
              className={`text-sm ${
                enrollMsg.toLowerCase().includes("success") ||
                enrollMsg.toLowerCase().includes("enrolled")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {enrollMsg}
            </span>
          )}
        </div>
      )}

      <Link
        to={`/student/courses/${id}/discussion`}
        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 shadow inline-block"
      >
        Go to Discussion Board
      </Link>

      {/* Announcements */}
      <div className="bg-white shadow rounded p-4 space-y-2">
        <h4 className="text-xl font-semibold">Announcements</h4>
        {isInstructor && (
          <div className="flex gap-2">
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 flex-1"
              placeholder="Add new announcement"
              value={newAnnouncement}
              onChange={(e) => setNewAnnouncement(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
              onClick={handleAddAnnouncement}
            >
              Add
            </button>
          </div>
        )}
        {announcements.length === 0 ? (
          <p>No announcements yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {announcements.map((a) => (
              <li
                key={a._id || a.createdAt}
                className="py-2 flex justify-between items-center"
              >
                {a.content}
                {isNew(a.createdAt) && (
                  <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs ml-2">
                    New
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lessons */}
      {alreadyEnrolled && (
        <div className="bg-white shadow rounded p-4 space-y-2">
          <h4 className="text-xl font-semibold">Lessons</h4>
          {course.lessons?.length === 0 && <p>No lessons added yet.</p>}

          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3 border rounded divide-y divide-gray-200">
              {course.lessons?.map((lesson, index) => {
                const studentProgress = course.completedLessons?.find(
                  (cl) => cl.student.toString() === auth.user.id
                );
                const completed = studentProgress?.lessons?.some(
                  (lId) => lId.toString() === lesson._id.toString()
                );
                const locked = isLessonLocked(index);

                return (
                  <div
                    key={lesson._id}
                    className={`flex justify-between items-center px-3 py-2 cursor-pointer ${
                      selectedLesson?._id === lesson._id
                        ? "bg-blue-100 font-semibold"
                        : ""
                    } ${locked ? "opacity-50" : "hover:bg-gray-100"}`}
                    onClick={() => {
                      if (!locked) setSelectedLesson(lesson);
                      else alert("Complete previous lesson first 🔒");
                    }}
                  >
                    <span>
                      {index + 1}. {lesson.title} ({lesson.contentType})
                    </span>
                    <span className="flex gap-1">
                      {completed && (
                        <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">
                          Completed
                        </span>
                      )}
                      {locked && (
                        <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs">
                          🔒 Locked
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="md:w-2/3">
              <h5 className="font-medium mb-2">Lesson Viewer</h5>
              {!selectedLesson && <p>Select a lesson to start learning</p>}
              {selectedLesson && (
                <div className="border rounded p-3">
                  {renderLessonContent()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
