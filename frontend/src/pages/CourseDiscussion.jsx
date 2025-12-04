// frontend/src/pages/CourseDiscussion.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function CourseDiscussion() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams(); // course id

  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const isEnrolled =
  auth?.user &&
  course?.enrolledStudents?.some(
    (studentId) => studentId.toString() === auth.user.id
  );


  // Fetch course details (to show title)
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/courses/${id}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setCourse(res.data.course);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load course details"
        );
      } finally {
        setLoadingCourse(false);
      }
    };

    if (auth?.token) {
      fetchCourse();
    }
  }, [id, auth]);

  // Fetch questions for this course
  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const res = await axios.get(
        `http://localhost:5000/api/discussions/courses/${id}/questions`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
      setQuestions(res.data);
    }   
     catch (err) {
        console.error(
          "Error loading questions:",
          err.response?.status,
          err.response?.data
        );
        setError(
          err.response?.data?.message ||
            `Failed to load course questions (status ${err.response?.status || "?"})`
        );
      }
    finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!content.trim()) {
      setError("Question content cannot be empty");
      return;
    }

    try {
      setPosting(true);
      const res = await axios.post(
        `http://localhost:5000/api/discussions/courses/${id}/questions`,
        { title, content },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      // Prepend new question to the list
      setQuestions((prev) => [res.data, ...prev]);
      setTitle("");
      setContent("");
      setSuccessMsg("Question posted successfully!");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to post question, please try again"
      );
    } finally {
      setPosting(false);
    }
  };

  if (!auth.user) {
    return (
      <div className="container mt-4">
        <p>You must be logged in to view the discussion.</p>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>
          Course Discussion{" "}
          {course && (
            <span className="text-muted" style={{ fontSize: "0.8em" }}>
              – {course.title}
            </span>
          )}
        </h2>
        <Link to={`/student/courses/${id}`} className="btn btn-outline-secondary">
          Back to Course
        </Link>
      </div>

      {loadingCourse && <p>Loading course...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Ask Question Form (students only AND enrolled) */}
        {auth.user.role === "student" && isEnrolled && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Ask a Question</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Title (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary of your question"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Question *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your question in detail..."
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={posting}
              >
                {posting ? "Posting..." : "Post Question"}
              </button>
              {successMsg && (
                <p className="text-success mt-2 mb-0">{successMsg}</p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Info message for students who are NOT enrolled */}
      {auth.user.role === "student" && !isEnrolled && (
        <div className="alert alert-info mb-4">
          You must enroll in this course to ask questions in the discussion.
        </div>
      )}


      {/* Questions List */}
      <div>
        <h4>Questions</h4>
        {loadingQuestions ? (
          <p>Loading questions...</p>
        ) : questions.length === 0 ? (
          <p>No questions yet. Be the first to ask!</p>
        ) : (
          <div className="list-group">
            {questions.map((q) => (
              <div
                key={q._id}
                className="list-group-item list-group-item-action mb-2"
              >
                <div className="d-flex justify-content-between">
                  <h5 className="mb-1">{q.title || "Question"}</h5>
                  <small className="text-muted">
                    {new Date(q.createdAt).toLocaleString()}
                  </small>
                </div>
                <p className="mb-1">{q.content}</p>
                <small className="text-muted">
                  Asked by: {q.user?.name || "Unknown"} ({q.user?.role || "user"})
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
