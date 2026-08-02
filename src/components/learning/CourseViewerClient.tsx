"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  PlayCircle,
  FileText,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Menu,
  BookOpen,
  Clock,
  BarChart3,
  Search,
  Bookmark,
  BookmarkCheck,
  Star,
  GraduationCap,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ListVideo,
  Download,
  HelpCircle,
  Trophy,
  Sparkles,
  Circle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  assignmentUrl: string | null;
  order: number;
}

interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty?: string;
  modules: Module[];
}

interface CourseViewerClientProps {
  course: Course;
  completedLessonIds: string[];
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  advanced: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

export function CourseViewerClient({
  course,
  completedLessonIds: initialCompleted,
}: CourseViewerClientProps) {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [completedLessonIds, setCompletedLessonIds] =
    useState<string[]>(initialCompleted);
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedLessons, setBookmarkedLessons] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    total: number;
    passed: boolean;
  } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Initialize first lesson
  useEffect(() => {
    if (course.modules.length > 0 && course.modules[0].lessons.length > 0 && !activeLesson) {
      setActiveLesson(course.modules[0].lessons[0]);
      setActiveModule(course.modules[0]);
      setExpandedModules({ [course.modules[0].id]: true });
    }
  }, [course, activeLesson]);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`bookmarks-${course.id}`);
      if (saved) setBookmarkedLessons(JSON.parse(saved));
      const fav = localStorage.getItem(`favorite-${course.id}`);
      if (fav) setIsFavorite(JSON.parse(fav));
    } catch {}
  }, [course.id]);

  // Save bookmarks
  const toggleBookmark = (lessonId: string) => {
    setBookmarkedLessons((prev) => {
      const next = prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId];
      localStorage.setItem(`bookmarks-${course.id}`, JSON.stringify(next));
      return next;
    });
  };

  const toggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    localStorage.setItem(`favorite-${course.id}`, JSON.stringify(next));
    toast.success(next ? "Added to favorites" : "Removed from favorites");
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleLessonSelect = (module: Module, lesson: Lesson) => {
    setActiveModule(module);
    setActiveLesson(lesson);
    setShowQuiz(false);
    setQuizResult(null);
    setQuizAnswers({});
  };

  const markLessonComplete = async () => {
    if (!activeLesson) return;

    if (!completedLessonIds.includes(activeLesson.id)) {
      setCompletedLessonIds((prev) => [...prev, activeLesson.id]);
    }

    try {
      const res = await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: activeLesson.id,
          completed: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Lesson completed! 🎉");
    } catch {
      toast.error("Failed to save progress.");
    }
  };

  // Navigate between lessons
  const allLessons = useMemo(() => {
    return course.modules.flatMap((m) =>
      m.lessons.map((l) => ({ ...l, moduleId: m.id }))
    );
  }, [course.modules]);

  const currentIndex = useMemo(
    () => allLessons.findIndex((l) => l.id === activeLesson?.id),
    [allLessons, activeLesson?.id]
  );

  const goToNext = () => {
    if (currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      const mod = course.modules.find((m) => m.id === next.moduleId);
      if (mod) handleLessonSelect(mod, next);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prev = allLessons[currentIndex - 1];
      const mod = course.modules.find((m) => m.id === prev.moduleId);
      if (mod) handleLessonSelect(mod, prev);
    }
  };

  // Calculate progress
  const totalLessons = course.modules.reduce(
    (acc, mod) => acc + mod.lessons.length,
    0
  );
  const progressPercentage =
    totalLessons > 0
      ? Math.round((completedLessonIds.length / totalLessons) * 100)
      : 0;

  // Filtered lessons for search
  const filteredModules = useMemo(() => {
    if (!searchQuery) return course.modules;
    const q = searchQuery.toLowerCase();
    return course.modules
      .map((m) => ({
        ...m,
        lessons: m.lessons.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.description?.toLowerCase().includes(q)
        ),
      }))
      .filter((m) => m.lessons.length > 0);
  }, [course.modules, searchQuery]);

  // Sticky video on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden text-zinc-50">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-zinc-800 space-y-3">
              <Link
                href="/dashboard/learning"
                className="flex items-center text-zinc-400 hover:text-zinc-200 transition text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Link>

              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h2
                    className="font-bold text-lg leading-tight truncate"
                    title={course.title}
                  >
                    {course.title}
                  </h2>
                  {course.difficulty && (
                    <span
                      className={`inline-block mt-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        DIFFICULTY_COLORS[course.difficulty] ??
                        DIFFICULTY_COLORS.beginner
                      }`}
                    >
                      {course.difficulty}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleFavorite}
                  className={`p-1.5 rounded-lg transition ${
                    isFavorite
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <Star
                    className="w-4 h-4"
                    fill={isFavorite ? "currentColor" : "none"}
                  />
                </button>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {completedLessonIds.length}/{totalLessons} (
                    {Math.round(progressPercentage)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search lessons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition"
                />
              </div>
            </div>

            {/* Modules & Lessons */}
            <div className="flex-1 overflow-y-auto">
              {filteredModules.length === 0 ? (
                <div className="p-6 text-center text-zinc-500 text-sm">
                  No lessons match your search.
                </div>
              ) : (
                filteredModules.map((module) => {
                  const isExpanded = expandedModules[module.id];
                  const moduleCompleted = module.lessons.every((l) =>
                    completedLessonIds.includes(l.id)
                  );

                  return (
                    <div key={module.id} className="border-b border-zinc-800/50">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/30 transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              moduleCompleted
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {module.order}
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500 font-medium">
                              Module {module.order}
                            </div>
                            <h3 className="font-medium text-sm">
                              {module.title}
                            </h3>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-zinc-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-zinc-900/30"
                          >
                            {module.lessons.map((lesson) => {
                              const isCompleted = completedLessonIds.includes(
                                lesson.id
                              );
                              const isActive =
                                activeLesson?.id === lesson.id;
                              const isBookmarked =
                                bookmarkedLessons.includes(lesson.id);

                              return (
                                <div
                                  key={lesson.id}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() =>
                                    handleLessonSelect(module, lesson)
                                  }
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Enter" ||
                                      e.key === " "
                                    ) {
                                      e.preventDefault();
                                      handleLessonSelect(module, lesson);
                                    }
                                  }}
                                  className={`w-full flex items-start gap-3 p-3 pl-12 text-left transition relative cursor-pointer ${
                                    isActive
                                      ? "bg-cyan-500/10 border-l-2 border-cyan-500"
                                      : "hover:bg-zinc-800/50 border-l-2 border-transparent"
                                  }`}
                                >
                                  <div className="mt-0.5 flex-shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    ) : isActive ? (
                                      <PlayCircle className="w-4 h-4 text-cyan-500" />
                                    ) : (
                                      <Circle className="w-4 h-4 text-zinc-600" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-sm ${
                                        isActive
                                          ? "text-cyan-400 font-medium"
                                          : isCompleted
                                            ? "text-zinc-400"
                                            : "text-zinc-300"
                                      }`}
                                    >
                                      {lesson.order}. {lesson.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      {lesson.duration && (
                                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {lesson.duration}
                                        </span>
                                      )}
                                      {lesson.videoUrl && (
                                        <span className="text-xs text-zinc-600">
                                          Video
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleBookmark(lesson.id);
                                    }}
                                    className={`p-1 rounded transition ${
                                      isBookmarked
                                        ? "text-cyan-400"
                                        : "text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100"
                                    }`}
                                  >
                                    <Bookmark
                                      className="w-3.5 h-3.5"
                                      fill={
                                        isBookmarked ? "currentColor" : "none"
                                      }
                                    />
                                  </button>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm flex items-center px-4 shrink-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 mr-4 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm text-zinc-400 flex-1 min-w-0">
            <span className="truncate">{activeModule?.title}</span>
            <span className="text-zinc-600">/</span>
            <span className="truncate text-zinc-200">
              {activeLesson?.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowQuiz(true)}
              className="px-3 py-1.5 text-xs font-medium bg-violet-500/10 text-violet-400 rounded-lg hover:bg-violet-500/20 transition"
            >
              Quiz
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {activeLesson ? (
              <div className="space-y-8">
                {/* Video Player Section */}
                <div
                  className={`${
                    isSticky
                      ? "fixed top-14 left-0 right-0 z-40 p-4 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 shadow-xl"
                      : ""
                  }`}
                >
                  {activeLesson.videoUrl ? (
                    <div className="max-w-5xl mx-auto">
                      <VideoPlayer
                        url={activeLesson.videoUrl}
                        title={activeLesson.title}
                        onEnded={() => {
                          markLessonComplete();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-zinc-900 rounded-xl flex flex-col items-center justify-center border border-zinc-800">
                      <FileText className="w-16 h-16 text-zinc-700 mb-4" />
                      <p className="text-zinc-500 text-lg">
                        No video for this lesson
                      </p>
                      <p className="text-zinc-600 text-sm mt-1">
                        Check the resources section for materials
                      </p>
                    </div>
                  )}
                </div>

                {/* Spacer for sticky video */}
                {isSticky && <div className="aspect-video" />}

                {/* Lesson Content */}
                <div className="space-y-6">
                  {/* Title & Actions */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                          Lesson {activeLesson.order}
                        </span>
                        {activeLesson.duration && (
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activeLesson.duration}
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl md:text-3xl font-bold text-zinc-50">
                        {activeLesson.title}
                      </h1>
                    </div>
                    <button
                      onClick={() => toggleBookmark(activeLesson.id)}
                      className={`p-2 rounded-lg transition ${
                        bookmarkedLessons.includes(activeLesson.id)
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <Bookmark
                        className="w-5 h-5"
                        fill={
                          bookmarkedLessons.includes(activeLesson.id)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  </div>

                  {/* Description */}
                  {activeLesson.description && (
                    <p className="text-zinc-400 leading-relaxed text-base">
                      {activeLesson.description}
                    </p>
                  )}

                  {/* Navigation & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6 border-t border-zinc-800">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={goToPrev}
                        disabled={currentIndex <= 0}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm text-zinc-300 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <button
                        onClick={goToNext}
                        disabled={currentIndex >= allLessons.length - 1}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm text-zinc-300 transition"
                      >
                        Next
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 sm:ml-auto">
                      <button
                        onClick={markLessonComplete}
                        disabled={completedLessonIds.includes(activeLesson.id)}
                        className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                      >
                        {completedLessonIds.includes(activeLesson.id) ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Completed
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Mark Complete
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Notes & Flashcards Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-zinc-800">
                    {/* Notes */}
                    <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-6">
                      <div className="flex items-center gap-2 mb-4 text-cyan-400">
                        <BookOpen className="w-5 h-5" />
                        <h3 className="text-lg font-semibold text-zinc-100">Key Takeaways</h3>
                      </div>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-zinc-300 leading-relaxed">This video breaks down complex concepts into simple, everyday examples.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-zinc-300 leading-relaxed">Always consider the long-term impact of financial decisions, focusing on compound growth.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-zinc-300 leading-relaxed">Risk management is just as important as maximizing returns. Diversify to protect your wealth.</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                          <span className="text-sm text-zinc-300 leading-relaxed">Start early and be consistent. Time in the market beats timing the market.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Flashcards */}
                    <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/60 p-6">
                      <div className="flex items-center gap-2 mb-4 text-emerald-400">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="text-lg font-semibold text-zinc-100">Review Flashcards</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="group relative h-32 w-full [perspective:1000px]">
                          <div className="absolute inset-0 transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                            {/* Front */}
                            <div className="absolute inset-0 bg-zinc-800/80 rounded-xl flex items-center justify-center p-4 text-center border border-zinc-700/50 [backface-visibility:hidden]">
                              <p className="text-sm font-medium text-zinc-200">What is the #1 rule of investing?</p>
                            </div>
                            {/* Back */}
                            <div className="absolute inset-0 bg-emerald-500/10 rounded-xl flex items-center justify-center p-4 text-center border border-emerald-500/30 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                              <p className="text-sm font-medium text-emerald-300">Don&#39;t lose money (and start as early as possible).</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative h-32 w-full [perspective:1000px]">
                          <div className="absolute inset-0 transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                            {/* Front */}
                            <div className="absolute inset-0 bg-zinc-800/80 rounded-xl flex items-center justify-center p-4 text-center border border-zinc-700/50 [backface-visibility:hidden]">
                              <p className="text-sm font-medium text-zinc-200">What does &quot;Diversification&quot; mean?</p>
                            </div>
                            {/* Back */}
                            <div className="absolute inset-0 bg-cyan-500/10 rounded-xl flex items-center justify-center p-4 text-center border border-cyan-500/30 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                              <p className="text-sm font-medium text-cyan-300">Spreading your investments across different assets to reduce risk.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resources Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 hover:border-zinc-700 transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-rose-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200">
                            PDF Notes
                          </h4>
                          <p className="text-xs text-zinc-500">
                            {activeLesson.pdfUrl
                              ? "Available"
                              : "Not available"}
                          </p>
                        </div>
                      </div>
                      {activeLesson.pdfUrl ? (
                        <a
                          href={activeLesson.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition"
                        >
                          <Download className="w-3 h-3" /> Download PDF
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600">
                          No PDF available
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 hover:border-zinc-700 transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <LayoutDashboard className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200">
                            Assignment
                          </h4>
                          <p className="text-xs text-zinc-500">
                            {activeLesson.assignmentUrl
                              ? "Available"
                              : "Not available"}
                          </p>
                        </div>
                      </div>
                      {activeLesson.assignmentUrl ? (
                        <a
                          href={activeLesson.assignmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition"
                        >
                          <Download className="w-3 h-3" /> View Assignment
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-600">
                          No assignment
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl bg-zinc-900/50 border border-zinc-800 p-4 hover:border-zinc-700 transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                          <HelpCircle className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200">
                            Quiz
                          </h4>
                          <p className="text-xs text-zinc-500">
                            Test your knowledge
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition"
                      >
                        <Sparkles className="w-3 h-3" /> Take Quiz
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <GraduationCap className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500 text-lg">
                    Select a lesson from the sidebar to begin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {showQuiz && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setShowQuiz(false);
                setQuizResult(null);
                setQuizAnswers({});
              }}
            />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-violet-400" />
                  </div>
                  <h2 className="text-base font-semibold text-zinc-50">
                    Course Quiz
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowQuiz(false);
                    setQuizResult(null);
                    setQuizAnswers({});
                  }}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {quizResult ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 text-center">
                      <Trophy
                        className={`w-16 h-16 mx-auto mb-4 ${
                          quizResult.passed
                            ? "text-amber-400"
                            : "text-zinc-600"
                        }`}
                      />
                      <p className="text-5xl font-bold text-zinc-50 mb-2">
                        {quizResult.score}/{quizResult.total}
                      </p>
                      <p
                        className={`text-lg font-medium ${
                          quizResult.passed
                            ? "text-emerald-400"
                            : "text-amber-400"
                        }`}
                      >
                        {quizResult.passed
                          ? "🎉 Congratulations! You passed!"
                          : "Keep learning and try again!"}
                      </p>
                      <p className="text-sm text-zinc-500 mt-2">
                        {quizResult.passed
                          ? "You've mastered this module!"
                          : "Review the lessons and retake the quiz."}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setQuizResult(null);
                        setQuizAnswers({});
                      }}
                      className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium transition"
                    >
                      Retake Quiz
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-zinc-400">
                      Answer all questions to test your understanding of this
                      course.
                    </p>
                    {/* Placeholder quiz questions - in production these come from the API */}
                    <div className="rounded-xl border border-zinc-800 p-4">
                      <p className="text-sm text-zinc-500 text-center">
                        Quiz questions will be loaded from the course data.
                      </p>
                    </div>
                    <button
                      disabled
                      className="w-full py-2.5 bg-violet-600/50 text-violet-200 rounded-lg font-medium cursor-not-allowed"
                    >
                      Submit Quiz
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}