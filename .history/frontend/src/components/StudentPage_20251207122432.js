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

        // Filter only published courses for students
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

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container mt-4 text-center">
      <h3>Student Dashboard</h3>
      <p>Welcome! You can browse and enroll in courses.</p>

      <div className="mt-3 mb-4">
        <Link to="/student/courses" className="btn btn-primary me-2">
          View All Courses
        </Link>

        <Link to="/student/my-courses" className="btn btn-success">
          My Courses
        </Link>
      </div>

      <h4>Recent Announcements</h4>
      {courses.length === 0 && <p>No courses available</p>}
      <ul className="list-group">
        {courses.map((course) =>
          course.announcements?.map((a) => (
            <li
              key={a._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>{course.title}:</strong> {a.content}
              </div>
              {isNew(a.createdAt) && (
                <span className="badge bg-warning">New</span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
