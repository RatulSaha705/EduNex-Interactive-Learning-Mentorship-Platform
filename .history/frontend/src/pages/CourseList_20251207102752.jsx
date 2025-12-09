import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CourseList() {
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("");

  const fetchCourses = async (
    category = categoryFilter,
    instructor = instructorFilter
  ) => {
    try {
      setLoading(true);
      let url = "http://localhost:5000/api/courses";
      const params = {};
      if (category) params.category = category;
      if (instructor) params.instructor = instructor;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth?.token}` },
        params,
      });

      let fetchedCourses = res.data.courses || [];

      // ✅ Only show published courses to students
      if (auth?.user?.role === "student") {
        fetchedCourses = fetchedCourses.filter(
          (course) => course.status === "published"
        );
      }

      setCourses(fetchedCourses);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/courses/${courseId}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${auth?.token}` } }
      );
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course._id === courseId
            ? {
                ...course,
                enrolledStudents: [
                  ...(course.enrolledStudents || []),
                  auth.user.id,
                ],
              }
            : course
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to enroll");
    }
  };

  useEffect(() => {
    if (auth?.token) fetchCourses();
  }, [auth?.token]);

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container mt-4">
      <h2>Courses</h2>

      {/* Filters */}
      <div className="mb-3 d-flex gap-2">
        <input
          type="text"
          placeholder="Filter by category"
          className="form-control"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by instructor name"
          className="form-control"
          value={instructorFilter}
          onChange={(e) => setInstructorFilter(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={() => fetchCourses(categoryFilter, instructorFilter)}
        >
          Apply
        </button>
      </div>

      {/* Courses Grid */}
      <div className="row">
        {Array.isArray(courses) && courses.length > 0 ? (
          courses.map((course) => (
            <div key={course._id} className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text">{course.description}</p>
                  <p>
                    <strong>Category:</strong> {course.category || "N/A"}
                  </p>
                  <p>
                    <strong>Instructor:</strong>{" "}
                    {course.instructor?.name || "Unknown"}
                  </p>

                  {/* ✅ Estimated Duration */}
                  {course.duration && (
                    <p>
                      <strong>Estimated Duration:</strong> {course.duration}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="d-flex gap-2 mt-2">
                    {auth.user?.role === "student" &&
                      (course.enrolledStudents?.includes(auth.user.id) ? (
                        <button className="btn btn-secondary" disabled>
                          Enrolled
                        </button>
                      ) : (
                        <button
                          className="btn btn-success"
                          onClick={() => handleEnroll(course._id)}
                        >
                          Enroll
                        </button>
                      ))}

                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/student/courses/${course._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No courses found.</p>
        )}
      </div>
    </div>
  );
}
