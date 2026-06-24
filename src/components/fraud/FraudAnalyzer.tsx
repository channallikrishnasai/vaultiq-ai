"use client";

import { useState } from "react";
import { Shield, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FRAUD_INPUT_TYPES, FRAUD_EXAMPLES } from "@/lib/fraud-utils";
import { FraudResultCard } from "./FraudResultCard";
import type { FraudInputType } from "@/generated/prisma/enums";

export interface FraudAnalysisResponse {
  riskScore: number;
  riskBand: "Safe" | "Medium" | "High";
  threatCategory: string;
  explanation: string;
  actions: string[];
  reportId: string;
}

interface FraudAnalyzerProps {
  onAnalyzed?: () => void;
}

export function FraudAnalyzer({ onAnalyzed }: FraudAnalyzerProps) {
  const [inputType, setInputType] = useState<FraudInputType>("MESSAGE");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FraudAnalysisResponse | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/fraud/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputType, content: content.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Analysis failed");
      setResult(json.data);
      toast.success("Analysis complete");
      onAnalyzed?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
            <Shield className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-50">Fraud Shield Analyzer</h3>
            <p className="text-xs text-zinc-500">
              Paste suspicious SMS, links, or phone numbers for instant analysis
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FRAUD_INPUT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setInputType(type.value as FraudInputType)}
              className={`rounded-xl border p-3 text-left transition-all ${
                inputType === type.value
                  ? "border-teal-500/50 bg-teal-500/10"
                  : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
              }`}
            >
              <span className="text-lg">{type.icon}</span>
              <p className="mt-1 text-xs font-medium text-zinc-300">{type.label}</p>
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste suspicious message, link, or phone number here..."
          rows={5}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500">Try example:</span>
          {FRAUD_EXAMPLES.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setContent(example)}
              className="rounded-lg border border-zinc-800 px-2 py-1 text-xs text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-300"
            >
              Example {i + 1}
            </button>
          ))}
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={loading || !content.trim()}
          className="mt-4 w-full bg-teal-500 text-zinc-950 hover:bg-teal-400"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze for Fraud
            </>
          )}
        </Button>
      </div>

      {result && <FraudResultCard result={result} />}
    </div>
  );
}
