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
    <div className="max-w-5xl mx-auto px-4 mt-8">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">
          Student Dashboard
        </h3>
        <p className="text-gray-600 mt-1">
          Welcome! You can browse and enroll in courses.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center flex-wrap gap-3 mb-8">
        <Link
          to="/student/courses"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          View All Courses
        </Link>

        <Link
          to="/student/my-courses"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          My Courses
        </Link>

        <Link
          to="/student/consultations"
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
        >
          My Consultations
        </Link>
      </div>

      {/* Announcements */}
      <h4 className="text-xl font-semibold text-gray-800 mb-3">
        Recent Announcements
      </h4>

      {courses.length === 0 && (
        <p className="text-gray-500">No courses available</p>
      )}

      <ul className="space-y-3">
        {courses.map((course) =>
          course.announcements?.map((a) => (
            <li
              key={a._id}
              className="flex justify-between items-start bg-white p-4 rounded-xl shadow-sm border"
            >
              <div className="text-gray-700">
                <strong>{course.title}:</strong> {a.content}
              </div>

              {isNew(a.createdAt) && (
                <span className="ml-3 px-2 py-1 text-xs font-semibold bg-yellow-400 text-black rounded-full">
                  New
                </span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
