import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function InstructorCourseDetails() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams(); // courseId
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setCourse(res.data.course);
      } catch (err) {
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) fetchCourse();
  }, [id, auth?.token]);

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/courses/${id}/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      setCourse((prev) => ({
        ...prev,
        lessons: prev.lessons.filter((l) => l._id !== lessonId),
      }));
    } catch (err) {
      alert("Failed to delete lesson");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!course) return <p>Course not found</p>;

  return (
    <div className="container mt-4">
      <h2>{course.title}</h2>
      <p>{course.description}</p>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Lessons</h4>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/instructor/courses/${id}/add-lesson`)}
        >
          + Add Lesson
        </button>
      </div>

      {course.lessons?.length === 0 && <p>No lessons added yet.</p>}

      <ul className="list-group">
        {course.lessons?.map((lesson, index) => (
          <li
            key={lesson._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>
                {index + 1}. {lesson.title}
              </strong>
              <div className="text-muted">Type: {lesson.contentType}</div>
              <div className="text-info mt-1">
                {/* Show URL for reference */}
                {lesson.url}
              </div>
            </div>

            <div>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleDeleteLesson(lesson._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
