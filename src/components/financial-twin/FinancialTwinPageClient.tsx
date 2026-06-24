"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Loader2 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { GenerateTwinPanel, RegenerateButton } from "@/components/financial-twin/GenerateTwinPanel";
import { TwinSnapshotCard } from "@/components/financial-twin/TwinSnapshotCard";
import { TwinProjectionsChart } from "@/components/financial-twin/TwinProjectionsChart";
import { TwinRecommendations } from "@/components/financial-twin/TwinRecommendations";

interface TwinData {
  id: string;
  name: string;
  healthScore: number;
  riskAppetite: string;
  snapshot: {
    income: number;
    expenses: number;
    savings: number;
    investments: number;
    debt: number;
    netWorth: number;
    savingsRate: number;
  };
  projections: {
    oneYear: number;
    threeYear: number;
    fiveYear: number;
    tenYear: number;
  };
  recommendations: {
    items: string[];
    summary: string;
  };
}

interface FinancialTwinPageClientProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function FinancialTwinPageClient({ user }: FinancialTwinPageClientProps) {
  const [twin, setTwin] = useState<TwinData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTwin = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/financial-twin");
      const json = await res.json();
      if (json.success && json.data.active) {
        const active = json.data.active;
        setTwin({
          id: active.id,
          name: active.name,
          healthScore: active.healthScore,
          riskAppetite: active.riskAppetite,
          snapshot: active.snapshot as TwinData["snapshot"],
          projections: active.projections as TwinData["projections"],
          recommendations: active.recommendations as TwinData["recommendations"],
        });
      } else {
        setTwin(null);
      }
    } catch {
      setTwin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTwin();
  }, [fetchTwin]);

  const recommendations = twin?.recommendations?.items ?? [];
  const summary = twin?.recommendations?.summary;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardHeader user={user} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Bot className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-50">Financial Twin</h1>
                <p className="text-sm text-zinc-500">
                  AI-powered digital replica of your financial life
                </p>
              </div>
            </div>
          </div>
          {twin && <RegenerateButton onGenerated={fetchTwin} />}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : twin ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div>
                <p className="text-xs text-zinc-500">Active Twin</p>
                <p className="text-lg font-semibold text-zinc-50">{twin.name}</p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div>
                <p className="text-xs text-zinc-500">Health Score</p>
                <p className="text-lg font-semibold text-emerald-400">{twin.healthScore}/100</p>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div>
                <p className="text-xs text-zinc-500">Risk Profile</p>
                <p className="text-lg font-semibold capitalize text-zinc-200">
                  {twin.riskAppetite.toLowerCase()}
                </p>
              </div>
            </div>

            <TwinSnapshotCard snapshot={twin.snapshot} />

            <TwinProjectionsChart
              projections={twin.projections}
              currentNetWorth={twin.snapshot.netWorth}
            />

            <TwinRecommendations recommendations={recommendations} summary={summary} />
          </div>
        ) : (
          <div className="mx-auto max-w-lg">
            <div className="mb-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-8 text-center">
              <Bot className="mx-auto mb-4 h-12 w-12 text-violet-400/50" />
              <h2 className="mb-2 text-lg font-semibold text-zinc-50">No Twin Yet</h2>
              <p className="text-sm text-zinc-500">
                Generate your Financial Twin to see projections, scenarios, and personalized
                recommendations based on your real financial data.
              </p>
            </div>
            <GenerateTwinPanel onGenerated={fetchTwin} />
          </div>
        )}

        {twin && (
          <div className="mx-auto max-w-lg">
            <GenerateTwinPanel
              onGenerated={fetchTwin}
              currentNetWorth={twin.snapshot.netWorth}
            />
          </div>
        )}
      </div>
    </main>
  );
}
