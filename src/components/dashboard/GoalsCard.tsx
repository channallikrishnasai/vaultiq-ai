"use client";

import { goals } from "@/lib/dashboard-data";
import { Target, Shield, Plane, Home } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Shield,
  Plane,
  Home,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function GoalsCard() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
          <Target className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">
            Financial Goals
          </h3>
          <p className="text-xs text-zinc-500">Track your progress</p>
        </div>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const percent = Math.round((goal.current / goal.target) * 100);
          const Icon = iconMap[goal.icon] || Target;

          return (
            <div key={goal.id} className="rounded-xl bg-zinc-950/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${goal.color}/10`}
                  >
                    <Icon className={`h-4 w-4 ${goal.color.replace("bg-", "text-")}`} />
                  </div>
                  <span className="text-sm font-medium text-zinc-200">
                    {goal.name}
                  </span>
                </div>
                <span className="text-xs text-zinc-500">{percent}%</span>
              </div>

              <div className="mb-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-2 rounded-full ${goal.color} transition-all duration-700`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{formatCurrency(goal.current)}</span>
                <span>{formatCurrency(goal.target)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}