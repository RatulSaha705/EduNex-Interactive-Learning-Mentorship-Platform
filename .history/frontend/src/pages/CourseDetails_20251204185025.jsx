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

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        });
        setCourse(res.data.course);
      } catch (err) {
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    if (auth?.token) {
      fetchCourse();
    }
  }, [id, auth?.token]);

  const handleEnroll = async () => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/courses/${id}/enroll`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setEnrollMsg(res.data.message);
      setCourse(res.data.course); // ✅ sync UI with backend
    } catch (err) {
      setEnrollMsg(err.response?.data?.message || "Failed to enroll");
    }
  };

  if (loading) return <p>Loading course...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!course) return <p>Course not found</p>;

  // ✅ Safe enrolled check (ObjectId vs string)
  const alreadyEnrolled =
    auth?.user &&
    course.enrolledStudents?.some(
      (studentId) => studentId.toString() === auth.user.id
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

      <p>
        <strong>Progress:</strong> 0%
      </p>

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
    </div>
  );
}
