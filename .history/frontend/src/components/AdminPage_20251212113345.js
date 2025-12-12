// frontend/src/components/AdminPage.js
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function AdminPage() {
  const { auth } = useContext(AuthContext);

  const [tab, setTab] = useState("users"); // "users" | "courses" | "reports"
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  // ===== Fetch all admin data =====
  useEffect(() => {
    if (!auth?.token || auth?.user?.role !== "admin") {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        setLoading(true);

        const headers = { Authorization: `Bearer ${auth.token}` };

        const [usersRes, coursesRes, reportsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/admin/users", { headers }),
          axios.get("http://localhost:5000/api/admin/courses", { headers }),
          // 🔹 UPDATED: reports now come from /api/reports
          axios.get("http://localhost:5000/api/reports", { headers }),
        ]);

        setUsers(usersRes.data.users || []);
        setCourses(coursesRes.data.courses || []);
        setReports(reportsRes.data.reports || []);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
        setError(
          err.response?.data?.message || "Failed to load admin dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [auth?.token, auth?.user?.role]);

  if (!auth?.user || auth.user.role !== "admin") {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-10 text-center">
        <p className="text-red-600 font-semibold">
          Admin access only. Please log in as an admin.
        </p>
      </div>
    );
  }

  // ===== Handlers =====

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      setUpdating(true);
      const res = await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role: newRole },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      const updated = res.data.user;
      setUsers((prev) =>
        prev.map((u) => (u._id === updated._id ? updated : u))
      );
    } catch (err) {
      console.error("Failed to update role:", err);
      alert(
        err.response?.data?.message || "Failed to update user role. Try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this user? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert(err.response?.data?.message || "Failed to delete user. Try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeCourseStatus = async (courseId, status) => {
    try {
      setUpdating(true);
      const res = await axios.patch(
        `http://localhost:5000/api/admin/courses/${courseId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      const updated = res.data.course;
      setCourses((prev) =>
        prev.map((c) =>
          c._id === updated._id
            ? {
                ...c,
                status: updated.status,
              }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to update course status:", err);
      alert(
        err.response?.data?.message ||
          "Failed to update course status. Try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      setUpdating(true);
      // 🔹 UPDATED: status endpoint is now /api/reports/:id/status
      const res = await axios.patch(
        `http://localhost:5000/api/reports/${reportId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      const updated = res.data.report;
      setReports((prev) =>
        prev.map((r) =>
          r._id === updated._id ? { ...r, status: updated.status } : r
        )
      );
    } catch (err) {
      console.error("Failed to update report status:", err);
      alert(
        err.response?.data?.message ||
          "Failed to update report status. Try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  // ===== Small helpers =====
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalInstructors = users.filter((u) => u.role === "instructor").length;
  const publishedCourses = courses.filter(
    (c) => c.status === "published"
  ).length;
  const openReports = reports.filter((r) => r.status === "open").length;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <p className="text-center text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 mt-8 text-center">
        <p className="text-red-600 font-semibold mb-3">{error}</p>
        <p className="text-gray-500 text-sm">
          Check your backend server logs for more details.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-gray-600">
            Monitor users, courses, and reported content across EduNex.
          </p>
        </div>
        {updating && (
          <span className="text-xs text-gray-500 animate-pulse">
            Saving changes...
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Users"
          value={users.length}
          color="bg-slate-50 text-slate-800"
        />
        <SummaryCard
          label="Students"
          value={totalStudents}
          color="bg-blue-50 text-blue-800"
        />
        <SummaryCard
          label="Instructors"
          value={totalInstructors}
          color="bg-emerald-50 text-emerald-800"
        />
        <SummaryCard
          label="Published Courses"
          value={publishedCourses}
          color="bg-purple-50 text-purple-800"
          sub={
            openReports > 0 ? `${openReports} open reports` : "No open reports"
          }
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-4 text-sm">
        <TabButton
          label="Users"
          active={tab === "users"}
          onClick={() => setTab("users")}
        />
        <TabButton
          label="Courses"
          active={tab === "courses"}
          onClick={() => setTab("courses")}
        />
        <TabButton
          label="Reported Content"
          active={tab === "reports"}
          onClick={() => setTab("reports")}
        />
      </div>

      {/* Tab content */}
      {tab === "users" && (
        <div className="bg-white rounded-xl shadow-md p-5 overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Users</h3>
            <span className="text-xs text-gray-500">
              Manage roles and remove problematic accounts.
            </span>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-gray-600">No users found.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-3 text-left font-medium text-gray-700">
                    Name
                  </th>
                  <th className="py-2 px-3 text-left font-medium text-gray-700">
                    Email
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Role
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Joined
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b last:border-0">
                    <td className="py-2 px-3 text-gray-800">{u.name}</td>
                    <td className="py-2 px-3 text-gray-600">{u.email}</td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : u.role === "instructor"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex gap-1">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleChangeUserRole(u._id, e.target.value)
                          }
                          className="border rounded px-2 py-1 text-xs"
                        >
                          <option value="student">student</option>
                          <option value="instructor">instructor</option>
                          <option value="admin">admin</option>
                        </select>
                        {u._id !== auth.user._id && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "courses" && (
        <div className="bg-white rounded-xl shadow-md p-5 overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">Courses</h3>
            <span className="text-xs text-gray-500">
              Publish, archive, or review courses.
            </span>
          </div>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-600">No courses found.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-3 text-left font-medium text-gray-700">
                    Title
                  </th>
                  <th className="py-2 px-3 text-left font-medium text-gray-700">
                    Instructor
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Category
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Status
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Enrolled
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c._id} className="border-b last:border-0">
                    <td className="py-2 px-3 text-gray-800">{c.title}</td>
                    <td className="py-2 px-3 text-gray-600">
                      {c.instructor?.name || "—"}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">
                      {c.category}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === "published"
                            ? "bg-green-100 text-green-800"
                            : c.status === "archived"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">
                      {c.enrolledCount}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() =>
                            handleChangeCourseStatus(c._id, "draft")
                          }
                          className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
                        >
                          Draft
                        </button>
                        <button
                          onClick={() =>
                            handleChangeCourseStatus(c._id, "published")
                          }
                          className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() =>
                            handleChangeCourseStatus(c._id, "archived")
                          }
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="bg-white rounded-xl shadow-md p-5 overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Reported Content
            </h3>
            <span className="text-xs text-gray-500">
              Review and resolve user reports.
            </span>
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-gray-600">
              No reported content yet. Great job community! 🎉
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 px-3 text-left font-medium text-gray-700">
                    Target
                  </th>
                  <th className="py-2 px-3 text-left font-medium text-gray-700">
                    Reason
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Type
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Reported By
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Status
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Created
                  </th>
                  <th className="py-2 px-3 text-center font-medium text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id} className="border-b last:border-0">
                    <td className="py-2 px-3 text-gray-800">
                      {/* 🔹 targetSummary comes from Report model */}
                      {r.targetSummary
                        ? `[${r.targetType}] ${r.targetSummary}`
                        : r.targetType}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {r.reason || "—"}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">
                      {r.targetType}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">
                      {/* 🔹 reporter is populated in adminGetReports */}
                      {r.reporter
                        ? `${r.reporter.name} (${r.reporter.email})`
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === "open"
                            ? "bg-red-100 text-red-700"
                            : r.status === "in_review"
                            ? "bg-yellow-100 text-yellow-800"
                            : r.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center text-gray-500">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() =>
                            handleUpdateReportStatus(r._id, "in_review")
                          }
                          className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100"
                        >
                          In review
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateReportStatus(r._id, "resolved")
                          }
                          className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateReportStatus(r._id, "dismissed")
                          }
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
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

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium transition ${
        active
          ? "border-indigo-600 text-indigo-700"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}
