"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { getRiskBandColor, getRiskScoreColor } from "@/lib/fraud-utils";
import type { FraudAnalysisResponse } from "./FraudAnalyzer";

interface FraudResultCardProps {
  result: FraudAnalysisResponse;
}

export function FraudResultCard({ result }: FraudResultCardProps) {
  const bandColor = getRiskBandColor(result.riskBand);
  const scoreColor = getRiskScoreColor(result.riskScore);

  const Icon =
    result.riskBand === "Safe"
      ? ShieldCheck
      : result.riskBand === "Medium"
        ? ShieldAlert
        : AlertTriangle;

  return (
    <div className={`rounded-2xl border p-6 ${bandColor}`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6" />
          <div>
            <h4 className="text-lg font-semibold">{result.riskBand} Risk</h4>
            <p className="text-sm opacity-80">{result.threatCategory}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-3xl font-bold ${scoreColor}`}>{result.riskScore}</span>
          <p className="text-xs opacity-70">/ 100</p>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed opacity-90">{result.explanation}</p>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
          Recommended Actions
        </p>
        <ul className="space-y-2">
          {result.actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
