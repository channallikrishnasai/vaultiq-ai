"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Loader2, Edit2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
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

  // ----- Edit Twin Snapshot (Income / Expenses) -----
  const [editingTwin, setEditingTwin] = useState(false);
  const [editIncome, setEditIncome] = useState(0);
  const [editExpenses, setEditExpenses] = useState(0);
  // Advice state for leftover money recommendations
  const [advice, setAdvice] = useState<null | { invest: number; save: number; discretionary: number }>(null);

  const startEditTwin = () => {
    if (twin?.snapshot) {
      setEditIncome(twin.snapshot.income / 12);
      setEditExpenses(twin.snapshot.expenses);
      setEditingTwin(true);
    }
  };

  const handleTwinUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!twin) return;
    // editIncome is treated as monthly salary; convert to annual income
    const annualIncome = editIncome * 12;
    const updatedSnapshot = {
      ...twin.snapshot,
      income: annualIncome,
      expenses: editExpenses,
    };
    // Update twin state with new snapshot
    setTwin({ ...twin, snapshot: updatedSnapshot });
    setEditingTwin(false);
    // Dispatch event for other components (budget & envelope planner)
    window.dispatchEvent(
      new CustomEvent('twinSnapshotUpdated', {
        detail: { income: annualIncome, expenses: editExpenses },
      })
    );
  };

  useEffect(() => {
    fetchTwin();
  }, [fetchTwin]);

  // Listen for updates to income/expenses and compute advice
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { income, expenses } = e.detail;
      // Update snapshot values (income, expenses, netWorth) in twin state
      setTwin(prev => {
        if (!prev) return prev;
        const oldIncome = prev.snapshot.income;
        const oldExpenses = prev.snapshot.expenses;
        const netChange = (income - expenses) - (oldIncome - oldExpenses);
        const updatedSnapshot = {
          ...prev.snapshot,
          income,
          expenses,
          netWorth: Math.max(0, prev.snapshot.netWorth + netChange),
        };
        return { ...prev, snapshot: updatedSnapshot };
      });

      const leftover = income - expenses;
      const invest = Math.max(0, leftover * 0.3);
      const save = Math.max(0, leftover * 0.2);
      const discretionary = Math.max(0, leftover - invest - save);
      setAdvice({ invest, save, discretionary });
    };
    window.addEventListener('twinSnapshotUpdated', handler as EventListener);
    return () => window.removeEventListener('twinSnapshotUpdated', handler as EventListener);
  }, []);


  const recommendations = twin?.recommendations?.items ?? [];
  const summary = twin?.recommendations?.summary;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <DashboardHeader user={user} visible={true} />

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
            {/* Edit Income / Expenses button */}
            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={startEditTwin}
                className="flex items-center gap-2 rounded-md bg-violet-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-500"
              >
                <Edit2 className="h-4 w-4" /> Edit Income/Expense
              </button>
            </div>
            {/* Edit form */}
            {editingTwin && (
              <form onSubmit={handleTwinUpdate} className="mt-4 space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex flex-col">
                  <label className="text-xs text-zinc-400">Income</label>
                  <input
                    type="number"
                    value={editIncome}
                    onChange={(e) => setEditIncome(parseFloat(e.target.value))}
                    className="mt-1 rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-200"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-zinc-400">Expenses</label>
                  <input
                    type="number"
                    value={editExpenses}
                    onChange={(e) => setEditExpenses(parseFloat(e.target.value))}
                    className="mt-1 rounded bg-zinc-900 px-2 py-1 text-sm text-zinc-200"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTwin(false)}
                    className="rounded bg-zinc-600 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <TwinProjectionsChart
              projections={twin.projections}
              currentNetWorth={twin.snapshot.netWorth}
            />

            <TwinRecommendations recommendations={recommendations} summary={summary} />
            {/* Leftover Money Advice */}
            {advice && (
              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <h3 className="mb-2 text-lg font-semibold text-zinc-50">How to Use Your Leftover Money</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-200">
                  <li>Invest: {formatCurrency(advice.invest)}</li>
                  <li>Save: {formatCurrency(advice.save)}</li>
                  <li>Discretionary: {formatCurrency(advice.discretionary)}</li>
                </ul>
                {/* Suggestion based on discretionary amount */}
                <p className="mt-2 text-sm text-zinc-300">
                  {advice.discretionary > 0
                    ? `You have ${formatCurrency(advice.discretionary)} left. Consider allocating it to short‑term goals or a small emergency fund.`
                    : 'No remaining funds after recommended invest/save allocations.'}
                </p>
              </div>
            )}
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
