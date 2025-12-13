// frontend/src/components/InstructorPage.js
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";

export default function InstructorPage() {
  const { auth } = useContext(AuthContext);
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    status: "draft",
    startDate: "",
    endDate: "",
  });
  const [prerequisiteIds, setPrerequisiteIds] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [announcementInputs, setAnnouncementInputs] = useState({});
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [showAnnouncements, setShowAnnouncements] = useState({});

  // Read success message from navigation state (e.g., after editing course)
  useEffect(() => {
    if (location.state?.successMsg) {
      setMessage(location.state.successMsg);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      const userId = auth.user._id || auth.user.id;

      const myCourses =
        res.data.courses?.filter(
          (c) =>
            c.instructor &&
            (c.instructor._id === userId || c.instructor === userId)
        ) || [];

      setCourses(myCourses);
    } catch (err) {
      console.error(err);
      setError("Error fetching courses");
    }
  };

  useEffect(() => {
    if (auth.user) fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user]);

  // Toggle prerequisite selection tag
  const togglePrerequisite = (courseId) => {
    setPrerequisiteIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Course title is required");
      return;
    }

    try {
      const payload = {
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        prerequisites: prerequisiteIds,
      };

      const res = await axios.post(
        "http://localhost:5000/api/courses",
        payload,
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(res.data.message || "Course created successfully");
      setTimeout(() => setMessage(""), 4000);

      setForm({
        title: "",
        description: "",
        category: "",
        status: "draft",
        startDate: "",
        endDate: "",
      });
      setPrerequisiteIds([]);
      fetchCourses();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error creating course");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      setMessage("Course deleted successfully");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to delete course");
    }
  };

  const handleToggleStatus = async (course) => {
    try {
      const newStatus = course.status === "published" ? "draft" : "published";
      const res = await axios.put(
        `http://localhost:5000/api/courses/${course._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      setCourses((prev) =>
        prev.map((c) => (c._id === course._id ? res.data.course : c))
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleAddAnnouncement = async (courseId) => {
    const content = announcementInputs[courseId]?.trim();
    if (!content) return;

    try {
      const res = await axios.post(
        `http://localhost:5000/api/courses/${courseId}/announcements`,
        { content },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      setCourses((prev) =>
        prev.map((c) =>
          c._id === courseId
            ? { ...c, announcements: res.data.announcements }
            : c
        )
      );

      setAnnouncementInputs((prev) => ({ ...prev, [courseId]: "" }));
    } catch (err) {
      console.error(
        err.response?.data?.message || "Failed to add announcement"
      );
    }
  };

  const isNew = (date) => {
    if (!date) return false;
    const created = new Date(date);
    const now = new Date();
    return (now - created) / (1000 * 60 * 60 * 24) <= 3;
  };

  const prerequisiteOptions = courses.filter((c) => c.status === "published");

  const totalPublished = courses.filter((c) => c.status === "published").length;
  const totalDraft = courses.filter((c) => c.status === "draft").length;
  const totalLearners =
    courses.reduce(
      (sum, c) => sum + (c.enrolledStudents ? c.enrolledStudents.length : 0),
      0
    ) || 0;

  const instructorName = auth?.user?.name?.split(" ")[0] || "Instructor";

  return (
    <div className="max-w-6xl mx-auto mt-6 px-4 space-y-6">
      {/* HERO HEADER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-violet-600 to-fuchsia-600 text-white shadow-xl">
        <div className="absolute -right-20 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-indigo-100/90">
              Instructor Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
              Welcome back, <span className="font-bold">{instructorName}</span>{" "}
              👨‍🏫
            </h1>
            <p className="text-sm sm:text-[15px] text-indigo-50/90">
              Design engaging learning experiences, manage your courses, and
              keep your learners informed — all within EduNex.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center rounded-full border border-indigo-100/50 bg-indigo-900/20 px-3 py-1 text-[11px] font-medium">
                📘 {totalPublished} published course
                {totalPublished === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center rounded-full border border-indigo-100/40 bg-indigo-900/10 px-3 py-1 text-[11px] font-medium">
                ✏️ {totalDraft} in draft
              </span>
              <span className="inline-flex items-center rounded-full border border-indigo-100/40 bg-indigo-900/10 px-3 py-1 text-[11px] font-medium">
                🎓 {totalLearners} active learner
                {totalLearners === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {/* Snapshot card */}
          <div className="w-full sm:w-auto sm:min-w-[230px]">
            <div className="rounded-2xl bg-slate-950/15 backdrop-blur-sm border border-white/15 px-4 py-3 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-indigo-50/90 font-medium">
                  Teaching snapshot
                </span>
                <span className="text-[10px] text-indigo-100/80">
                  Live overview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <p className="text-[11px] text-indigo-100/80">Courses</p>
                  <p className="text-lg font-semibold">{courses.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-indigo-100/80">Learners</p>
                  <p className="text-lg font-semibold">{totalLearners}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-indigo-100/80">Status</p>
                  <p className="text-lg font-semibold">
                    {totalPublished > 0 ? "Active" : "Drafting"}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-indigo-100/85">
                Keep momentum by updating content, posting announcements, and
                tracking enrollments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="rounded-2xl bg-white/80 shadow-sm border border-slate-200/70 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Quick actions
            </h2>
            <p className="text-[11px] text-slate-500">
              Jump into your most common instructor workflows.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <QuickAction
            to="#create-course"
            icon="➕"
            label="Create a course"
            description="Start a new learning pathway"
            isAnchor
          />
          <QuickAction
            to="/instructor/consultations/schedule"
            icon="📅"
            label="Consultation schedule"
            description="Set your available slots"
          />
          <QuickAction
            to="/instructor/consultations/today"
            icon="⏰"
            label="Upcoming sessions"
            description="See who you’re mentoring today"
          />
          <QuickAction
            to="/courses"
            icon="👀"
            label="View as learner"
            description="Preview the catalog as students see it"
          />
        </div>
      </section>

      {/* Global alerts */}
      {(message || error) && (
        <div className="space-y-2">
          {message && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Create Course */}
      <section
        id="create-course"
        className="bg-white rounded-xl shadow-md p-6 space-y-4"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Create a new course
            </h3>
            <p className="text-xs text-slate-500">
              Define the essentials. You can add lessons, resources, and more
              details later.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Course title
            </label>
            <input
              type="text"
              placeholder="e.g. Modern Web Development with React"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <input
              type="text"
              placeholder="e.g. Web Development, Data Science"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Publish immediately</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Give learners a brief overview of what they'll learn..."
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              Start date
            </label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">
              End date
            </label>
            <input
              type="date"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300 focus:outline-none"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          {/* Prerequisites */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Prerequisite courses
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Students must complete these courses before enrolling here. You
              can adjust prerequisites from Edit Course later.
            </p>

            <div className="border rounded-lg bg-slate-50 px-3 py-2 max-h-40 overflow-y-auto">
              {prerequisiteOptions.length === 0 ? (
                <p className="text-xs text-slate-400">
                  You don&apos;t have any other published courses yet. Publish a
                  course first to use it as a prerequisite.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {prerequisiteOptions.map((c) => {
                    const selected = prerequisiteIds.includes(c._id);
                    return (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => togglePrerequisite(c._id)}
                        className={`text-xs px-3 py-1 rounded-full border transition ${
                          selected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {c.title}
                        {c.category && (
                          <span className="ml-1 text-[10px] text-slate-400">
                            • {c.category}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {prerequisiteIds.length > 0 && (
              <p className="mt-1 text-xs text-indigo-600">
                Selected:{" "}
                {prerequisiteOptions
                  .filter((c) => prerequisiteIds.includes(c._id))
                  .map((c) => c.title)
                  .join(", ")}
              </p>
            )}
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition"
            >
              Create course
            </button>
          </div>
        </form>
      </section>

      {/* My Courses */}
      <section>
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          My courses
        </h3>
        {courses.length === 0 && (
          <p className="text-sm text-slate-500">
            You haven&apos;t created any courses yet.
          </p>
        )}

        <ul className="space-y-4">
          {courses.map((course) => {
            const enrolledCount = course.enrolledStudents
              ? course.enrolledStudents.length
              : 0;
            const isExpanded = expandedCourseId === course._id;

            return (
              <li
                key={course._id}
                className="border rounded-xl bg-white px-4 py-3 shadow-sm hover:shadow-md transition"
              >
                {/* Header row */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-2 text-left"
                  onClick={() =>
                    setExpandedCourseId(isExpanded ? null : course._id)
                  }
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-slate-900">
                        {course.title}
                      </span>
                      {course.category && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {course.category}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          course.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {course.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 flex flex-wrap gap-3">
                      {course.startDate && course.endDate && (
                        <span>
                          Duration:{" "}
                          {new Date(course.startDate).toLocaleDateString()} –{" "}
                          {new Date(course.endDate).toLocaleDateString()}
                        </span>
                      )}
                      <span>Lessons: {course.lessons?.length || 0}</span>
                      <span>Enrolled: {enrolledCount}</span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-sm">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="mt-3 space-y-3">
                    {course.description && (
                      <p className="text-sm text-slate-700">
                        {course.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Link
                        to={`/instructor/course/${course._id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 text-xs rounded-lg bg-amber-500 text-white hover:bg-amber-600"
                      >
                        Edit course
                      </Link>
                      <Link
                        to={`/instructor/courses/${course._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Manage lessons
                      </Link>
                      <Link
                        to={`/instructor/courses/${course._id}/discussion`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 text-xs rounded-lg bg-purple-500 text-white hover:bg-purple-600"
                      >
                        Discussion board
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(course);
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-slate-500 text-white hover:bg-slate-600"
                      >
                        {course.status === "published"
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course._id);
                        }}
                        className="px-3 py-1 text-xs rounded-lg bg-red-500 text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Announcements */}
                    <div className="mt-4 border-t pt-3">
                      <h6 className="text-sm font-semibold text-slate-800 mb-2">
                        Course announcements
                      </h6>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Write a new announcement..."
                          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                          value={announcementInputs[course._id] || ""}
                          onChange={(e) =>
                            setAnnouncementInputs((prev) => ({
                              ...prev,
                              [course._id]: e.target.value,
                            }))
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddAnnouncement(course._id);
                          }}
                          className="px-4 py-2 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Post
                        </button>
                      </div>

                      {course.announcements?.length > 0 ? (
                        <>
                          <button
                            className="text-xs text-indigo-600 hover:underline mb-2"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowAnnouncements((prev) => ({
                                ...prev,
                                [course._id]: !prev[course._id],
                              }));
                            }}
                          >
                            {showAnnouncements[course._id]
                              ? "Hide announcements"
                              : "View announcements"}
                          </button>

                          {showAnnouncements[course._id] && (
                            <ul className="space-y-2">
                              {course.announcements.map((a) => (
                                <li
                                  key={a._id}
                                  className="bg-slate-50 border rounded-lg px-3 py-2 flex justify-between items-center"
                                >
                                  <span className="text-xs sm:text-sm text-slate-800">
                                    {a.content}
                                  </span>
                                  {isNew(a.createdAt) && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                      NEW
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-slate-400">
                          No announcements yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* --------- QuickAction component (supports hash anchors) --------- */
function QuickAction({ to, icon, label, description, isAnchor = false }) {
  const handleClick = (e) => {
    if (isAnchor && to.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(to);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const Wrapper = isAnchor ? "a" : Link;
  const props = isAnchor ? { href: to } : { to };

  return (
    <Wrapper
      {...props}
      onClick={handleClick}
      className="group rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3 text-left text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-transform"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900/5 text-base">
          {icon}
        </span>
        <span className="font-semibold text-slate-900 group-hover:text-indigo-700">
          {label}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-snug">{description}</p>
    </Wrapper>
  );
}
