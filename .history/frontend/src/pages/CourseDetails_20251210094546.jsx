import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
  if (error) return <p className="text-red-600">{error}</p>;
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
    <div className="max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
      <p className="mb-2">{course.description}</p>

      <p>
        <strong>Category:</strong> {course.category || "N/A"}
      </p>
      <p>
        <strong>Instructor:</strong> {course.instructor?.name || "Unknown"}
      </p>
      <p>
        <strong>Duration:</strong>{" "}
        {course.startDate && course.endDate
          ? `${new Date(course.startDate).toLocaleDateString()} - ${new Date(
              course.endDate
            ).toLocaleDateString()}`
          : "N/A"}
      </p>

      <hr className="my-4" />

      <h4 className="text-xl font-semibold mb-2">Important Dates</h4>

      {course.endDate ? (
        <div className="border rounded p-4 mb-3 bg-gray-50">
          <p className="text-gray-500 mb-1">
            {new Date(course.endDate).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>

          <h6 className="mb-1 font-medium">Course ends</h6>

          <p className="mb-0 text-gray-600">
            After the course ends, the course content will be archived and no
            longer active.
          </p>
        </div>
      ) : (
        <p>No important dates available.</p>
      )}

      <p className="mb-3">
        <strong>Total Lessons:</strong> {course.lessons?.length || 0}
      </p>

      {alreadyEnrolled && (
        <div className="mb-4">
          <h5 className="mb-2">Course Progress: {progress}%</h5>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {auth.user?.role === "student" && (
        <div className="mb-4 flex flex-wrap gap-2">
          {!alreadyEnrolled ? (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleEnroll}
            >
              Enroll
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded"
              disabled
            >
              Already Enrolled
            </button>
          )}

          {alreadyEnrolled && (
            <Link
              to={`/student/courses/${id}/consultation`}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
            >
              Book Consultation
            </Link>
          )}
        </div>
      )}

      <div className="mt-3">
        <Link
          to={`/student/courses/${id}/discussion`}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Go to Discussion Board
        </Link>
      </div>

      {enrollMsg && <p className="mt-2 text-green-600">{enrollMsg}</p>}

      <hr className="my-4" />
      <h4 className="text-xl font-semibold mb-2">Announcements</h4>

      {auth.user.role === "instructor" && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 flex-1"
            placeholder="Add new announcement"
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleAddAnnouncement}
          >
            Add
          </button>
        </div>
      )}

      {announcements.length === 0 && <p>No announcements yet.</p>}
      <ul className="mb-4">
        {announcements.map((a) => (
          <li
            key={a._id}
            className="flex justify-between items-center border-b py-2"
          >
            {a.content}
            {isNew(a.createdAt) && (
              <span className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs ml-2">
                New
              </span>
            )}
          </li>
        ))}
      </ul>

      {alreadyEnrolled && (
        <>
          <hr className="my-4" />
          <h4 className="text-xl font-semibold mb-2">Lessons</h4>
          {course.lessons?.length === 0 && <p>No lessons added yet.</p>}

          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3">
              <ul className="border rounded divide-y divide-gray-200">
                {course.lessons?.map((lesson, index) => {
                  const completed =
                    course.completedLessons
                      ?.find((cl) => cl.student.toString() === auth.user.id)
                      ?.lessons.includes(lesson._id) || false;

                  const locked = isLessonLocked(index);

                  return (
                    <li
                      key={lesson._id}
                      className={`flex justify-between items-center px-3 py-2 cursor-pointer ${
                        selectedLesson?._id === lesson._id
                          ? "bg-blue-100 font-semibold"
                          : ""
                      } ${locked ? "opacity-50" : "hover:bg-gray-100"}`}
                      onClick={() => {
                        if (!locked) setSelectedLesson(lesson);
                        else alert("Complete previous lesson first 🔒");
                      }}
                    >
                      <span>
                        {index + 1}. {lesson.title} ({lesson.contentType})
                      </span>
                      <span className="flex gap-1">
                        {completed && (
                          <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">
                            Completed
                          </span>
                        )}
                        {locked && (
                          <span className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs">
                            🔒 Locked
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="md:w-2/3">
              <h5 className="font-medium mb-2">Lesson Viewer</h5>
              {!selectedLesson && <p>Select a lesson to start learning</p>}
              {selectedLesson && (
                <div className="border rounded p-3">
                  {renderLessonContent()}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {auth?.user?.role === "student" && !alreadyEnrolled && (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-4"
          onClick={handleEnroll}
        >
          Enroll
        </button>
      )}

      {enrollMsg && <p className="mt-2 text-green-600">{enrollMsg}</p>}
    </div>
  );
}
