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
      <div className="text-center mt-10 text-red-500">
        <h4 className="text-lg font-semibold">{error}</h4>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center mt-10">
        <h4 className="text-lg font-semibold">Loading profile...</h4>
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-10 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-center mb-6 text-xl font-semibold text-blue-600">
          User Profile
        </h3>

        <p className="mb-2">
          <strong>Name:</strong> {profile.name}
        </p>
        <p className="mb-2">
          <strong>Email:</strong> {profile.email}
        </p>
        <p className="mb-4">
          <strong>Role:</strong> {profile.role}
        </p>

        {/* Future: Enrolled courses */}
        {profile.enrolledCourses && profile.enrolledCourses.length > 0 && (
          <div className="mb-4">
            <strong>Enrolled Courses:</strong>
            <ul className="list-disc list-inside mt-1">
              {profile.enrolledCourses.map((course) => (
                <li key={course.id}>{course.title}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Future: Certificates */}
        {profile.certificates && profile.certificates.length > 0 && (
          <div className="mb-4">
            <strong>Certificates:</strong>
            <ul className="list-disc list-inside mt-1">
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
              <ul className="list-disc list-inside mt-1">
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
