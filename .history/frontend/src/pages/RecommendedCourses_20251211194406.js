import axios from "axios";
import { useContext, useEffect, useState } from "react";
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
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/recommendations?limit=10`,
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        setRecommended(response.data || []);
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
          <div className="col-md-4 mb-3" key={course.courseId || course._id}>
            <Card style={{ height: "100%" }}>
              <h5>{course.title}</h5>
              <p>{course.description?.slice(0, 100) + "…"}</p>
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
