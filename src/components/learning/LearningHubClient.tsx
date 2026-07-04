"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  Play,
  X,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fadeInUp, staggerContainer } from "@/lib/motion";

const extractYouTubeId = (url: string) => {
  const regExp = /(?:youtube\.com\/(?:[^/]+\/.+|(?:v|embed)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match ? match[1] : "";
};

interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  lessons: { id: string; title: string; duration: string; content: string; youtubeId?: string }[];
  quiz: { id: string; question: string; options: string[]; correctIndex: number }[];
  completedLessons: number;
  totalLessons: number;
  youtubeUrl?: string;
}

interface LearningHubClientProps {
  user: { name: string | null; email: string; image: string | null };
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  advanced: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

export function LearningHubClient({ user }: LearningHubClientProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/learning/courses");
      const json = await res.json();
      if (json.success) setCourses(json.data);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCourses();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchCourses]);

  const markLessonComplete = async (courseId: string, lessonId: string) => {
    try {
      await fetch("/api/learning/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, lessonId, completed: true }),
      });
      toast.success("Lesson completed! +25 XP");
      fetchCourses();
    } catch {
      toast.error("Failed to save progress");
    }
  };

  const submitQuiz = async () => {
    if (!activeCourse) return;
    const answers = activeCourse.quiz.map((q) => ({
      questionId: q.id,
      answerIndex: quizAnswers[q.id] ?? -1,
    }));

    try {
      const res = await fetch("/api/learning/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: activeCourse.id, answers }),
      });
      const json = await res.json();
      if (json.success) {
        setQuizResult(json.data);
        toast.success(json.data.passed ? "Quiz passed! +50 XP" : "Quiz completed — review and retry");
      }
    } catch {
      toast.error("Failed to submit quiz");
    }
  };

  const openCourse = (course: Course) => {
    setActiveCourse(course);
    setActiveLesson(0);
    setShowQuiz(false);
    setQuizResult(null);
    setQuizAnswers({});
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardHeader user={user} visible={true} />

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
              <GraduationCap className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-50">Learning Hub</h1>
              <p className="text-sm text-zinc-500">
                Master personal finance — earn XP as you learn
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
            <p className="text-sm text-zinc-500">No courses available yet.</p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-6 sm:grid-cols-2"
          >
            {courses.map((course) => {
              const progress =
                course.totalLessons > 0
                  ? Math.round((course.completedLessons / course.totalLessons) * 100)
                  : 0;

              return (
                <motion.div
                  key={course.id}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  className="group relative cursor-pointer rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 backdrop-blur-sm transition hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
                  onClick={() => openCourse(course)}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
                      <BookOpen className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-2">
  <button
    onClick={(e) => {
      e.stopPropagation();
      // Open the course viewer modal and ensure video is shown
      setActiveCourse(course);
      setActiveLesson(0);
      setShowQuiz(false);
      const id = course.youtubeUrl ? extractYouTubeId(course.youtubeUrl) : null;
      if (!id) {
        const fallbackId = 'WxXCPmKkfUI';
        setVideoId(fallbackId);
        toast.info('Using fallback video');
      } else {
        setVideoId(id);
      }
    }}
    className="rounded-full bg-red-600/10 border border-red-500/30 px-2.5 py-0.5 text-xs font-medium text-red-400 hover:bg-red-600/20 transition-all flex items-center gap-1"
  >
    <Play className="h-3 w-3 fill-current" /> Video
  </button>
  <span
    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${LEVEL_COLORS[course.level] ?? LEVEL_COLORS.beginner}`}
  >
    {course.level}
  </span>
</div>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-zinc-50">{course.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-zinc-400">{course.description}</p>

                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {course.completedLessons}/{course.totalLessons} lessons
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      className="h-1.5 rounded-full bg-cyan-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs text-cyan-400 opacity-0 transition group-hover:opacity-100">
                    Start learning <ChevronRight className="h-3 w-3" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Course viewer modal */}
      <AnimatePresence>
        {activeCourse && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setActiveCourse(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
                <h2 className="text-base font-semibold text-zinc-50">{activeCourse.title}</h2>
                <button
                  onClick={() => setActiveCourse(null)}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {!showQuiz ? (
                  <>
                    <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                      {videoId && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                            onClick={() => setVideoId(null)}
                          >
                            <div className="relative w-full max-w-3xl p-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setVideoId(null)}
                                className="absolute top-2 right-2 rounded-full bg-zinc-800 p-1 text-zinc-200 hover:bg-zinc-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video"
                                className="aspect-video w-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      )}

                      {activeCourse.lessons.map((lesson, i) => (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLesson(i)}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            activeLesson === i
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {i + 1}. {lesson.title}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowQuiz(true)}
                        className="shrink-0 rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-400"
                      >
                        Quiz
                      </button>
                    </div>

                    {activeCourse.lessons[activeLesson] && (
                      <div>
                        {activeCourse.lessons[activeLesson].youtubeId && (
                          <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black">
                            <iframe
                              className="h-full w-full"
                              src={`https://www.youtube.com/embed/${activeCourse.lessons[activeLesson].youtubeId}`}
                              title={activeCourse.lessons[activeLesson].title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                        <div className="mb-3 flex items-center gap-2">
                          <Play className="h-4 w-4 text-cyan-400" />
                          <h3 className="font-semibold text-zinc-100">
                            {activeCourse.lessons[activeLesson].title}
                          </h3>
                          <span className="text-xs text-zinc-500">
                            {activeCourse.lessons[activeLesson].duration}
                          </span>
                        </div>
                        <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                          {activeCourse.lessons[activeLesson].content}
                        </p>
                        <Button
                          onClick={() =>
                            markLessonComplete(
                              activeCourse.id,
                              activeCourse.lessons[activeLesson].id,
                            )
                          }
                          className="w-full bg-cyan-500 text-zinc-950 hover:bg-cyan-400"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark Complete
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <h3 className="mb-4 font-semibold text-zinc-100">Course Quiz</h3>
                    {quizResult ? (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
                        <p className="text-3xl font-bold text-zinc-50">
                          {quizResult.score}/{quizResult.total}
                        </p>
                        <p
                          className={`mt-2 text-sm ${quizResult.passed ? "text-emerald-400" : "text-amber-400"}`}
                        >
                          {quizResult.passed ? "Passed!" : "Keep learning and retry"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {activeCourse.quiz.map((q) => (
                          <div key={q.id} className="rounded-xl border border-zinc-800 p-4">
                            <p className="mb-3 text-sm font-medium text-zinc-200">{q.question}</p>
                            <div className="space-y-2">
                              {q.options.map((opt, i) => (
                                <button
                                  key={i}
                                  onClick={() =>
                                    setQuizAnswers((prev) => ({ ...prev, [q.id]: i }))
                                  }
                                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                                    quizAnswers[q.id] === i
                                      ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        <Button
                          onClick={submitQuiz}
                          disabled={Object.keys(quizAnswers).length < activeCourse.quiz.length}
                          className="w-full bg-violet-500 text-white hover:bg-violet-400"
                        >
                          Submit Quiz
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
