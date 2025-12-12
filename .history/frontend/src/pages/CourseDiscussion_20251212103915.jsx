import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ReportButton from "../components/ReportButton"; // 🔹 NEW

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
      <div className="max-w-7xl mx-auto mt-4 px-4">
        You must be logged in to view the discussion.
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto mt-4 px-4 space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-bold">
          Course Discussion{" "}
          {course && (
            <span className="text-gray-500 text-sm">– {course.title}</span>
          )}
        </h2>
        <Link
          to={`/student/courses/${id}`}
          className="px-3 py-1 border border-gray-400 text-gray-700 rounded hover:bg-gray-100"
        >
          Back to Course
        </Link>
      </div>

      {loadingCourse && <p>Loading course...</p>}
      {error && <div className="text-red-600">{error}</div>}
      {successMsg && <div className="text-green-600">{successMsg}</div>}

      {/* Ask Question */}
      {auth.user.role === "student" && isEnrolled && (
        <div className="bg-white shadow rounded p-4 mb-4">
          <h5 className="text-lg font-semibold mb-3">Ask a Question</h5>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block mb-1 font-medium">Title</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Question *</label>
              <textarea
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows="3"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your question..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={posting}
            >
              {posting ? "Posting..." : "Post Question"}
            </button>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Questions</h4>
        {loadingQuestions ? (
          <p>Loading questions...</p>
        ) : questions.length === 0 ? (
          <p>No questions yet. Be the first to ask!</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => {
              const qId = q._id;
              const answers = answersByQuestion[qId] || [];
              const helpfulAnswer = answers.find((a) => a.isMarkedHelpful);

              return (
                <div
                  key={qId}
                  className="bg-white shadow rounded p-3 space-y-2"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">
                          {q.title || "Question"}{" "}
                          {q.isResolved && (
                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded ml-1">
                              Resolved
                            </span>
                          )}
                        </h5>
                      </div>
                      <p className="mt-1">{q.content}</p>
                      <small className="text-gray-400 block mt-1">
                        Asked by: {q.user?.name || "Unknown"} (
                        {q.user?.role || "user"}) •{" "}
                        {new Date(q.createdAt).toLocaleString()}
                      </small>
                    </div>

                    {/* 🔹 actions for this question (report + delete) */}
                    <div className="flex flex-col items-end gap-1 text-sm">
                      <ReportButton
                        targetType="question"
                        targetId={qId}
                        small
                        label="Report"
                      />
                      {canDeleteQuestion(q) && (
                        <button
                          className="text-red-600 text-xs"
                          onClick={() => handleDeleteQuestion(qId)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <button
                      className="text-blue-600 text-sm"
                      onClick={() => handleToggleQuestion(qId)}
                    >
                      {expandedQuestionId === qId
                        ? "Hide answers"
                        : "View answers / reply"}
                    </button>
                    {helpfulAnswer && (
                      <span className="text-xs text-green-600">
                        ✅ Helpful answer selected
                      </span>
                    )}
                  </div>

                  {expandedQuestionId === qId && (
                    <div className="mt-2 space-y-2">
                      {answersLoading[qId] ? (
                        <p>Loading answers...</p>
                      ) : answers.length === 0 ? (
                        <p className="text-gray-500">No answers yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {answers.map((a) => (
                            <div
                              key={a._id}
                              className={`p-2 border rounded ${
                                a.isMarkedHelpful
                                  ? "border-green-500"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <strong>{a.user?.name || "User"}</strong>{" "}
                                  <small className="text-gray-400">
                                    ({a.user?.role || "user"}) •{" "}
                                    {new Date(a.createdAt).toLocaleString()}
                                  </small>
                                  <p className="mt-1">{a.content}</p>
                                </div>

                                <div className="flex flex-col items-end gap-1 text-xs">
                                  <button
                                    className="text-blue-600"
                                    onClick={() =>
                                      handleUpvoteAnswer(qId, a._id)
                                    }
                                  >
                                    Upvote ({a.upvotes || 0})
                                  </button>

                                  {userId === q.user?._id &&
                                    !a.isMarkedHelpful && (
                                      <button
                                        className="text-green-600"
                                        onClick={() =>
                                          handleMarkHelpful(qId, a._id)
                                        }
                                      >
                                        Mark helpful
                                      </button>
                                    )}

                                  {a.isMarkedHelpful && (
                                    <span className="bg-green-500 text-white px-2 py-0.5 rounded">
                                      Helpful
                                    </span>
                                  )}

                                  {canDeleteAnswer(a) && (
                                    <button
                                      className="text-red-600"
                                      onClick={() =>
                                        handleDeleteAnswer(qId, a._id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  )}

                                  {/* 🔹 report answer */}
                                  <ReportButton
                                    targetType="answer"
                                    targetId={a._id}
                                    small
                                    label="Report"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(userRole === "student" ||
                        userRole === "instructor") && (
                        <form
                          onSubmit={(e) => handleAnswerSubmit(e, qId)}
                          className="mt-2 space-y-2"
                        >
                          <textarea
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            rows="2"
                            value={answerText[qId] || ""}
                            onChange={(e) =>
                              handleAnswerChange(qId, e.target.value)
                            }
                            placeholder="Write your answer..."
                          ></textarea>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
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
