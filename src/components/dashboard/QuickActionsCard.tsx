"use client";

import Link from "next/link";
import {
  Plus,
  Target,
  Compass,
  Wallet,
  Settings,
  Rocket,
} from "lucide-react";

export default function QuickActionsCard() {
  const actions = [
    {
      label: "Add Expense",
      href: "/dashboard/expenses",
      icon: Plus,
    },
    {
      label: "Add Goal",
      href: "/dashboard/goals",
      icon: Target,
    },
    {
      label: "Portfolio",
      href: "/dashboard/portfolio",
      icon: Compass,
    },
    {
      label: "Add Income",
      href: "/dashboard/profile",
      icon: Wallet,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-zinc-50">
          Quick Actions
        </h3>
        <p className="text-xs text-zinc-500">
          Manage your finances faster
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 transition-all hover:border-teal-500/30 hover:bg-zinc-900"
            >
              <Icon className="h-4 w-4 text-teal-400" />
              <span className="text-sm text-zinc-300">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>

      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-teal-400">
        <Rocket className="h-4 w-4" />
        Load Demo Data
      </button>
    </div>
  );
}