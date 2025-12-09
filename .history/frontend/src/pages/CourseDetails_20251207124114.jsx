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
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");

  // Fetch course details
  useEffect(() => {
    if (!auth?.token) return;

    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        const courseData = res.data.course;

        if (
          auth?.user?.role === "student" &&
          courseData.status !== "published"
        ) {
          setError("This course is not available for students");
        } else {
          setCourse(courseData);
          setAnnouncements(courseData.announcements || []);
        }
      } catch (err) {
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, auth?.token, auth?.user?.role]);

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

        return { ...prevCourse, completedLessons: updatedCompletedLessons };
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

  const isLessonLocked = (lessonIndex) => {
    if (lessonIndex === 0) return false;
    const studentProgress = course.completedLessons?.find(
      (cl) => cl.student.toString() === auth.user.id
    );
    const prevLessonId = course.lessons[lessonIndex - 1]._id;
    return !studentProgress?.lessons.includes(prevLessonId);
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    try {
      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/announcements`,
        { content: newAnnouncement },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setAnnouncements(res.data.announcements);
      setNewAnnouncement("");
    } catch (err) {
      console.log(err.response?.data?.message || "Failed to add announcement");
    }
  };

  if (loading) return <p>Loading course...</p>;
  if (!auth?.user) return <p>Please login to view course details</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!course) return <p>Course not found</p>;

  const alreadyEnrolled =
    course.enrolledStudents?.some(
      (studentId) => studentId.toString() === auth.user.id
    ) || false;

  let progress = 0;
  if (alreadyEnrolled) {
    const totalLessons = course.lessons?.length || 1;
    const studentCompleted = course.completedLessons?.find(
      (cl) => cl.student.toString() === auth.user?.id
    );
    const completedCount =
      studentCompleted?.lessons.filter((lessonId) =>
        course.lessons.some((l) => l._id === lessonId)
      ).length || 0;
    progress = Math.floor((completedCount / totalLessons) * 100);
  }

  const isNew = (date) => {
    const created = new Date(date);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  return (
    <div className="container mt-4">
      <h2>{course.title}</h2>
      <p>{course.description}</p>

      {/* Course Info visible for all roles */}
      <p>
        <strong>Category:</strong> {course.category || "N/A"}
      </p>
      <p>
        <strong>Instructor:</strong> {course.instructor?.name || "Unknown"}
      </p>
      <p>
        <strong>Duration:</strong> {course.duration || "N/A"}
      </p>
      <p>
        <strong>Start Date:</strong>{" "}
        {course.startDate
          ? new Date(course.startDate).toLocaleDateString()
          : "N/A"}
      </p>
      <p>
        <strong>End Date:</strong>{" "}
        {course.endDate ? new Date(course.endDate).toLocaleDateString() : "N/A"}
      </p>
      <p>
        <strong>Total Lessons:</strong> {course.lessons?.length || 0}
      </p>

      {/* Progress Bar */}
      {alreadyEnrolled && (
        <div className="mb-3">
          <h5>Course Progress: {progress}%</h5>
          <div className="progress">
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      )}

      {/* Announcements Panel */}
      <hr />
      <h4>Announcements</h4>

      {auth.user.role === "instructor" && (
        <div className="mb-3 d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Add new announcement"
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleAddAnnouncement}>
            Add
          </button>
        </div>
      )}

      {announcements.length === 0 && <p>No announcements yet.</p>}
      <ul className="list-group mb-3">
        {announcements.map((a) => (
          <li
            key={a._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            {a.content}
            {isNew(a.createdAt) && (
              <span className="badge bg-warning">New</span>
            )}
          </li>
        ))}
      </ul>

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

                  const locked = isLessonLocked(index);

                  return (
                    <li
                      key={lesson._id}
                      className={`list-group-item d-flex justify-content-between align-items-center ${
                        selectedLesson?._id === lesson._id ? "active" : ""
                      }`}
                      style={{ cursor: locked ? "not-allowed" : "pointer" }}
                      onClick={() => {
                        if (!locked) setSelectedLesson(lesson);
                        else alert("Complete previous lesson first 🔒");
                      }}
                    >
                      {index + 1}. {lesson.title} ({lesson.contentType})
                      {completed && (
                        <span className="badge bg-success">Completed</span>
                      )}
                      {locked && (
                        <span className="badge bg-secondary ms-2">
                          🔒 Locked
                        </span>
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

      {/* Enroll button only for students who are not enrolled */}
      {auth?.user?.role === "student" && !alreadyEnrolled && (
        <button className="btn btn-primary" onClick={handleEnroll}>
          Enroll
        </button>
      )}

      {enrollMsg && <p className="mt-2">{enrollMsg}</p>}
    </div>
  );
}
