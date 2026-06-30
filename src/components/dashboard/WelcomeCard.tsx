"use client";

import Link from "next/link";
import { ArrowUpRight, Plus, TrendingUp, Wallet } from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface WelcomeCardProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
  greeting: string;
  netWorth: number;
  netWorthChange: number;
  netWorthChangePercent: number;
  profile: {
    income: number;
    currency: string;
    riskAppetite: string;
    xp: number;
    streak: number;
  } | null;
}

export default function WelcomeCard({
  user,
  greeting,
  netWorth,
  netWorthChange,
  netWorthChangePercent,
  profile,
}: WelcomeCardProps) {
  const displayName = 
  user.name ||
  user.email.split("@")[0] || 
  "User";
  const isPositive = netWorthChange >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 sm:p-8">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-zinc-500">
              {greeting}, {displayName}
            </p>
            {!profile && (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">
                Complete Profile
              </span>
            )}
          </div>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {formatCurrency(netWorth)}
          </h2>

          <div className="mt-2 flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-sm font-medium ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <ArrowUpRight
                className={`h-4 w-4 ${!isPositive ? "rotate-90" : ""}`}
              />
              {isPositive ? "+" : ""}
              {formatCurrency(netWorthChange)} ({netWorthChangePercent.toFixed(1)}%)
            </span>
            <span className="text-sm text-zinc-600">this month</span>
          </div>

          {profile && (
            <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
              <span>Income: {formatCurrency(profile.income)}</span>
              <span className="h-3 w-px bg-zinc-800" />
              <span>Streak: {profile.streak} days</span>
              <span className="h-3 w-px bg-zinc-800" />
              <span>XP: {profile.xp}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/expenses"
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Link>
          <Link
            href="/dashboard/invest"
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
          >
            <TrendingUp className="h-4 w-4" />
            Review Investments
          </Link>
          <Link
            href="/dashboard/health"
            className="flex items-center gap-2 rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm font-medium text-teal-400 transition-colors hover:bg-teal-500/20"
          >
            <Wallet className="h-4 w-4" />
            Check Score
          </Link>
        </div>
      </div>
    </div>
  );
}