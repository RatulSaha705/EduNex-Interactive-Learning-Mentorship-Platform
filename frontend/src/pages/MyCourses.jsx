import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function MyCourses() {
  const { auth } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/courses/my-courses",
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setCourses(res.data.courses);
      } catch (err) {
        setError("Failed to load enrolled courses");
      }
    };

    if (auth?.token) {
      fetchMyCourses();
    }
  }, [auth?.token]);

  return (
    <div className="container mt-4">
      <h3>My Courses</h3>

      {error && <p className="text-danger">{error}</p>}

      {courses.length === 0 && <p>You are not enrolled in any courses yet.</p>}

      <div className="row">
        {courses.map((course) => (
          <div key={course._id} className="col-md-4 mb-3">
            <div className="card h-100">
              <div className="card-body">
                <Link to={`/student/courses/${course._id}`}>
                  <h5 className="card-title">{course.title}</h5>
                </Link>
                <p className="card-text">{course.description}</p>
                <small className="text-muted">
                  Instructor: {course.instructor?.name || "Unknown"}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
