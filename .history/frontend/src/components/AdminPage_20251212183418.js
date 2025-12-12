// frontend/src/components/AdminPage.js
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function AdminPage() {
  const { auth } = useContext(AuthContext);

  const [tab, setTab] = useState("users"); // "users" | "courses" | "reports" | "analytics"
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const currentAdminId = auth?.user?._id || auth?.user?.id;

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

        const [usersRes, coursesRes, reportsRes, analyticsRes] =
          await Promise.all([
            axios.get("http://localhost:5000/api/admin/users", { headers }),
            axios.get("http://localhost:5000/api/admin/courses", { headers }),
            axios.get("http://localhost:5000/api/admin/reports", { headers }),
            axios.get("http://localhost:5000/api/admin/analytics", {
              headers,
            }),
          ]);

        setUsers(usersRes.data.users || []);
        setCourses(coursesRes.data.courses || []);
        setReports(reportsRes.data.reports || []);
        setAnalytics(analyticsRes.data.analytics || null);
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
      const res = await axios.patch(
        `http://localhost:5000/api/admin/reports/${reportId}/status`,
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

  // ===== Small helpers & derived stats =====
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
  const totalAdmins = users.filter((u) => u.role === "admin").length;
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

  // Analytics shortcuts (safe with optional chaining)
  const userCounts = analytics?.userCounts || {};
  const courseCounts = analytics?.courseCounts || {};
  const topCourses = analytics?.topCourses || [];
  const topCategories = analytics?.topCategories || [];
  const trends = analytics?.trends || {};
  const signups7 =
    trends.userSignupsLast7Days?.reduce((sum, d) => sum + d.count, 0) || 0;
  const newCourses7 =
    trends.coursesCreatedLast7Days?.reduce((sum, d) => sum + d.count, 0) || 0;

  const adminName = auth?.user?.name?.split(" ")[0] || "Admin";

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
      {/* HERO / OVERVIEW */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-sky-800 text-white shadow-xl">
        <div className="absolute -right-20 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-sky-300/10 blur-3xl" />

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-sky-100/90">
              EduNex Control Center
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
              Welcome back, <span className="font-bold">{adminName}</span> 🛡️
            </h1>
            <p className="text-sm sm:text-[15px] text-sky-50/90">
              Oversee users, courses, content safety, and platform health — all
              in one place.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center rounded-full border border-sky-100/50 bg-slate-900/40 px-3 py-1 text-[11px] font-medium">
                👥 {users.length} users • {totalStudents} students •{" "}
                {totalInstructors} instructors • {totalAdmins} admins
              </span>
              <span className="inline-flex items-center rounded-full border border-sky-100/40 bg-slate-900/30 px-3 py-1 text-[11px] font-medium">
                📚 {publishedCourses} published courses
              </span>
              <span className="inline-flex items-center rounded-full border border-sky-100/40 bg-slate-900/30 px-3 py-1 text-[11px] font-medium">
                🚩 {openReports} open report{openReports === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Compact system snapshot */}
          <div className="w-full sm:w-auto sm:min-w-[230px]">
            <div className="rounded-2xl bg-slate-950/15 backdrop-blur-sm border border-white/15 px-4 py-3 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-sky-50/90 font-medium">
                  System snapshot
                </span>
                <span className="text-[10px] text-sky-100/80">Last 7 days</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <p className="text-[11px] text-sky-100/80">Signups</p>
                  <p className="text-lg font-semibold">{signups7}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-sky-100/80">New courses</p>
                  <p className="text-lg font-semibold">{newCourses7}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-sky-100/80">Open reports</p>
                  <p className="text-lg font-semibold">{openReports}</p>
                </div>
              </div>
              <p className="text-[11px] text-sky-100/85">
                Use the tabs below to deep-dive into users, courses, reports,
                and analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Users"
          value={users.length}
          color="bg-slate-50 text-slate-800"
          icon="👥"
        />
        <SummaryCard
          label="Students"
          value={totalStudents}
          color="bg-blue-50 text-blue-800"
          icon="🎓"
        />
        <SummaryCard
          label="Instructors"
          value={totalInstructors}
          color="bg-emerald-50 text-emerald-800"
          icon="🧑‍🏫"
        />
        <SummaryCard
          label="Published Courses"
          value={publishedCourses}
          color="bg-purple-50 text-purple-800"
          icon="📚"
          sub={
            openReports > 0 ? `${openReports} open reports` : "No open reports"
          }
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex flex-wrap gap-4 text-sm">
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
        <TabButton
          label="Analytics"
          active={tab === "analytics"}
          onClick={() => setTab("analytics")}
        />
        {updating && (
          <span className="ml-auto text-xs text-gray-500 animate-pulse">
            Saving changes…
          </span>
        )}
      </div>

      {/* USERS TAB */}
      {tab === "users" && (
        <div className="bg-white rounded-xl shadow-md p-5 overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Users</h3>
              <p className="text-xs text-gray-500">
                Promote instructors, manage admin access, and remove problematic
                accounts.
              </p>
            </div>
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
                      <div className="inline-flex gap-2 items-center justify-center">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleChangeUserRole(u._id, e.target.value)
                          }
                          className="border rounded-full px-2 py-1 text-xs bg-white"
                        >
                          <option value="student">student</option>
                          <option value="instructor">instructor</option>
                          <option value="admin">admin</option>
                        </select>
                        {u._id !== currentAdminId && (
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-full hover:bg-red-100"
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

      {/* COURSES TAB */}
      {tab === "courses" && (
        <div className="bg-white rounded-xl shadow-md p-5 overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Courses</h3>
              <p className="text-xs text-gray-500">
                Review course quality, publish or archive content.
              </p>
            </div>
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
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() =>
                            handleChangeCourseStatus(c._id, "draft")
                          }
                          className="px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-full hover:bg-yellow-100"
                        >
                          Set draft
                        </button>
                        <button
                          onClick={() =>
                            handleChangeCourseStatus(c._id, "published")
                          }
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() =>
                            handleChangeCourseStatus(c._id, "archived")
                          }
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
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

      {/* REPORTS TAB */}
      {tab === "reports" && (
        <div className="bg-white rounded-xl shadow-md p-5 overflow-x-auto">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Reported Content
              </h3>
              <p className="text-xs text-gray-500">
                Review and resolve user reports to keep EduNex safe.
              </p>
            </div>
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
                      {r.targetLabel || "—"}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {r.reason || "—"}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">
                      {r.targetType}
                    </td>
                    <td className="py-2 px-3 text-center text-gray-600">
                      {r.reportedBy
                        ? `${r.reportedBy.name} (${r.reportedBy.email})`
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
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdateReportStatus(r._id, "in_review")
                          }
                          className="px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-full hover:bg-yellow-100"
                        >
                          In review
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateReportStatus(r._id, "resolved")
                          }
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateReportStatus(r._id, "dismissed")
                          }
                          className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
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

      {/* ANALYTICS TAB */}
      {tab === "analytics" && (
        <div className="bg-white rounded-xl shadow-md p-5 space-y-5 overflow-x-auto">
          <div className="flex justify-between items-center mb-1">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                System Analytics
              </h3>
              <p className="text-xs text-gray-500">
                High-level insights on user activity, courses, and growth
                trends.
              </p>
            </div>
          </div>

          {!analytics ? (
            <p className="text-sm text-gray-600">
              Analytics data is not available yet.
            </p>
          ) : (
            <>
              {/* Analytics summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard
                  label="Users (total / roles)"
                  value={userCounts.total ?? "—"}
                  sub={`Students ${userCounts.students ?? 0} • Instructors ${
                    userCounts.instructors ?? 0
                  } • Admins ${userCounts.admins ?? 0}`}
                  color="bg-sky-50 text-sky-900"
                  icon="👥"
                />
                <SummaryCard
                  label="Courses (total / states)"
                  value={courseCounts.total ?? "—"}
                  sub={`Published ${courseCounts.published ?? 0} • Draft ${
                    courseCounts.draft ?? 0
                  } • Archived ${courseCounts.archived ?? 0}`}
                  color="bg-indigo-50 text-indigo-900"
                  icon="📚"
                />
                <SummaryCard
                  label="Signups (7 days)"
                  value={signups7}
                  sub="New users in last 7 days"
                  color="bg-emerald-50 text-emerald-900"
                  icon="📈"
                />
                <SummaryCard
                  label="New Courses (7 days)"
                  value={newCourses7}
                  sub="Courses created in last 7 days"
                  color="bg-orange-50 text-orange-900"
                  icon="🆕"
                />
              </div>

              {/* Top courses & categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top courses */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-2">
                    Top Courses by Enrollment
                  </h4>
                  {topCourses.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No published courses with enrollments yet.
                    </p>
                  ) : (
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="py-2 px-3 text-left font-medium text-gray-700">
                            Course
                          </th>
                          <th className="py-2 px-3 text-center font-medium text-gray-700">
                            Category
                          </th>
                          <th className="py-2 px-3 text-center font-medium text-gray-700">
                            Enrolled
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCourses.map((c) => (
                          <tr key={c._id} className="border-b last:border-0">
                            <td className="py-2 px-3 text-gray-800">
                              <div className="font-medium">{c.title}</div>
                              {c.instructor?.name && (
                                <div className="text-xs text-gray-500">
                                  {c.instructor.name}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-600">
                              {c.category}
                            </td>
                            <td className="py-2 px-3 text-center text-gray-800">
                              {c.enrolledCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Top categories */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-2">
                    Top Categories
                  </h4>
                  {topCategories.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      No category analytics available yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {topCategories.map((cat) => (
                        <div
                          key={cat.category}
                          className="flex justify-between items-center border rounded-lg px-3 py-2"
                        >
                          <div>
                            <div className="font-medium text-gray-800">
                              {cat.category}
                            </div>
                            <div className="text-xs text-gray-500">
                              {cat.courseCount} course
                              {cat.courseCount !== 1 ? "s" : ""} •{" "}
                              {cat.totalEnrollments} total enrollments
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Trends last 7 days */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                  Last 7 Days Activity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <TrendTable
                    title="User Signups"
                    data={trends.userSignupsLast7Days || []}
                  />
                  <TrendTable
                    title="New Courses Created"
                    data={trends.coursesCreatedLast7Days || []}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color, icon }) {
  return (
    <div
      className={`rounded-xl shadow-sm p-4 ${
        color || "bg-gray-50 text-gray-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-gray-500">
          {label}
        </div>
        {icon && <span className="text-lg opacity-70">{icon}</span>}
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

function TrendTable({ title, data }) {
  return (
    <div className="border rounded-xl p-3">
      <div className="text-xs font-semibold text-gray-700 mb-2">{title}</div>
      {data.length === 0 ? (
        <p className="text-xs text-gray-500">No data for this period.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="py-1 px-2 text-left text-gray-600">Date</th>
              <th className="py-1 px-2 text-center text-gray-600">Count</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.date} className="border-b last:border-0">
                <td className="py-1 px-2 text-gray-700">
                  {new Date(row.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="py-1 px-2 text-center text-gray-800">
                  {row.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
