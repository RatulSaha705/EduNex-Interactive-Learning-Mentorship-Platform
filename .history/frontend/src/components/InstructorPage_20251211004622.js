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
    status: "draft",
    startDate: "",
    endDate: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [announcementInputs, setAnnouncementInputs] = useState({});
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [showAnnouncements, setShowAnnouncements] = useState({});

  useEffect(() => {
    if (location.state?.successMsg) {
      setMessage(location.state.successMsg);
      window.history.replaceState({}, document.title);
      setTimeout(() => setMessage(""), 4000);
    }
  }, [location.state]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setCourses(
        res.data.courses.filter((c) => c.instructor._id === auth.user.id)
      );
    } catch {
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

    try {
      const res = await axios.post("http://localhost:5000/api/courses", form, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });
      setMessage(res.data.message);
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

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    await axios.delete(`http://localhost:5000/api/courses/${id}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    setCourses((prev) => prev.filter((c) => c._id !== id));
  };

  const handleToggleStatus = async (course) => {
    const newStatus = course.status === "published" ? "draft" : "published";

    const res = await axios.put(
      `http://localhost:5000/api/courses/${course._id}/status`,
      { status: newStatus },
      { headers: { Authorization: `Bearer ${auth.token}` } }
    );

    setCourses((prev) =>
      prev.map((c) => (c._id === course._id ? res.data.course : c))
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Instructor Dashboard
        </h2>

        {/* CREATE COURSE */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-8">
          <h4 className="text-lg font-semibold mb-4">Create New Course</h4>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Course Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2 md:col-span-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Publish</option>
            </select>

            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2">
              Create Course
            </button>
          </form>

          {message && <p className="text-green-600 mt-3">{message}</p>}
          {error && <p className="text-red-600 mt-3">{error}</p>}
        </div>

        {/* MY COURSES */}
        <h4 className="text-xl font-semibold mb-4">My Courses</h4>

        <div className="grid gap-4">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-4"
            >
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setExpandedCourseId(
                    expandedCourseId === course._id ? null : course._id
                  )
                }
              >
                <div>
                  <h5 className="font-semibold text-lg">{course.title}</h5>
                  <p className="text-sm text-gray-500">{course.category}</p>
                </div>

                <span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    course.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {course.status.toUpperCase()}
                </span>
              </div>

              {expandedCourseId === course._id && (
                <div className="mt-4 space-y-3">
                  <p className="text-gray-700">{course.description}</p>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/instructor/course/${course._id}/edit`}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </Link>

                    <Link
                      to={`/instructor/courses/${course._id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Manage Lessons
                    </Link>

                    <Link
                      to={`/instructor/courses/${course._id}/discussion`}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Discussion Board
                    </Link>

                    <button
                      onClick={() => handleToggleStatus(course)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                    >
                      {course.status === "published" ? "Unpublish" : "Publish"}
                    </button>

                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
