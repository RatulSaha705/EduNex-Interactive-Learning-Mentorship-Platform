import { Link } from "react-router-dom";

export default function StudentPage() {
  return (
    <div className="container mt-4 text-center">
      <h3>Student Dashboard</h3>
      <p>Welcome! You can browse and enroll in courses.</p>

      <div className="mt-3">
        <Link to="/student/courses" className="btn btn-primary me-2">
          View All Courses
        </Link>

        <Link to="/student/my-courses" className="btn btn-success me-2">
          My Courses
        </Link>

        <Link
          to="/student/consultations"
          className="btn btn-info"
        >
          My Consultations
        </Link>
      </div>
    </div>
  );
}

