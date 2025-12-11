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
      const myCourses = res.data.courses.filter(
        (c) => c.instructor._id === auth.user.id
      );
      setCourses(myCourses);
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
    } catch {
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
    } catch {
      setError("Failed to update status");
    }
  };

  const handleAddAnnouncement = async (courseId) => {
    const content = announcementInputs[courseId]?.trim();
    if (!content) return;

    try {
      const res = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/announcements`,
        { content },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId
            ? { ...c, announcements: res.data.announcements }
            : c
        )
      );

      setAnnouncementInputs((prev) => ({ ...prev, [courseId]: "" }));
    } catch {}
  };

  const isNew = (date) =>
    (new Date() - new Date(date)) / (1000 * 60 * 60 * 24) <= 3;

  return (
    <div className="max-w-7xl mx-auto px-4 pb-10">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Instructor Dashboard
        </h2>
        <p className="text-gray-500 mt-1">
          Create, manage and publish your courses
        </p>
      </div>

      {/* Create Course */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Create New Course</h3>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            placeholder="Course Title *"
            className="border rounded-lg px-4 py-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Category"
            className="border rounded-lg px-4 py-2"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <textarea
            placeholder="Course Description"
            className="border rounded-lg px-4 py-2 md:col-span-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <input
            type="date"
            className="border rounded-lg px-4 py-2"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <input
            type="date"
            className="border rounded-lg px-4 py-2"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />

          <select
            className="border rounded-lg px-4 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="published">Publish</option>
          </select>

          <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 font-semibold">
            Create Course
          </button>
        </form>

        {message && <p className="text-green-600 mt-3">{message}</p>}
        {error && <p className="text-red-600 mt-3">{error}</p>}
      </div>

      {/* Courses */}
      <h3 className="text-xl font-semibold mb-4">My Courses</h3>

      {courses.length === 0 && (
        <p className="text-gray-500">No courses created yet.</p>
      )}

      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course._id}
            className="bg-white rounded-xl shadow-md border hover:shadow-lg transition"
          >
            <div
              className="flex justify-between items-center p-4 cursor-pointer"
              onClick={() =>
                setExpandedCourseId(
                  expandedCourseId === course._id ? null : course._id
                )
              }
            >
              <div>
                <h4 className="font-semibold text-lg">{course.title}</h4>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    course.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {course.status.toUpperCase()}
                </span>
              </div>
              <span className="text-gray-400">
                {expandedCourseId === course._id ? "▲" : "▼"}
              </span>
            </div>

            {expandedCourseId === course._id && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-gray-600">{course.description}</p>

                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/instructor/course/${course._id}/edit`}
                    className="btn-yellow"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/instructor/courses/${course._id}`}
                    className="btn-blue"
                  >
                    Lessons
                  </Link>
                  <Link
                    to={`/instructor/courses/${course._id}/discussion`}
                    className="btn-gray"
                  >
                    Discussion
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(course)}
                    className="btn-gray"
                  >
                    {course.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="btn-red"
                  >
                    Delete
                  </button>
                </div>

                {/* Announcements */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <input
                    className="border rounded px-3 py-2 w-full mb-2"
                    placeholder="Add announcement"
                    value={announcementInputs[course._id] || ""}
                    onChange={(e) =>
                      setAnnouncementInputs((p) => ({
                        ...p,
                        [course._id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => handleAddAnnouncement(course._id)}
                    className="bg-indigo-600 text-white px-4 py-1 rounded"
                  >
                    Post
                  </button>

                  {course.announcements?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm">
                      {course.announcements.map((a) => (
                        <li
                          key={a._id}
                          className="flex justify-between bg-white px-3 py-2 rounded"
                        >
                          {a.content}
                          {isNew(a.createdAt) && (
                            <span className="text-xs bg-yellow-100 px-2 rounded">
                              New
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
