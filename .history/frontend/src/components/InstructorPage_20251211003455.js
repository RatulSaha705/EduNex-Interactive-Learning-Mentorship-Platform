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
    } catch (err) {
      console.log(err.response?.data?.message || "Failed to add announcement");
    }
  };

  const isNew = (date) => {
    const created = new Date(date);
    const now = new Date();
    return (now - created) / (1000 * 60 * 60 * 24) <= 3;
  };

  return (
    <div className="container mx-auto mt-4 px-2">
      <h3 className="text-2xl font-semibold mb-4">Instructor Dashboard</h3>

      {/* Create Course */}
      <div className="bg-white shadow p-4 mb-6 rounded">
        <h5 className="text-lg font-medium mb-3">Create New Course</h5>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            type="text"
            placeholder="Course Title"
            className="border rounded px-3 py-2 w-full"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Category"
            className="border rounded px-3 py-2 w-full"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <input
            type="text"
            placeholder="Description"
            className="border rounded px-3 py-2 col-span-1 md:col-span-2 w-full"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div>
            <label className="block mb-1">Start Date:</label>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block mb-1">End Date:</label>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>
          <select
            className="border rounded px-3 py-2 w-full md:w-auto"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="published">Publish</option>
          </select>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full md:w-auto">
            Create Course
          </button>
        </form>
        {message && <p className="text-green-600 mt-2">{message}</p>}
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {/* My Courses */}
      <h5 className="text-lg font-medium mb-2">My Courses</h5>
      {courses.length === 0 && <p>No courses created yet.</p>}

      <ul>
        {courses.map((course) => (
          <li
            key={course._id}
            className="border rounded mb-4 p-3 hover:shadow-sm cursor-pointer"
          >
            <div
              className="flex justify-between items-center"
              onClick={() =>
                setExpandedCourseId(
                  expandedCourseId === course._id ? null : course._id
                )
              }
            >
              <div>
                <strong>{course.title}</strong> — {course.category}{" "}
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    course.status === "published"
                      ? "bg-green-200 text-green-800"
                      : "bg-yellow-200 text-yellow-800"
                  } ml-2`}
                >
                  {course.status.toUpperCase()}
                </span>
              </div>
              <div>{expandedCourseId === course._id ? "▲" : "▼"}</div>
            </div>

            {expandedCourseId === course._id && (
              <div className="mt-3">
                {course.description && <p>{course.description}</p>}
                {course.startDate && course.endDate && (
                  <small className="text-gray-500">
                    Duration: {new Date(course.startDate).toLocaleDateString()}{" "}
                    - {new Date(course.endDate).toLocaleDateString()}
                  </small>
                )}
                <br />
                <small className="text-gray-400">
                  Lessons: {course.lessons?.length || 0}
                </small>

                {/* Course Actions */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link
                    to={`/instructor/course/${course._id}/edit`}
                    className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500 text-sm"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/instructor/courses/${course._id}`}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                  >
                    Manage Lessons
                  </Link>
                  <Link
                    to={`/instructor/courses/${course._id}/discussion`}
                    className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                  >
                    Discussion Board
                  </Link>
                  <button
                    className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm"
                    onClick={() => handleToggleStatus(course)}
                  >
                    {course.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                    onClick={() => handleDeleteCourse(course._id)}
                  >
                    Delete
                  </button>
                </div>

                {/* Announcements */}
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Add new announcement"
                    className="border rounded px-3 py-2 w-full mb-2"
                    value={announcementInputs[course._id] || ""}
                    onChange={(e) =>
                      setAnnouncementInputs((prev) => ({
                        ...prev,
                        [course._id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 mb-2"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddAnnouncement(course._id);
                    }}
                  >
                    POST
                  </button>

                  {course.announcements?.length > 0 && (
                    <>
                      <button
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 mb-2 text-sm"
                        onClick={() =>
                          setShowAnnouncements((prev) => ({
                            ...prev,
                            [course._id]: !prev[course._id],
                          }))
                        }
                      >
                        {showAnnouncements[course._id]
                          ? "Hide Announcements"
                          : "View Announcements"}
                      </button>

                      {showAnnouncements[course._id] && (
                        <ul className="border rounded divide-y divide-gray-200">
                          {course.announcements.map((a) => (
                            <li
                              key={a._id}
                              className="flex justify-between items-center px-3 py-2"
                            >
                              {a.content}
                              {isNew(a.createdAt) && (
                                <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded">
                                  New
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
