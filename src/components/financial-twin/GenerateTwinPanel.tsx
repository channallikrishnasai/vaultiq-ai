"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RISK_APPETITE_OPTIONS, scenarioProjection } from "@/lib/twin-utils";
import type { RiskAppetite } from "@/generated/prisma/enums";
import { formatCurrency } from "@/utils/format";

interface GenerateTwinPanelProps {
  onGenerated: () => void;
  currentNetWorth?: number;
}

export function GenerateTwinPanel({ onGenerated, currentNetWorth = 0 }: GenerateTwinPanelProps) {
  const [loading, setLoading] = useState(false);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>("MODERATE");
  const [extraSavings, setExtraSavings] = useState(5000);

  const scenario5Y = scenarioProjection(currentNetWorth, extraSavings, 5, riskAppetite);
  const scenario10Y = scenarioProjection(currentNetWorth, extraSavings, 10, riskAppetite);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financial-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskAppetite }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Generation failed");
      toast.success("Financial Twin generated!");
      onGenerated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6">
      <h3 className="mb-4 text-base font-semibold text-zinc-50">Generate Your Twin</h3>

      <div className="mb-4">
        <p className="mb-2 text-xs text-zinc-500">Risk Appetite</p>
        <div className="grid grid-cols-3 gap-2">
          {RISK_APPETITE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRiskAppetite(opt.value)}
              className={`rounded-xl border p-3 text-left transition ${
                riskAppetite === opt.value
                  ? "border-teal-500/50 bg-teal-500/10"
                  : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
              }`}
            >
              <p className="text-xs font-medium text-zinc-200">{opt.label}</p>
              <p className="text-[10px] text-zinc-500">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs text-zinc-500">What-if: Extra monthly savings</p>
          <span className="text-sm font-medium text-teal-400">{formatCurrency(extraSavings)}/mo</span>
        </div>
        <input
          type="range"
          min={0}
          max={50000}
          step={1000}
          value={extraSavings}
          onChange={(e) => setExtraSavings(Number(e.target.value))}
          className="w-full accent-teal-500"
        />
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-2">
            <span className="text-zinc-500">5Y scenario: </span>
            <span className="font-medium text-zinc-200">{formatCurrency(scenario5Y)}</span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-2">
            <span className="text-zinc-500">10Y scenario: </span>
            <span className="font-medium text-zinc-200">{formatCurrency(scenario10Y)}</span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full bg-teal-500 text-zinc-950 hover:bg-teal-400"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Twin...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Financial Twin
          </>
        )}
      </Button>

      <p className="mt-3 text-center text-xs text-zinc-600">
        Uses your real expenses, goals, and portfolio data
      </p>
    </div>
  );
}

export function RegenerateButton({ onGenerated }: { onGenerated: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financial-twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Regeneration failed");
      toast.success("Twin updated with latest data");
      onGenerated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Regeneration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegenerate}
      disabled={loading}
      className="border-zinc-700 text-zinc-300"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <RefreshCw className="mr-1 h-3 w-3" />
          Refresh Twin
        </>
      )}
    </Button>
  );
}
