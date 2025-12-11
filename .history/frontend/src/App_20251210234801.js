function Navigation() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 w-full bg-gray-900 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-bold text-white hover:text-yellow-400 transition"
        >
          EduNex
        </Link>

        {/* Links */}
        <div className="flex items-center space-x-3">
          {!auth.user && (
            <>
              <Link
                to="/register"
                className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded transition"
              >
                Register
              </Link>
              <Link
                to="/"
                className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded transition"
              >
                Login
              </Link>
            </>
          )}

          {auth.user && (
            <>
              <Link
                to="/profile"
                className="px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded transition"
              >
                Edit Profile
              </Link>
              <Link
                to="/profile/view"
                className="px-3 py-2 bg-gray-700 text-white hover:bg-gray-600 rounded transition"
              >
                View Profile
              </Link>

              {auth.user.role === "student" && (
                <Link
                  to="/student"
                  className="px-3 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded transition font-semibold"
                >
                  Dashboard
                </Link>
              )}

              {auth.user.role === "instructor" && (
                <>
                  <Link
                    to="/instructor"
                    className="px-3 py-2 bg-yellow-500 text-black hover:bg-yellow-400 rounded transition font-semibold"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/instructor/consultations/schedule"
                    className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded transition"
                  >
                    Consultations
                  </Link>
                  <Link
                    to="/instructor/consultations/today"
                    className="px-3 py-2 bg-green-500 text-white hover:bg-green-600 rounded transition"
                  >
                    Today's Consultations
                  </Link>
                </>
              )}

              {auth.user.role === "admin" && (
                <Link
                  to="/admin"
                  className="px-3 py-2 bg-red-500 text-white hover:bg-red-600 rounded transition"
                >
                  Admin
                </Link>
              )}

              {/* Notifications */}
              <NotificationsDropdown />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-gray-700 text-white hover:bg-gray-600 rounded transition"
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
