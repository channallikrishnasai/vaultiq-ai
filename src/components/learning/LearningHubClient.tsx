"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  Clock,
  Star,
  Search,
  Filter,
  Sparkles,
  Trophy,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { toast } from "sonner";
import { fadeInUp, staggerContainer } from "@/lib/motion";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  duration: string | null;
  videoUrl: string | null;
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
  difficulty: string;
  modules: Module[];
  _count?: { learningProgress: number };
  completedLessons?: number;
  totalLessons?: number;
}

interface LearningHubClientProps {
  user: { name: string | null; email: string; image: string | null };
}

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  intermediate: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  advanced: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

export function LearningHubClient({ user }: LearningHubClientProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [favorites, setFavorites] = useState<string[]>([]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/learning/courses");
      const json = await res.json();
      if (json.success) {
        // Fetch progress for each course
        const coursesWithProgress = await Promise.all(
          json.data.map(async (course: Course) => {
            const totalLessons = course.modules.reduce(
              (acc: number, m: Module) => acc + m.lessons.length,
              0
            );
            try {
              const progressRes = await fetch(
                `/api/learning/progress?courseId=${course.id}`
              );
              const progressJson = await progressRes.json();
              const completedLessons = progressJson.success
                ? progressJson.data.filter((p: any) => p.completed).length
                : 0;
              return { ...course, totalLessons, completedLessons };
            } catch {
              return { ...course, totalLessons, completedLessons: 0 };
            }
          })
        );
        setCourses(coursesWithProgress);
      }
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("favorite-courses");
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const router = useRouter();

  const openCourse = (course: Course) => {
    router.push(`/dashboard/learning/${course.id}`);
  };

  const toggleFavorite = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId];
      localStorage.setItem("favorite-courses", JSON.stringify(next));
      return next;
    });
  };

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty =
      filterDifficulty === "all" || course.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardHeader user={user} visible={true} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
                <h1 className="text-xl font-bold text-zinc-50">
                  Learning Hub
                </h1>
                <p className="text-sm text-zinc-500">
                  Master personal finance — earn XP as you learn
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition"
            />
          </div>
          <div className="flex gap-2">
            {["all", "beginner", "intermediate", "advanced"].map((level) => (
              <button
                key={level}
                onClick={() => setFilterDifficulty(level)}
                className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition ${
                  filterDifficulty === level
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {level === "all" ? "All" : level}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-zinc-700" />
            <p className="text-sm text-zinc-500">
              {searchQuery
                ? "No courses match your search."
                : "No courses available yet."}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredCourses.map((course) => {
              const progress =
                course.totalLessons && course.totalLessons > 0
                  ? Math.round(
                      ((course.completedLessons ?? 0) / course.totalLessons) *
                        100
                    )
                  : 0;
              const isFavorite = favorites.includes(course.id);

              return (
                <motion.div
                  key={course.id}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  className="group relative cursor-pointer rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 backdrop-blur-sm transition hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5"
                  onClick={() => openCourse(course)}
                >
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(e, course.id)}
                    className={`absolute top-4 right-4 p-1.5 rounded-lg transition ${
                      isFavorite
                        ? "text-amber-400 bg-amber-500/10"
                        : "text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Star
                      className="w-4 h-4"
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </button>

                  {/* Icon & Difficulty */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20">
                      <BookOpen className="h-5 w-5 text-cyan-400" />
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                        DIFFICULTY_COLORS[course.difficulty] ??
                        DIFFICULTY_COLORS.beginner
                      }`}
                    >
                      {course.difficulty}
                    </span>
                  </div>

                  {/* Course Info */}
                  <h3 className="mb-2 text-lg font-semibold text-zinc-50 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed text-zinc-400 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.totalLessons ?? 0} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {course.modules.length} modules
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {course.completedLessons ?? 0}/{course.totalLessons ?? 0}{" "}
                      completed
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="overflow-hidden rounded-full bg-zinc-800">
                    <motion.div
                      className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>

                  {/* CTA */}
                  <div className="mt-4 flex items-center gap-1 text-xs text-cyan-400 opacity-0 transition group-hover:opacity-100">
                    {progress > 0 ? "Continue learning" : "Start learning"}{" "}
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </main>
  );
}