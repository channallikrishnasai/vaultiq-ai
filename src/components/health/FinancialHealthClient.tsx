"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Loader2,
  Lightbulb,
  TrendingUp,
  Shield,
  PiggyBank,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type { HealthScoreResult } from "@/lib/financial-health";

interface FinancialHealthClientProps {
  user: { name: string | null; email: string; image: string | null };
}

const FACTOR_ICONS: Record<string, typeof Heart> = {
  "Savings Rate": PiggyBank,
  "Debt Management": Shield,
  Investments: TrendingUp,
  "Emergency Fund": Shield,
};

export function FinancialHealthClient({ user }: FinancialHealthClientProps) {
  const [health, setHealth] = useState<HealthScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/health-score");
      const json = await res.json();
      if (json.success) setHealth(json.data);
      else throw new Error(json.error?.message || "Failed to load health score");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const circumference = 2 * Math.PI * 70;
  const score = health?.score ?? 0;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const gradeColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 65
        ? "text-teal-400"
        : score >= 50
          ? "text-amber-400"
          : "text-rose-400";

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <DashboardHeader user={user} visible={true} />

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Heart className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-50">Financial Health</h1>
              <p className="text-sm text-zinc-500">Unified 0–100 wellness score & insights</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
            <p className="text-sm text-rose-400">{error}</p>
            <button onClick={fetchHealth} className="mt-3 text-xs text-teal-400">
              Retry
            </button>
          </div>
        ) : health ? (
          <div className="space-y-6">
            {/* Hero score */}
            <motion.div
              {...fadeInUp}
              className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-zinc-900/50 p-8 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                <div className="relative flex h-44 w-44 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#27272a" strokeWidth="10" />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="url(#healthPageGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1.4, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="healthPageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <AnimatedNumber value={health.score} className="text-4xl font-black text-zinc-50" />
                    <span className="text-xs text-zinc-500">/ 100</span>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <p className={`text-2xl font-bold ${gradeColor}`}>Grade {health.grade}</p>
                  <p className="mt-1 text-lg text-zinc-300">{health.label}</p>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">{health.summary}</p>
                </div>
              </div>
            </motion.div>

            {/* 6-factor breakdown */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6"
            >
              <h3 className="mb-5 text-base font-semibold text-zinc-50">Score Breakdown</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {health.breakdown.map((item) => (
                  <motion.div key={item.name} variants={fadeInUp} className="rounded-xl bg-zinc-950/50 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-zinc-400">{item.name}</span>
                      <span className="text-sm font-semibold text-zinc-200">{item.value}</span>
                    </div>
                    <div className="overflow-hidden rounded-full bg-zinc-800">
                      <motion.div
                        className="h-2 rounded-full bg-teal-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Contributing factors */}
            <motion.div {...fadeInUp} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
              <div className="mb-5 flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-semibold text-zinc-50">Contributing Factors</h3>
              </div>
              <div className="space-y-4">
                {health.factors.map((factor) => {
                  const Icon = FACTOR_ICONS[factor.name] ?? Heart;
                  const pct = Math.round((factor.score / factor.maxScore) * 100);
                  return (
                    <div
                      key={factor.name}
                      className="flex gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
                        <Icon className="h-5 w-5 text-teal-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-200">{factor.name}</span>
                          <span className="text-xs text-zinc-500">
                            {factor.score}/{factor.maxScore} pts
                          </span>
                        </div>
                        <div className="mb-2 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-zinc-500">{factor.tip}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Actionable insights */}
            <motion.div {...fadeInUp} className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6">
              <h3 className="mb-3 text-base font-semibold text-zinc-50">Actionable Insights</h3>
              <ul className="space-y-2">
                {health.factors
                  .filter((f) => f.score < f.maxScore * 0.7)
                  .map((f) => (
                    <li key={f.name} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                      {f.tip}
                    </li>
                  ))}
                {health.factors.every((f) => f.score >= f.maxScore * 0.7) && (
                  <li className="text-sm text-emerald-400">
                    All factors are healthy — maintain your current financial discipline!
                  </li>
                )}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/twin"
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-300 transition hover:border-teal-500/40 hover:text-teal-400"
                >
                  View Financial Twin →
                </Link>
                <Link
                  href="/dashboard#goals"
                  className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-300 transition hover:border-teal-500/40 hover:text-teal-400"
                >
                  Manage Goals →
                </Link>
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
