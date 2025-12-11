// src/pages/RecommendedCourses.js

import React, { useEffect, useState, useContext } from "react";
import { courseController } from "../controllers/courseController";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";

export default function RecommendedCourses() {
  const { auth } = useContext(AuthContext);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        // Call backend route directly
        const res = await courseController.fetchRecommendations({ limit: 10 });
        // Expecting res.data to be an array of courses with score
        setRecommended(Array.isArray(res) ? res : res.courses || []);
      } catch (err) {
        console.error("Failed to fetch recommended courses:", err);
        setError("Could not load course recommendations.");
      } finally {
        setLoading(false);
      }
    }

    if (auth?.token) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [auth?.token]);

  if (loading) {
    return <div className="container mt-4">Loading recommendations…</div>;
  }

  if (error) {
    return <div className="container mt-4 text-danger">{error}</div>;
  }

  if (!recommended.length) {
    return (
      <div className="container mt-4">No course recommendations available.</div>
    );
  }

  return (
    <div className="container mt-4">
      <h3>Recommended For You</h3>
      <div className="row">
        {recommended.map((course, idx) => (
          <div
            className="col-md-4 mb-3"
            key={course.courseId || course._id || idx}
          >
            <Card style={{ height: "100%" }}>
              <h5>{course.title}</h5>
              <p>{course.description?.slice(0, 100) + "…"}</p>
              <p>
                <small className="text-muted">
                  Score: {course.score.toFixed(2)} | Avg Rating:{" "}
                  {course.stats?.avgRating?.toFixed(1) || 0} | Enrolled:{" "}
                  {course.stats?.enrollmentCount || 0}
                </small>
              </p>
              <a
                href={`/courses/${course.courseId || course._id}`}
                className="btn btn-primary btn-sm"
              >
                View Course
              </a>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
