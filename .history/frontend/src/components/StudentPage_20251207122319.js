import { Link, useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function StudentPage() {
  const { auth } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  const isNew = (date) => {
    const created = new Date(date);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/courses/my-courses",
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
        setCourses(res.data.courses || []);
      } catch (err) {
        setError("Failed to fetch your courses");
      }
    };

    if (auth.user?.role === "student") fetchCourses();
  }, [auth.user, auth.token]);

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

      {error && <p className="text-danger">{error}</p>}

      {/* Announcements Section */}
      {courses.length > 0 && (
        <>
          <hr />
          <h4>Recent Announcements</h4>
          <ul className="list-group mb-3">
            {courses.map((course) =>
              (course.announcements || []).map((a) => (
                <li
                  key={a._id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                >
                  <span>
                    <strong>{course.title}:</strong> {a.content}
                  </span>
                  {a.createdAt && isNew(a.createdAt) && (
                    <span className="badge bg-warning">New</span>
                  )}
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
