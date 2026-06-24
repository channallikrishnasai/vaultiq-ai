"use client";

import { Lightbulb, CheckCircle2 } from "lucide-react";

interface TwinRecommendationsProps {
  recommendations: string[];
  summary?: string;
}

export function TwinRecommendations({ recommendations, summary }: TwinRecommendationsProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
          <Lightbulb className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-50">AI Recommendations</h3>
          {summary && <p className="text-xs text-zinc-500">{summary}</p>}
        </div>
      </div>

      <ul className="space-y-3">
        {recommendations.map((rec, i) => (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
            <span className="text-sm text-zinc-300">{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
