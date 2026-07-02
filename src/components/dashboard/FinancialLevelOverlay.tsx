"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Star, Check, Award, ArrowRightLeft, TrendingUp, FileText, PieChart } from "lucide-react";
import { DashboardData } from "@/types/dashboard";

const PANEL: React.CSSProperties = {
  background: "rgba(5,5,8,0.0)",
  pointerEvents: "auto",
};

const GLASS: React.CSSProperties = {
  background: "rgba(8,8,14,0.82)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  padding: "10px 12px",
};

const SECTION = "text-[8px] font-semibold uppercase tracking-widest mb-2";

const BADGES = [
  { label: "Early Investor", icon: Star, color: "#D4AF37" },
  { label: "Early Investor", icon: Star, color: "#D4AF37" },
  { label: "Debt Free",      icon: Check, color: "#10b981" },
];

const GOALS_DEFAULT = [
  { name: "Home purchase", percent: 32,  color: "#D4AF37" },
  { name: "Retirement",   percent: 90,  color: "#10b981" },
  { name: "Vacation",     percent: 55,  color: "#60a5fa" },
];

const ACTIONS = [
  { label: "Transfer Funds",   icon: ArrowRightLeft },
  { label: "Invest Now",       icon: TrendingUp },
  { label: "View Budget",      icon: FileText },
  { label: "Analyze Spending", icon: PieChart },
];

export default function FinancialLevelOverlay({ data }: { data: DashboardData }) {
  const xp     = data.profile?.xp     ?? 4200;
  const streak = data.profile?.streak ?? 8;
  const level  = Math.floor(xp / 1000) + 21;
  const xpPct  = ((xp % 1000) / 1000) * 100;

  const goals = data.goals?.slice(0, 3).length
    ? data.goals.slice(0, 3).map((g, i) => ({
        name:    g.name,
        percent: g.percent ?? GOALS_DEFAULT[i].percent,
        color:   GOALS_DEFAULT[i].color,
      }))
    : GOALS_DEFAULT;

  return (
    <div
      className="absolute left-0 top-0 bottom-0 z-10 flex flex-col gap-2.5 overflow-y-auto py-3 px-3 scrollbar-none"
      style={{ ...PANEL, width: 196 }}
    >
      {/* ── Financial Level ── */}
      <div style={GLASS}>
        <p className={`${SECTION} text-zinc-500`}>Financial Level</p>

        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[9px] font-black"
            style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37" }}
          >
            {level}
          </div>
          <span className="text-[9px] font-bold text-zinc-200">Level {level}: Wealth Builder</span>
        </div>

        {/* XP Progress */}
        <p className="text-[7.5px] text-zinc-500 mb-1">
          <span className="text-zinc-300 font-semibold">XP Progress</span>{"   "}towards next level
        </p>
        <div className="mb-2 h-[5px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#D4AF37,#F5D060)", boxShadow: "0 0 8px rgba(212,175,55,0.5)" }}
          />
        </div>

        {/* Savings Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Flame size={10} className="text-orange-400" />
            <span className="text-[8px] font-semibold text-zinc-300">Savings Streak</span>
          </div>
          <span className="text-[8px] font-bold text-orange-400">{streak} months</span>
        </div>
      </div>

      {/* ── Achievement Badges ── */}
      <div style={GLASS}>
        <p className={`${SECTION} text-zinc-500`}>Achievement Badges</p>
        <div className="flex items-end gap-2.5">
          {BADGES.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${b.color}1a`, border: `1px solid ${b.color}44` }}
                >
                  <Icon size={13} style={{ color: b.color }} />
                </div>
                <span className="text-center text-[6.5px] text-zinc-500 leading-tight max-w-[38px]">{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Goal Completion Rings ── */}
      <div style={GLASS}>
        <p className={`${SECTION} text-zinc-500`}>Goal Completion Rings</p>
        <p className="text-[7px] text-zinc-600 mb-2 leading-snug">Goal celebratory animations upon completion</p>

        <div className="flex items-center justify-around mb-2.5">
          {goals.map((g, i) => {
            const r = 14, circ = 2 * Math.PI * r;
            const offset = circ - (g.percent / 100) * circ;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="relative" style={{ width: 38, height: 38 }}>
                  <svg className="absolute inset-0" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <motion.circle
                      cx="18" cy="18" r={r} fill="none"
                      stroke={g.color} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1.2, delay: i * 0.12, ease: "easeOut" }}
                      style={{ filter: `drop-shadow(0 0 3px ${g.color}66)` }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-zinc-100">
                    {g.percent}%
                  </span>
                </div>
                <span className="text-[6.5px] text-zinc-500 text-center w-10 truncate">{g.name.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>

        <div
          className="rounded-lg p-2"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-[7.5px] font-bold text-zinc-300 mb-0.5">Wealth Growth Journey</p>
          <p className="text-[7px] text-zinc-600 leading-snug">Visualised with premium glowing animations</p>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={GLASS}>
        <p className={`${SECTION} text-zinc-500`}>Quick Actions</p>
        <div className="grid grid-cols-2 gap-1.5">
          {ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.button
                key={i}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all"
                style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ background: "rgba(212,175,55,0.12)" }}
                >
                  <Icon size={10} style={{ color: "#D4AF37" }} />
                </div>
                <span className="text-center text-[6.5px] text-zinc-400 leading-tight">{a.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
