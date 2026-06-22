"use client";

import { user } from "@/lib/dashboard-data";
import { ArrowUpRight, Plus, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function WelcomeCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 sm:p-8">
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            {getGreeting()}, {user.name}
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            {formatCurrency(user.netWorth)}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-medium text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
              +{formatCurrency(user.netWorthChange)} ({user.netWorthChangePercent}%)
            </span>
            <span className="text-sm text-zinc-600">this month</span>
          </div>
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