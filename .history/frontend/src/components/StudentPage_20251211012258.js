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
      <p className="text-center mt-10 text-gray-600 text-lg">
        Loading courses...
      </p>
    );

  if (error)
    return (
      <p className="text-center mt-10 text-red-600 font-medium text-lg">
        {error}
      </p>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-gray-800">Student Dashboard</h3>
        <p className="text-gray-600">
          Welcome! You can browse and enroll in courses.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <Link
          to="/student/courses"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition font-medium"
        >
          View All Courses
        </Link>
        <Link
          to="/student/my-courses"
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition font-medium"
        >
          My Courses
        </Link>
        <Link
          to="/student/consultations"
          className="px-6 py-3 bg-cyan-600 text-white rounded-lg shadow-md hover:bg-cyan-700 transition font-medium"
        >
          My Consultations
        </Link>
      </div>

      {/* Recent Announcements */}
      <div className="space-y-4">
        <h4 className="text-2xl font-semibold text-gray-800 mb-2">
          Recent Announcements
        </h4>

        {courses.length === 0 && (
          <p className="text-gray-500">No courses available</p>
        )}

        <ul className="grid md:grid-cols-2 gap-4">
          {courses.map((course) =>
            course.announcements?.map((a) => (
              <li
                key={a._id}
                className="flex justify-between items-start bg-white p-5 rounded-2xl shadow-md border hover:shadow-lg transition"
              >
                <div className="text-gray-700">
                  <strong className="text-gray-900">{course.title}:</strong>{" "}
                  {a.content}
                </div>

                {isNew(a.createdAt) && (
                  <span className="ml-3 px-3 py-1 text-xs font-semibold bg-yellow-400 text-black rounded-full">
                    New
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
