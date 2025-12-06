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
  const [selectedLesson, setSelectedLesson] = useState(null);

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

      if (selectedLesson?._id === lessonId) setSelectedLesson(null);
    } catch (err) {
      alert("Failed to delete lesson");
    }
  };

  const renderLessonContent = (lesson) => {
    switch (lesson.contentType) {
      case "video":
        return (
          <iframe
            width="100%"
            height="300"
            src={
              lesson.url.includes("youtube")
                ? lesson.url.replace("watch?v=", "embed/")
                : lesson.url
            }
            title={lesson.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );

      case "pdf":
        return (
          <iframe
            width="100%"
            height="400"
            src={lesson.url}
            title={lesson.title}
          />
        );

      case "doc":
        return (
          <a
            href={lesson.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Open Document
          </a>
        );

      default:
        return <p>Unknown lesson type</p>;
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

      <div className="row">
        <div className="col-md-4">
          <ul className="list-group">
            {course.lessons?.map((lesson, index) => (
              <li
                key={lesson._id}
                className={`list-group-item ${
                  selectedLesson?._id === lesson._id ? "active" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setSelectedLesson(lesson)}
              >
                {index + 1}. {lesson.title} ({lesson.contentType})
                <button
                  className="btn btn-sm btn-outline-danger float-end"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLesson(lesson._id);
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-md-8">
          <h5>Lesson Preview</h5>
          {!selectedLesson && <p>Select a lesson to preview</p>}
          {selectedLesson && (
            <div className="card p-3">
              {renderLessonContent(selectedLesson)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
