import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function StudentCourses() {
  const { auth } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/courses", {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        setCourses(res.data.courses);
      } catch (err) {
        setError("Failed to load courses");
      }
    };

    fetchCourses();
  }, [auth.token]);

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">
        Available Courses
      </h3>

      {error && <p className="text-red-600 font-medium mb-4">{error}</p>}

      {courses.length === 0 && (
        <p className="text-gray-500">No courses available.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course._id}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition duration-300 border"
          >
            <div className="p-5 flex flex-col h-full">
              <Link
                to={`/student/courses/${course._id}`}
                className="text-lg font-semibold text-blue-600 hover:underline mb-2"
              >
                {course.title}
              </Link>

              <p className="text-gray-700 flex-grow">{course.description}</p>

              <p className="text-sm text-gray-500 mt-3">
                Category: <span className="font-medium">{course.category}</span>
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Instructor:{" "}
                <span className="font-medium">
                  {course.instructor?.name || "Unknown"}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
