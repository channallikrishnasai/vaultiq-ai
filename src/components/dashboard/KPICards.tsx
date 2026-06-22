"use client";

import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KPICardsProps {
  netWorth: number;
  netWorthChange: number;
  netWorthChangePercent: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function KPICards({
  netWorth,
  netWorthChange,
  netWorthChangePercent,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
}: KPICardsProps) {
  const isNetWorthPositive = netWorthChange >= 0;

  const kpis = [
    {
      label: "Net Worth",
      value: formatCurrency(netWorth),
      change: `${isNetWorthPositive ? "+" : ""}${netWorthChangePercent.toFixed(1)}%`,
      isPositive: isNetWorthPositive,
      icon: Wallet,
      iconBg: "bg-teal-500/10",
      iconColor: "text-teal-400",
      borderColor: "border-teal-500/20",
      glowColor: "from-teal-500/5 to-transparent",
    },
    {
      label: "Monthly Income",
      value: formatCurrency(monthlyIncome),
      change: monthlyIncome > 0 ? "This month" : "No data",
      isPositive: true,
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
      glowColor: "from-emerald-500/5 to-transparent",
    },
    {
      label: "Monthly Expenses",
      value: formatCurrency(monthlyExpenses),
      change: monthlyExpenses > 0 ? "This month" : "No data",
      isPositive: false,
      icon: TrendingDown,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/20",
      glowColor: "from-rose-500/5 to-transparent",
    },
    {
      label: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      change: savingsRate > 20 ? "Healthy" : savingsRate > 0 ? "Work on it" : "Start saving",
      isPositive: savingsRate > 20,
      icon: PiggyBank,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20",
      glowColor: "from-blue-500/5 to-transparent",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const ChangeIcon = kpi.isPositive ? ArrowUpRight : ArrowDownRight;

        return (
          <div
            key={kpi.label}
            className={`group relative overflow-hidden rounded-2xl border ${kpi.borderColor} bg-zinc-900/40 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-zinc-900/60`}
          >
            {/* Subtle gradient glow on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${kpi.glowColor} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />

            <div className="relative flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                  <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                </div>
              </div>

              {kpi.label === "Net Worth" && (
                <div
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                    kpi.isPositive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-rose-500/10 text-rose-400"
                  }`}
                >
                  <ChangeIcon className="h-3 w-3" />
                  {kpi.change}
                </div>
              )}
            </div>

            <div className="relative mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {kpi.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-50">
                {kpi.value}
              </p>
              {kpi.label !== "Net Worth" && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    kpi.isPositive ? "text-emerald-400" : "text-zinc-500"
                  }`}
                >
                  {kpi.change}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}