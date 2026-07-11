"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Flame,
  Star,
  Trophy,
  Award,
  Check,
  ArrowRightLeft,
  TrendingUp,
  FileText,
  PieChart,
} from "lucide-react";
import { DashboardData } from "@/types/dashboard";

interface LeftPanelProps {
  data: DashboardData;
}

const BADGES = [
  { label: "Early Investor", icon: Star, color: "#D4AF37", earned: true },
  { label: "Debt Free", icon: Check, color: "#10b981", earned: true },
  { label: "Achievement", icon: Trophy, color: "#60a5fa", earned: true },
  { label: "Upon Completion", icon: Award, color: "#a78bfa", earned: false },
];

const QUICK_ACTIONS = [
  { label: "Transfer Funds", icon: ArrowRightLeft },
  { label: "Invest Now", icon: TrendingUp },
  { label: "View Budget", icon: FileText },
  { label: "Analyze Spending", icon: PieChart },
];

export default function LeftPanel({ data }: LeftPanelProps) {
  const xp = data.profile?.xp ?? 4200;
  const streak = data.profile?.streak ?? 8;
  const level = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const xpToNext = 1000;
  const xpPct = (xpInLevel / xpToNext) * 100;

  const goals = data.goals?.slice(0, 3) ?? [];

  return (
    <div className="flex h-full w-[200px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-zinc-900/80 bg-zinc-950 p-4 scrollbar-thin scrollbar-thumb-zinc-900">
      {/* ── Financial Level ── */}
      <div className="space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">Financial Level</p>
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30">
              <span className="text-[11px] font-black text-[#D4AF37]">{level}</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-100">Level {level}: Wealth Builder</p>
            </div>
          </div>

          {/* XP Progress */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[8px] text-zinc-500 uppercase tracking-wider">XP Progress</p>
              <p className="text-[8px] text-zinc-400">towards next level</p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5D060]"
                style={{ boxShadow: "0 0 6px rgba(212,175,55,0.4)" }}
              />
            </div>
          </div>

          {/* Savings Streak */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Flame size={11} className="text-orange-400" />
              <p className="text-[9px] text-zinc-400">Savings Streak</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-orange-400">{streak}</span>
              <span className="text-[8px] text-zinc-500">months</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Achievement Badges ── */}
      <div className="space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">Achievement Badges</p>
        <div className="grid grid-cols-2 gap-1.5">
          {BADGES.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className={`flex flex-col items-center gap-1 rounded-lg border p-2 ${
                  badge.earned
                    ? "border-zinc-800 bg-zinc-900/40"
                    : "border-zinc-900/30 bg-zinc-950/20 opacity-40"
                }`}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ background: `${badge.color}22`, border: `1px solid ${badge.color}44` }}
                >
                  <Icon size={11} style={{ color: badge.color }} />
                </div>
                <span className="text-center text-[7px] leading-tight text-zinc-400">{badge.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Goal Completion Rings ── */}
      <div className="space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">Goal Completion Rings</p>
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-3 space-y-2">
          <p className="text-[8px] text-zinc-600 leading-snug">Goal celebratory animations upon completion</p>
          <div className="flex items-center justify-between gap-2 pt-1">
            {goals.slice(0, 3).map((goal: any, idx: number) => {
              const r = 14;
              const circumference = 2 * Math.PI * r;
              const pct = goal.percent ?? 50;
              const strokeDashoffset = circumference - (pct / 100) * circumference;
              const color = goal.color ?? "#D4AF37";
              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div className="relative h-9 w-9">
                    <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <motion.circle
                        cx="18" cy="18" r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.2, delay: idx * 0.1, ease: "easeOut" }}
                        style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-zinc-200">
                      {pct}%
                    </span>
                  </div>
                  <span className="text-[7px] text-zinc-500 text-center leading-tight w-10 truncate">
                    {(goal.name ?? "Goal").split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wealth Growth Journey */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-2.5">
          <p className="text-[8px] font-bold text-zinc-300 mb-0.5">Wealth Growth Journey</p>
          <p className="text-[7px] text-zinc-600 leading-snug">Visualised with premium glowing animations</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-zinc-500 font-semibold">Quick Actions</p>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_ACTIONS.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.03, borderColor: "rgba(212,175,55,0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-900 bg-zinc-950/60 p-2.5 transition-all text-left"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10 border border-amber-500/20">
                  <Icon size={11} className="text-[#D4AF37]" />
                </div>
                <span className="text-[7.5px] text-zinc-400 text-center leading-tight">{action.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
