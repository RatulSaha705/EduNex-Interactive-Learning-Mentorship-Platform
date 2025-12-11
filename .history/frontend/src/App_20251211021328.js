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

  const getDashboardRoute = () => {
    if (auth.user?.role === "student") return "/student";
    if (auth.user?.role === "instructor") return "/instructor";
    if (auth.user?.role === "admin") return "/admin";
    return "/";
  };

  return (
    <BrowserRouter>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 pt-20">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              !auth.user ? <Login /> : <Navigate to={getDashboardRoute()} />
            }
          />
          <Route
            path="/register"
            element={
              !auth.user ? <Register /> : <Navigate to={getDashboardRoute()} />
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={auth.user ? <Profile /> : <Navigate to="/" />}
          />

          {/* Student */}
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
            element={<StudentMyConsultations />}
          />
          <Route
            path="/student/courses/:id/consultation"
            element={<StudentConsultationBooking />}
          />

          {/* Instructor */}
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
          <Route path="/instructor/create-course" element={<CreateCourse />} />
          <Route
            path="/instructor/consultations/schedule"
            element={<InstructorConsultationSchedule />}
          />
          <Route
            path="/instructor/consultations/today"
            element={<InstructorTodayConsultations />}
          />
          <Route
            path="/instructor/courses/:id"
            element={<InstructorCourseDetails />}
          />
          <Route path="/instructor/course/:id/edit" element={<EditCourse />} />
          <Route
            path="/instructor/courses/:id/add-lesson"
            element={<AddLesson />}
          />

          {/* Discussion */}
          <Route
            path="/student/courses/:id/discussion"
            element={<CourseDiscussion />}
          />
          <Route
            path="/instructor/courses/:id/discussion"
            element={<CourseDiscussion />}
          />

          {/* General */}
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

/* ---------------- NAVIGATION ---------------- */
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
        <Link to="/" className="text-2xl font-bold hover:text-yellow-300">
          EduNex
        </Link>

        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden">
          ☰
        </button>

        <div
          className={`md:flex md:items-center space-y-2 md:space-y-0 md:space-x-3 ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          {!auth.user && (
            <>
              <Link
                to="/register"
                className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded hover:bg-gray-100 transition"
              >
                Register
              </Link>

              <Link
                to="/"
                className="px-4 py-2 bg-yellow-400 text-black font-semibold rounded hover:bg-yellow-300 transition"
              >
                Login
              </Link>
            </>
          )}

          {auth.user && (
            <>
              <Link
                to="/profile"
                className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded hover:bg-gray-100 transition"
              >
                Profile
              </Link>

              {auth.user.role === "student" && (
                <>
                  <Link
                    to="/student"
                    className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold"
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/student/consultations"
                    className="px-4 py-2 bg-blue-500 text-white rounded font-semibold"
                  >
                    Manage Consultations
                  </Link>
                </>
              )}

              {auth.user.role === "instructor" && (
                <>
                  <Link
                    to="/instructor"
                    className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold"
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/instructor/consultations/schedule"
                    className="px-4 py-2 bg-blue-500 text-white rounded font-semibold"
                  >
                    Manage Consultations
                  </Link>

                  <Link
                    to="/instructor/consultations/today"
                    className="px-4 py-2 bg-green-500 text-white rounded font-semibold"
                  >
                    Today's Consultations
                  </Link>
                </>
              )}

              {auth.user.role === "admin" && (
                <Link to="/admin" className="px-4 py-2 bg-red-500 rounded">
                  Admin
                </Link>
              )}

              <NotificationsDropdown />

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 rounded"
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
