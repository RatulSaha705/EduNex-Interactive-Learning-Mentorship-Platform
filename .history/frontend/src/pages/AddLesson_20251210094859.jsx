import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function AddLesson() {
  const { id: courseId } = useParams(); // match the route param

  const [form, setForm] = useState({
    title: "",
    contentType: "video",
    url: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = JSON.parse(localStorage.getItem("auth")).token;

      await axios.post(
        `http://localhost:5000/api/courses/${courseId}/lessons`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Lesson added successfully");
      setForm({ title: "", contentType: "video", url: "" });
    } catch (err) {
      alert("Failed to add lesson");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h3 className="text-2xl font-semibold mb-4">Add Lesson</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Lesson title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <select
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          name="contentType"
          value={form.contentType}
          onChange={handleChange}
        >
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="doc">Document</option>
        </select>

        <input
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Lesson URL"
          name="url"
          value={form.url}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Lesson
        </button>
      </form>
    </div>
  );
}
