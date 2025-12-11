// frontend/src/components/CreateCourse.js
import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function CreateCourse() {
  const { auth } = useContext(AuthContext);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.title.trim() ||
      !form.category.trim() ||
      !form.description.trim()
    ) {
      setError("All fields are required");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/courses", form, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
      });

      setMessage(res.data.message || "Course created successfully!");
      setForm({ title: "", description: "", category: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Error creating course");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        className="card p-4 shadow"
        style={{ width: "500px", borderRadius: "15px" }}
      >
        <h3 className="text-center mb-4 text-primary">Create Course</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Course Title"
              className="form-control"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Category"
              className="form-control"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <textarea
              placeholder="Course Description"
              className="form-control"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>
          <button type="submit" className="btn btn-success w-100">
            Create Course
          </button>
        </form>
        {message && <p className="text-success mt-3 text-center">{message}</p>}
        {error && <p className="text-danger mt-3 text-center">{error}</p>}
      </div>
    </div>
  );
}
