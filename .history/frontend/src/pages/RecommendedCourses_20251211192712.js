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
      try {
        setLoading(true);

        const res = await axios.get(
          "http://localhost:5000/api/recommendations",
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );

        // Backend returns an array, so just set it directly
        setRecommended(Array.isArray(res.data) ? res.data : []);
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
        {recommended.map((item) => (
          <div className="col-md-4 mb-3" key={item.courseId}>
            <Card style={{ height: "100%" }}>
              <h5>{item.title}</h5>
              <p>{item.description?.slice(0, 100) + "…"}</p>

              <a
                href={`/courses/${item.courseId}`}
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
