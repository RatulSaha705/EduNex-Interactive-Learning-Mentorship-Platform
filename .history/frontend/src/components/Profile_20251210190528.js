// frontend/src/components/Profile.js
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function Profile() {
  const { auth, login } = useContext(AuthContext);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

      // Update auth context
      login({ token: auth.token, user: res.data.user });

      setForm((prev) => ({ ...prev, password: "" }));
    } catch (err) {
      if (err.response?.data?.message) setError(err.response.data.message);
      else setError("Error updating profile");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[450px]">
        <h3 className="text-center mb-6 text-blue-600 text-2xl font-semibold">
          My Profile
        </h3>

        {/* View current info */}
        <div className="mb-4 text-gray-700">
          <span className="font-semibold">Role:</span> {auth.user?.role}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Update Profile
          </button>
        </form>

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
