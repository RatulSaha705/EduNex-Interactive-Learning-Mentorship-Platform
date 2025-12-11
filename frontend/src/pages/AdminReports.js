// src/pages/AdminReports.js

import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { reportController } from "../controllers/reportController";

export default function AdminReports() {
  const { auth } = useContext(AuthContext);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!auth?.token || auth?.user?.role !== "admin") {
      setLoading(false);
      setError("You are not authorized to view this page.");
      return;
    }

    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await reportController.fetchAllReports();
        // assuming backend returns { reports: [...] } or an array directly
        const list = Array.isArray(data) ? data : data.reports || [];
        setReports(list);
      } catch (err) {
        console.error(err);
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [auth?.token, auth?.user?.role]);

  const handleMarkResolved = async (reportId) => {
    try {
      await reportController.updateReport(reportId, { status: "resolved" });
      setReports((prev) =>
        prev.map((r) =>
          r._id === reportId || r.id === reportId ? { ...r, status: "resolved" } : r
        )
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update report status.");
    }
  };

  const handleDeleteReport = async (reportId) => {
    const ok = window.confirm("Are you sure you want to delete this report?");
    if (!ok) return;

    try {
      await reportController.deleteReport(reportId);
      setReports((prev) =>
        prev.filter((r) => (r._id || r.id) !== reportId)
      );
    } catch (err) {
      console.error(err);
      alert("Failed to delete report.");
    }
  };

  const filteredReports =
    statusFilter === "all"
      ? reports
      : reports.filter((r) => (r.status || "open") === statusFilter);

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <p className="text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h3>Report Management</h3>
      <p className="text-muted">
        View and manage user/content reports submitted across the platform.
      </p>

      {/* Filters */}
      <div className="d-flex align-items-center mb-3 gap-2">
        <span>Filter by status:</span>
        <select
          className="form-select"
          value={statusFilter}
          style={{ maxWidth: "200px" }}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {filteredReports.length === 0 ? (
        <p>No reports found for this filter.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Reporter</th>
                <th>Target</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r, index) => (
                <tr key={r._id || r.id}>
                  <td>{index + 1}</td>
                  <td>{r.type || r.reportType || "N/A"}</td>
                  <td>{r.reason || r.title || r.category || "N/A"}</td>
                  <td>
                    {r.reporter?.name ||
                      r.reporterName ||
                      r.reporter?.email ||
                      "Unknown"}
                  </td>
                  <td>
                    {r.reportedUser?.name ||
                      r.reportedUser?.email ||
                      r.course?.title ||
                      r.targetId ||
                      "N/A"}
                  </td>
                  <td>
                    <span className="badge bg-secondary">
                      {r.status || "open"}
                    </span>
                  </td>
                  <td>
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      {(r.status || "open") !== "resolved" && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() =>
                            handleMarkResolved(r._id || r.id)
                          }
                        >
                          Mark Resolved
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteReport(r._id || r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
