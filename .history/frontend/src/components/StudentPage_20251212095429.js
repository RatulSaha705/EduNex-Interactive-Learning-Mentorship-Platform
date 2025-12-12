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
      } catch (err) {
        console.error("Failed to load recommendations:", err);
        // don't show a hard error on dashboard for this
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
        {/* Redirect to CourseList page */}
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

        {/* 🔹 Learning Stats & Analytics */}
        <Link
          to="/student/stats"
          className="px-5 py-3 bg-orange-200 text-orange-800 rounded-lg shadow hover:bg-orange-300 transition font-medium"
        >
          Learning Stats &amp; Analytics
        </Link>
      </div>

      {/* 🔹 Recommended Courses */}
      <div className="space-y-4 mt-6">
        <div className="flex justify-between items-center">
          <h4 className="text-xl font-semibold text-gray-800">
            Recommended For You
          </h4>
          {recLoading && (
            <span className="text-xs text-gray-500">Updating...</span>
          )}
        </div>

        {recommendedCourses.length === 0 && !recLoading && (
          <div className="bg-white p-4 rounded-xl shadow-md border">
            <p className="text-sm text-gray-600">
              Start enrolling in courses to get personalized recommendations.
            </p>
          </div>
        )}

        {recommendedCourses.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedCourses.map((course) => (
              <Link
                key={course._id}
                to={`/student/courses/${course._id}`}
                className="bg-white p-4 rounded-xl shadow-md border hover:shadow-lg transition flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <p className="text-xs uppercase text-indigo-600 font-semibold tracking-wide">
                    {course.category || "General"}
                  </p>
                  <h5 className="font-semibold text-gray-800">
                    {course.title}
                  </h5>
                  {course.instructor?.name && (
                    <p className="text-xs text-gray-500">
                      By {course.instructor.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    {course.description
                      ? course.description.slice(0, 100) + "..."
                      : "Click to view course details."}
                  </p>
                </div>

                <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                  <span>{course.totalEnrolled || 0} learners</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                    Recommended
                  </span>
                </div>
              </Link>
            ))}
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

      {/* Recent Announcements */}
      <div className="space-y-4 mt-6">
        <h4 className="text-xl font-semibold text-gray-800">
          Recent Announcements
        </h4>

        {courses.length === 0 && (
          <p className="text-gray-500">No courses available</p>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((course) =>
            course.announcements?.map((a) => (
              <div
                key={a._id}
                className="bg-white p-4 rounded-xl shadow-md border flex justify-between items-start hover:shadow-lg transition"
              >
                <div className="text-gray-700">
                  <strong>{course.title}:</strong> {a.content}
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
    </div>
  );
}
