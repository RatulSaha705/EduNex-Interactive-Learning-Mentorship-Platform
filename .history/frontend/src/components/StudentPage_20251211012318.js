import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function StudentPage() {
  const { auth } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExplore, setShowExplore] = useState(false);

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

        const enrolled = publishedCourses.filter((course) =>
          course.students?.includes(auth.user._id)
        );
        setEnrolledCourses(enrolled);
      } catch (err) {
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token && auth?.user?.role === "student") fetchCourses();
  }, [auth?.token, auth?.user?.role, auth.user._id]);

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

  // Courses that student hasn't enrolled in
  const availableCourses = courses.filter(
    (course) => !course.students?.includes(auth.user._id)
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
        <button
          onClick={() => setShowExplore(!showExplore)}
          className="px-5 py-3 bg-blue-200 text-blue-800 rounded-lg shadow hover:bg-blue-300 transition font-medium"
        >
          Explore Courses
        </button>

        <Link
          to="/student/my-courses"
          className="px-5 py-3 bg-green-200 text-green-800 rounded-lg shadow hover:bg-green-300 transition font-medium"
        >
          View My Courses
        </Link>

        <Link
          to="/student/consultations"
          className="px-5 py-3 bg-indigo-200 text-indigo-800 rounded-lg shadow hover:bg-indigo-300 transition font-medium"
        >
          Manage Consultations
        </Link>
      </div>

      {/* Explore Courses */}
      {showExplore && (
        <div className="space-y-4 mt-6">
          <h4 className="text-xl font-semibold text-gray-800">
            Available Courses
          </h4>
          {availableCourses.length === 0 ? (
            <p className="text-gray-500">No courses available to explore</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableCourses.map((course) => (
                <Link
                  key={course._id}
                  to={`/student/courses/${course._id}`}
                  className="bg-white p-4 rounded-xl shadow-md border hover:shadow-lg transition flex flex-col justify-between"
                >
                  <h5 className="font-semibold text-gray-800 mb-2">
                    {course.title}
                  </h5>
                  <p className="text-gray-600 text-sm">
                    {course.description?.slice(0, 80)}...
                  </p>
                  {isNew(course.createdAt) && (
                    <span className="mt-2 px-2 py-1 text-xs font-semibold bg-yellow-400 text-black rounded-full">
                      New
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

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
