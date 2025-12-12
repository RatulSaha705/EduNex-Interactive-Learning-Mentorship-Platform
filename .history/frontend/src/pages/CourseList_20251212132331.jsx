// frontend/src/pages/CourseList.jsx
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function CourseList() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");

  // 🔹 New: UI state for enroll UX
  const [enrollingCourseId, setEnrollingCourseId] = useState(null);
  const [toast, setToast] = useState(null); // { type: "success" | "error", message: string }

  // ---- Helpers ----
  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isNewCourse = (createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  const formatPrerequisiteLabel = (prereq, index) => {
    if (!prereq) return `Course ${index + 1}`;
    if (typeof prereq === "string") return `Course ${index + 1}`;
    if (typeof prereq === "object" && prereq.title) return prereq.title;
    return `Course ${index + 1}`;
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    // auto-hide after a while
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // ---- API: fetch courses ----
  const fetchCourses = async (categoryQuery, instructorQuery) => {
    if (!auth?.token) {
      setLoading(false);
      setError("Please log in to view available courses.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = {};
      if (categoryQuery) params.category = categoryQuery;
      if (instructorQuery) params.instructor = instructorQuery;

      const res = await axios.get("http://localhost:5000/api/courses", {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        params,
      });

      setCourses(res.data.courses || []);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch courses. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    if (auth?.token) {
      fetchCourses();
    } else {
      setLoading(false);
    }
  }, [auth?.token]);

  const handleApplyFilters = () => {
    fetchCourses(categoryFilter.trim(), instructorFilter.trim());
  };

  const handleClearFilters = () => {
    setCategoryFilter("");
    setInstructorFilter("");
    fetchCourses();
  };

  // ---- Enroll ----
  const handleEnroll = async (courseId) => {
    if (!auth?.token) {
      showToast("error", "Please log in to enroll in a course.");
      navigate("/login");
      return;
    }

    try {
      setEnrollingCourseId(courseId);
      showToast(null, ""); // clear any previous

      const res = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/enroll`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      const updatedCourse = res.data.course || res.data;

      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId ? { ...course, ...updatedCourse } : course
        )
      );

      showToast("success", res.data.message || "Enrolled successfully.");
    } catch (err) {
      console.error("Failed to enroll:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to enroll in this course. Please try again.";
      showToast("error", msg);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const isEnrolled = (course) => {
    if (!auth?.user) return false;
    if (!Array.isArray(course.enrolledStudents)) return false;
    return course.enrolledStudents.some(
      (id) => id?.toString() === auth.user.id
    );
  };

  // ================== RENDER ==================
  if (!auth?.user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-center text-red-600 font-semibold">
          Please log in to browse courses.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* 🔔 Toast (top-right) */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 max-w-sm rounded-xl shadow-lg px-4 py-3 text-sm text-white flex items-start gap-3 ${
            toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          <span className="mt-0.5">{toast.type === "error" ? "⚠️" : "✅"}</span>
          <div className="flex-1">{toast.message}</div>
          <button
            className="text-xs text-white/80 hover:text-white"
            onClick={() => setToast(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">All Courses</h2>
          <p className="text-gray-600">
            Browse courses and enroll to start your learning journey on EduNex.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Total Courses
          </p>
          <p className="text-2xl font-bold text-indigo-700">
            {courses.length || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Category
          </label>
          <input
            type="text"
            placeholder="e.g. Programming, Design…"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Instructor name
          </label>
          <input
            type="text"
            placeholder="Search by instructor…"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm"
          >
            Apply
          </button>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Loading / Error / Empty states */}
      {loading && (
        <div className="py-10 flex justify-center">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="inline-block h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            Loading courses…
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="py-6">
          <p className="text-center text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="py-10">
          <p className="text-center text-gray-500">
            No courses found. Try adjusting your filters.
          </p>
        </div>
      )}

      {/* Course grid */}
      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course) => {
            const enrolled = isEnrolled(course);
            const lessonsCount = course.lessons?.length || 0;
            const hasPrereqs =
              Array.isArray(course.prerequisites) &&
              course.prerequisites.length > 0;

            return (
              <div
                key={course._id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition flex flex-col"
              >
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {course.title}
                      </h3>
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
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              course.status === "published"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : course.status === "archived"
                                ? "bg-gray-100 text-gray-700 border border-gray-200"
                                : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                            }`}
                          >
                            {course.status}
                            {isNewCourse(course.createdAt) && " · New"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {course.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {course.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-gray-600 mt-1">
                    {course.instructor?.name && (
                      <span>
                        <span className="font-semibold">Instructor:</span>{" "}
                        {course.instructor.name}
                      </span>
                    )}
                    {lessonsCount > 0 && (
                      <span>
                        <span className="font-semibold">Lessons:</span>{" "}
                        {lessonsCount}
                      </span>
                    )}
                    {course.duration && (
                      <span>
                        <span className="font-semibold">Duration:</span>{" "}
                        {course.duration} day
                        {course.duration > 1 ? "s" : ""}
                      </span>
                    )}
                    {course.startDate && (
                      <span>
                        <span className="font-semibold">Starts:</span>{" "}
                        {formatDate(course.startDate)}
                      </span>
                    )}
                  </div>

                  {/* 🔹 Prerequisites display */}
                  {hasPrereqs && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      <p className="font-semibold">Prerequisites required</p>
                      <p className="mt-1">
                        {course.prerequisites
                          .map((p, idx) => formatPrerequisiteLabel(p, idx))
                          .join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    Enrolled: {course.enrolledStudents?.length || 0}
                  </div>
                  <div className="flex gap-2">
                    {enrolled ? (
                      <button
                        type="button"
                        disabled
                        className="px-3 py-1.5 rounded-lg bg-gray-300 text-gray-700 text-sm font-semibold cursor-default"
                      >
                        Enrolled
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrollingCourseId === course._id}
                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {enrollingCourseId === course._id && (
                          <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {enrollingCourseId === course._id
                          ? "Enrolling..."
                          : "Enroll"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                      onClick={() => navigate(`/student/courses/${course._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
