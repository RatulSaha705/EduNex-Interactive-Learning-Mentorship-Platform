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

  if (loading) return <p className="text-center mt-6">Loading courses...</p>;
  if (error) return <p className="text-red-500 mt-4">{error}</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-6">
      <h2 className="text-2xl font-semibold mb-4">Courses</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Filter by category"
          className="border rounded px-3 py-2 w-full"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter by instructor name"
          className="border rounded px-3 py-2 w-full"
          value={instructorFilter}
          onChange={(e) => setInstructorFilter(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => fetchCourses(categoryFilter, instructorFilter)}
        >
          Apply
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(courses) && courses.length > 0 ? (
          courses.map((course) => (
            <div
              key={course._id}
              className="border rounded-lg shadow-sm p-4 flex flex-col justify-between"
            >
              <div>
                <h5 className="text-lg font-semibold mb-2">{course.title}</h5>
                <p className="text-gray-700 mb-2">{course.description}</p>
                <p className="text-sm">
                  <strong>Category:</strong> {course.category || "N/A"}
                </p>
                <p className="text-sm">
                  <strong>Instructor:</strong>{" "}
                  {course.instructor?.name || "Unknown"}
                </p>

                {course.duration && (
                  <p className="text-sm mt-1">
                    <strong>Estimated Duration:</strong> {course.duration}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-4">
                {auth.user?.role === "student" &&
                  (course.enrolledStudents?.includes(auth.user.id) ? (
                    <button
                      disabled
                      className="bg-gray-400 text-white px-3 py-2 rounded cursor-not-allowed"
                    >
                      Enrolled
                    </button>
                  ) : (
                    <button
                      className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
                      onClick={() => handleEnroll(course._id)}
                    >
                      Enroll
                    </button>
                  ))}

                <button
                  className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                  onClick={() => navigate(`/student/courses/${course._id}`)}
                >
                  View Details
                </button>
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
