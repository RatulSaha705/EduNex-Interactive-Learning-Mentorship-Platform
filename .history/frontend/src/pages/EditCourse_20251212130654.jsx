// frontend/src/pages/EditCourse.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("beginner");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🆕 prerequisites state
  const [prerequisites, setPrerequisites] = useState([]); // array of course IDs
  const [availablePrereqCourses, setAvailablePrereqCourses] = useState([]);
  const [loadingPrereq, setLoadingPrereq] = useState(false);

  useEffect(() => {
    if (!auth?.token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${auth.token}` };

    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers,
        });

        const c = res.data.course;
        setTitle(c.title || "");
        setDescription(c.description || "");
        setCategory(c.category || "");
        setLevel(c.level || "beginner");

        if (c.startDate) {
          setStartDate(c.startDate.substring(0, 10));
        }
        if (c.endDate) {
          setEndDate(c.endDate.substring(0, 10));
        }

        // 🆕 take existing prerequisites from API (may be ids or populated objects)
        const prereqIds =
          (c.prerequisites || []).map((p) =>
            typeof p === "string" ? p : p._id
          ) || [];
        setPrerequisites(prereqIds);
      } catch (err) {
        console.error("Failed to load course:", err);
        setError(
          err.response?.data?.message || "Failed to load course details."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchInstructorCourses = async () => {
      try {
        setLoadingPrereq(true);

        const res = await axios.get(
          `http://localhost:5000/api/courses?instructor=${encodeURIComponent(
            auth.user?.name || ""
          )}`,
          { headers }
        );

        const all = res.data.courses || [];

        // Do not allow course to be its own prerequisite
        const selectable = all.filter(
          (c) => c._id !== id && c.status !== "archived"
        );

        setAvailablePrereqCourses(selectable);
      } catch (err) {
        console.error("Failed to load instructor courses:", err);
      } finally {
        setLoadingPrereq(false);
      }
    };

    fetchCourse();
    if (auth?.user?.role === "instructor") {
      fetchInstructorCourses();
    }
  }, [auth?.token, auth?.user?.name, auth?.user?.role, id]);

  if (!auth?.user || auth.user.role !== "instructor") {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <p className="text-red-600 font-semibold">
          Only instructors can edit courses.
        </p>
      </div>
    );
  }

  const togglePrerequisite = (courseId) => {
    setPrerequisites((prev) => {
      const exists = prev.includes(courseId);
      return exists
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    try {
      setSaving(true);

      const headers = { Authorization: `Bearer ${auth.token}` };

      await axios.put(
        `http://localhost:5000/api/courses/${id}`,
        {
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          level,
          startDate: startDate || null,
          endDate: endDate || null,
          prerequisites, // 🆕 send updated prerequisites
        },
        { headers }
      );

      setSuccess("Course updated successfully.");
      setTimeout(() => {
        navigate(`/courses/${id}`);
      }, 900);
    } catch (err) {
      console.error("Failed to update course:", err);
      setError(
        err.response?.data?.message || "Failed to update course. Try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <p className="text-gray-600 text-sm">Loading course...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <div className="bg-white shadow rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Edit Course</h2>
            <p className="text-sm text-gray-500">
              Update course info, schedule, and prerequisites.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
            Course ID: {id}
          </span>
        </div>

        {error && (
          <div className="p-2 rounded bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-2 rounded bg-green-50 text-green-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 🆕 Prerequisite Courses */}
          <div className="border rounded-lg p-3 bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <div>
                <label className="block text-sm font-medium">
                  Prerequisite Courses
                </label>
                <p className="text-xs text-gray-500">
                  Students must have completed these courses before enrolling.
                </p>
              </div>
              {loadingPrereq && (
                <span className="text-[11px] text-gray-500 animate-pulse">
                  Loading...
                </span>
              )}
            </div>

            {availablePrereqCourses.length === 0 ? (
              <p className="text-xs text-gray-500 mt-1">
                You don&apos;t have any other courses to set as prerequisites.
              </p>
            ) : (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {availablePrereqCourses.map((c) => {
                  const selected = prerequisites.includes(c._id);
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => togglePrerequisite(c._id)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border text-left transition ${
                        selected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-[11px] text-gray-500">
                          {c.category} · {c.level || "beginner"}
                        </div>
                      </div>
                      {selected && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {prerequisites.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {prerequisites.map((idVal) => {
                  const course = availablePrereqCourses.find(
                    (c) => c._id === idVal
                  );
                  if (!course) return null;
                  return (
                    <span
                      key={idVal}
                      className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px]"
                    >
                      {course.title}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/courses/${id}`)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
