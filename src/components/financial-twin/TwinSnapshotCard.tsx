"use client";

import { Wallet, TrendingUp, PiggyBank, CreditCard, Percent } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface TwinSnapshotCardProps {
  snapshot: {
    income: number;
    expenses: number;
    savings: number;
    investments: number;
    debt: number;
    netWorth: number;
    savingsRate: number;
  };
}

export function TwinSnapshotCard({ snapshot }: TwinSnapshotCardProps) {
  const items = [
    { label: "Annual Income", value: snapshot.income, icon: Wallet, color: "text-teal-400" },
    { label: "Annual Expenses", value: snapshot.expenses, icon: CreditCard, color: "text-rose-400" },
    { label: "Savings", value: snapshot.savings, icon: PiggyBank, color: "text-emerald-400" },
    { label: "Investments", value: snapshot.investments, icon: TrendingUp, color: "text-violet-400" },
    { label: "Debt", value: snapshot.debt, icon: CreditCard, color: "text-amber-400" },
    { label: "Savings Rate", value: snapshot.savingsRate, icon: Percent, color: "text-blue-400", isPercent: true },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-50">Financial Snapshot</h3>
        <div className="text-right">
          <p className="text-xs text-zinc-500">Net Worth</p>
          <p className="text-lg font-bold text-teal-400">{formatCurrency(snapshot.netWorth)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3"
            >
              <div className="mb-1 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${item.color}`} />
                <span className="text-xs text-zinc-500">{item.label}</span>
              </div>
              <p className="text-sm font-semibold text-zinc-200">
                {"isPercent" in item && item.isPercent
                  ? `${item.value}%`
                  : formatCurrency(item.value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
