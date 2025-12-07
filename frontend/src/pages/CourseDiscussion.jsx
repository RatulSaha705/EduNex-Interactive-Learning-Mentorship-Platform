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

  // Ask-question form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Answers state
  const [answersByQuestion, setAnswersByQuestion] = useState({}); // { [questionId]: Answer[] }
  const [answersLoading, setAnswersLoading] = useState({}); // { [questionId]: boolean }
  const [answerText, setAnswerText] = useState({}); // { [questionId]: string }
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  const userId = auth?.user?.id;
  const userRole = auth?.user?.role;

  const isEnrolled =
    auth?.user &&
    course?.enrolledStudents?.some(
      (studentId) => studentId.toString() === auth.user.id
    );

  // ----------------- LOAD COURSE ----------------- //
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

  // ----------------- LOAD QUESTIONS ----------------- //
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
    } catch (err) {
      console.error("Error loading questions:", err.response || err);
      setError(
        err.response?.data?.message ||
          `Failed to load course questions (status ${
            err.response?.status || "?"
          })`
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (auth?.token) {
      loadQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, auth]);

  // ----------------- ASK QUESTION ----------------- //
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

  // ----------------- LOAD ANSWERS FOR A QUESTION ----------------- //
  const loadAnswers = async (questionId) => {
    try {
      setAnswersLoading((prev) => ({ ...prev, [questionId]: true }));
      const res = await axios.get(
        `http://localhost:5000/api/discussions/questions/${questionId}/answers`,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setAnswersByQuestion((prev) => ({
        ...prev,
        [questionId]: res.data,
      }));
    } catch (err) {
      console.error("Error loading answers:", err.response || err);
      setError(
        err.response?.data?.message ||
          "Failed to load answers for this question"
      );
    } finally {
      setAnswersLoading((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleToggleQuestion = (questionId) => {
    if (expandedQuestionId === questionId) {
      setExpandedQuestionId(null);
      return;
    }
    setExpandedQuestionId(questionId);

    // Load answers only first time we expand
    if (!answersByQuestion[questionId]) {
      loadAnswers(questionId);
    }
  };

  // ----------------- REPLY (ANSWER) ----------------- //
  const handleAnswerChange = (questionId, value) => {
    setAnswerText((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleAnswerSubmit = async (e, questionId) => {
    e.preventDefault();
    setError("");

    const text = (answerText[questionId] || "").trim();
    if (!text) {
      setError("Answer content cannot be empty");
      return;
    }

    try {
      const res = await axios.post(
        `http://localhost:5000/api/discussions/questions/${questionId}/answers`,
        { content: text },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      setAnswersByQuestion((prev) => ({
        ...prev,
        [questionId]: prev[questionId]
          ? [...prev[questionId], res.data]
          : [res.data],
      }));
      setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
    } catch (err) {
      console.error("Error posting answer:", err.response || err);
      setError(
        err.response?.data?.message ||
          "Failed to post answer, please try again"
      );
    }
  };

  // ----------------- UPVOTE ANSWER ----------------- //
  const handleUpvoteAnswer = async (questionId, answerId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/discussions/answers/${answerId}/upvote`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );
  
      const newUpvotes = res.data.upvotes;
  
      setAnswersByQuestion((prev) => ({
        ...prev,
        [questionId]: (prev[questionId] || []).map((ans) =>
          ans._id === answerId ? { ...ans, upvotes: newUpvotes } : ans
        ),
      }));
    } catch (err) {
      console.error("Error upvoting answer:", err.response || err);
      setError(
        err.response?.data?.message || "Failed to upvote answer, try again"
      );
    }
  };
  
  // ----------------- MARK HELPFUL ----------------- //
  const handleMarkHelpful = async (questionId, answerId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/discussions/answers/${answerId}/mark-helpful`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      // Reload answers so only one is marked helpful
      await loadAnswers(questionId);
    } catch (err) {
      console.error("Error marking answer helpful:", err.response || err);
      setError(
        err.response?.data?.message ||
          "Failed to mark answer as helpful, try again"
      );
    }
  };

  // ----------------- RENDER ----------------- //
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
        <Link
          to={`/student/courses/${id}`}
          className="btn btn-outline-secondary"
        >
          Back to Course
        </Link>
      </div>

      {loadingCourse && <p>Loading course...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

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
            </form>
          </div>
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
            {questions.map((q) => {
              const qId = q._id;
              const answers = answersByQuestion[qId] || [];
              const canMarkHelpful =
                  userId && q.user && q.user._id === userId;

            

              const helpfulAnswer = answers.find((a) => a.isMarkedHelpful);

              return (
                <div
                  key={qId}
                  className="list-group-item list-group-item-action mb-2"
                >
                  <div className="d-flex justify-content-between">
                    <h5 className="mb-1">
                      {q.title || "Question"}{" "}
                      {q.isResolved && (
                        <span className="badge bg-success ms-2">Resolved</span>
                      )}
                    </h5>
                    <small className="text-muted">
                      {new Date(q.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <p className="mb-1">{q.content}</p>
                  <small className="text-muted d-block mb-2">
                    Asked by: {q.user?.name || "Unknown"} (
                    {q.user?.role || "user"})
                  </small>

                  {/* Toggle answers */}
                  <button
                    className="btn btn-sm btn-link p-0 mb-2"
                    onClick={() => handleToggleQuestion(qId)}
                  >
                    {expandedQuestionId === qId
                      ? "Hide answers"
                      : "View answers / reply"}
                  </button>

                  {expandedQuestionId === qId && (
                    <div className="mt-2">
                      {/* Answers */}
                      {answersLoading[qId] ? (
                        <p>Loading answers...</p>
                      ) : answers.length === 0 ? (
                        <p className="text-muted">No answers yet.</p>
                      ) : (
                        <div className="mb-2">
                          {answers.map((a) => (
                            <div
                              key={a._id}
                              className={`card mb-2 ${
                                a.isMarkedHelpful ? "border-success" : ""
                              }`}
                            >
                              <div className="card-body py-2">
                                <div className="d-flex justify-content-between">
                                  <div>
                                    <strong>{a.user?.name || "User"}</strong>{" "}
                                    <small className="text-muted">
                                      ({a.user?.role || "user"}) •{" "}
                                      {new Date(
                                        a.createdAt
                                      ).toLocaleString()}
                                    </small>
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary me-2"
                                      onClick={() =>
                                        handleUpvoteAnswer(qId, a._id)
                                      }
                                    >
                                      Upvote ({a.upvotes || 0})
                                    </button>
                                    {canMarkHelpful && !a.isMarkedHelpful && (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() =>
                                          handleMarkHelpful(qId, a._id)
                                        }
                                      >
                                        Mark helpful
                                      </button>
                                    )}
                                    {a.isMarkedHelpful && (
                                      <span className="badge bg-success ms-1">
                                        Helpful
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="mb-1 mt-1">{a.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply form (students & instructors) */}
                      {(userRole === "student" || userRole === "instructor") && (
                        <form
                          onSubmit={(e) => handleAnswerSubmit(e, qId)}
                          className="mt-2"
                        >
                          <div className="mb-2">
                            <textarea
                              className="form-control"
                              rows="2"
                              value={answerText[qId] || ""}
                              onChange={(e) =>
                                handleAnswerChange(qId, e.target.value)
                              }
                              placeholder="Write your answer..."
                            ></textarea>
                          </div>
                          <button type="submit" className="btn btn-sm btn-primary">
                            Post Answer
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
