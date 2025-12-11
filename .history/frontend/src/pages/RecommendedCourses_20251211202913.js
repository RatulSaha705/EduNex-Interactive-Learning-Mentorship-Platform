// src/pages/RecommendedCourses.js

import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";

export default function RecommendedCourses() {
  const { auth } = useContext(AuthContext);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecommendations() {
      if (!auth?.token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Use your frontend env variable for backend URL
        const baseURL = process.env.REACT_APP_API_URL || "";
        const response = await axios.get(
          `${baseURL}/api/recommendations?limit=10`,
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );

        setRecommended(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to fetch recommended courses:", err);
        setError("Could not load course recommendations.");
      } finally {
        setLoading(false);
      }
    }

    loadRecommendations();
  }, [auth?.token]);

  if (loading)
    return <div className="container mt-4">Loading recommendations…</div>;
  if (error) return <div className="container mt-4 text-danger">{error}</div>;
  if (!recommended.length)
    return (
      <div className="container mt-4">No course recommendations available.</div>
    );

  return (
    <div className="container mt-4">
      <h3>Recommended For You</h3>
      <div className="row">
        {recommended.map((course) => (
          <div className="col-md-4 mb-3" key={course.courseId}>
            <Card style={{ height: "100%" }}>
              <h5>{course.title}</h5>
              <p>{course.description?.slice(0, 100) + "…"}</p>
              <p>
                <strong>Category:</strong> {course.category || "N/A"}
              </p>
              <p>
                <strong>Rating:</strong>{" "}
                {course.stats.avgRating?.toFixed(1) || 0} (
                {course.stats.ratingCount} ratings)
              </p>
              <a
                href={`/courses/${course.courseId}`}
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
