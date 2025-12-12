// frontend/src/pages/LearningStats.jsx
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function LearningStats() {
  const { auth } = useContext(AuthContext);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔹 NEW: Download Progress Report (PDF)
  const handleDownloadReport = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/reports/progress",
        {
          headers: { Authorization: `Bearer ${auth.token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "edunex-progress-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Failed to download progress report. Please try again."
      );
    }
  };

  const handlePreviewReport = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/reports/progress",
        {
          headers: { Authorization: `Bearer ${auth.token}` },
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // open PDF in a new tab as a preview
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
          "Failed to preview progress report. Please try again."
      );
    }
  };

  <div className="flex gap-2">
    <Link
      to="/student"
      className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
    >
      ⬅ Back to Dashboard
    </Link>
    <Link
      to="/student/certificates"
      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
    >
      🎓 My Certificates
    </Link>

    {/* existing download button */}
    <button
      onClick={handleDownloadReport}
      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
    >
      ⬇ Download Report (PDF)
    </button>

    {/* ⭐ NEW preview button */}
    <button
      onClick={handlePreviewReport}
      className="px-4 py-2 text-sm bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50"
    >
      👁 Preview Report
    </button>
  </div>;

  useEffect(() => {
    const fetchStats = async () => {
      if (!auth?.token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/stats/my", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load learning statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [auth?.token]);

  if (!auth?.user) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-10 text-center">
        <p className="text-red-600 font-semibold">
          Please log in to view your learning stats.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <p className="text-center text-gray-600">Loading learning stats...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-8 text-center space-y-3">
        <p className="text-red-600 font-semibold">
          {error || "Unable to load learning stats"}
        </p>
        <Link
          to="/student"
          className="inline-block px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          ⬅ Back to Dashboard
        </Link>
      </div>
    );
  }

  const { summary, perCourse, activityLast7Days } = stats;

  const maxMinutesInWeek = Math.max(
    30,
    ...(activityLast7Days || []).map((d) => d.minutes || 0)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Learning Analytics
          </h2>
          <p className="text-gray-600">
            Track your learning hours, course progress, and engagement on
            EduNex.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/student"
            className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            ⬅ Back to Dashboard
          </Link>
          <Link
            to="/student/certificates"
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            🎓 My Certificates
          </Link>
          {/* 🔹 NEW: Export PDF button */}
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            ⬇ Export Progress Report (PDF)
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Courses"
          value={summary.totalCourses}
          color="bg-blue-50 text-blue-800"
        />
        <SummaryCard
          label="Completed Courses"
          value={summary.completedCourses}
          color="bg-green-50 text-green-800"
        />
        <SummaryCard
          label="Lessons Completed"
          value={summary.totalLessonsCompleted}
          color="bg-indigo-50 text-indigo-800"
        />
        <SummaryCard
          label="Learning Hours"
          value={summary.totalLearningHours}
          sub="(approx.)"
          color="bg-orange-50 text-orange-800"
        />
      </div>

      {/* Weekly activity */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Activity (Last 7 Days)
          </h3>
          <span className="text-xs text-gray-500">
            Estimated minutes spent learning per day
          </span>
        </div>
        {(!activityLast7Days || activityLast7Days.length === 0) && (
          <p className="text-gray-600 text-sm">
            No recent activity recorded yet.
          </p>
        )}
        {activityLast7Days && activityLast7Days.length > 0 && (
          <div className="space-y-2">
            {activityLast7Days.map((day) => {
              const width =
                maxMinutesInWeek === 0
                  ? 0
                  : Math.max(
                      5,
                      Math.round((day.minutes / maxMinutesInWeek) * 100)
                    );
              const dateLabel = new Date(day.date).toLocaleDateString(
                undefined,
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                }
              );
              return (
                <div key={day.date} className="flex items-center gap-2">
                  <div className="w-32 text-xs text-gray-600">{dateLabel}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${width}%` }}
                    ></div>
                  </div>
                  <div className="w-10 text-right text-xs text-gray-700">
                    {day.minutes}m
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-course breakdown */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Course-wise Progress & Engagement
          </h3>
          <span className="text-xs text-gray-500">
            Based on completed lessons and tracked activity
          </span>
        </div>

        {perCourse.length === 0 ? (
          <p className="text-gray-600 text-sm">
            You are not enrolled in any courses yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-3 text-left font-medium text-gray-700">
                    Course
                  </th>
                  <th className="py-2 px-3 text-left font-medium text-gray-700">
                    Instructor
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Lessons
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Progress
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Learning Time
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Status
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Certificate
                  </th>
                </tr>
              </thead>
              <tbody>
                {perCourse.map((c) => (
                  <tr key={c.courseId} className="border-b last:border-0">
                    <td className="py-2 px-3">
                      <div className="font-semibold text-gray-800">
                        {c.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.category || "General"}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-700">
                      {c.instructor || "Unknown"}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-700">
                      {c.lessonsCompleted}/{c.lessonsTotal}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-gray-800">
                          {c.progress}%
                        </span>
                        <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              c.progress === 100
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                            style={{ width: `${c.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-700">
                      {c.learningMinutes}m
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {c.hasCertificate ? (
                        <span className="text-xs text-green-700 font-semibold">
                          ✅ Issued
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div
      className={`rounded-xl shadow-sm p-4 ${
        color || "bg-gray-50 text-gray-800"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
