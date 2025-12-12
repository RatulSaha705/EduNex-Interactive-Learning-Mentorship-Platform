// frontend/src/components/CreateCourse.js
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function CreateCourse() {
  const { auth } = useContext(AuthContext);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "beginner",
    startDate: "",
    endDate: "",
    prerequisites: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // available courses that can be used as prerequisites
  const [availablePrereqCourses, setAvailablePrereqCourses] = useState([]);
  const [loadingPrereq, setLoadingPrereq] = useState(false);

  const isLoggedIn = !!auth?.user;
  const isInstructor = auth?.user?.role === "instructor";

  // Load instructor's other courses to use as prerequisites
  useEffect(() => {
    if (!auth?.token || !isInstructor) return;

    const fetchInstructorCourses = async () => {
      try {
        setLoadingPrereq(true);

        // backend supports ?instructor=...
        const res = await axios.get(
          `http://localhost:5000/api/courses?instructor=${encodeURIComponent(
            auth.user.name || ""
          )}`,
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );

        const all = res.data.courses || [];
        // use all non-archived courses as possible prerequisites
        const selectable = all.filter((c) => c.status !== "archived");

        setAvailablePrereqCourses(selectable);
      } catch (err) {
        console.error("Failed to load possible prerequisite courses:", err);
      } finally {
        setLoadingPrereq(false);
      }
    };

    fetchInstructorCourses();
  }, [auth?.token, auth?.user?.name, isInstructor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // toggle a course as prerequisite
  const togglePrerequisite = (courseId) => {
    setForm((prev) => {
      const already = prev.prerequisites.includes(courseId);
      return {
        ...prev,
        prerequisites: already
          ? prev.prerequisites.filter((id) => id !== courseId)
          : [...prev.prerequisites, courseId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Course title is required.");
      return;
    }
    if (!form.description.trim()) {
      setError("Course description is required.");
      return;
    }
    if (!form.category.trim()) {
      setError("Course category is required.");
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        "http://localhost:5000/api/courses",
        {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          level: form.level,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          prerequisites: form.prerequisites,
        },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      setSuccess("Course created successfully in draft mode.");
      setForm({
        title: "",
        description: "",
        category: "",
        level: "beginner",
        startDate: "",
        endDate: "",
        prerequisites: [],
      });
    } catch (err) {
      console.error("Create course error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to create course. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // 🔒 Guards AFTER hooks
  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <p className="text-red-600 font-semibold">
          Please log in as an instructor to create courses.
        </p>
      </div>
    );
  }

  if (!isInstructor) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <p className="text-red-600 font-semibold">
          Only instructors can create courses.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <div className="bg-white shadow rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Create New Course
            </h2>
            <p className="text-sm text-gray-500">
              Draft your course, set prerequisites, and publish when ready.
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
            Instructor: {auth.user.name}
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
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Data Structures with JavaScript"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What will students learn in this course?"
            />
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Programming, Math, Design..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Optional schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Start Date (optional)
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                End Date (optional)
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Prerequisite courses */}
          <div className="border rounded-lg p-3 bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <div>
                <label className="block text-sm font-medium">
                  Prerequisite Courses (optional)
                </label>
                <p className="text-xs text-gray-500">
                  Students must complete these before enrolling in this course.
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
                You don&apos;t have any other courses yet to use as
                prerequisites.
              </p>
            ) : (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                {availablePrereqCourses.map((c) => {
                  const selected = form.prerequisites.includes(c._id);
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

            {form.prerequisites.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {form.prerequisites.map((id) => {
                  const course = availablePrereqCourses.find(
                    (c) => c._id === id
                  );
                  if (!course) return null;
                  return (
                    <span
                      key={id}
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
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Course (Draft)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
