// frontend/src/components/Profile.js
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { auth, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ role: "", joinedAt: "" });

  // Decide where "back" goes based on role
  const handleBack = () => {
    if (auth.user?.role === "student") return navigate("/student");
    if (auth.user?.role === "instructor") return navigate("/instructor");
    if (auth.user?.role === "admin") return navigate("/admin");
    return navigate("/");
  };

  // Fetch profile on mount
  useEffect(() => {
    if (!auth?.token) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        const user = res.data.user || {};
        setForm({
          name: user.name || "",
          email: user.email || "",
          password: "",
        });
        setMeta({
          role: user.role || auth.user?.role || "",
          joinedAt: user.createdAt || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [auth?.token, auth?.user?.role]);

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try:{
      const payload = {};
      if (form.name) payload.name = form.name;
      if (form.email) payload.email = form.email;
      if (form.password) payload.password = form.password;

      const res = await axios.put(
        "http://localhost:5000/api/auth/me",
        payload,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(res.data.message || "Profile updated successfully.");
      // Refresh auth context user
      login({ token: auth.token, user: res.data.user });
      setForm((prev) => ({ ...prev, password: "" }));
      setEditMode(false);

      const updated = res.data.user || {};
      setMeta((prev) => ({
        ...prev,
        role: updated.role || prev.role,
        joinedAt: updated.createdAt || prev.joinedAt,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const formattedJoined = meta.joinedAt
    ? new Date(meta.joinedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 space-y-6">
        {/* Top bar: back + title + role chip */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center text-xs sm:text-sm text-slate-600 hover:text-indigo-700 px-2 py-1 rounded-full hover:bg-slate-100 transition"
          >
            <span className="mr-1">←</span>
            Back to dashboard
          </button>

          <div className="flex items-center gap-3 ml-auto">
            {meta.role && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                {meta.role.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-slate-900">
              My Profile
            </h3>
            <p className="text-sm text-slate-500">
              Manage your personal information and account credentials.
            </p>
            {formattedJoined && (
              <p className="mt-1 text-xs text-slate-400">
                Member since {formattedJoined}
              </p>
            )}
          </div>

          {/* Avatar-ish initials */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-semibold text-lg shadow-md">
              {form.name
                ? form.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase())
                    .join("")
                : "ED"}
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="mt-4 space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-52 bg-slate-200 rounded animate-pulse" />
          </div>
        )}

        {/* Error / success messages */}
        {!loading && (message || error) && (
          <div className="space-y-2">
            {message && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
                {error}
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE */}
        {!loading && !editMode && (
          <div className="mt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
                  Full Name
                </div>
                <div className="mt-1 text-slate-900">{form.name || "—"}</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wide">
                  Email
                </div>
                <div className="mt-1 text-slate-900">{form.email || "—"}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* EDIT MODE */}
        {!loading && editMode && (
          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">
                New Password{" "}
                <span className="text-xs font-normal text-slate-400">
                  (leave blank to keep current)
                </span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setForm((prev) => ({ ...prev, password: "" }));
                  setError("");
                }}
                className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
