// frontend/src/pages/CourseDiscussion.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ReportButton from "../components/ReportButton";

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
    if (!auth?.token) {
      setLoadingCourse(false);
      return;
    }

    const fetchCourse = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setCourse(res.data.course || res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load course details"
        );
      } finally {
        setLoadingCourse(false);
      }
    };

    fetchCourse();
  }, [id, auth?.token]);

  // Fetch questions
  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const res = await axios.get(
        `http://localhost:5000/api/discussions/courses/${id}/questions`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setQuestions(res.data || []);
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
  }, [id, auth?.token]);

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
      setTimeout(() => setSuccessMsg(""), 3000);
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
      setAnswersByQuestion((prev) => ({ ...prev, [qId]: res.data || [] }));
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

  if (!auth?.user) {
    return (
      <div className="max-w-5xl mx-auto px-4 mt-10">
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center space-y-3">
          <p className="text-red-600 font-semibold">
            You must be logged in to view the course discussion.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 mt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Course Discussion
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Ask questions, share insights, and collaborate with your instructor
            and peers.
          </p>
          {course && (
            <p className="text-xs text-gray-500 mt-1">
              For course:{" "}
              <span className="font-medium text-indigo-700">
                {course.title}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/student/courses/${id}`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            ← Back to Course
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {(error || successMsg) && (
        <div className="space-y-2">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* Course load state */}
      {loadingCourse && (
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading course details…
        </div>
      )}

      {/* Info for non-enrolled students */}
      {course && userRole === "student" && !isEnrolled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          To ask questions in this discussion board, you need to be enrolled in
          this course.
          <div className="mt-2">
            <Link
              to={`/student/courses/${id}`}
              className="inline-flex items-center px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700"
            >
              View Course &amp; Enroll
            </Link>
          </div>
        </div>
      )}

      {/* Ask Question */}
      {course && auth.user.role === "student" && isEnrolled && (
        <div className="bg-white shadow-md rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Ask a Question
            </h3>
            <span className="text-xs text-gray-400">
              Visible to instructor &amp; enrolled students
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Title (optional)
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary of your question"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Question <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows="3"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe your question in detail…"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
                disabled={posting}
              >
                {posting ? "Posting…" : "Post Question"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-800">Questions</h4>
          <span className="text-xs text-gray-500">
            {questions.length} discussion thread
            {questions.length === 1 ? "" : "s"}
          </span>
        </div>

        {loadingQuestions ? (
          <div className="text-sm text-gray-500">
            Loading questions, please wait…
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-gray-600">
            No questions yet. Be the first to start the discussion!
          </p>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => {
              const qId = q._id;
              const answers = answersByQuestion[qId] || [];
              const helpfulAnswer = answers.find((a) => a.isMarkedHelpful);

              return (
                <div
                  key={qId}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-semibold text-gray-900">
                          {q.title || "Question"}
                        </h5>
                        {q.isResolved && (
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-800">{q.content}</p>
                      <div className="mt-1 text-[11px] text-gray-500">
                        Asked by{" "}
                        <span className="font-medium">
                          {q.user?.name || "Unknown"}
                        </span>{" "}
                        ({q.user?.role || "user"}) •{" "}
                        {new Date(q.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Question actions */}
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <ReportButton
                        targetType="question"
                        targetId={qId}
                        small
                        label="Report"
                      />
                      {canDeleteQuestion(q) && (
                        <button
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteQuestion(qId)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-1 text-xs">
                    <button
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                      onClick={() => handleToggleQuestion(qId)}
                    >
                      {expandedQuestionId === qId
                        ? "Hide answers"
                        : "View answers / reply"}
                    </button>
                    {helpfulAnswer && (
                      <span className="text-[11px] text-green-600 flex items-center gap-1">
                        ✅ Helpful answer selected
                      </span>
                    )}
                  </div>

                  {/* Answers & reply box */}
                  {expandedQuestionId === qId && (
                    <div className="mt-3 space-y-3">
                      {answersLoading[qId] ? (
                        <p className="text-xs text-gray-500">
                          Loading answers…
                        </p>
                      ) : answers.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          No answers yet. Be the first to reply.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {answers.map((a) => (
                            <div
                              key={a._id}
                              className={`p-2 border rounded-lg bg-white text-sm ${
                                a.isMarkedHelpful
                                  ? "border-green-500"
                                  : "border-gray-200"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">
                                    <span className="font-semibold text-gray-800">
                                      {a.user?.name || "User"}
                                    </span>{" "}
                                    ({a.user?.role || "user"}) •{" "}
                                    {new Date(a.createdAt).toLocaleString()}
                                  </div>
                                  <p className="text-gray-800">{a.content}</p>
                                </div>

                                <div className="flex flex-col items-end gap-1 text-[11px]">
                                  <button
                                    className="text-indigo-600 hover:text-indigo-700"
                                    onClick={() =>
                                      handleUpvoteAnswer(qId, a._id)
                                    }
                                  >
                                    Upvote ({a.upvotes || 0})
                                  </button>

                                  {userId === q.user?._id &&
                                    !a.isMarkedHelpful && (
                                      <button
                                        className="text-green-600 hover:text-green-700"
                                        onClick={() =>
                                          handleMarkHelpful(qId, a._id)
                                        }
                                      >
                                        Mark helpful
                                      </button>
                                    )}

                                  {a.isMarkedHelpful && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                                      Helpful
                                    </span>
                                  )}

                                  {canDeleteAnswer(a) && (
                                    <button
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() =>
                                        handleDeleteAnswer(qId, a._id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  )}

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
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="2"
                            value={answerText[qId] || ""}
                            onChange={(e) =>
                              handleAnswerChange(qId, e.target.value)
                            }
                            placeholder="Write your answer…"
                          ></textarea>
                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                            >
                              Post Answer
                            </button>
                          </div>
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
