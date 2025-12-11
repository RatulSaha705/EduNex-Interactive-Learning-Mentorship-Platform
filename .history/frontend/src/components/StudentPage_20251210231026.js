import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function StudentPage() {
  const { auth } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/courses", {
          headers: { Authorization: `Bearer ${auth?.token}` },
        });

        const publishedCourses = res.data.courses.filter(
          (course) => course.status === "published"
        );

        setCourses(publishedCourses);
      } catch (err) {
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token && auth?.user?.role === "student") fetchCourses();
  }, [auth?.token, auth?.user?.role]);

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

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/student/courses"
          className="px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium"
        >
          Browse Courses
        </Link>

        <Link
          to="/student/my-courses"
          className="px-5 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition font-medium"
        >
          My Courses
        </Link>

        <Link
          to="/student/consultations"
          className="px-5 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition font-medium"
        >
          My Consultations
        </Link>
      </div>

      {/* Recent Announcements */}
      <div className="space-y-4">
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

      {/* Quick Links / Suggestions */}
      <div className="bg-gray-50 p-4 rounded-xl shadow-inner">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">
          Quick Actions
        </h4>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/student/courses"
            className="px-4 py-2 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 transition"
          >
            Explore Courses
          </Link>
          <Link
            to="/student/my-courses"
            className="px-4 py-2 bg-green-200 text-green-800 rounded-lg hover:bg-green-300 transition"
          >
            View My Courses
          </Link>
          <Link
            to="/student/consultations"
            className="px-4 py-2 bg-indigo-200 text-indigo-800 rounded-lg hover:bg-indigo-300 transition"
          >
            Manage Consultations
          </Link>
        </div>
      </div>
    </div>
  );
}
