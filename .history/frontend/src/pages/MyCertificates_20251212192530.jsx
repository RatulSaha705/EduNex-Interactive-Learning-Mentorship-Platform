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
      if (!auth?.token) {
        setLoading(false);
        setError("Please log in to view your certificates.");
        return;
      }

      try {
        setLoading(true);
        setError("");

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

  const issuedCount = certificates.filter((c) => c.status === "issued").length;
  const revokedCount = certificates.filter(
    (c) => c.status === "revoked"
  ).length;

  // If user somehow lands here without being logged in
  if (!auth?.user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-red-600 font-semibold mb-3">
            Please log in to view your certificates.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-3 bg-white rounded-2xl shadow-sm p-6">
          <div className="inline-block h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading your certificates…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">{error}</p>
          <p className="text-xs text-gray-500">
            If this keeps happening, please try again later.
          </p>
          <div className="mt-4">
            <Link
              to="/student"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-200 text-gray-800 text-sm font-semibold hover:bg-gray-300"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            to="/student"
            className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
          >
            ← Back to student dashboard
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">My Certificates</h2>
          <p className="text-sm text-gray-600">
            All completion certificates you’ve earned on EduNex.
          </p>
        </div>

        {/* Small stats */}
        <div className="flex flex-col items-end gap-1 text-right">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Total Certificates
            </p>
            <p className="text-2xl font-bold text-indigo-700">
              {certificates.length || 0}
            </p>
          </div>
          {certificates.length > 0 && (
            <div className="flex gap-2 text-[11px]">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                Issued: {issuedCount}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold">
                Revoked: {revokedCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* No certificates */}
      {certificates.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-3">
          <div className="text-3xl">🏅</div>
          <h3 className="text-lg font-semibold text-gray-800">
            You haven’t earned any certificates yet
          </h3>
          <p className="text-sm text-gray-600 max-w-md">
            Complete courses on EduNex to earn shareable certificates and track
            your achievements.
          </p>
          <Link
            to="/student/courses"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Browse Courses
          </Link>
        </div>
      )}

      {/* Certificates list */}
      {certificates.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {certificates.map((cert) => {
            const isIssued = cert.status === "issued";

            return (
              <div
                key={cert._id}
                className="bg-gradient-to-br from-emerald-50 via-white to-indigo-50 p-[1px] rounded-2xl shadow-sm hover:shadow-md transition"
              >
                <div className="bg-white rounded-2xl p-4 h-full flex flex-col justify-between">
                  {/* Top: course + status */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cert.course?.title || "Unnamed Course"}
                    </h3>

                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                        {cert.course?.category || "General"}
                      </span>
                      {cert.course?.instructor?.name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                          {cert.course.instructor.name}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          isIssued
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {isIssued ? "Issued" : "Revoked"}
                      </span>
                      <span className="text-gray-500">
                        Completed on:{" "}
                        <span className="font-medium">
                          {formatDate(cert.completionDate)}
                        </span>
                      </span>
                    </div>

                    {cert.certificateCode && (
                      <p className="mt-1 text-xs text-gray-500">
                        Certificate Code:{" "}
                        <span className="font-mono font-semibold">
                          {cert.certificateCode}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/student/certificates/${cert._id}`}
                      className="px-3 py-1.5 text-xs sm:text-sm border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-semibold"
                    >
                      View Certificate
                    </Link>

                    {cert.course?._id && (
                      <Link
                        to={`/student/courses/${cert.course._id}`}
                        className="px-3 py-1.5 text-xs sm:text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                      >
                        View Course
                      </Link>
                    )}

                    {isIssued && cert.pdfUrl && (
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs sm:text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
                      >
                        Download PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
