// frontend/src/pages/AddLesson.jsx (or components/AddLesson.jsx)
import { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function AddLesson() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const [form, setForm] = useState({
    title: "",
    contentType: "video",
    url: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLoggedIn = !!auth?.user;
  const isInstructor = auth?.user?.role === "instructor";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isLoggedIn || !isInstructor) {
      setError("Only instructors can add lessons.");
      return;
    }

    if (!form.title.trim()) {
      setError("Lesson title is required.");
      return;
    }

    if (!form.url.trim()) {
      setError("Lesson URL is required.");
      return;
    }

    try {
      setSaving(true);

      await axios.post(
        `http://localhost:5000/api/courses/${courseId}/lessons`,
        {
          title: form.title.trim(),
          contentType: form.contentType,
          url: form.url.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setSuccess("Lesson added successfully ✅");
      setForm({ title: "", contentType: "video", url: "" });
    } catch (err) {
      console.error("Failed to add lesson:", err);
      setError(
        err.response?.data?.message || "Failed to add lesson. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-red-600 font-semibold">
          Please log in as an instructor to add lessons.
        </p>
      </div>
    );
  }

  if (!isInstructor) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-red-600 font-semibold">
          Only instructors can add lessons.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white shadow rounded p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold">Add Lesson</h3>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          >
            ⬅ Back
          </button>
        </div>

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        {success && (
          <p className="text-sm text-green-600 font-medium">{success}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Lesson title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <select
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            name="contentType"
            value={form.contentType}
            onChange={handleChange}
          >
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="doc">Document</option>
          </select>

          <input
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Lesson URL"
            name="url"
            value={form.url}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow transition disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add Lesson"}
          </button>
        </form>
      </div>
    </div>
  );
}
