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
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        className="card p-4 shadow"
        style={{ width: "450px", borderRadius: "15px" }}
      >
        <h3 className="text-center mb-4 text-primary">My Profile</h3>

        {/* View current info */}
        <div className="mb-3">
          <strong>Role:</strong> {auth.user?.role}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100">
            Update Profile
          </button>
        </form>

        {message && <p className="text-success mt-3 text-center">{message}</p>}
        {error && <p className="text-danger mt-3 text-center">{error}</p>}
      </div>
    </div>
  );
}
