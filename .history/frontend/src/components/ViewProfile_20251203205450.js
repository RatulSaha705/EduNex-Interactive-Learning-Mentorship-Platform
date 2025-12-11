// frontend/src/components/ViewProfile.js
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function ViewProfile() {
  const { auth } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth.token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setProfile(res.data.user);
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching profile");
      }
    };

    fetchProfile();
  }, [auth.token]);

  if (error) {
    return (
      <div className="text-center mt-5 text-danger">
        <h4>{error}</h4>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center mt-5">
        <h4>Loading profile...</h4>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center mt-5">
      <div
        className="card p-4 shadow"
        style={{ width: "450px", borderRadius: "15px" }}
      >
        <h3 className="text-center mb-4 text-primary">User Profile</h3>

        <p>
          <strong>Name:</strong> {profile.name}
        </p>
        <p>
          <strong>Email:</strong> {profile.email}
        </p>
        <p>
          <strong>Role:</strong> {profile.role}
        </p>

        {/* Future: Enrolled courses */}
        {profile.enrolledCourses && profile.enrolledCourses.length > 0 && (
          <div>
            <strong>Enrolled Courses:</strong>
            <ul>
              {profile.enrolledCourses.map((course) => (
                <li key={course.id}>{course.title}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Future: Certificates */}
        {profile.certificates && profile.certificates.length > 0 && (
          <div>
            <strong>Certificates:</strong>
            <ul>
              {profile.certificates.map((cert) => (
                <li key={cert.id}>{cert.title}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Future: Mentorship sessions */}
        {profile.mentorshipSessions &&
          profile.mentorshipSessions.length > 0 && (
            <div>
              <strong>Mentorship Sessions:</strong>
              <ul>
                {profile.mentorshipSessions.map((session) => (
                  <li key={session.id}>
                    {session.title} with {session.mentorName}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </div>
  );
}
