"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, TrendingUp, TrendingDown, Shield, Star,
  Receipt, BarChart3, RefreshCw, ChevronRight, Zap,
  AlertTriangle, ArrowRight, ShieldAlert, Activity,
  Target, Flame, Heart, Clock,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface CopilotCelebration {
  id: string;
  icon: string;
  title: string;
  message: string;
  category: string;
}

interface CopilotWarning {
  id: string;
  icon: string;
  title: string;
  message: string;
  severity: string;
  actionLabel?: string;
  actionHref?: string;
}

interface CopilotRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: string;
  actionLabel: string;
  actionHref: string;
}

interface CopilotActionSuggestion {
  id: string;
  icon: string;
  label: string;
  description: string;
  href: string;
  category: string;
}

interface CopilotBriefing {
  greeting: string;
  userName: string;
  contextLine: string;
  netWorth: number;
  savingsRate: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  healthScore: number;
  healthGrade: string;
  healthLabel: string;
  emergencyFundProgress: number;
  emergencyFundTarget: number;
  goalProgress: number;
  watchlistSummary: {
    hasWatchlist: boolean;
    topGainer: { symbol: string; changePercent: number } | null;
    topLoser: { symbol: string; changePercent: number } | null;
    biggestOpportunity: { symbol: string; reason: string } | null;
    activeAlertCount: number;
    marketStatus: "open" | "closed";
    watchlistMovers: number;
  };
  activeAlerts: { symbol: string; type: string; message: string | null }[];
  keyInsight: string;
  celebrations: CopilotCelebration[];
  warnings: CopilotWarning[];
  recommendations: CopilotRecommendation[];
  actionSuggestions: CopilotActionSuggestion[];
  generatedAt: string;
}

const CELEBRATION_ICON: Record<string, React.ReactNode> = {
  Shield: <Shield size={13} />,
  Target: <Target size={13} />,
  Flame: <Flame size={13} />,
  Heart: <Heart size={13} />,
  TrendingUp: <TrendingUp size={13} />,
};

const WARNING_ICON: Record<string, React.ReactNode> = {
  AlertTriangle: <AlertTriangle size={13} />,
  TrendingDown: <TrendingDown size={13} />,
  Clock: <Clock size={13} />,
  Activity: <Activity size={13} />,
  ShieldAlert: <ShieldAlert size={13} />,
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  Shield: <Shield size={14} />,
  TrendingUp: <TrendingUp size={14} />,
  Star: <Star size={14} />,
  Receipt: <Receipt size={14} />,
  BarChart3: <BarChart3 size={14} />,
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-amber-500/20 bg-amber-500/5",
  medium: "border-blue-500/20 bg-blue-500/5",
  low: "border-zinc-700/30 bg-zinc-800/30",
};

const PRIORITY_BADGES: Record<string, string> = {
  high: "bg-amber-500/20 text-amber-400",
  medium: "bg-blue-500/20 text-blue-400",
  low: "bg-zinc-700/30 text-zinc-400",
};

const SEVERITY_STYLES: Record<string, { border: string; bg: string; icon: string }> = {
  critical: { border: "border-red-500/20", bg: "bg-red-500/5", icon: "text-red-400" },
  warning: { border: "border-amber-500/20", bg: "bg-amber-500/5", icon: "text-amber-400" },
  info: { border: "border-blue-500/20", bg: "bg-blue-500/5", icon: "text-blue-400" },
};

export default function FinancialCopilotCard() {
  const [briefing, setBriefing] = useState<CopilotBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"overview" | "recommendations" | "actions">("overview");

  const fetchBriefing = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/copilot");
      if (!res.ok) throw new Error("Failed to load copilot data");
      const json = await res.json();
      setBriefing(json.data);
    } catch {
      setError("Unable to load AI copilot briefing");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  useEffect(() => {
    const interval = setInterval(() => fetchBriefing(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchBriefing]);

  if (isLoading && !briefing) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10">
            <Brain size={18} className="text-[#D4AF37] animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-50">AI Financial Copilot</h3>
            <p className="text-[11px] text-zinc-500">Analyzing your finances...</p>
          </div>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-zinc-800/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !briefing) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10">
            <Brain size={18} className="text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-50">AI Financial Copilot</h3>
            <p className="text-[11px] text-red-400">{error}</p>
          </div>
        </div>
        <button
          onClick={() => fetchBriefing()}
          className="flex items-center gap-2 text-xs text-[#D4AF37] hover:underline"
        >
          <RefreshCw size={12} /> Try again
        </button>
      </div>
    );
  }

  if (!briefing) return null;

  const emergencyPercent =
    briefing.emergencyFundTarget > 0
      ? Math.round((briefing.emergencyFundProgress / briefing.emergencyFundTarget) * 100)
      : 0;

  const hasAlerts = briefing.celebrations.length > 0 || briefing.warnings.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative rounded-2xl border border-zinc-800/60 bg-zinc-900/50 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.04) 0%, rgba(0,0,0,0.78) 100%)",
      }}
    >
      {/* Subtle glow effect */}
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
            <Brain size={18} className="text-[#D4AF37]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-50">AI Financial Copilot</h3>
              <MarketBadge status={briefing.watchlistSummary.marketStatus} />
            </div>
            <p className="text-[11px] text-zinc-500">
              {briefing.greeting}, {briefing.userName}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchBriefing(true)}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-[#D4AF37] hover:bg-zinc-800/50 transition-all disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Context line */}
      <div className="relative px-5 pb-2">
        <p className="text-[11px] text-zinc-500 leading-relaxed">{briefing.contextLine}</p>
      </div>

      {/* Section Tabs */}
      <div className="relative flex items-center gap-1 px-5 pb-2">
        {[
          { key: "overview" as const, label: "Overview" },
          { key: "recommendations" as const, label: "Recs", count: briefing.recommendations.length },
          { key: "actions" as const, label: "Actions" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeSection === tab.key
                ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-1 py-0.5 rounded-full text-[8px] font-bold bg-[#D4AF37]/20 text-[#D4AF37]">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative px-5 pb-4">
        <AnimatePresence mode="wait">
          {activeSection === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              {/* Celebrations */}
              {briefing.celebrations.length > 0 && (
                <div className="space-y-1.5">
                  {briefing.celebrations.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15"
                    >
                      <span className="mt-0.5 text-emerald-400 shrink-0">
                        {CELEBRATION_ICON[c.icon] ?? <Zap size={13} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-emerald-300">{c.title}</p>
                        <p className="text-[10px] text-zinc-400 leading-relaxed">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {briefing.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {briefing.warnings.map((w) => {
                    const style = SEVERITY_STYLES[w.severity] ?? SEVERITY_STYLES.info;
                    return (
                      <div
                        key={w.id}
                        className={`flex items-start gap-2 p-2 rounded-lg ${style.bg} border ${style.border}`}
                      >
                        <span className={`mt-0.5 shrink-0 ${style.icon}`}>
                          {WARNING_ICON[w.icon] ?? <AlertTriangle size={13} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-white">{w.title}</p>
                          <p className="text-[10px] text-zinc-400 leading-relaxed">{w.message}</p>
                          {w.actionLabel && w.actionHref && (
                            <Link
                              href={w.actionHref}
                              className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-[#D4AF37] hover:underline"
                            >
                              {w.actionLabel} <ArrowRight size={9} />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Key Metrics — compact 2x2 */}
              <div className="grid grid-cols-2 gap-2">
                <MetricPill label="Net Worth" value={formatCurrency(briefing.netWorth)} color="text-[#D4AF37]" />
                <MetricPill
                  label="Savings Rate"
                  value={`${briefing.savingsRate}%`}
                  color={briefing.savingsRate >= 20 ? "text-emerald-400" : "text-amber-400"}
                />
                <MetricPill
                  label="Health"
                  value={`${briefing.healthScore}`}
                  sub={briefing.healthGrade}
                  color={briefing.healthScore >= 65 ? "text-emerald-400" : "text-amber-400"}
                />
                <MetricPill
                  label="Goals"
                  value={`${briefing.goalProgress}%`}
                  color={briefing.goalProgress >= 50 ? "text-emerald-400" : "text-blue-400"}
                />
              </div>

              {/* Income & Expenses — compact */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-zinc-500">In</span>
                  <span className="text-zinc-300 font-medium">{formatCurrency(briefing.monthlyIncome)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-zinc-500">Out</span>
                  <span className="text-zinc-300 font-medium">{formatCurrency(briefing.monthlyExpenses)}</span>
                </span>
              </div>

              {/* Emergency Fund — compact bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Emergency Fund</span>
                  <span className="text-zinc-400">
                    {formatCurrency(briefing.emergencyFundProgress)} / {formatCurrency(briefing.emergencyFundTarget)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, emergencyPercent)}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    style={{
                      background:
                        emergencyPercent >= 80
                          ? "linear-gradient(90deg, #10b981, #34d399)"
                          : emergencyPercent >= 50
                            ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                            : "linear-gradient(90deg, #ef4444, #f87171)",
                    }}
                  />
                </div>
              </div>

              {/* Watchlist + Alerts — compact */}
              {briefing.watchlistSummary.hasWatchlist && (
                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px]">
                  {briefing.watchlistSummary.topGainer && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <TrendingUp size={11} />
                      <span className="font-medium">{briefing.watchlistSummary.topGainer.symbol}</span>
                      <span>+{briefing.watchlistSummary.topGainer.changePercent.toFixed(1)}%</span>
                    </span>
                  )}
                  {briefing.watchlistSummary.topLoser && (
                    <span className="flex items-center gap-1 text-red-400">
                      <TrendingDown size={11} />
                      <span className="font-medium">{briefing.watchlistSummary.topLoser.symbol}</span>
                      <span>{briefing.watchlistSummary.topLoser.changePercent.toFixed(1)}%</span>
                    </span>
                  )}
                  {briefing.watchlistSummary.biggestOpportunity && (
                    <span className="flex items-center gap-1 text-blue-400">
                      <Star size={11} />
                      <span className="font-medium">{briefing.watchlistSummary.biggestOpportunity.symbol}</span>
                      <span className="text-zinc-500">opportunity</span>
                    </span>
                  )}
                  {briefing.activeAlerts.length > 0 && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle size={11} />
                      <span>{briefing.activeAlerts.length} alert{briefing.activeAlerts.length > 1 ? "s" : ""}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Key Insight */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                <Zap size={13} className="text-[#D4AF37] mt-0.5 shrink-0" />
                <p className="text-[11px] text-zinc-300 leading-relaxed">{briefing.keyInsight}</p>
              </div>
            </motion.div>
          )}

          {activeSection === "recommendations" && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {briefing.recommendations.length === 0 ? (
                <p className="text-[11px] text-zinc-500 text-center py-5">
                  Your finances are in great shape — no recommendations right now.
                </p>
              ) : (
                briefing.recommendations.map((rec) => (
                  <Link
                    key={rec.id}
                    href={rec.actionHref}
                    className={`block p-2.5 rounded-xl border transition-all hover:scale-[1.01] ${PRIORITY_COLORS[rec.priority] ?? PRIORITY_COLORS.low}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-white">{rec.title}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${PRIORITY_BADGES[rec.priority] ?? PRIORITY_BADGES.low}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed mb-1.5">{rec.description}</p>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-[#D4AF37]">
                      {rec.actionLabel} <ArrowRight size={9} />
                    </span>
                  </Link>
                ))
              )}
            </motion.div>
          )}

          {activeSection === "actions" && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-1.5"
            >
              {briefing.actionSuggestions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-700/30 bg-zinc-800/30 hover:bg-zinc-800/60 hover:border-zinc-600/40 transition-all group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] group-hover:bg-[#D4AF37]/15 transition-all shrink-0">
                    {ACTION_ICONS[action.icon] ?? <Zap size={13} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-white truncate">{action.label}</p>
                    <p className="text-[9px] text-zinc-500 truncate">{action.description}</p>
                  </div>
                  <ChevronRight size={11} className="text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between px-5 py-2.5 border-t border-zinc-800/40">
        <span className="text-[9px] text-zinc-600">
          Updated {new Date(briefing.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div className="flex items-center gap-3">
          {hasAlerts && (
            <span className="flex items-center gap-1 text-[9px]">
              {briefing.celebrations.length > 0 && (
                <span className="text-emerald-400">{briefing.celebrations.length} win{briefing.celebrations.length > 1 ? "s" : ""}</span>
              )}
              {briefing.warnings.length > 0 && (
                <span className="text-amber-400">{briefing.warnings.length} alert{briefing.warnings.length > 1 ? "s" : ""}</span>
              )}
            </span>
          )}
          <Link
            href="/dashboard/health"
            className="flex items-center gap-1 text-[9px] font-medium text-[#D4AF37] hover:underline"
          >
            Full analysis <ArrowRight size={9} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function MetricPill({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="p-2 rounded-xl bg-zinc-800/30 border border-zinc-700/20">
      <p className="text-[9px] text-zinc-500 mb-0.5">{label}</p>
      <p className={`text-xs font-bold ${color}`}>
        {value}
        {sub && <span className="ml-0.5 text-[9px] font-medium opacity-70">{sub}</span>}
      </p>
    </div>
  );
}

function MarketBadge({ status }: { status: "open" | "closed" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
        status === "open"
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-zinc-700/30 text-zinc-500"
      }`}
    >
      <span
        className={`w-1 h-1 rounded-full ${
          status === "open" ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
        }`}
      />
      {status === "open" ? "LIVE" : "CLOSED"}
    </span>
  );
}
