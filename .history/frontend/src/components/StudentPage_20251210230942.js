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
    <div className="max-w-6xl mx-auto px-4 mt-8 space-y-10">
      {/* Quick Actions / Dashboard Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/student/courses"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-medium"
        >
          Browse Courses
        </Link>

        <Link
          to="/student/my-courses"
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition font-medium"
        >
          My Courses
        </Link>

        <Link
          to="/student/consultations"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition font-medium"
        >
          My Consultations
        </Link>
      </div>

      {/* Header / Welcome */}
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-bold text-gray-800">Student Dashboard</h3>
        <p className="text-gray-600">
          Welcome! Here are your recent announcements and updates.
        </p>
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
    </div>
  );
}
