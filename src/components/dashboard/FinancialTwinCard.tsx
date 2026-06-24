"use client";

import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface FinancialTwinCardProps {
  hasTwin: boolean;
  healthScore?: number;
  netWorth?: number;
  twinName?: string;
}

export default function FinancialTwinCard({
  hasTwin,
  healthScore = 0,
  netWorth = 0,
  twinName,
}: FinancialTwinCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <Bot className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">Financial Twin</h3>
          <p className="text-xs text-zinc-500">Digital financial replica</p>
        </div>
      </div>

      {hasTwin ? (
        <div className="mb-4 space-y-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
            <p className="text-xs text-zinc-500">{twinName ?? "My Financial Twin"}</p>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold text-teal-400">{formatCurrency(netWorth)}</span>
              <span className="text-xs text-emerald-400">Health {healthScore}/100</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-zinc-500">
          Generate your AI-powered financial twin to see projections and personalized advice.
        </p>
      )}

      <Link
        href="/dashboard/twin"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20"
      >
        {hasTwin ? "View Twin" : "Generate Twin"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
