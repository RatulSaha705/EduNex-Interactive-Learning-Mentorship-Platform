// frontend/src/App.js
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
} from "react-router-dom";
import { useContext, useState } from "react";

import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import ViewProfile from "./components/ViewProfile";
import StudentPage from "./components/StudentPage";
import InstructorPage from "./components/InstructorPage";
import AdminPage from "./components/AdminPage";
import CreateCourse from "./components/CreateCourse";
import { AuthContext } from "./context/AuthContext";
import NotificationsDropdown from "./components/NotificationsDropdown";

import CourseDetails from "./pages/CourseDetails";
import MyCourses from "./pages/MyCourses";
import EditCourse from "./pages/EditCourse";
import CourseDiscussion from "./pages/CourseDiscussion";
import AddLesson from "./pages/AddLesson";
import CourseList from "./pages/CourseList";
import InstructorCourseDetails from "./pages/InstructorCourseDetails";
import StudentMyConsultations from "./pages/StudentMyConsultations";
import StudentConsultationBooking from "./pages/StudentConsultationBooking";
import InstructorConsultationSchedule from "./pages/InstructorConsultationSchedule";
import InstructorTodayConsultations from "./pages/InstructorTodayConsultations";
import NotificationsPage from "./pages/NotificationsPage";

function App() {
  const { auth } = useContext(AuthContext);

  return (
    <BrowserRouter>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 pt-20">
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

          {/* Student Routes */}
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
          <Route
            path="/student/courses"
            element={
              auth.user?.role === "student" ? (
                <CourseList />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="/student/courses/:id" element={<CourseDetails />} />
          <Route path="/student/my-courses" element={<MyCourses />} />
          <Route
            path="/student/consultations"
            element={
              auth.user?.role === "student" ? (
                <StudentMyConsultations />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/student/courses/:id/consultation"
            element={
              auth.user?.role === "student" ? (
                <StudentConsultationBooking />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Instructor Routes */}
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
            path="/instructor/consultations/schedule"
            element={
              auth.user?.role === "instructor" ? (
                <InstructorConsultationSchedule />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/instructor/consultations/today"
            element={
              auth.user?.role === "instructor" ? (
                <InstructorTodayConsultations />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/instructor/courses/:id"
            element={<InstructorCourseDetails />}
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
          <Route
            path="/instructor/courses/:id/add-lesson"
            element={<AddLesson />}
          />

          {/* Discussion Routes */}
          <Route
            path="/student/courses/:id/discussion"
            element={<CourseDiscussion />}
          />
          <Route
            path="/instructor/courses/:id/discussion"
            element={<CourseDiscussion />}
          />

          {/* General Routes */}
          <Route path="/courses/:courseId/add-lesson" element={<AddLesson />} />
          <Route path="/courses" element={<CourseList />} />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={auth.user ? <NotificationsPage /> : <Navigate to="/" />}
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              auth.user?.role === "admin" ? <AdminPage /> : <Navigate to="/" />
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// Responsive & Dynamic Navigation
function Navigation() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full bg-gradient-to-r from-indigo-900 via-purple-800 to-pink-700 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold hover:text-yellow-300 transition"
        >
          EduNex
        </Link>

        {/* Hamburger menu */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Menu Links */}
        <div
          className={`flex-col md:flex md:flex-row md:items-center md:space-x-3 absolute md:static top-16 md:top-0 w-full md:w-auto bg-gradient-to-b from-indigo-900 via-purple-800 to-pink-700 md:bg-transparent transition-all duration-300 ${
            menuOpen ? "flex" : "hidden"
          }`}
        >
          {!auth.user && (
            <>
              <Link
                to="/register"
                className="block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-center md:text-left transition"
              >
                Register
              </Link>
              <Link
                to="/"
                className="block px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-center md:text-left transition"
              >
                Login
              </Link>
            </>
          )}

          {auth.user && (
            <>
              <Link
                to="/profile"
                className="block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-center md:text-left transition"
              >
                Edit Profile
              </Link>
              <Link
                to="/profile/view"
                className="block px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center md:text-left transition"
              >
                View Profile
              </Link>

              {auth.user.role === "student" && (
                <Link
                  to="/student"
                  className="block px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded font-semibold text-center md:text-left transition"
                >
                  Student Dashboard
                </Link>
              )}

              {auth.user.role === "instructor" && (
                <>
                  <Link
                    to="/instructor"
                    className="block px-4 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded font-semibold text-center md:text-left transition"
                  >
                    Instructor Dashboard
                  </Link>
                  <Link
                    to="/instructor/consultations/schedule"
                    className="block px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-center md:text-left transition"
                  >
                    Manage Consultations
                  </Link>
                  <Link
                    to="/instructor/consultations/today"
                    className="block px-4 py-2 bg-green-500 hover:bg-green-600 rounded text-center md:text-left transition"
                  >
                    Today's Consultations
                  </Link>
                </>
              )}

              {auth.user.role === "admin" && (
                <Link
                  to="/admin"
                  className="block px-4 py-2 bg-red-500 hover:bg-red-600 rounded text-center md:text-left transition"
                >
                  Admin Dashboard
                </Link>
              )}

              <NotificationsDropdown />
              <button
                onClick={handleLogout}
                className="block px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-center md:text-left transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default App;
