import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

export default function InstructorPage() {
  const { auth } = useContext(AuthContext);
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Show success message if navigated from EditCourse
  useEffect(() => {
    if (location.state?.successMsg) {
      setMessage(location.state.successMsg);
      window.history.replaceState({}, document.title); // Clear state

      // Auto-hide message after 4 seconds
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      // Filter only instructor's courses
      const myCourses = res.data.courses.filter(
        (c) => c.instructor._id === auth.user.id
      );
      setCourses(myCourses);
    } catch (err) {
      setError("Error fetching courses");
    }
  };

  useEffect(() => {
    if (auth.user) fetchCourses();
  }, [auth.user]);

  // Create new course
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Course title is required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/courses", form, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });

      setMessage(res.data.message);

      // Auto-hide new course success message as well
      setTimeout(() => setMessage(""), 4000);

      setForm({ title: "", description: "", category: "" });
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating course");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Instructor Dashboard</h3>

      {/* Create Course */}
      <div className="card p-3 mb-4">
        <h5>Create New Course</h5>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Course Title"
            className="form-control mb-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Description"
            className="form-control mb-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="text"
            placeholder="Category"
            className="form-control mb-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <button className="btn btn-primary">Create Course</button>
        </form>

        {message && <p className="text-success mt-2">{message}</p>}
        {error && <p className="text-danger mt-2">{error}</p>}
      </div>

      {/* My Courses */}
      <h5>My Courses</h5>
      {courses.length === 0 && <p>No courses created yet.</p>}

      <ul className="list-group">
        {courses.map((course) => (
          <li key={course._id} className="list-group-item">
            <strong>{course.title}</strong> — {course.category}
            <br />
            {course.description && <small>{course.description}</small>}
            <br />
            <Link
              to={`/instructor/course/${course._id}/edit`}
              className="btn btn-sm btn-warning mt-2"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
