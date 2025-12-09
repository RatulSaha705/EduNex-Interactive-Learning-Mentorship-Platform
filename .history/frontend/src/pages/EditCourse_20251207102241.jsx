import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function EditCourse() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState(""); // ✅ new start date
  const [endDate, setEndDate] = useState(""); // ✅ new end date
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        setTitle(res.data.course.title);
        setDescription(res.data.course.description);
        setCategory(res.data.course.category);
        setStartDate(res.data.course.startDate?.split("T")[0] || ""); // format for input type="date"
        setEndDate(res.data.course.endDate?.split("T")[0] || "");
      } catch (err) {
        console.error(err);
        setError("Failed to load course");
      }
    };

    fetchCourse();
  }, [id, auth.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axios.put(
        `http://localhost:5000/api/courses/${id}`,
        { title, description, category, startDate, endDate }, // ✅ send date range
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      navigate("/instructor", {
        state: { successMsg: "Course updated successfully" },
      });
    } catch (err) {
      console.error(err);
      setError("Update failed");
    }
  };

  return (
    <div className="container mt-4">
      <h3>Edit Course</h3>

      {error && <p className="text-danger">{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          className="form-control mb-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          className="form-control mb-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          className="form-control mb-2"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        {/* ✅ Date range picker */}
        <div className="mb-2 d-flex gap-2">
          <div>
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary">Update Course</button>
      </form>
    </div>
  );
}
