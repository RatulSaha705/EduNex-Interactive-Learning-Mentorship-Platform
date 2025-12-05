import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function CourseDetails() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollMsg, setEnrollMsg] = useState("");
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth?.token}` },
        });
        setCourse(res.data.course);

        // Calculate initial progress if already enrolled
        if (auth?.user) {
          const studentProgress = res.data.course.completedLessons?.find(
            (cl) =>
              cl.student === auth.user.id ||
              cl.student === auth.user.id.toString()
          );
          if (studentProgress) {
            setProgress(
              Math.floor(
                (studentProgress.lessons.length /
                  res.data.course.lessons.length) *
                  100
              )
            );
          }
        }
      } catch (err) {
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) fetchCourse();
  }, [id, auth?.token]);

  const handleEnroll = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setEnrollMsg(res.data.message);
      setCourse(res.data.course);
    } catch (err) {
      setEnrollMsg(err.response?.data?.message || "Failed to enroll");
    }
  };

  const handleCompleteLesson = async (lessonId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/lessons/${lessonId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setProgress(res.data.progress);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark lesson complete");
    }
  };

  if (loading) return <p>Loading course...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!course) return <p>Course not found</p>;

  const alreadyEnrolled =
    auth?.user &&
    course.enrolledStudents?.some(
      (studentId) => studentId.toString() === auth.user.id
    );

  // -------------------- Lesson Content Renderer --------------------
  const renderLessonContent = () => {
    if (!selectedLesson) return null;

    switch (selectedLesson.contentType) {
      case "video":
        return (
          <iframe
            width="100%"
            height="400"
            src={selectedLesson.url}
            title={selectedLesson.title}
            frameBorder="0"
            allowFullScreen
          ></iframe>
        );

      case "pdf":
        return (
          <iframe
            width="100%"
            height="500"
            src={selectedLesson.url}
            title={selectedLesson.title}
            frameBorder="0"
          ></iframe>
        );

      case "doc":
        return (
          <a
            href={selectedLesson.url}
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

  return (
    <div className="container mt-4">
      {/* Course Info */}
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <p>
        <strong>Category:</strong> {course.category || "N/A"}
      </p>
      <p>
        <strong>Instructor:</strong> {course.instructor?.name || "Unknown"}
      </p>

      {/* Progress Bar */}
      {alreadyEnrolled && (
        <div className="mb-3">
          <strong>Progress:</strong>
          <div className="progress">
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {progress}%
            </div>
          </div>
        </div>
      )}

      {/* Enroll Button */}
      {auth?.user?.role === "student" && (
        <>
          {!alreadyEnrolled ? (
            <button className="btn btn-primary" onClick={handleEnroll}>
              Enroll
            </button>
          ) : (
            <button className="btn btn-secondary" disabled>
              Already Enrolled
            </button>
          )}
        </>
      )}
      {enrollMsg && <p className="mt-2">{enrollMsg}</p>}

      {/* Lessons List & Viewer */}
      {alreadyEnrolled && (
        <>
          <hr />
          <h4>Lessons</h4>

          {course.lessons?.length === 0 && <p>No lessons added yet.</p>}

          <div className="row">
            {/* Lesson Menu */}
            <div className="col-md-4">
              <ul className="list-group">
                {course.lessons?.map((lesson, index) => {
                  const completed =
                    course.completedLessons
                      ?.find((cl) => cl.student.toString() === auth.user.id)
                      ?.lessons.includes(lesson._id) || false;
                  return (
                    <li
                      key={lesson._id}
                      className={`list-group-item d-flex justify-content-between align-items-center ${
                        selectedLesson?._id === lesson._id ? "active" : ""
                      }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      {index + 1}. {lesson.title} ({lesson.contentType})
                      {completed && (
                        <span className="badge bg-success">Completed</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Lesson Viewer */}
            <div className="col-md-8">
              <h5>Lesson Viewer</h5>
              {!selectedLesson && <p>Select a lesson to start learning</p>}
              {selectedLesson && (
                <div className="card p-3">
                  {renderLessonContent()}
                  {/* Mark as Completed Button */}
                  {!course.completedLessons?.some(
                    (cl) =>
                      cl.student.toString() === auth.user.id &&
                      cl.lessons.includes(selectedLesson._id)
                  ) && (
                    <button
                      className="btn btn-success mt-2"
                      onClick={() => handleCompleteLesson(selectedLesson._id)}
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
