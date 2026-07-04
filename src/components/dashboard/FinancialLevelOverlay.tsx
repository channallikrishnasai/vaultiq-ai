"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame, Star, Check, Award, ArrowRightLeft, TrendingUp, FileText, PieChart, Zap } from "lucide-react";
import { DashboardData } from "@/types/dashboard";

const PANEL: React.CSSProperties = {
  background: "rgba(5,5,8,0.0)",
  pointerEvents: "auto",
};

const GLASS: React.CSSProperties = {
  background: "rgba(7,5,2,0.88)",
  border: "1px solid rgba(212,175,55,0.22)",
  borderRadius: 13,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  padding: "12px 14px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
};

const SECTION_STYLE: React.CSSProperties = {
  fontSize: 8.5,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(212,175,55,0.6)",
  marginBottom: 8,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const BADGES = [
  { label: "Early Investor", icon: Star,  color: "#D4AF37" },
  { label: "Early Investor", icon: Star,  color: "#D4AF37" },
  { label: "Debt Free",      icon: Check, color: "#10b981" },
  { label: "Advance",        icon: Award, color: "#a78bfa" },
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
      style={{ ...PANEL, width: 212 }}
    >
      {/* ── Financial Level ── */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        style={GLASS}
      >
        {/* Gold accent top border */}
        <div style={{
          position:"absolute",top:0,left:"10%",right:"10%",height:1,
          background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)",
          borderRadius:1,
        }}/>

        <div style={SECTION_STYLE}>
          <div style={{width:3,height:10,borderRadius:2,background:"#D4AF37",boxShadow:"0 0 6px #D4AF3788"}}/>
          Financial Level
        </div>

        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black"
            style={{
              background: "linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.08))",
              border: "1.5px solid rgba(212,175,55,0.45)",
              color: "#D4AF37",
              boxShadow: "0 0 10px rgba(212,175,55,0.3)",
            }}
          >
            {level}
          </div>
          <span className="text-[10px] font-bold text-zinc-200">Level {level}: Wealth Builder</span>
        </div>

        {/* XP Progress */}
        <p className="text-[8px] text-zinc-500 mb-1.5">
          <span className="text-zinc-300 font-semibold">XP Progress</span>{"   "}towards next level
        </p>
        <div className="mb-2.5 h-[6px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 1.3, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg,#9a7f22,#D4AF37,#F5D060)",
              boxShadow: "0 0 10px rgba(212,175,55,0.6)",
            }}
          />
        </div>

        {/* Savings Streak */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame size={11} className="text-orange-400" />
            <span className="text-[8.5px] font-semibold text-zinc-300">Savings Streak</span>
          </div>
          <span
            className="text-[8.5px] font-bold text-orange-400"
            style={{
              background:"rgba(251,146,60,0.1)",
              padding:"1px 6px",
              borderRadius:4,
              border:"1px solid rgba(251,146,60,0.2)"
            }}
          >
            {streak} months
          </span>
        </div>
      </motion.div>

      {/* ── Achievement Badges ── */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        style={{...GLASS, position:"relative"}}
      >
        <div style={SECTION_STYLE}>
          <div style={{width:3,height:10,borderRadius:2,background:"#D4AF37",boxShadow:"0 0 6px #D4AF3788"}}/>
          Achievement Badges
        </div>
        <div className="flex items-end gap-2">
          {BADGES.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={i}
                className="flex flex-col items-center gap-1"
                whileHover={{ scale: 1.08 }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    background: `linear-gradient(135deg,${b.color}22,${b.color}08)`,
                    border: `1.5px solid ${b.color}44`,
                    boxShadow: `0 0 8px ${b.color}22`,
                  }}
                >
                  <Icon size={15} style={{ color: b.color }} />
                </div>
                <span className="text-center text-[7px] text-zinc-500 leading-tight max-w-[38px]">{b.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Goal Completion Rings ── */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        style={{...GLASS, position:"relative"}}
      >
        <div style={SECTION_STYLE}>
          <div style={{width:3,height:10,borderRadius:2,background:"#D4AF37",boxShadow:"0 0 6px #D4AF3788"}}/>
          Goal Completion Rings
        </div>
        <p className="text-[7.5px] text-zinc-600 mb-3 leading-snug">Goal celebratory animations upon completion</p>

        <div className="flex items-center justify-around mb-3">
          {goals.map((g, i) => {
            const r = 14, circ = 2 * Math.PI * r;
            const offset = circ - (g.percent / 100) * circ;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="relative" style={{ width: 42, height: 42 }}>
                  <svg className="absolute inset-0" style={{ transform: "rotate(-90deg)" }} viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <motion.circle
                      cx="18" cy="18" r={r} fill="none"
                      stroke={g.color} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={circ}
                      initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: offset }}
                      transition={{ duration: 1.3, delay: i * 0.14, ease: "easeOut" }}
                      style={{ filter: `drop-shadow(0 0 4px ${g.color}88)` }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-zinc-100">
                    {g.percent}%
                  </span>
                </div>
                <span className="text-[7px] text-zinc-500 text-center w-12 truncate">{g.name.split(" ")[0]}</span>
              </div>
            );
          })}
        </div>

        <div
          className="rounded-xl p-2.5"
          style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}
        >
          <p className="text-[8px] font-bold text-zinc-300 mb-0.5">Wealth Growth Journey</p>
          <p className="text-[7.5px] text-zinc-600 leading-snug">Visualised with premium glowing animations</p>
        </div>
      </motion.div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        style={{...GLASS, position:"relative"}}
      >
        <div style={SECTION_STYLE}>
          <div style={{width:3,height:10,borderRadius:2,background:"#D4AF37",boxShadow:"0 0 6px #D4AF3788"}}/>
          Quick Actions
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05, boxShadow: "0 0 14px rgba(212,175,55,0.25)" }}
                whileTap={{ scale: 0.96 }}
                className="flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all"
                style={{
                  background: "rgba(212,175,55,0.05)",
                  border: "1px solid rgba(212,175,55,0.16)",
                }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: "rgba(212,175,55,0.14)", boxShadow: "0 0 6px rgba(212,175,55,0.2)" }}
                >
                  <Icon size={12} style={{ color: "#D4AF37" }} />
                </div>
                <span className="text-center text-[7px] text-zinc-400 leading-tight">{a.label}</span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
