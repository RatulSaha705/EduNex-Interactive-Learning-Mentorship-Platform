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
    status: "draft", // ✅ initial status
    startDate: "", // ✅ Start Date
    endDate: "", // ✅ End Date
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.successMsg) {
      setMessage(location.state.successMsg);
      window.history.replaceState({}, document.title);

      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

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
      setTimeout(() => setMessage(""), 4000);

      setForm({
        title: "",
        description: "",
        category: "",
        status: "draft",
        startDate: "",
        endDate: "",
      });
      fetchCourses();
    } catch (err) {
      setError(err.response?.data?.message || "Error creating course");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      setMessage("Course deleted successfully");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setError("Failed to delete course");
    }
  };

  const handleToggleStatus = async (course) => {
    try {
      const newStatus = course.status === "published" ? "draft" : "published";
      const res = await axios.put(
        `http://localhost:5000/api/courses/${course._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setCourses((prev) =>
        prev.map((c) => (c._id === course._id ? res.data.course : c))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
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

          {/* ✅ Start & End Date Pickers */}
          <div className="mb-2">
            <label>
              Start Date:
              <input
                type="date"
                name="startDate"
                className="form-control"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
            </label>
          </div>
          <div className="mb-2">
            <label>
              End Date:
              <input
                type="date"
                name="endDate"
                className="form-control"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </label>
          </div>

          {/* ✅ Status */}
          <select
            className="form-control mb-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="published">Publish</option>
          </select>

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
            {/* ✅ Display Course Dates if available */}
            {course.startDate && course.endDate && (
              <small>
                Course Duration:{" "}
                {new Date(course.startDate).toLocaleDateString()} -{" "}
                {new Date(course.endDate).toLocaleDateString()}
              </small>
            )}
            <br />
            <small className="text-muted">
              Lessons: {course.lessons?.length || 0}
            </small>
            <br />
            <span
              className={`badge ${
                course.status === "published" ? "bg-success" : "bg-warning"
              }`}
            >
              {course.status.toUpperCase()}
            </span>
            <div className="mt-2">
              <Link
                to={`/instructor/course/${course._id}/edit`}
                className="btn btn-sm btn-warning me-2"
              >
                Edit
              </Link>

              <Link
                to={`/instructor/courses/${course._id}`}
                className="btn btn-sm btn-primary me-2"
              >
                Manage Lessons
              </Link>

              <button
                className="btn btn-sm btn-secondary me-2"
                onClick={() => handleToggleStatus(course)}
              >
                {course.status === "published" ? "Unpublish" : "Publish"}
              </button>

              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteCourse(course._id)}
              >
                Delete Course
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
