"use client";

import Link from "next/link";
import { Target, Shield, TrendingUp, Home, Plus } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { fadeInUp } from "@/lib/motion";

interface GoalsCardProps {
  goals: {
    id: string;
    name: string;
    target: number;
    current: number;
    color: string;
    icon: string;
    percent: number;
  }[];
  totalGoals?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Shield,
  TrendingUp,
  Home,
  Target,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function GoalsCard({ goals, totalGoals = 0 }: GoalsCardProps) {
  const hasGoals = goals.length > 0;

  return (
    <motion.div
      {...fadeInUp}
      className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all hover:border-blue-500/20"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Target className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-50">Financial Goals</h3>
            <p className="text-xs text-zinc-500">Top priorities</p>
          </div>
        </div>
        {totalGoals > goals.length && (
          <Link href="/dashboard#goals" className="text-xs text-teal-400 hover:text-teal-300">
            View all ({totalGoals}) →
          </Link>
        )}
      </div>

      {hasGoals ? (
        <div className="space-y-4">
          {goals.map((goal, i) => {
            const Icon = iconMap[goal.icon] || Target;
            const textColor = goal.color.replace("bg-", "text-");

            return (
              <div key={goal.id} className="rounded-xl bg-zinc-950/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${goal.color}/10`}>
                      <Icon className={`h-4 w-4 ${textColor}`} />
                    </div>
                    <span className="text-sm font-medium text-zinc-200">{goal.name}</span>
                  </div>
                  <span className="text-xs text-zinc-500">{goal.percent}%</span>
                </div>

                <div className="mb-2 overflow-hidden rounded-full bg-zinc-800">
                  <motion.div
                    className={`h-2 rounded-full ${goal.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.percent}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
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
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-zinc-500">No goals set yet.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Create your first financial goal to start tracking.
          </p>
          <Link
            href="/dashboard#goals"
            className="mt-4 flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-teal-400"
          >
            <Plus className="h-4 w-4" />
            Create Goal
          </Link>
        </div>
      )}
    </motion.div>
  );
}
