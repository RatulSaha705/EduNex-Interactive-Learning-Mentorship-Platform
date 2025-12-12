// frontend/src/components/StudentPage.js
import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function StudentPage() {
  const { auth } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [basedOnCategories, setBasedOnCategories] = useState([]); // ⭐ NEW
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth?.token || auth?.user?.role !== "student") return;

    const fetchCourses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/courses", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        const publishedCourses = res.data.courses.filter(
          (course) => course.status === "published"
        );
        setCourses(publishedCourses);

        // handle both enrolledStudents and students arrays
        const enrolled = publishedCourses.filter((course) => {
          const arr = course.enrolledStudents || course.students || [];
          return arr.some((id) => id.toString() === auth.user._id);
        });

        setEnrolledCourses(enrolled);
      } catch (err) {
        console.error(err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        setRecLoading(true);
        const res = await axios.get(
          "http://localhost:5000/api/recommendations/my",
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
        setRecommendedCourses(res.data.recommendations || []);
        setBasedOnCategories(res.data.basedOnCategories || []); // ⭐ NEW
      } catch (err) {
        console.error("Failed to load recommendations:", err);
        // don't crash the page if recs fail
      } finally {
        setRecLoading(false);
      }
    };

    fetchCourses();
    fetchRecommendations();
  }, [auth?.token, auth?.user?.role, auth?.user?._id]);

  const isNew = (date) => {
    const created = new Date(date);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  const isCourseNew = (date) => {
    if (!date) return false;
    const created = new Date(date);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-600">Loading courses...</p>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-600 font-medium">{error}</p>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-gray-800">Student Dashboard</h3>
        <p className="text-gray-600">
          Welcome! Browse, enroll, and manage your courses.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/courses"
          className="px-5 py-3 bg-blue-200 text-blue-800 rounded-lg shadow hover:bg-blue-300 transition font-medium"
        >
          Explore Courses
        </Link>

        <Link
          to="/student/my-courses"
          className="px-5 py-3 bg-green-200 text-green-800 rounded-lg shadow hover:bg-green-300 transition font-medium"
        >
          View My Courses
        </Link>

        <Link
          to="/student/certificates"
          className="px-5 py-3 bg-purple-200 text-purple-800 rounded-lg shadow hover:bg-purple-300 transition font-medium"
        >
          My Certificates
        </Link>

        <Link
          to="/student/consultations"
          className="px-5 py-3 bg-indigo-200 text-indigo-800 rounded-lg shadow hover:bg-indigo-300 transition font-medium"
        >
          Manage Consultations
        </Link>

        <Link
          to="/student/stats"
          className="px-5 py-3 bg-orange-200 text-orange-800 rounded-lg shadow hover:bg-orange-300 transition font-medium"
        >
          Learning Stats &amp; Analytics
        </Link>
      </div>

      {/* 🔔 Recent Announcements – moved near the top */}
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-lg">
              🔔
            </span>
            Recent Announcements
          </h4>
          {courses.length > 0 && (
            <span className="text-xs text-gray-500">
              From courses you can access
            </span>
          )}
        </div>

        {courses.length === 0 && (
          <p className="text-gray-500 text-sm">
            No courses available, so no announcements yet.
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((course) =>
            course.announcements?.map((a) => (
              <div
                key={a._id}
                className="bg-white p-4 rounded-xl shadow-md border flex justify-between items-start hover:shadow-lg transition"
              >
                <div className="text-gray-700">
                  <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                    {course.title}
                  </div>
                  <div className="text-sm mt-1">{a.content}</div>
                </div>
                {isNew(a.createdAt) && (
                  <span className="ml-3 px-2 py-1 text-xs font-semibold bg-yellow-400 text-black rounded-full">
                    New
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ⭐ Recommended Courses – more aesthetic */}
      <div className="space-y-2 mt-6">
        <div className="flex justify-between items-center">
          <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-lg">
              ⭐
            </span>
            Recommended For You
          </h4>
          {recLoading && (
            <span className="text-xs text-gray-500">Updating...</span>
          )}
        </div>

        {/* ⭐ NEW: explain why these are recommended */}
        {basedOnCategories.length > 0 && (
          <p className="text-xs text-gray-500 ml-1">
            Because you’ve been learning{" "}
            <span className="font-semibold">
              {basedOnCategories.join(", ")}
            </span>{" "}
            courses.
          </p>
        )}

        {recommendedCourses.length === 0 && !recLoading && (
          <div className="bg-white p-4 rounded-2xl shadow-md border border-dashed border-gray-300 mt-1">
            <p className="text-sm text-gray-600">
              Start enrolling in courses to get personalized recommendations
              based on your favorite categories.
            </p>
          </div>
        )}

        {recommendedCourses.length > 0 && (
          <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedCourses.map((course) => {
              const isNewCourse = isCourseNew(course.startDate);
              const learners = course.totalEnrolled || 0;
              const popularityBadge =
                learners >= 20
                  ? "Popular choice"
                  : learners >= 5
                  ? "Learners are joining"
                  : "Be one of the first";

              return (
                <Link
                  key={course._id}
                  to={`/student/courses/${course._id}`}
                  className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-[1px] rounded-2xl shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 group"
                >
                  <div className="h-full bg-white rounded-2xl p-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                          {course.category || "General"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {learners} learners
                        </span>
                      </div>

                      <h5 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition">
                        {course.title}
                      </h5>

                      {course.instructor?.name && (
                        <p className="text-xs text-gray-500">
                          By {course.instructor.name}
                        </p>
                      )}

                      <p className="text-sm text-gray-600 mt-1 leading-snug">
                        {course.description
                          ? course.description.slice(0, 110) + "..."
                          : "Click to view course details and syllabus."}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                        Recommended
                      </span>
                      <div className="flex items-center gap-2 text-gray-500">
                        {isNewCourse && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                            New
                          </span>
                        )}
                        <span>{popularityBadge}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Enrolled Courses */}
      {enrolledCourses.length > 0 && (
        <div className="space-y-4 mt-6">
          <h4 className="text-xl font-semibold text-gray-800">
            My Enrolled Courses
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {enrolledCourses.map((course) => (
              <Link
                key={course._id}
                to={`/student/my-courses/${course._id}`}
                className="bg-white p-4 rounded-xl shadow-md border hover:shadow-lg transition flex flex-col justify-between"
              >
                <h5 className="font-semibold text-gray-800 mb-2">
                  {course.title}
                </h5>
                <p className="text-gray-600 text-sm">
                  {course.description?.slice(0, 80)}...
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
