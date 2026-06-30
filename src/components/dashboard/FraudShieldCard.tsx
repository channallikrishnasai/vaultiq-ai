"use client";

import Link from "next/link";
import { Shield, ArrowRight } from "lucide-react";

interface FraudShieldCardProps {
  scanCount: number;
  highRiskCount: number;
}

export default function FraudShieldCard({ scanCount, highRiskCount }: FraudShieldCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
          <Shield className="h-5 w-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">Fraud Shield</h3>
          <p className="text-xs text-zinc-500">Scam & phishing protection</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-2xl font-bold text-zinc-50">{scanCount}</p>
          <p className="text-xs text-zinc-500">Scans run</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <p className={`text-2xl font-bold ${highRiskCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {highRiskCount}
          </p>
          <p className="text-xs text-zinc-500">High risk detected</p>
        </div>
      </div>

      <Link
        href="/dashboard/fraud"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20"
      >
        Scan Suspicious Content
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
