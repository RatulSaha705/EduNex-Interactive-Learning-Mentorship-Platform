// src/pages/LearningStats.js

import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { formatDate } from "../utils/helpers";

export default function LearningStats() {
  const { auth } = useContext(AuthContext);

  const [summary, setSummary] = useState(null);
  const [coursesStats, setCoursesStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth?.token) {
      setLoading(false);
      setError("Please login to view your learning stats.");
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);

        // GET /api/me/learning-stats
        const [summaryRes, coursesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/me/learning-stats", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
          axios.get("http://localhost:5000/api/me/learning-courses", {
            headers: { Authorization: `Bearer ${auth.token}` },
          }),
        ]);

        setSummary(summaryRes.data || null);
        setCoursesStats(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load learning statistics.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [auth?.token]);

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Loading learning stats...</p>
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

  if (!summary && coursesStats.length === 0) {
    return (
      <div className="container mt-4">
        <h3>My Learning Analytics</h3>
        <p>No learning data available yet.</p>
      </div>
    );
  }

  // Try to be flexible with backend field names
  const totalMinutes =
    summary?.totalMinutes ||
    summary?.totalLearningMinutes ||
    summary?.minutesSpent ||
    0;

  const totalHours = (totalMinutes / 60).toFixed(1);

  const totalCourses =
    summary?.totalCoursesEnrolled ||
    summary?.coursesCount ||
    summary?.enrolledCoursesCount ||
    coursesStats.length;

  const totalLessonsCompleted =
    summary?.totalLessonsCompleted ||
    summary?.lessonsCompleted ||
    0;

  const activeDays = summary?.activeDays || summary?.activeDaysCount || 0;

  const lastActiveAt =
    summary?.lastActiveAt || summary?.lastAccessedAt || summary?.updatedAt;

  return (
    <div className="container mt-4">
      <h3>My Learning Analytics</h3>
      <p className="text-muted">
        Track your learning time, course engagement, and progress.
      </p>

      {/* Summary cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="border rounded p-3 text-center">
            <h5>Total Learning Time</h5>
            <p className="mb-0">
              <strong>{totalMinutes}</strong> min
            </p>
            <small className="text-muted">≈ {totalHours} hours</small>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="border rounded p-3 text-center">
            <h5>Courses Engaged</h5>
            <p className="mb-0">
              <strong>{totalCourses}</strong>
            </p>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="border rounded p-3 text-center">
            <h5>Lessons Completed</h5>
            <p className="mb-0">
              <strong>{totalLessonsCompleted}</strong>
            </p>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="border rounded p-3 text-center">
            <h5>Active Days</h5>
            <p className="mb-0">
              <strong>{activeDays}</strong>
            </p>
            {lastActiveAt && (
              <small className="text-muted">
                Last active: {formatDate(lastActiveAt)}
              </small>
            )}
          </div>
        </div>
      </div>

      {/* Per-course breakdown */}
      <h4>Per-Course Learning Breakdown</h4>
      {coursesStats.length === 0 ? (
        <p>You haven’t started learning any courses yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Minutes Spent</th>
                <th>Lessons Completed</th>
                <th>Progress</th>
                <th>Last Accessed</th>
              </tr>
            </thead>
            <tbody>
              {coursesStats.map((c) => {
                const minutes = c.minutesSpent || 0;
                const completed = c.completedLessonsCount || 0;
                const total = c.totalLessonsCount || 0;
                const progress =
                  total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <tr key={c.courseId || c._id}>
                    <td>{c.title || "Untitled course"}</td>
                    <td>{c.status || "N/A"}</td>
                    <td>{minutes}</td>
                    <td>
                      {completed} / {total}
                    </td>
                    <td>{progress}%</td>
                    <td>{c.lastAccessedAt ? formatDate(c.lastAccessedAt) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
