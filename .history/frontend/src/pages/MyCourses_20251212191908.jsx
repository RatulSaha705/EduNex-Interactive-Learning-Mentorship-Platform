import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function MyCourses() {
  const { auth } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Helper to format dates
  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Compute progress for a course if data is available
  const getProgressForCourse = (course) => {
    try {
      const totalLessons = course.lessons?.length || 0;
      if (
        !totalLessons ||
        !Array.isArray(course.completedLessons) ||
        !auth?.user?.id
      ) {
        return null;
      }

      const record = course.completedLessons.find(
        (cl) => cl.student?.toString() === auth.user.id
      );
      if (!record || !Array.isArray(record.lessons)) return null;

      const completedCount = record.lessons.filter((lessonId) =>
        (course.lessons || []).some(
          (l) => l?._id && lessonId && l._id.toString() === lessonId.toString()
        )
      ).length;

      if (!completedCount) return 0;
      return Math.round((completedCount / totalLessons) * 100);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchMyCourses = async () => {
      if (!auth?.token) {
        setLoading(false);
        setError("Please log in to view your courses.");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          "http://localhost:5000/api/courses/my-courses",
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setCourses(res.data.courses || []);
      } catch (err) {
        setError("Failed to load enrolled courses");
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [auth?.token]);

  if (!auth?.user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-red-600 font-semibold mb-3">
            Please log in to view your courses.
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <button className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800">
            <Link to="/student">← Back to student dashboard</Link>
          </button>
          <h3 className="text-3xl font-bold text-gray-900">My Courses</h3>
          <p className="text-sm text-gray-600">
            Continue where you left off and track your learning progress on
            EduNex.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Enrolled Courses
          </p>
          <p className="text-2xl font-bold text-indigo-700">
            {courses.length || 0}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-white rounded-xl border border-rose-200 p-4">
          <p className="text-rose-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="py-10 flex justify-center">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="inline-block h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Loading your courses…
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && courses.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-3">
          <div className="text-3xl">📚</div>
          <h4 className="text-lg font-semibold text-gray-800">
            You’re not enrolled in any courses yet
          </h4>
          <p className="text-sm text-gray-600 max-w-md">
            Explore the course catalog and enroll in your first course to start
            learning with EduNex.
          </p>
          <Link
            to="/student/courses"
            className="mt-1 inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Browse Courses
          </Link>
        </div>
      )}

      {/* Course grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const progress = getProgressForCourse(course);
            const hasProgress = progress !== null && progress >= 0;
            const totalLessons = course.lessons?.length || 0;

            return (
              <div
                key={course._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col"
              >
                <div className="p-4 flex-1 flex flex-col gap-2">
                  {/* Title & category */}
                  <div className="space-y-1">
                    <Link
                      to={`/student/courses/${course._id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-indigo-700 line-clamp-2"
                    >
                      {course.title}
                    </Link>

                    <div className="flex flex-wrap gap-2 text-[11px]">
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
                    </div>
                  </div>

                  {/* Description */}
                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {course.description}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="mt-1 space-y-1 text-xs text-gray-600">
                    <p>
                      <span className="font-semibold">Instructor:</span>{" "}
                      {course.instructor?.name || "Unknown"}
                    </p>
                    {totalLessons > 0 && (
                      <p>
                        <span className="font-semibold">Lessons:</span>{" "}
                        {totalLessons}
                      </p>
                    )}
                    {(course.startDate || course.endDate) && (
                      <p>
                        <span className="font-semibold">Schedule:</span>{" "}
                        {course.startDate ? formatDate(course.startDate) : "—"}{" "}
                        {course.endDate && "–"}{" "}
                        {course.endDate ? formatDate(course.endDate) : ""}
                      </p>
                    )}
                  </div>

                  {/* Progress bar */}
                  {hasProgress && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center text-[11px] text-gray-600 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-500">
                    Enrolled • {course.enrolledStudents?.length || 1} learner
                    {course.enrolledStudents?.length > 1 ? "s" : ""}
                  </div>
                  <Link
                    to={`/student/courses/${course._id}`}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                  >
                    Continue Course
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
