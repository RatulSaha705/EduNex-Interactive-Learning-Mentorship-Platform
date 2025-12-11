// frontend/src/components/Profile.js
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { auth, login } = useContext(AuthContext);

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    if (!auth.token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        setForm({
          name: res.data.user.name,
          email: res.data.user.email,
          password: "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching profile");
      }
    };

    fetchProfile();
  }, [auth.token]);

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
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

      setMessage(res.data.message);
      login({ token: auth.token, user: res.data.user });
      setForm({ ...form, password: "" });
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || "Error updating profile");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">My Profile</h3>

          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700">
            {auth.user?.role}
          </span>
        </div>

        {/* VIEW MODE */}
        {!editMode && (
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-semibold">Name:</span> {form.name}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Email:</span> {form.email}
            </p>

            <button
              onClick={() => setEditMode(true)}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          </div>
        )}

        {/* EDIT MODE */}
        {editMode && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium text-gray-600">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-600">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-600">
                New Password (optional)
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {message && (
          <p className="text-green-600 font-medium text-center">{message}</p>
        )}
        {error && (
          <p className="text-red-600 font-medium text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
