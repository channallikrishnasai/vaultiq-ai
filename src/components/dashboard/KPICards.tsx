"use client";

import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { formatCurrency } from "@/utils/format";

interface KPICardsProps {
  netWorth: number;
  netWorthChange: number;
  netWorthChangePercent: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export default function KPICards({
  netWorth,
  netWorthChangePercent,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
}: KPICardsProps) {
  const isNetWorthPositive = netWorthChangePercent >= 0;

  const kpis = [
    {
      label: "Net Worth",
      rawValue: netWorth,
      isCurrency: true,
      isPercent: false,
      change: `${isNetWorthPositive ? "+" : ""}${netWorthChangePercent.toFixed(1)}%`,
      isPositive: isNetWorthPositive,
      icon: Wallet,
      iconBg: "bg-teal-500/10",
      iconColor: "text-teal-400",
      borderColor: "border-teal-500/20",
      glowColor: "from-teal-500/5 to-transparent",
      showChangeBadge: true,
    },
    {
      label: "Monthly Income",
      rawValue: monthlyIncome,
      isCurrency: true,
      isPercent: false,
      change: monthlyIncome > 0 ? "This month" : "No data",
      isPositive: true,
      icon: TrendingUp,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20",
      glowColor: "from-emerald-500/5 to-transparent",
      showChangeBadge: false,
    },
    {
      label: "Monthly Expenses",
      rawValue: monthlyExpenses,
      isCurrency: true,
      isPercent: false,
      change: monthlyExpenses > 0 ? "This month" : "No data",
      isPositive: false,
      icon: TrendingDown,
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-400",
      borderColor: "border-rose-500/20",
      glowColor: "from-rose-500/5 to-transparent",
      showChangeBadge: false,
    },
    {
      label: "Savings Rate",
      rawValue: savingsRate,
      isCurrency: false,
      isPercent: true,
      change: savingsRate >= 30 ? "Healthy" : savingsRate > 0 ? "Work on it" : "Start saving",
      isPositive: savingsRate >= 20,
      icon: PiggyBank,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20",
      glowColor: "from-blue-500/5 to-transparent",
      showChangeBadge: false,
    },
  ] as const;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const ChangeIcon = kpi.isPositive ? ArrowUpRight : ArrowDownRight;

        return (
          <motion.div
            key={kpi.label}
            variants={fadeInUp}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`group relative overflow-hidden rounded-2xl border ${kpi.borderColor} bg-zinc-900/40 p-5 backdrop-blur-sm`}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${kpi.glowColor} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />

            <div className="relative flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.iconBg}`}>
                <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>

              {kpi.showChangeBadge && (
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
                {kpi.rawValue > 0 ? (
                  <AnimatedNumber
                    value={kpi.rawValue}
                    formatter={(n) =>
                      kpi.isPercent ? formatPercent(n) : formatCurrency(n)
                    }
                  />
                ) : (
                  kpi.isPercent ? formatPercent(kpi.rawValue) : formatCurrency(kpi.rawValue)
                )}
              </p>
              {!kpi.showChangeBadge && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    kpi.isPositive ? "text-emerald-400" : "text-zinc-500"
                  }`}
                >
                  {kpi.change}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
