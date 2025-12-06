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

  // Function to calculate progress dynamically
  const calculateProgress = (completedLessons = [], totalLessons = 0) => {
    if (!totalLessons) return 0;
    const studentCompleted = completedLessons.find(
      (cl) => cl.student.toString() === auth.user?.id
    );
    const completedCount = studentCompleted?.lessons.length || 0;
    return Math.min(Math.floor((completedCount / totalLessons) * 100), 100);
  };

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth?.token}` },
        });
        setCourse(res.data.course);
      } catch (err) {
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) fetchCourse();
  }, [id, auth?.token]);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

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
      const studentProgress = course.completedLessons?.find(
        (cl) => cl.student.toString() === auth.user.id
      );
      if (studentProgress?.lessons.includes(lessonId)) return;

      await axios.post(
        `http://localhost:5000/api/courses/${id}/lessons/${lessonId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      setCourse((prevCourse) => {
        const updatedCompletedLessons = [...prevCourse.completedLessons];
        const existingStudent = updatedCompletedLessons.find(
          (cl) => cl.student.toString() === auth.user.id
        );

        if (existingStudent) {
          existingStudent.lessons = [
            ...new Set([...existingStudent.lessons, lessonId]),
          ];
        } else {
          updatedCompletedLessons.push({
            student: auth.user.id,
            lessons: [lessonId],
          });
        }

        return {
          ...prevCourse,
          completedLessons: updatedCompletedLessons,
        };
      });
    } catch (err) {
      console.log(
        err.response?.data?.message || "Failed to mark lesson complete"
      );
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

  const renderLessonContent = () => {
    if (!selectedLesson) return null;

    const completed =
      course.completedLessons
        ?.find((cl) => cl.student.toString() === auth.user.id)
        ?.lessons.includes(selectedLesson._id) || false;

    switch (selectedLesson.contentType) {
      case "video":
        const embedUrl =
          selectedLesson.url.includes("youtube.com") ||
          selectedLesson.url.includes("youtu.be")
            ? getYouTubeEmbedUrl(selectedLesson.url)
            : selectedLesson.url;

        if (embedUrl.includes("youtube.com/embed")) {
          return (
            <iframe
              key={selectedLesson._id}
              id="youtube-player"
              width="100%"
              height="400"
              src={embedUrl + "?enablejsapi=1"}
              title={selectedLesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => handleCompleteLesson(selectedLesson._id)}
            />
          );
        }

        return (
          <video
            key={selectedLesson._id}
            width="100%"
            height="400"
            controls
            onEnded={() => handleCompleteLesson(selectedLesson._id)}
          >
            <source src={selectedLesson.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        );

      case "pdf":
        return (
          <iframe
            key={selectedLesson._id}
            width="100%"
            height="500"
            src={selectedLesson.url}
            title={selectedLesson.title}
            frameBorder="0"
            onLoad={() => handleCompleteLesson(selectedLesson._id)}
          />
        );

      case "doc":
        return (
          <a
            key={selectedLesson._id}
            href={selectedLesson.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            onClick={() => handleCompleteLesson(selectedLesson._id)}
          >
            Open Document
          </a>
        );

      default:
        return <p>Unknown lesson type</p>;
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

  // Dynamically calculate progress
  const progress = calculateProgress(
    course.completedLessons,
    course.lessons?.length || 0
  );

  return (
    <div className="container mt-4">
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <p>
        <strong>Category:</strong> {course.category || "N/A"}
      </p>
      <p>
        <strong>Instructor:</strong> {course.instructor?.name || "Unknown"}
      </p>

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

      {alreadyEnrolled && (
        <>
          <hr />
          <h4>Lessons</h4>
          {course.lessons?.length === 0 && <p>No lessons added yet.</p>}

          <div className="row">
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

            <div className="col-md-8">
              <h5>Lesson Viewer</h5>
              {!selectedLesson && <p>Select a lesson to start learning</p>}
              {selectedLesson && (
                <div className="card p-3">{renderLessonContent()}</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
