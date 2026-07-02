"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, Tooltip,
} from "recharts";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CARD: React.CSSProperties = {
  position: "absolute",
  background: "rgba(6,6,10,0.88)",
  border: "1px solid rgba(212,175,55,0.18)",
  borderRadius: 14,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.05)",
  overflow: "hidden",
  padding: "12px 14px",
  color: "#fff",
  zIndex: 5,
};

const SPARK = [
  { v: 30 }, { v: 55 }, { v: 40 }, { v: 70 }, { v: 60 }, { v: 85 }, { v: 75 }, { v: 95 },
];
const MINI_CASHFLOW = [
  { m: "Inflow", v: 80, c: "#10b981" }, { m: "Outflow", v: 40, c: "#ef4444" },
  { m: "", v: 60, c: "#10b981" }, { m: "", v: 30, c: "#ef4444" },
];
const PIE = [
  { name: "Asset class", value: 60, color: "#10b981" },
  { name: "Performance", value: 20, color: "#D4AF37" },
  { name: "Asset", value: 20, color: "#60a5fa" },
];
const SAVINGS_SPARK = [
  { v: 20 }, { v: 35 }, { v: 30 }, { v: 50 }, { v: 45 }, { v: 60 }, { v: 55 },
];
const GOALS_SPARK = [
  { v: 25 }, { v: 40 }, { v: 55 }, { v: 50 }, { v: 70 }, { v: 65 }, { v: 80 },
];

const TT = { contentStyle: { display: "none" }, cursor: false as any };

interface Props {
  netWorth?: number;
  portfolio?: { totalValue: number; changePercent: number };
  monthlyIncome?: number;
  savingsRate?: number;
  healthScore?: number;
  goals?: { name: string; percent: number }[];
}

export default function DashboardFloatingCards({
  netWorth = 1280450.78,
  portfolio = { totalValue: 0, changePercent: 14.5 },
  monthlyIncome = 7890.12,
  savingsRate = 48.9,
  healthScore = 94,
  goals = [],
}: Props) {
  const goalList = goals.length
    ? goals.slice(0, 3)
    : [
        { name: "Home purchase", percent: 32 },
        { name: "Retirement", percent: 90 },
        { name: "Vacation", percent: 55 },
      ];

  return (
    <>
      {/* ── Portfolio Performance — top center ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          ...CARD,
          width: 200,
          top: "4%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-zinc-400">Portfolio Performance</span>
          <span className="text-[7px] text-zinc-600">···</span>
        </div>
        <p className="text-[7.5px] text-zinc-500 mb-1">Overall return</p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold text-[#D4AF37]">+15.45%</span>
          <span className="text-[8px] text-emerald-400">+14.55%</span>
        </div>
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SPARK}>
              <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} dot={false} />
              <Tooltip {...TT} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[7px] text-zinc-600">Debt volume</span>
          <span className="text-[7px] text-rose-400">-76.82%</span>
          <span className="text-[7px] text-zinc-600">Best invest</span>
        </div>
      </motion.div>

      {/* ── Net Worth — left upper ── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        style={{ ...CARD, width: 164, top: "12%", left: "19%" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-zinc-400">Net Worth</span>
          <span className="text-[7px] text-zinc-600">···</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-1">Total assets</p>
        <p className="text-base font-bold text-[#D4AF37] leading-none mb-2">${fmt(netWorth)}</p>
        <div className="h-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[...SPARK, { v: 100 }]}>
              <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} dot={false} />
              <Tooltip {...TT} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[7px] text-emerald-400">+13,250.00</span>
          <span className="text-[7px] text-zinc-600">2016 2020 2023 2025</span>
        </div>
      </motion.div>

      {/* ── Tax Planner — left mid ── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35 }}
        style={{ ...CARD, width: 172, top: "30%", left: "19%", borderColor: "rgba(96,165,250,0.2)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[8px] uppercase tracking-widest text-blue-400">Tax Planner</span>
          <span className="text-[7px] text-zinc-600">···</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-2">Projected tax liability</p>
        <div className="space-y-1">
          {[
            { k: "Amounts", v: "$1,500.00", c: "text-zinc-200" },
            { k: "Due date", v: "08.06.2023", c: "text-zinc-400" },
            { k: "Dep. cont", v: "08.06.2023", c: "text-zinc-400" },
            { k: "Tax tax", v: "03.05.2023", c: "text-zinc-400" },
            { k: "Deadlines", v: "08.06.2022", c: "text-zinc-400" },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-[7px] text-zinc-500">{r.k}</span>
              </div>
              <span className={`text-[7px] ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Fraud Shield + AI Twin — left lower-mid ── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        style={{ ...CARD, width: 172, top: "50%", left: "19%", borderColor: "rgba(251,146,60,0.2)" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[8px] font-bold text-orange-400 mb-1">Fraud Shield</p>
            <div className="space-y-0.5">
              <p className="text-[7px] text-zinc-500">AI Twin</p>
              <p className="text-[7px] text-zinc-500">Unique option</p>
              <p className="text-[7px] text-zinc-500">Persona/ Perspective</p>
              <p className="text-[7px] text-zinc-500">The/locality metrics</p>
            </div>
          </div>
          {/* Avatar placeholder */}
          <div
            className="h-16 w-12 shrink-0 rounded-lg"
            style={{
              background: "linear-gradient(135deg, #1a3a4a, #0d2535)",
              border: "1px solid rgba(96,165,250,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="h-8 w-8 rounded-full" style={{ background: "rgba(96,165,250,0.2)", border: "1px solid rgba(96,165,250,0.4)" }} />
          </div>
        </div>
      </motion.div>

      {/* ── Tax Planner 2 — left bottom ── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45 }}
        style={{ ...CARD, width: 172, top: "67%", left: "19%", borderColor: "rgba(96,165,250,0.2)" }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[8px] uppercase tracking-widest text-blue-400">Tax Planner</span>
          <span className="text-[7px] text-zinc-600">···</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-1.5">Projected tax liability</p>
        <div className="space-y-1">
          {[
            { k: "Amounts", v: "226,000" },
            { k: "Deductions", v: "-$6,000" },
            { k: "Due dates", v: "Sue date" },
            { k: "Payment", v: "5$S 2023" },
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[7px] text-zinc-500">{r.k}</span>
              <span className="text-[7px] text-zinc-200">{r.v}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Monthly Income — right upper ── */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        style={{ ...CARD, width: 172, top: "12%", right: "25%", borderColor: "rgba(16,185,129,0.2)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-emerald-400">Monthly Income</span>
          <span className="text-[7px] text-zinc-600">···</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-1">Primary/secondary sources</p>
        <p className="text-base font-bold text-white leading-none mb-0.5">${fmt(monthlyIncome)}</p>
        <span className="text-[7.5px] text-emerald-400 mb-2 block">↑ Growth</span>
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SPARK}>
              <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} dot={false} />
              <Tooltip {...TT} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Cash Flow — right mid ── */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35 }}
        style={{ ...CARD, width: 172, top: "30%", right: "25%", borderColor: "rgba(96,165,250,0.2)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-blue-400">Cash Flow</span>
          <span className="text-[7px] text-emerald-400">+</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-1">Inflow vs. outflow · Liquidity ratio</p>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MINI_CASHFLOW}>
              <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                {MINI_CASHFLOW.map((e, i) => <Cell key={i} fill={e.c} />)}
              </Bar>
              <Tooltip {...TT} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[7px] text-emerald-400">Inflow</span>
          <span className="text-[7px] text-rose-400">Outflow</span>
        </div>
      </motion.div>

      {/* ── Savings Rate — right lower-mid ── */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        style={{ ...CARD, width: 172, top: "50%", right: "25%", borderColor: "rgba(212,175,55,0.2)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-[#D4AF37]">Savings Rate</span>
          <span className="text-[7px] text-emerald-400">+</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-1">Percentage saved · Benchmark comparison</p>
        <div className="h-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SAVINGS_SPARK}>
              <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} dot={false} />
              <Tooltip {...TT} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[7px] text-zinc-500">Savings</span>
          <span className="text-[7px] text-zinc-500">Progress</span>
        </div>
      </motion.div>

      {/* ── Emergency Fund — right bottom ── */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.45 }}
        style={{ ...CARD, width: 172, top: "65%", right: "25%", borderColor: "rgba(96,165,250,0.2)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-blue-400">Emergency Fund</span>
          <span className="text-[7px] text-emerald-400">+</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-2">Current balance vs. goal</p>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ v: 85 }, { v: 15 }]} innerRadius={14} outerRadius={22} dataKey="v" startAngle={90} endAngle={-270}>
                  <Cell fill="#60a5fa" />
                  <Cell fill="rgba(255,255,255,0.06)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-blue-400">85%</span>
          </div>
          <div>
            <p className="text-[7px] text-zinc-500">Month</p>
            <p className="text-[7px] text-zinc-500">coverage</p>
          </div>
        </div>
      </motion.div>

      {/* ── Goals Progress — bottom left ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ ...CARD, width: 172, bottom: "8%", left: "19%" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-purple-400">Goals Progress</span>
          <span className="text-[7px] text-zinc-600">···</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-2">Visualisation of progress</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            {goalList.map((g, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full shrink-0" style={{ background: ["#D4AF37","#10b981","#60a5fa"][i] }} />
                <span className="text-[6.5px] text-zinc-500 truncate flex-1">{g.name}</span>
              </div>
            ))}
          </div>
          <div className="relative h-10 w-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ v: 90 }, { v: 10 }]} innerRadius={12} outerRadius={18} dataKey="v" startAngle={90} endAngle={-270}>
                  <Cell fill="#10b981" />
                  <Cell fill="rgba(255,255,255,0.06)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-emerald-400">90%</span>
          </div>
        </div>
      </motion.div>

      {/* ── Financial Health Score — bottom center ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        style={{
          ...CARD,
          width: 172,
          bottom: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          borderColor: "rgba(16,185,129,0.2)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-emerald-400">Financial Health Score</span>
          <span className="text-[7px] text-emerald-400">+</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-1">Calculated by AI</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <p className="text-[7px] text-zinc-500">• Key factors</p>
            <p className="text-[7px] text-zinc-500">• Improvement suggestions</p>
            <p className="text-[7px] text-zinc-500">• Colour score</p>
          </div>
          <div className="relative h-12 w-12">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ v: healthScore }, { v: 100 - healthScore }]} innerRadius={14} outerRadius={22} dataKey="v" startAngle={90} endAngle={-270}>
                  <Cell fill="#10b981" />
                  <Cell fill="rgba(255,255,255,0.06)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-emerald-400">{healthScore}</span>
          </div>
        </div>
        <p className="text-sm font-bold text-emerald-400 mt-1">{healthScore}/100</p>
      </motion.div>

      {/* ── Investment Returns — bottom right ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ ...CARD, width: 172, bottom: "8%", right: "25%" }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[8px] uppercase tracking-widest text-[#D4AF37]">Investment Returns</span>
          <span className="text-[7px] text-emerald-400">+</span>
        </div>
        <p className="text-[7px] text-zinc-500 mb-2">ROI over various periods · good often</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-0.5">
            <p className="text-[7px] text-zinc-500">• Asset class</p>
            <p className="text-[7px] text-zinc-500">• Performance</p>
            <p className="text-[7px] text-zinc-500">• Asset</p>
            <p className="text-[7px] text-zinc-500">• Heatmap</p>
          </div>
          <div className="relative h-10 w-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={PIE} innerRadius={12} outerRadius={18} dataKey="value">
                  {PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-[#D4AF37]">90%</span>
          </div>
        </div>
      </motion.div>
    </>
  );
}
