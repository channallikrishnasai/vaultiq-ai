"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Info,
} from "lucide-react";
import { getRiskBandColor, getRiskScoreColor } from "@/lib/fraud-utils";
import type { FraudAnalysisResponse } from "./FraudAnalyzer";

interface FraudResultCardProps {
  result: FraudAnalysisResponse;
}

const BAND_GLOW: Record<string, string> = {
  Safe: "shadow-emerald-500/20",
  Medium: "shadow-amber-500/20",
  High: "shadow-rose-500/30",
};

export function FraudResultCard({ result }: FraudResultCardProps) {
  const bandColor = getRiskBandColor(result.riskBand);
  const scoreColor = getRiskScoreColor(result.riskScore);

  const Icon =
    result.riskBand === "Safe"
      ? ShieldCheck
      : result.riskBand === "Medium"
        ? ShieldAlert
        : AlertTriangle;

  const indicators = result.threatIndicators ?? [result.threatCategory];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`overflow-hidden rounded-2xl border backdrop-blur-sm ${bandColor} shadow-xl ${BAND_GLOW[result.riskBand] ?? ""}`}
    >
      {/* Hero risk score section */}
      <div className="border-b border-white/5 bg-black/20 p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={result.riskBand === "High" ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: result.riskBand === "High" ? Infinity : 0, duration: 2 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/30 ring-1 ring-white/10"
            >
              <Icon className="h-8 w-8" />
            </motion.div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-60">
                Threat Assessment
              </p>
              <h4 className="text-2xl font-bold">{result.riskBand} Risk</h4>
              <p className="text-sm opacity-80">{result.threatCategory}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className={`relative flex h-24 w-24 items-center justify-center rounded-full border-4 bg-black/30 ${
                  result.riskBand === "High"
                    ? "border-rose-500/60"
                    : result.riskBand === "Medium"
                      ? "border-amber-500/60"
                      : "border-emerald-500/60"
                }`}
              >
                <span className={`text-3xl font-black ${scoreColor}`}>{result.riskScore}</span>
              </motion.div>
              <p className="mt-1 text-xs opacity-60">Risk Score / 100</p>
            </div>
            {result.confidence != null && (
              <div className="rounded-xl bg-black/20 px-3 py-2 text-center ring-1 ring-white/10">
                <Sparkles className="mx-auto mb-1 h-4 w-4 opacity-70" />
                <p className="text-lg font-bold">{result.confidence}%</p>
                <p className="text-[10px] uppercase tracking-wider opacity-60">Confidence</p>
              </div>
            )}
          </div>
        </div>

        {/* Threat indicator chips */}
        <div className="mt-5 flex flex-wrap gap-2">
          {indicators.map((indicator) => (
            <span
              key={indicator}
              className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs font-medium backdrop-blur-sm"
            >
              {indicator}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-5 p-6">
        {/* Why flagged */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Info className="h-4 w-4 opacity-70" />
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
              Why It Was Flagged
            </p>
          </div>
          <p className="text-sm leading-relaxed opacity-90">{result.explanation}</p>
        </div>

        {/* Recommended actions */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider opacity-70">
            Recommended Actions
          </p>
          <ul className="space-y-2">
            {result.actions.map((action, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-3 text-sm"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                <span>{action}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
