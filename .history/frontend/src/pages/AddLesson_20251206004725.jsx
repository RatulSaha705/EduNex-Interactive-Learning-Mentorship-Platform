import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function AddLesson() {
  const { courseId } = useParams();

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
    <div className="container mt-4">
      <h3>Add Lesson</h3>

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          placeholder="Lesson title"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <select
          className="form-control mb-2"
          name="contentType"
          value={form.contentType}
          onChange={handleChange}
        >
          <option value="video">Video</option>
          <option value="pdf">PDF</option>
          <option value="doc">Document</option>
        </select>

        <input
          className="form-control mb-2"
          placeholder="Lesson URL"
          name="url"
          value={form.url}
          onChange={handleChange}
        />

        <button className="btn btn-primary">Add Lesson</button>
      </form>
    </div>
  );
}
