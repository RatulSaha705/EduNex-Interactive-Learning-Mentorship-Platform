import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function CourseList() {
  const { auth } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [filters, setFilters] = useState({ category: "", instructor: "" });
  const [error, setError] = useState("");

  // Fetch all courses
  const fetchCourses = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axios.get(
        `http://localhost:5000/api/courses?${query}`,
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setCourses(res.data.courses);

      // Extract unique categories and instructors
      const cats = [
        ...new Set(res.data.courses.map((c) => c.category).filter(Boolean)),
      ];
      setCategories(cats);

      const instrs = [
        ...new Map(
          res.data.courses
            .filter((c) => c.instructor)
            .map((c) => [c.instructor._id, c.instructor])
        ).values(),
      ];
      setInstructors(instrs);
    } catch (err) {
      setError("Failed to load courses");
    }
  };

  useEffect(() => {
    if (auth?.token) fetchCourses();
  }, [auth?.token, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="container mt-4">
      <h3>All Courses</h3>

      {error && <p className="text-danger">{error}</p>}

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-md-4">
          <select
            className="form-control"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <select
            className="form-control"
            name="instructor"
            value={filters.instructor}
            onChange={handleFilterChange}
          >
            <option value="">All Instructors</option>
            {instructors.map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses List */}
      <div className="row">
        {courses.length === 0 && <p>No courses found.</p>}
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
                <p>
                  <strong>Category:</strong> {course.category || "N/A"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
