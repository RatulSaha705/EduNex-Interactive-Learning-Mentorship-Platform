import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function CourseDiscussion() {
  const { auth } = useContext(AuthContext);
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [answersLoading, setAnswersLoading] = useState({});
  const [answerText, setAnswerText] = useState({});
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  const userId = auth?.user?.id;
  const userRole = auth?.user?.role;

  const isEnrolled =
    auth?.user &&
    course?.enrolledStudents?.some((sid) => sid.toString() === userId);

  const isCourseInstructor =
    auth?.user && course?.instructor?._id?.toString() === userId;

  const canDeleteQuestion = (q) => {
    const qUserId = q.user?._id || q.user;
    return qUserId?.toString() === userId || isCourseInstructor;
  };

  const canDeleteAnswer = (a) => {
    const aUserId = a.user?._id || a.user;
    return aUserId?.toString() === userId || isCourseInstructor;
  };

  const handleAnswerChange = (qId, value) => {
    setAnswerText((prev) => ({ ...prev, [qId]: value }));
  };

  const handleAnswerSubmit = async (e, qId) => {
    e.preventDefault();
    setError("");
    const text = (answerText[qId] || "").trim();
    if (!text) return setError("Answer content cannot be empty");

    try {
      const res = await axios.post(
        `http://localhost:5000/api/discussions/questions/${qId}/answers`,
        { content: text },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      setAnswersByQuestion((prev) => ({
        ...prev,
        [qId]: prev[qId] ? [...prev[qId], res.data] : [res.data],
      }));
      setAnswerText((prev) => ({ ...prev, [qId]: "" }));
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Failed to post answer, try again"
      );
    }
  };

  // Fetch course
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setCourse(res.data.course);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load course details"
        );
      } finally {
        setLoadingCourse(false);
      }
    };
    if (auth?.token) fetchCourse();
  }, [id, auth]);

  // Fetch questions
  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const res = await axios.get(
        `http://localhost:5000/api/discussions/courses/${id}/questions`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setQuestions(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to load questions (status ${err.response?.status || "?"})`
      );
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (auth?.token) loadQuestions();
  }, [id, auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!content.trim()) return setError("Question content cannot be empty");

    try {
      setPosting(true);
      const res = await axios.post(
        `http://localhost:5000/api/discussions/courses/${id}/questions`,
        { title, content },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setQuestions((prev) => [res.data, ...prev]);
      setTitle("");
      setContent("");
      setSuccessMsg("Question posted successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post question");
    } finally {
      setPosting(false);
    }
  };

  const loadAnswers = async (qId) => {
    try {
      setAnswersLoading((prev) => ({ ...prev, [qId]: true }));
      const res = await axios.get(
        `http://localhost:5000/api/discussions/questions/${qId}/answers`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setAnswersByQuestion((prev) => ({ ...prev, [qId]: res.data }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load answers");
    } finally {
      setAnswersLoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  const handleToggleQuestion = (qId) => {
    if (expandedQuestionId === qId) return setExpandedQuestionId(null);
    setExpandedQuestionId(qId);
    if (!answersByQuestion[qId]) loadAnswers(qId);
  };

  const handleUpvoteAnswer = async (qId, aId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/discussions/answers/${aId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      await loadAnswers(qId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upvote answer");
    }
  };

  const handleMarkHelpful = async (qId, aId) => {
    try {
      await axios.post(
        `http://localhost:5000/api/discussions/answers/${aId}/mark-helpful`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      await loadAnswers(qId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to mark helpful");
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    try {
      await axios.delete(
        `http://localhost:5000/api/discussions/questions/${qId}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      setQuestions((prev) => prev.filter((q) => q._id !== qId));
      setAnswersByQuestion((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
      if (expandedQuestionId === qId) setExpandedQuestionId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete question");
    }
  };

  const handleDeleteAnswer = async (qId, aId) => {
    if (!window.confirm("Are you sure you want to delete this answer?")) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/discussions/answers/${aId}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      setAnswersByQuestion((prev) => ({
        ...prev,
        [qId]: (prev[qId] || []).filter((a) => a._id !== aId),
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete answer");
    }
  };

  if (!auth.user)
    return (
      <div className="container mt-4">
        You must be logged in to view the discussion.
      </div>
    );

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

      {/* Ask Question */}
      {auth.user.role === "student" && isEnrolled && (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Ask a Question</h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Question *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Describe your question..."
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

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <button
                      className="btn btn-sm btn-link p-0"
                      onClick={() => handleToggleQuestion(qId)}
                    >
                      {expandedQuestionId === qId
                        ? "Hide answers"
                        : "View answers / reply"}
                    </button>
                    {canDeleteQuestion(q) && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteQuestion(qId)}
                      >
                        Delete Question
                      </button>
                    )}
                  </div>

                  {expandedQuestionId === qId && (
                    <div className="mt-2">
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
                                      {new Date(a.createdAt).toLocaleString()}
                                    </small>
                                  </div>
                                  <div>
                                    <button
                                      className="btn btn-sm btn-outline-primary me-2"
                                      onClick={() =>
                                        handleUpvoteAnswer(qId, a._id)
                                      }
                                    >
                                      Upvote ({a.upvotes || 0})
                                    </button>
                                    {userId === q.user?._id &&
                                      !a.isMarkedHelpful && (
                                        <button
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
                                    {canDeleteAnswer(a) && (
                                      <button
                                        className="btn btn-sm btn-outline-danger ms-2"
                                        onClick={() =>
                                          handleDeleteAnswer(qId, a._id)
                                        }
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <p className="mb-1 mt-1">{a.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {(userRole === "student" ||
                        userRole === "instructor") && (
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
                          <button
                            type="submit"
                            className="btn btn-sm btn-primary"
                          >
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
