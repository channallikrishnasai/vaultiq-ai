"use client";

import { Compass, ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";

interface PortfolioCardProps {
  portfolio: {
    totalValue: number;
    cashBalance: number;
    change: number;
    changePercent: number;
    allocation: {
      name: string;
      percent: number;
      color: string;
    }[];
    topHoldings: {
      name: string;
      value: number;
      change: number;
    }[];
    isEmpty: boolean;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PortfolioCard({ portfolio }: PortfolioCardProps) {
  if (portfolio.isEmpty) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Compass className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-50">Portfolio</h3>
            <p className="text-xs text-zinc-500">No portfolio yet</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-zinc-500">You have not created a portfolio.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Start tracking your investments today.
          </p>
          <Link
            href="/dashboard/portfolio"
            className="mt-4 flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-teal-400"
          >
            <Plus className="h-4 w-4" />
            Create Portfolio
          </Link>
        </div>
      </div>
    );
  }

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
            +{portfolio.changePercent.toFixed(1)}%
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
                +{holding.change.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
