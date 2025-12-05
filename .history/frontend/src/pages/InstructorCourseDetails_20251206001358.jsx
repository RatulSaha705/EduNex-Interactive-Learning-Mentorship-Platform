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
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
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
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setCourse((prev) => ({
        ...prev,
        lessons: prev.lessons.filter((l) => l._id !== lessonId),
      }));
    } catch (err) {
      alert("Failed to delete lesson");
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (
        urlObj.hostname.includes("youtube.com") &&
        urlObj.searchParams.has("v")
      ) {
        return `https://www.youtube.com/embed/${urlObj.searchParams.get("v")}`;
      }
      if (urlObj.hostname === "youtu.be") {
        return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
      }
      return url;
    } catch {
      return url;
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
          <li key={lesson._id} className="list-group-item mb-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <strong>
                  {index + 1}. {lesson.title}
                </strong>
                <div className="text-muted">Type: {lesson.contentType}</div>

                {/* Render lesson content inline */}
                {lesson.contentType === "video" && (
                  <iframe
                    width="100%"
                    height="200"
                    src={
                      lesson.url.includes("youtube.com") ||
                      lesson.url.includes("youtu.be")
                        ? getYouTubeEmbedUrl(lesson.url)
                        : lesson.url
                    }
                    frameBorder="0"
                    allowFullScreen
                    title={lesson.title}
                    className="mt-2"
                  />
                )}

                {lesson.contentType === "pdf" && (
                  <iframe
                    width="100%"
                    height="300"
                    src={lesson.url}
                    frameBorder="0"
                    title={lesson.title}
                    className="mt-2"
                  />
                )}

                {lesson.contentType === "doc" && (
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary mt-2"
                  >
                    Open Document
                  </a>
                )}
              </div>

              <div className="ms-3 d-flex flex-column">
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteLesson(lesson._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
