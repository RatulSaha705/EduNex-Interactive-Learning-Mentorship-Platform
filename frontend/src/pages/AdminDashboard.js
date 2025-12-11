// src/pages/AdminDashboard.js

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminAnalyticsController } from "../controllers/adminAnalyticsController";

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [topCourses, setTopCourses] = useState([]);
  const [usageTrends, setUsageTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [ov, top, trends] = await Promise.all([
          adminAnalyticsController.fetchOverview(),
          adminAnalyticsController.fetchTopCourses({ limit: 5 }),
          adminAnalyticsController.fetchUsageTrends({ days: 30 }),
        ]);
        setOverview(ov);
        setTopCourses(top);
        setUsageTrends(trends);
      } catch (err) {
        console.error("Error loading admin analytics:", err);
        setError("Could not load admin analytics.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="container mt-4">Loading dashboard…</div>;
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
      <h2>Admin Dashboard</h2>

      {/* Added link to Reports management page */}
      <div className="mb-4">
        <Link to="/admin/reports" className="btn btn-outline-warning">
          Manage Reports
        </Link>
      </div>

      {overview && (
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="border rounded p-3 text-center">
              <h5>Total Users</h5>
              <p>{overview.totalUsers}</p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="border rounded p-3 text-center">
              <h5>Total Courses</h5>
              <p>{overview.totalCourses}</p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="border rounded p-3 text-center">
              <h5>Total Enrollments</h5>
              <p>{overview.totalEnrollments}</p>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="border rounded p-3 text-center">
              <h5>Open Reports</h5>
              <p>{overview.openReports}</p>
            </div>
          </div>
        </div>
      )}

      <h4>Top Courses</h4>
      {topCourses.length === 0 ? (
        <p>No top courses data.</p>
      ) : (
        <ul className="list-group mb-4">
          {topCourses.map((course) => (
            <li key={course.id || course._id} className="list-group-item">
              {course.title} — {course.rating || course.avgRating} ⭐
            </li>
          ))}
        </ul>
      )}

      <h4>System Usage Trends (last 30 days)</h4>
      {usageTrends ? (
        <pre>{JSON.stringify(usageTrends, null, 2)}</pre>
      ) : (
        <p>No usage data.</p>
      )}
    </div>
  );
}
