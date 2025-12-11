// frontend/src/pages/MyCertificates.jsx
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function MyCertificates() {
  const { auth } = useContext(AuthContext);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!auth?.token) return;

      try {
        const res = await axios.get(
          "http://localhost:5000/api/certificates/my",
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setCertificates(res.data.certificates || []);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load your certificates"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [auth?.token]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <p className="text-center text-gray-600">Loading certificates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <p className="text-center text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            My Certificates
          </h2>
          <p className="text-gray-600">
            View all completion certificates you’ve earned on EduNex.
          </p>
        </div>
        <Link
          to="/student"
          className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          ⬅ Back to Dashboard
        </Link>
      </div>

      {/* No certificates */}
      {certificates.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-700 mb-2">
            You haven’t earned any certificates yet.
          </p>
          <Link
            to="/courses"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Courses
          </Link>
        </div>
      )}

      {/* Certificates list */}
      {certificates.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex flex-col justify-between"
            >
              {/* Top: course + status */}
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {cert.course?.title || "Unnamed Course"}
                </h3>
                <p className="text-sm text-gray-600">
                  Category:{" "}
                  <span className="font-medium">
                    {cert.course?.category || "General"}
                  </span>
                </p>

                {cert.course?.instructor && (
                  <p className="text-sm text-gray-600">
                    Instructor:{" "}
                    <span className="font-medium">
                      {cert.course.instructor.name} (
                      {cert.course.instructor.email})
                    </span>
                  </p>
                )}

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      cert.status === "issued"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {cert.status === "issued" ? "Issued" : "Revoked"}
                  </span>
                  <span className="text-xs text-gray-500">
                    Completed on: {formatDate(cert.completionDate)}
                  </span>
                </div>

                {cert.certificateCode && (
                  <p className="mt-2 text-xs text-gray-500">
                    Certificate Code:{" "}
                    <span className="font-mono font-semibold">
                      {cert.certificateCode}
                    </span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* NEW: View Certificate page */}
                <Link
                  to={`/student/certificates/${cert._id}`}
                  className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                >
                  View Certificate
                </Link>

                {/* Existing: View Course */}
                <Link
                  to={`/student/courses/${cert.course?._id}`}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  View Course
                </Link>

                {/* Existing: optional PDF download */}
                {cert.pdfUrl && cert.status === "issued" && (
                  <a
                    href={cert.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Download Certificate
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
