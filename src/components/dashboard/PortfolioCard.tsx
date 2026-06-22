"use client";

import { portfolio } from "@/lib/dashboard-data";
import { Compass, ArrowUpRight } from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PortfolioCard() {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Compass className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-50">Portfolio</h3>
            <p className="text-xs text-zinc-500">Total value</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-zinc-50">
            {formatCurrency(portfolio.totalValue)}
          </span>
          <div className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            +{portfolio.changePercent}%
          </div>
        </div>
      </div>

      {/* Allocation Bar */}
      <div className="mb-5 flex h-3 overflow-hidden rounded-full">
        {portfolio.allocation.map((item) => (
          <div
            key={item.name}
            className={`${item.color} first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${item.percent}%` }}
          />
        ))}
      </div>

      {/* Allocation Legend */}
      <div className="mb-5 grid grid-cols-2 gap-2">
        {portfolio.allocation.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            <span className="text-xs text-zinc-400">
              {item.name} ({item.percent}%)
            </span>
          </div>
        ))}
      </div>

      {/* Top Holdings */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
          Top Holdings
        </p>
        {portfolio.topHoldings.map((holding) => (
          <div
            key={holding.name}
            className="flex items-center justify-between rounded-lg bg-zinc-950/50 px-3 py-2"
          >
            <span className="text-sm text-zinc-300">{holding.name}</span>
            <div className="text-right">
              <span className="block text-sm font-medium text-zinc-50">
                {formatCurrency(holding.value)}
              </span>
              <span className="text-xs text-emerald-400">
                +{holding.change}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}