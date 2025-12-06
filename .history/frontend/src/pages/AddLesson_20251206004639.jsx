import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AddLesson() {
  const { courseId } = useParams();
  const navigate = useNavigate();

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

    if (!form.title || !form.url) {
      alert("Title and URL are required");
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem("auth")).token;

      const res = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/lessons`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Lesson added successfully");
      setForm({ title: "", contentType: "video", url: "" });

      // redirect back to instructor course details
      navigate(`/instructor/courses/${courseId}`);
    } catch (err) {
      console.error(err.response?.data);
      alert(err.response?.data?.message || "Failed to add lesson");
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
          required
        />

        <button className="btn btn-primary">Add Lesson</button>
      </form>
    </div>
  );
}
