// frontend/src/components/StudentPage.js
import React, { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function StudentPage() {
  const { auth } = useContext(AuthContext);

  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [basedOnCategories, setBasedOnCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auth?.token || auth?.user?.role !== "student") return;

    const fetchCourses = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/courses", {
          headers: { Authorization: `Bearer ${auth.token}` },
        });

        const publishedCourses = res.data.courses.filter(
          (course) => course.status === "published"
        );
        setCourses(publishedCourses);

        // handle both enrolledStudents and students arrays
        const enrolled = publishedCourses.filter((course) => {
          const arr = course.enrolledStudents || course.students || [];
          const userId = auth.user._id || auth.user.id;
          return arr.some((id) => id.toString() === userId);
        });

        setEnrolledCourses(enrolled);
      } catch (err) {
        console.error(err);
        setError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecommendations = async () => {
      try {
        setRecLoading(true);
        const res = await axios.get(
          "http://localhost:5000/api/recommendations/my",
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
        setRecommendedCourses(res.data.recommendations || []);
        setBasedOnCategories(res.data.basedOnCategories || []);
      } catch (err) {
        console.error("Failed to load recommendations:", err);
        // don't crash the page if recs fail
      } finally {
        setRecLoading(false);
      }
    };

    fetchCourses();
    fetchRecommendations();
  }, [auth?.token, auth?.user?.role, auth?.user?._id]);

  const isNew = (date) => {
    if (!date) return false;
    const created = new Date(date);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  const isCourseNew = (date) => {
    if (!date) return false;
    const created = new Date(date);
    const now = new Date();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <p className="text-center text-slate-500 text-sm">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 mt-10">
        <p className="text-center text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  const totalPublished = courses.length;
  const totalEnrolled = enrolledCourses.length;
  const totalRecommendations = recommendedCourses.length;

  const learnerName = auth?.user?.name?.split(" ")[0] || "Learner";

  const anyAnnouncements = courses.some(
    (c) => c.announcements && c.announcements.length > 0
  );

  return (
    <div className="max-w-6xl mx-auto px-4 mt-6 space-y-8">
      {/* HERO / HEADER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 text-white shadow-xl">
        <div className="absolute -right-20 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-sky-300/10 blur-3xl" />
        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-100/90">
              Student Dashboard
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-snug">
              Welcome back, <span className="font-bold">{learnerName}</span> 👋
            </h1>
            <p className="text-sm sm:text-[15px] text-sky-100/90">
              Track your learning, explore new courses, and stay in sync with
              announcements &amp; consultations — all in one place.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center rounded-full border border-sky-200/50 bg-sky-900/20 px-3 py-1 text-[11px] font-medium">
                📚 {totalEnrolled} enrolled course
                {totalEnrolled === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center rounded-full border border-sky-200/40 bg-sky-900/10 px-3 py-1 text-[11px] font-medium">
                🎯 {totalRecommendations} smart recommendation
                {totalRecommendations === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center rounded-full border border-sky-200/40 bg-sky-900/10 px-3 py-1 text-[11px] font-medium">
                📖 {totalPublished} course
                {totalPublished === 1 ? "" : "s"} available
              </span>
            </div>
          </div>

          {/* Compact quick metrics card on the right */}
          <div className="w-full sm:w-auto sm:min-w-[220px]">
            <div className="rounded-2xl bg-slate-950/15 backdrop-blur-sm border border-white/15 px-4 py-3 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-sky-50/90 font-medium">
                  Learning snapshot
                </span>
                <span className="text-[10px] text-sky-100/80">
                  Live overview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="space-y-1">
                  <p className="text-[11px] text-sky-100/80">Courses</p>
                  <p className="text-lg font-semibold">{totalEnrolled}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-sky-100/80">Explore</p>
                  <p className="text-lg font-semibold">{totalPublished}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-sky-100/80">Focus</p>
                  <p className="text-lg font-semibold">
                    {totalRecommendations || "-"}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-sky-100/85">
                Continue where you left off or dive into a new course today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="rounded-2xl bg-white/80 shadow-sm border border-slate-200/70 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Quick actions
          </h2>
          <p className="text-[11px] text-slate-500">
            Navigate to your most important areas in one click.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <QuickAction
            to="/courses"
            icon="🧭"
            label="Explore courses"
            description="Browse all available courses"
          />
          <QuickAction
            to="/student/my-courses"
            icon="🎓"
            label="My courses"
            description="Resume your enrolled classes"
          />
          <QuickAction
            to="/student/certificates"
            icon="📜"
            label="Certificates"
            description="View your achievements"
          />
          <QuickAction
            to="/student/consultations"
            icon="🤝"
            label="Consultations"
            description="Mentorship & 1:1 sessions"
          />
          <QuickAction
            to="/student/stats"
            icon="📊"
            label="Learning stats"
            description="Analytics & time spent"
          />
        </div>
      </section>

      {/* MAIN GRID: Recommendations + Enrolled + Announcements */}
      <section className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 columns: Recommendations + Enrolled */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended */}
          <div className="rounded-2xl bg-white/90 shadow-sm border border-slate-200/80 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-lg">
                  ⭐
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Recommended for you
                  </h3>
                  {basedOnCategories.length > 0 && (
                    <p className="text-[11px] text-slate-500">
                      Based on your interest in{" "}
                      <span className="font-semibold">
                        {basedOnCategories.join(", ")}
                      </span>
                      .
                    </p>
                  )}
                </div>
              </div>
              {recLoading && (
                <span className="text-[11px] text-slate-500 animate-pulse">
                  Updating…
                </span>
              )}
            </div>

            {recommendedCourses.length === 0 && !recLoading && (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3 text-sm text-slate-600">
                Start exploring and enrolling in courses. As you learn, EduNex
                will automatically suggest courses tailored to your interests.
              </div>
            )}

            {recommendedCourses.length > 0 && (
              <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {recommendedCourses.map((course) => {
                  const isNewCourse = isCourseNew(course.startDate);
                  const learners = course.totalEnrolled || 0;
                  const popularityBadge =
                    learners >= 20
                      ? "Popular choice"
                      : learners >= 5
                      ? "Learners are joining"
                      : "Be one of the first";

                  return (
                    <Link
                      key={course._id}
                      to={`/student/courses/${course._id}`}
                      className="group rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-[1px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-transform"
                    >
                      <div className="h-full rounded-2xl bg-white p-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                              {course.category || "General"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {learners} learner{learners === 1 ? "" : "s"}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {course.title}
                          </h4>
                          {course.instructor?.name && (
                            <p className="text-[11px] text-slate-500">
                              By {course.instructor.name}
                            </p>
                          )}
                          <p className="text-xs text-slate-600 mt-1 leading-snug">
                            {course.description
                              ? course.description.slice(0, 110) + "..."
                              : "Click to view course details and syllabus."}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold">
                            Recommended
                          </span>
                          <div className="flex items-center gap-2">
                            {isNewCourse && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                                New
                              </span>
                            )}
                            <span>{popularityBadge}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enrolled Courses */}
          <div className="rounded-2xl bg-white/90 shadow-sm border border-slate-200/80 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  🎓
                </span>
                <h3 className="text-sm font-semibold text-slate-900">
                  My enrolled courses
                </h3>
              </div>
              <Link
                to="/student/my-courses"
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-800"
              >
                View all →
              </Link>
            </div>

            {enrolledCourses.length === 0 ? (
              <p className="text-sm text-slate-600">
                You haven&apos;t enrolled in any courses yet. Start with{" "}
                <Link
                  to="/courses"
                  className="font-semibold text-sky-700 hover:text-sky-800"
                >
                  Explore courses
                </Link>{" "}
                to begin your learning journey.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrolledCourses.map((course) => (
                  <Link
                    key={course._id}
                    to={`/student/courses/${course._id}`}
                    className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-transform flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {course.title}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {course.category}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      {course.description
                        ? course.description.slice(0, 80) + "..."
                        : "Continue this course"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Announcements */}
        <aside className="space-y-3 rounded-2xl bg-white/90 shadow-sm border border-slate-200/80 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                🔔
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Recent announcements
                </h3>
                <p className="text-[11px] text-slate-500">
                  Updates from courses you can access.
                </p>
              </div>
            </div>
          </div>

          {!anyAnnouncements && (
            <p className="text-xs text-slate-500">
              No announcements have been posted yet. You&apos;ll see instructor
              updates and course notices here.
            </p>
          )}

          {anyAnnouncements && (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {courses.map((course) =>
                course.announcements?.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 hover:bg-slate-50 transition"
                  >
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-[0.12em]">
                        {course.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-700">{a.content}</p>
                    </div>
                    {isNew(a.createdAt) && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-400 text-black">
                        New
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

/* --------- Small presentational component for Quick Actions --------- */
function QuickAction({ to, icon, label, description }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3 text-left text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-transform"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900/5 text-base">
          {icon}
        </span>
        <span className="font-semibold text-slate-900 group-hover:text-sky-700">
          {label}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 leading-snug">{description}</p>
    </Link>
  );
}
