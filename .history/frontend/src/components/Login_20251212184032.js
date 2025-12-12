import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Login() {
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      login(res.data); // save token + user in context
      setMessage("Login successful. Redirecting to your dashboard…");
      setIsError(false);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Error logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left brand / intro panel */}
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-700 to-sky-600 text-white p-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Welcome to EduNex
              </h2>
              <p className="mt-2 text-sm text-indigo-100/90">
                Your interactive learning & mentorship platform. Log in to
                continue your journey as a{" "}
                <span className="font-semibold">student</span>,{" "}
                <span className="font-semibold">instructor</span>, or{" "}
                <span className="font-semibold">admin</span>.
              </p>
            </div>

            <div className="space-y-2 text-xs text-indigo-100/90">
              <p className="font-semibold text-indigo-50">Why EduNex?</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Structured courses with progress tracking</li>
                <li>1:1 mentorship & consultation sessions</li>
                <li>Smart recommendations & learning analytics</li>
              </ul>
            </div>
          </div>

          {/* Right: login form */}
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-slate-900">
                Log in to EduNex
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Enter your credentials to access your personalized dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
              </div>

              {message && (
                <div
                  className={`text-sm rounded-lg px-3 py-2 ${
                    isError
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Logging in…
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            {/* Footer / Register link */}
            <div className="mt-5 text-xs sm:text-sm text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <p>
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Register now
                </Link>
              </p>
              <p className="text-[11px] text-slate-400">
                Having trouble? Contact your platform administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
