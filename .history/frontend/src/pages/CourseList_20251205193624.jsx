import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function CourseList() {
  const { auth } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      let url = "http://localhost:5000/api/courses";
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (instructorFilter) params.instructor = instructorFilter;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth?.token}` },
        params,
      });

      setCourses(res.data.courses || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth?.token) fetchCourses();
  }, [auth?.token, categoryFilter, instructorFilter]);

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container mt-4">
      <h2>Courses</h2>

      {/* Filters */}
      <div className="mb-3 d-flex gap-2">
        <input
          type="text"
          placeholder="Filter by category"
          className="form-control"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by instructor ID"
          className="form-control"
          value={instructorFilter}
          onChange={(e) => setInstructorFilter(e.target.value)}
        />
        <button className="btn btn-primary" onClick={fetchCourses}>
          Apply
        </button>
      </div>

      {/* Courses Grid */}
      <div className="row">
        {Array.isArray(courses) && courses.length > 0 ? (
          courses.map((course) => (
            <div key={course._id} className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text">{course.description}</p>
                  <p>
                    <strong>Category:</strong> {course.category || "N/A"}
                  </p>
                  <p>
                    <strong>Instructor:</strong>{" "}
                    {course.instructor?.name || "Unknown"}
                  </p>
                  <Link
                    to={`/student/courses/${course._id}`}
                    className="btn btn-primary"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No courses found.</p>
        )}
      </div>
    </div>
  );
}
