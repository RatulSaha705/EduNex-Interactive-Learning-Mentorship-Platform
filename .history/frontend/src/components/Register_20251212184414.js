import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        form
      );
      setIsError(false);
      setMessage(
        res.data.message || "Registered successfully. You can now login."
      );
      // Optionally clear password only
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Error registering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: brand/info panel */}
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-700 to-sky-600 text-white p-8">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Join EduNex
              </h2>
              <p className="mt-2 text-sm text-indigo-100/90">
                Create your EduNex account and start your interactive learning
                journey as a <span className="font-semibold">student</span> or{" "}
                <span className="font-semibold">instructor</span>.
              </p>
            </div>

            <div className="space-y-2 text-xs text-indigo-100/90">
              <p className="font-semibold text-indigo-50">
                What you&apos;ll get:
              </p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Access to curated courses and structured content</li>
                <li>Mentorship features & consultation booking</li>
                <li>Progress tracking, certificates, and analytics</li>
              </ul>
            </div>
          </div>

          {/* Right: registration form */}
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-slate-900">
                Create your account
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Fill in your details to get started with EduNex.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
              </div>

              {/* Email */}
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
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
              </div>

              {/* Password */}
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
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Minimum 6–8 characters recommended.
                </p>
              </div>

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Register as
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, role: "student" }))
                    }
                    className={`border rounded-lg px-3 py-2 text-sm font-medium transition ${
                      form.role === "student"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, role: "instructor" }))
                    }
                    className={`border rounded-lg px-3 py-2 text-sm font-medium transition ${
                      form.role === "instructor"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Instructor
                  </button>
                </div>
                {/* Hidden select for future extensibility (if needed) */}
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  className="hidden"
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>

              {/* Message */}
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </form>

            {/* Footer / back to login */}
            <div className="mt-5 text-xs sm:text-sm text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <p>
                Already have an account?{" "}
                <Link
                  to="/"
                  className="font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Login
                </Link>
              </p>
              <p className="text-[11px] text-slate-400">
                By creating an account, you agree to your institution&apos;s
                usage policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
