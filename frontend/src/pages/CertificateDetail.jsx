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
    if (!auth?.token) return;

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
        <p className="text-red-600 font-medium">
          Please log in to view certificates.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-10 text-center">
        <p className="text-gray-600">Loading certificate...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="max-w-4xl mx-auto px-4 mt-10 text-center space-y-3">
        <p className="text-red-600 font-medium">
          {error || "Certificate not found"}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          ⬅ Go Back
        </button>
      </div>
    );
  }

  const studentName = certificate.student?.name || auth.user.name;
  const courseTitle = certificate.course?.title || "Course";
  const instructorName =
    certificate.course?.instructor?.name || "Instructor";
  const completionDate = certificate.completionDate
    ? new Date(certificate.completionDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-pink-500 to-orange-400 flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 py-4 text-white">
        <div className="text-2xl font-extrabold tracking-wide">EduNex</div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 text-sm bg-white/10 border border-white/40 rounded-lg hover:bg-white/20"
          >
            ⬅ Back
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1 text-sm bg-white text-purple-700 rounded-lg hover:bg-gray-100"
          >
            🖨 Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Certificate area */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="bg-white max-w-4xl w-full aspect-[4/3] md:aspect-[16/9] rounded-3xl shadow-2xl border-[10px] border-yellow-400 relative overflow-hidden">
          {/* subtle pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_top,_#000_0,_transparent_55%)]" />

          <div className="relative h-full px-8 md:px-16 py-8 md:py-12 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xs md:text-sm tracking-[0.3em] uppercase text-gray-500">
                  Certificate of Completion
                </h1>
                <h2 className="mt-2 text-2xl md:text-4xl font-extrabold text-gray-900 tracking-wide">
                  EduNex Academy
                </h2>
              </div>
              <div className="text-right text-xs md:text-sm text-gray-500">
                <div>Certificate ID:</div>
                <div className="font-mono text-[0.65rem] md:text-xs">
                  {certificate.certificateCode}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="text-center px-2 md:px-10">
              <p className="text-xs md:text-sm text-gray-500 mb-2">
                This is to certify that
              </p>
              <p className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
                {studentName}
              </p>
              <p className="text-xs md:text-sm text-gray-500 mb-2">
                has successfully completed the course
              </p>
              <p className="text-xl md:text-3xl font-semibold text-purple-700 mb-4">
                {courseTitle}
              </p>
              <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
                Awarded on{" "}
                <span className="font-medium">{completionDate}</span> in
                recognition of consistent effort and successful completion of all
                required lessons and assessments on the{" "}
                <span className="font-semibold">EduNex Interactive Learning &amp; Mentorship Platform</span>.
              </p>
            </div>

            {/* Footer signatures */}
            <div className="flex items-end justify-between mt-6 text-xs md:text-sm text-gray-700">
              <div className="text-left">
                <div className="h-[1px] bg-gray-300 w-40 mb-1" />
                <div className="font-semibold">{instructorName}</div>
                <div className="text-gray-500">Instructor</div>
              </div>
              <div className="text-right">
                <div className="h-[1px] bg-gray-300 w-40 mb-1 ml-auto" />
                <div className="font-semibold">EduNex Team</div>
                <div className="text-gray-500">Platform Administrator</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* bottom link for mobile users */}
      <div className="pb-4 text-center text-white text-sm">
        View all your certificates{" "}
        <Link
          to="/student/certificates"
          className="underline font-semibold"
        >
          here
        </Link>
        .
      </div>
    </div>
  );
}
