// frontend/src/pages/CertificateDetail.jsx
import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function CertificateDetail() {
  const { id } = useParams(); // certificate id
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth?.token) {
      setLoading(false);
      setError("Please log in to view certificates.");
      return;
    }

    const fetchCertificate = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/certificates/${id}`,
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
        setCertificate(res.data.certificate);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load certificate details"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id, auth?.token]);

  const handlePrint = () => {
    window.print();
  };

  if (!auth?.user) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-10 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <p className="text-red-600 font-medium">
            Please log in to view certificates.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3">
            <div className="inline-block h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 text-sm">Loading certificate…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-10 text-center space-y-3">
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <p className="text-red-600 font-medium">
            {error || "Certificate not found"}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            ← Go Back
          </button>
          <Link
            to="/student/certificates"
            className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            View My Certificates
          </Link>
        </div>
      </div>
    );
  }

  const studentName = certificate.student?.name || auth.user.name;
  const courseTitle = certificate.course?.title || "Course";
  const instructorName = certificate.course?.instructor?.name || "Instructor";
  const completionDate = certificate.completionDate
    ? new Date(certificate.completionDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar (hidden on print) */}
      <div className="flex justify-between items-center px-4 md:px-8 py-4 bg-white border-b shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs md:text-sm rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            ← Back
          </button>
          <Link
            to="/student/certificates"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs md:text-sm rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
          >
            🎓 My Certificates
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block text-xs text-gray-500 mr-2">
            <span className="font-semibold">EduNex</span> · Certificate Viewer
          </div>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs md:text-sm rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            🖨 Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Certificate area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        {/* Outer gold frame (prints nicely) */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 p-[10px] rounded-3xl shadow-2xl max-w-4xl w-full aspect-[4/3] md:aspect-[16/9] print:shadow-none">
          {/* Inner certificate card */}
          <div className="bg-white h-full w-full rounded-2xl border border-amber-200 relative overflow-hidden">
            {/* subtle pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_top,_#000_0,_transparent_55%)]" />

            <div className="relative h-full px-6 md:px-12 py-6 md:py-10 flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-[0.55rem] md:text-xs tracking-[0.35em] uppercase text-gray-500">
                    Certificate of Completion
                  </h1>
                  <h2 className="mt-2 text-2xl md:text-4xl font-extrabold text-gray-900 tracking-wide">
                    EduNex Academy
                  </h2>
                </div>
                <div className="text-right text-[0.6rem] md:text-xs text-gray-500">
                  <div className="font-medium uppercase tracking-wide mb-1">
                    Certificate ID
                  </div>
                  <div className="font-mono break-all">
                    {certificate.certificateCode || "N/A"}
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="text-center px-2 md:px-10">
                <p className="text-[0.65rem] md:text-sm text-gray-500 mb-2">
                  This is to certify that
                </p>
                <p className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
                  {studentName}
                </p>
                <p className="text-[0.65rem] md:text-sm text-gray-500 mb-2">
                  has successfully completed the course
                </p>
                <p className="text-lg md:text-3xl font-semibold text-indigo-700 mb-4">
                  {courseTitle}
                </p>
                <p className="text-xs md:text-base text-gray-600 max-w-2xl mx-auto">
                  Awarded on{" "}
                  <span className="font-medium">{completionDate}</span> in
                  recognition of consistent effort and successful completion of
                  all required lessons and assessments on the{" "}
                  <span className="font-semibold">
                    EduNex Interactive Learning &amp; Mentorship Platform
                  </span>
                  .
                </p>
              </div>

              {/* Footer signatures */}
              <div className="flex items-end justify-between mt-6 text-[0.65rem] md:text-sm text-gray-700">
                <div className="text-left">
                  <div className="h-[1px] bg-gray-300 w-32 md:w-40 mb-1" />
                  <div className="font-semibold truncate max-w-[10rem] md:max-w-xs">
                    {instructorName}
                  </div>
                  <div className="text-gray-500">Instructor</div>
                </div>
                <div className="text-right">
                  <div className="h-[1px] bg-gray-300 w-32 md:w-40 mb-1 ml-auto" />
                  <div className="font-semibold">EduNex Team</div>
                  <div className="text-gray-500">Platform Administrator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* bottom link for mobile users (hidden on print) */}
      <div className="pb-4 text-center text-xs md:text-sm text-gray-600 print:hidden">
        View all your certificates{" "}
        <Link
          to="/student/certificates"
          className="underline font-semibold text-indigo-700"
        >
          here
        </Link>
        .
      </div>
    </div>
  );
}
