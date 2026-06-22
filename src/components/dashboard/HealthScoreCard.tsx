"use client";

import { healthScore } from "@/lib/dashboard-data";
import { Heart } from "lucide-react";

export default function HealthScoreCard() {
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset =
    circumference - (healthScore.score / healthScore.maxScore) * circumference;

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <Heart className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">
            Financial Health
          </h3>
          <p className="text-xs text-zinc-500">Overall wellness score</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Radial Score */}
        <div className="relative flex h-32 w-32 flex-shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#27272a"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#healthGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient
                id="healthGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-zinc-50">
              {healthScore.score}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400">
              {healthScore.label}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2.5">
          {healthScore.breakdown.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-16 text-xs text-zinc-500">{item.name}</span>
              <div className="flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-1.5 rounded-full bg-teal-500 transition-all duration-700"
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-zinc-400">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}