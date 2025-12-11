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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[450px]">
        <h3 className="text-center text-blue-600 text-2xl font-semibold mb-4">
          My Profile
        </h3>

        <p className="mb-4 text-gray-700">
          <strong>Role:</strong> {auth.user?.role}
        </p>

        {/* VIEW MODE */}
        {!editMode && (
          <>
            <p className="mb-2">
              <strong>Name:</strong> {form.name}
            </p>
            <p className="mb-4">
              <strong>Email:</strong> {form.email}
            </p>

            <button
              onClick={() => setEditMode(true)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Edit Profile
            </button>
          </>
        )}

        {/* EDIT MODE */}
        {editMode && (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="block mb-1 font-medium">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div className="mb-3">
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">
                New Password (optional)
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                Save
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
          <p className="text-green-600 mt-4 text-center font-medium">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-600 mt-4 text-center font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
