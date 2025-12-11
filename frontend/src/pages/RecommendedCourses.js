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
        // Assuming backend supports a query param like ?recommended=true
        const data = await courseController.fetchCourses({ recommended: true });
        setRecommended(Array.isArray(data) ? data : data.courses || []);
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
    return <div className="container mt-4">No course recommendations available.</div>;
  }

  return (
    <div className="container mt-4">
      <h3>Recommended For You</h3>
      <div className="row">
        {recommended.map((course) => (
          <div className="col-md-4 mb-3" key={course.id || course._id}>
            <Card style={{ height: "100%" }}>
              <h5>{course.title}</h5>
              <p>{course.description?.slice(0, 100) + "…"}</p>
              {/* Optionally, add link to course detail page */}
              <a href={`/courses/${course.id || course._id}`} className="btn btn-primary btn-sm">
                View Course
              </a>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
