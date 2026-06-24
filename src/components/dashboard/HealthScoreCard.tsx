"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { fadeInUp } from "@/lib/motion";

interface HealthScoreCardProps {
  healthScore: {
    score: number;
    label: string;
    grade?: string;
    breakdown: { name: string; value: number }[];
  };
}

export default function HealthScoreCard({ healthScore }: HealthScoreCardProps) {
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (healthScore.score / 100) * circumference;

  return (
    <motion.div
      {...fadeInUp}
      className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Heart className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-50">Financial Health</h3>
            <p className="text-xs text-zinc-500">Unified wellness score</p>
          </div>
        </div>
        <Link
          href="/dashboard/health"
          className="flex items-center gap-1 text-xs text-teal-400 opacity-0 transition-all group-hover:opacity-100 hover:text-teal-300"
        >
          Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#27272a" strokeWidth="8" />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#healthGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber
              value={healthScore.score}
              className="text-2xl font-bold text-zinc-50"
            />
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
              {healthScore.label}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {healthScore.breakdown.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-14 text-xs text-zinc-500">{item.name}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  className="h-1.5 rounded-full bg-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-zinc-400">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
