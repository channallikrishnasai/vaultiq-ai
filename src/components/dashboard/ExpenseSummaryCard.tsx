"use client";

import { expenses } from "@/lib/dashboard-data";
import { Brain } from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ExpenseSummaryCard() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
            <Brain className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-50">
              Expense Summary
            </h3>
            <p className="text-xs text-zinc-500">This month</p>
          </div>
        </div>
        <span className="text-lg font-bold text-zinc-50">
          {formatCurrency(expenses.total)}
        </span>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {expenses.categories.map((cat) => (
          <div key={cat.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-400">{cat.name}</span>
              <span className="text-zinc-500">
                {formatCurrency(cat.amount)} ({cat.percent}%)
              </span>
            </div>
            <div className="overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-2 rounded-full ${cat.color} transition-all duration-700`}
                style={{ width: `${cat.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}