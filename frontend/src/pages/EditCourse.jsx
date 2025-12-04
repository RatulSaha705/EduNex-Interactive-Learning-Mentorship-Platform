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
        { title, description, category },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      // Pass success message back to InstructorPage
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

        <button className="btn btn-primary">Update Course</button>
      </form>
    </div>
  );
}
