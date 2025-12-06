// frontend/src/App.js
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile"; // Edit Profile
import ViewProfile from "./components/ViewProfile"; // View Profile
import StudentPage from "./components/StudentPage";
import InstructorPage from "./components/InstructorPage"; // Dashboard with courses + create button
import AdminPage from "./components/AdminPage";
import CreateCourse from "./components/CreateCourse"; // Instructor: create course
import { AuthContext } from "./context/AuthContext";
import CourseDetails from "./pages/CourseDetails";
import MyCourses from "./pages/MyCourses";
import EditCourse from "./pages/EditCourse";
import AddLesson from "./pages/AddLesson";
import CourseList from "./pages/CourseList";

function App() {
  const { auth, logout } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Navigation auth={auth} logout={logout} />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={!auth.user ? <Login /> : <Navigate to="/profile" />}
        />
        <Route
          path="/register"
          element={!auth.user ? <Register /> : <Navigate to="/profile" />}
        />

        {/* Protected Routes */}
        <Route
          path="/profile"
          element={auth.user ? <Profile /> : <Navigate to="/" />}
        />
        <Route
          path="/profile/view"
          element={auth.user ? <ViewProfile /> : <Navigate to="/" />}
        />
        <Route
          path="/student"
          element={
            auth.user?.role === "student" ? (
              <StudentPage />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Updated route: student courses now shows CourseList */}
        <Route
          path="/student/courses"
          element={
            auth.user?.role === "student" ? <CourseList /> : <Navigate to="/" />
          }
        />

        <Route path="/student/courses/:id" element={<CourseDetails />} />
        <Route path="/student/my-courses" element={<MyCourses />} />

        <Route
          path="/instructor"
          element={
            auth.user?.role === "instructor" ? (
              <InstructorPage />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/instructor/create-course"
          element={
            auth.user?.role === "instructor" ? (
              <CreateCourse />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            auth.user?.role === "admin" ? <AdminPage /> : <Navigate to="/" />
          }
        />
        <Route
          path="/instructor/course/:id/edit"
          element={
            auth.user?.role === "instructor" ? (
              <EditCourse />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="/courses/:courseId/add-lesson" element={<AddLesson />} />
        <Route path="/courses" element={<CourseList />} />

        {/* Keep fallback route if needed */}
        <Route path="*" element={<Navigate to="/" />} />
        <Route
          path="/instructor/courses/:id"
          element={<InstructorCourseDetails />}
        />

        <Route
          path="/instructor/courses/:id/add-lesson"
          element={<AddLesson />}
        />
      </Routes>
    </BrowserRouter>
  );
}

// Navigation component
function Navigation({ auth, logout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Clear auth state
    navigate("/"); // Redirect to login page
  };

  return (
    <div className="text-center my-3">
      {!auth.user && (
        <>
          <Link to="/register" className="btn btn-primary me-2">
            Register
          </Link>
          <Link to="/" className="btn btn-success me-2">
            Login
          </Link>
        </>
      )}

      {auth.user && (
        <>
          {/* Profile Links */}
          <Link to="/profile" className="btn btn-info me-2">
            Edit Profile
          </Link>
          <Link to="/profile/view" className="btn btn-secondary me-2">
            View Profile
          </Link>

          {/* Role-based Links */}
          {auth.user.role === "student" && (
            <Link to="/student" className="btn btn-warning me-2">
              Student Dashboard
            </Link>
          )}
          {auth.user.role === "instructor" && (
            <Link to="/instructor" className="btn btn-warning me-2">
              Instructor Dashboard
            </Link>
          )}
          {auth.user.role === "admin" && (
            <Link to="/admin" className="btn btn-danger me-2">
              Admin Dashboard
            </Link>
          )}

          <button className="btn btn-dark" onClick={handleLogout}>
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default App;
