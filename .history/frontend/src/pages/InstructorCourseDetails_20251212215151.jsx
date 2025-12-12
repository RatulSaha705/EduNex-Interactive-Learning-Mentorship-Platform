import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function InstructorCourseDetails() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth?.token) {
      setLoading(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        const apiCourse = res.data.course || res.data;
        setCourse(apiCourse);
      } catch (err) {
        console.error(err);
        setError("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, auth?.token]);

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/courses/${id}/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lessons: (prev.lessons || []).filter((l) => l._id !== lessonId),
        };
      });
    } catch (err) {
      console.error(err);
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

  // 🔒 Role guards
  if (!auth?.user) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <p className="text-red-600 font-semibold">
          Please log in to view this page.
        </p>
      </div>
    );
  }

  if (auth.user.role !== "instructor") {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <p className="text-red-600 font-semibold">
          Only instructors can manage course lessons.
        </p>
      </div>
    );
  }

  if (loading) return <p className="text-gray-600 mt-4">Loading...</p>;
  if (error) return <p className="text-red-600 mt-4">{error}</p>;
  if (!course) return <p className="text-gray-600 mt-4">Course not found</p>;

  return (
    <div className="max-w-5xl mx-auto px-4 mt-6">
      <h2 className="text-2xl font-semibold text-gray-800">{course.title}</h2>
      <p className="text-gray-700 mt-1">{course.description}</p>

      <div className="flex justify-between items-center mt-4 mb-6">
        <h4 className="text-xl font-semibold text-gray-800">Lessons</h4>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={() => navigate(`/instructor/courses/${id}/add-lesson`)}
        >
          + Add Lesson
        </button>
      </div>

      {course.lessons?.length === 0 && (
        <p className="text-gray-500">No lessons added yet.</p>
      )}

      <ul className="space-y-4">
        {course.lessons?.map((lesson, index) => (
          <li
            key={lesson._id}
            className="bg-white p-4 rounded-xl shadow border"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-1">
                <strong className="text-gray-800">
                  {index + 1}. {lesson.title}
                </strong>
                <div className="text-gray-500 mt-1">
                  Type: {lesson.contentType}
                </div>

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
                    className="mt-2 rounded"
                  />
                )}

                {lesson.contentType === "pdf" && (
                  <iframe
                    width="100%"
                    height="300"
                    src={lesson.url}
                    frameBorder="0"
                    title={lesson.title}
                    className="mt-2 rounded"
                  />
                )}

                {lesson.contentType === "doc" && (
                  <a
                    href={lesson.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                  >
                    Open Document
                  </a>
                )}
              </div>

              <div className="mt-3 md:mt-0 md:ml-4 flex flex-col">
                <button
                  className="px-3 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white transition"
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
