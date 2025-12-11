// frontend/src/App.js
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useContext } from "react";

import Register from "./components/Register";
import Login from "./components/Login";
import Profile from "./components/Profile";
import ViewProfile from "./components/ViewProfile";
import StudentPage from "./components/StudentPage";
import InstructorPage from "./components/InstructorPage";
import AdminPage from "./components/AdminPage";
import CreateCourse from "./components/CreateCourse";
import { AuthContext } from "./context/AuthContext";
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
import NotificationsDropdown from "./components/NotificationsDropdown";
import NotificationsPage from "./pages/NotificationsPage";

function App() {
  const { auth, logout } = useContext(AuthContext); // ✅ get logout from context

  return (
    <BrowserRouter>
      <Navigation auth={auth} logout={logout} />
      <div className="max-w-7xl mx-auto px-4">
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

// ✅ Fixed Navigation component
function Navigation({ auth, logout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // now correctly calls logout from context
    navigate("/"); // redirect to login
  };

  return (
    <nav className="bg-gray-800 text-white py-3 shadow-md mb-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between px-4">
        <div className="flex space-x-2">
          {!auth.user && (
            <>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              >
                Register
              </Link>
              <Link
                to="/"
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
              >
                Login
              </Link>
            </>
          )}

          {auth.user && (
            <>
              <Link
                to="/profile"
                className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded"
              >
                Edit Profile
              </Link>
              <Link
                to="/profile/view"
                className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
              >
                View Profile
              </Link>

              {auth.user.role === "student" && (
                <Link
                  to="/student"
                  className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded"
                >
                  Student Dashboard
                </Link>
              )}

              {auth.user.role === "instructor" && (
                <>
                  <Link
                    to="/instructor"
                    className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded"
                  >
                    Instructor Dashboard
                  </Link>
                  <Link
                    to="/instructor/consultations/schedule"
                    className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded"
                  >
                    Manage Consultations
                  </Link>
                  <Link
                    to="/instructor/consultations/today"
                    className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded"
                  >
                    Today's Consultations
                  </Link>
                </>
              )}

              {auth.user.role === "admin" && (
                <Link
                  to="/admin"
                  className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
                >
                  Admin Dashboard
                </Link>
              )}

              {/* Notifications */}
              <NotificationsDropdown />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-gray-700 hover:bg-gray-800 px-3 py-1 rounded ml-2"
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
