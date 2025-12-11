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

          <Route
            path="/profile"
            element={auth.user ? <Profile /> : <Navigate to="/" />}
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

          <Route path="/notifications" element={<NotificationsPage />} />

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
              {/* ✅ FIXED REGISTER BUTTON */}
              <Link
                to="/register"
                className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded hover:bg-gray-100 transition"
              >
                Register
              </Link>

              {/* ✅ FIXED LOGIN BUTTON */}
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
                className="px-4 py-2 bg-white text-indigo-700 font-semibold rounded"
              >
                Profile
              </Link>

              <Link
                to={
                  auth.user.role === "student"
                    ? "/student"
                    : auth.user.role === "instructor"
                    ? "/instructor"
                    : "/admin"
                }
                className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold"
              >
                Dashboard
              </Link>

              <NotificationsDropdown />

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
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
