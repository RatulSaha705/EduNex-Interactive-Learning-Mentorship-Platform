// frontend/src/App.js
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
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
import MyCertificates from "./pages/MyCertificates";
import CertificateDetail from "./pages/CertificateDetail";
import LearningStats from "./pages/LearningStats";

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
      <div className="App">
        <Navigation />
        <main className="App-main pt-20">
          <div className="app-shell page-fade">
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
                  !auth.user ? (
                    <Register />
                  ) : (
                    <Navigate to={getDashboardRoute()} />
                  )
                }
              />

              {/* Profile */}
              <Route
                path="/profile"
                element={auth.user ? <Profile /> : <Navigate to="/" />}
              />

              {/* ---------- Student Routes ---------- */}
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

              <Route
                path="/student/courses/:id"
                element={
                  auth.user?.role === "student" ? (
                    <CourseDetails />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              <Route
                path="/student/my-courses"
                element={
                  auth.user?.role === "student" ? (
                    <MyCourses />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

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

              {/* Learning Stats */}
              <Route
                path="/student/stats"
                element={
                  auth.user?.role === "student" ? (
                    <LearningStats />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              {/* Certificates */}
              <Route
                path="/student/certificates"
                element={
                  auth.user?.role === "student" ? (
                    <MyCertificates />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/student/certificates/:id"
                element={
                  auth.user?.role === "student" ? (
                    <CertificateDetail />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              {/* ---------- Instructor Routes ---------- */}
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
                element={
                  auth.user?.role === "instructor" ? (
                    <InstructorCourseDetails />
                  ) : (
                    <Navigate to="/" />
                  )
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

              <Route
                path="/instructor/courses/:id/add-lesson"
                element={
                  auth.user?.role === "instructor" ? (
                    <AddLesson />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              {/* ---------- Discussion (both roles) ---------- */}
              <Route
                path="/student/courses/:id/discussion"
                element={auth.user ? <CourseDiscussion /> : <Navigate to="/" />}
              />
              <Route
                path="/instructor/courses/:id/discussion"
                element={auth.user ? <CourseDiscussion /> : <Navigate to="/" />}
              />

              {/* ---------- General Course Listing ---------- */}
              <Route path="/courses" element={<CourseList />} />

              {/* ---------- Notifications ---------- */}
              <Route
                path="/notifications"
                element={
                  auth.user ? <NotificationsPage /> : <Navigate to="/" />
                }
              />

              {/* ---------- Admin ---------- */}
              <Route
                path="/admin"
                element={
                  auth.user?.role === "admin" ? (
                    <AdminPage />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

/* ---------------- NAVIGATION ---------------- */
function Navigation() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const homeRoute =
    auth?.user?.role === "student"
      ? "/student"
      : auth?.user?.role === "instructor"
      ? "/instructor"
      : auth?.user?.role === "admin"
      ? "/admin"
      : "/";

  const showBackButton =
    auth?.user && !["/", "/register", homeRoute].includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActivePath = (path) => {
    if (!path) return false;
    if (path === "/student" || path === "/instructor" || path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const baseNavBtn =
    "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-400";

  const pillGhost =
    baseNavBtn +
    " text-slate-100/80 hover:text-white hover:bg-white/10 border border-transparent";
  const pillPrimary =
    baseNavBtn +
    " bg-white text-slate-900 hover:bg-slate-100 shadow-sm border border-slate-200";
  const pillDanger =
    baseNavBtn +
    " bg-slate-800/70 text-rose-100 hover:bg-rose-600 hover:text-white border border-rose-500/60";
  const pillAccent =
    baseNavBtn +
    " bg-emerald-500/90 text-white hover:bg-emerald-400 border border-emerald-400/80";

  return (
    <nav className="fixed top-0 inset-x-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Brand + Back */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={`${baseNavBtn} hidden sm:inline-flex bg-slate-800/80 text-slate-100 hover:bg-slate-700 border border-slate-600/60`}
            >
              <span className="mr-1.5 text-sm">←</span>
              Back
            </button>
          )}

          <Link
            to={homeRoute}
            className="inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight text-white"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-md">
              <span className="text-sm font-bold">E</span>
            </span>
            <span>EduNex</span>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center rounded-full p-1.5 text-slate-200 hover:bg-white/10"
        >
          <span className="sr-only">Toggle navigation</span>
          {menuOpen ? "✕" : "☰"}
        </button>

        {/* Right side links */}
        <div
          className={`${
            menuOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row md:items-center gap-2 md:gap-3 text-xs`}
        >
          {!auth.user && (
            <>
              <Link to="/register" className={pillGhost}>
                Sign up
              </Link>
              <Link to="/" className={pillPrimary}>
                Log in
              </Link>
            </>
          )}

          {auth.user && (
            <>
              {/* Role-specific main entry points */}
              <Link
                to="/profile"
                className={`${pillGhost} ${
                  isActivePath("/profile")
                    ? "bg-white/10 border-sky-400/70"
                    : ""
                }`}
              >
                Profile
              </Link>

              {auth.user.role === "student" && (
                <>
                  <Link
                    to="/student"
                    className={`${pillPrimary} ${
                      isActivePath("/student") ? "ring-1 ring-sky-400/80" : ""
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/student/courses"
                    className={`${pillGhost} ${
                      isActivePath("/student/courses")
                        ? "bg-white/10 border-sky-400/70"
                        : ""
                    }`}
                  >
                    Browse Courses
                  </Link>
                </>
              )}

              {auth.user.role === "instructor" && (
                <>
                  <Link
                    to="/instructor"
                    className={`${pillPrimary} ${
                      isActivePath("/instructor")
                        ? "ring-1 ring-sky-400/80"
                        : ""
                    }`}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/instructor/consultations/schedule"
                    className={`${pillGhost} ${
                      isActivePath("/instructor/consultations")
                        ? "bg-white/10 border-emerald-400/60"
                        : ""
                    }`}
                  >
                    Manage Consultations
                  </Link>

                  <Link
                    to="/instructor/consultations/today"
                    className={`${pillAccent} ${
                      isActivePath("/instructor/consultations/today")
                        ? "ring-1 ring-emerald-300/80"
                        : ""
                    }`}
                  >
                    Today&apos;s Consultations
                  </Link>
                </>
              )}

              {auth.user.role === "admin" && (
                <Link
                  to="/admin"
                  className={`${pillPrimary} ${
                    isActivePath("/admin") ? "ring-1 ring-rose-400/80" : ""
                  }`}
                >
                  Admin Dashboard
                </Link>
              )}

              {/* Notifications + Logout */}
              <div className="flex items-center gap-2">
                <NotificationsDropdown />
                <button
                  onClick={handleLogout}
                  className={pillDanger}
                  type="button"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default App;
