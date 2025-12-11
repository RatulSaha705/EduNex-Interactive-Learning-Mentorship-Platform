// src/pages/RecommendedCourses.js
import React, { useEffect, useState, useContext } from "react";
import { courseController } from "../controllers/courseController"; // optional, or axios directly
import { AuthContext } from "../context/AuthContext";
import Card from "../components/Card";
import axios from "axios";

export default function RecommendedCourses() {
  const { auth } = useContext(AuthContext);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecommendations() {
      try {
        setLoading(true);
        const token = auth?.token;

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/recommendations?limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setRecommended(Array.isArray(res.data) ? res.data : []);
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
    return <div className="container mt-4">No recommendations available.</div>;

  return (
    <div className="container mt-4">
      <h3>Recommended For You</h3>
      <div className="row">
        {recommended.map((course) => (
          <div className="col-md-4 mb-3" key={course._id}>
            <Card style={{ height: "100%" }}>
              <h5>{course.title}</h5>
              <p>{course.description?.slice(0, 100) + "…"}</p>
              <p>Category: {course.category}</p>
              <a
                href={`/courses/${course._id}`}
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
