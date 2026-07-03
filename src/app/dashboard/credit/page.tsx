"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Percent, ArrowUpRight, ShieldCheck, AlertCircle, TrendingUp, Info
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const SCORE_HISTORY = [
  { m: "Jan", s: 780 },
  { m: "Feb", s: 785 },
  { m: "Mar", s: 790 },
  { m: "Apr", s: 788 },
  { m: "May", s: 802 },
  { m: "Jun", s: 812 },
];

export default function CreditPage() {
  const [score, setScore] = useState<number>(812);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Credit Factors
  const factors = [
    { name: "Payment History", status: "Excellent", impact: "High", percent: 99, color: "bg-emerald-500" },
    { name: "Credit Utilization", status: "Good (14%)", impact: "High", percent: 86, color: "bg-emerald-400" },
    { name: "Credit Age", status: "Fair (4.2 yrs)", impact: "Medium", percent: 55, color: "bg-amber-400" },
    { name: "Total Accounts", status: "Excellent (12)", impact: "Low", percent: 90, color: "bg-emerald-500" },
    { name: "Recent Inquiries", status: "Good (1)", impact: "Medium", percent: 85, color: "bg-emerald-400" },
  ];

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Percent className="text-[#f59e0b] h-5 w-5" /> Credit Score Intelligence
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Analyze credit score components, track historical changes, and simulate improvement plans
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Credit Score Dial & History (6 Cols) */}
        <div className="col-span-6 space-y-4">
          
          {/* Credit Dial Box */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a] flex items-center justify-around">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 40}
                  strokeDashoffset={2 * Math.PI * 40 * (1 - score / 850)}
                  strokeLinecap="round"
                  style={{ filter: "drop-shadow(0 0 4px rgba(251,146,60,0.4))" }}
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Score</span>
                <h2 className="text-3xl font-extrabold text-white leading-none my-1">{score}</h2>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Excellent</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
                <ShieldCheck size={14} className="text-emerald-400" /> Safe range
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[180px]">
                Your score is in the top 15% nationally. You qualify for prime interest rates on loans.
              </p>
            </div>
          </div>

          {/* Score History Chart */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-[#f59e0b]" /> Historical Score Progression
            </h3>
            <div className="h-[140px] w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SCORE_HISTORY}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="m" stroke="#52525b" fontSize={8} tickLine={false} />
                    <YAxis domain={[700, 850]} stroke="#52525b" fontSize={8} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 9 }} />
                    <Area type="monotone" dataKey="s" stroke="#fb923c" strokeWidth={1.5} fillOpacity={1} fill="url(#scoreGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Factors List (6 Cols) */}
        <div className="col-span-6 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Key Score Factors</h3>
          <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {factors.map((f, i) => (
              <div key={i} className="p-2.5 rounded-lg border border-zinc-800/40 bg-zinc-900/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white block">{f.name}</span>
                    <span className="text-[9px] text-zinc-500">Impact: {f.impact}</span>
                  </div>
                  <span className="font-semibold text-zinc-300">{f.status}</span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
