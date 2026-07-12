"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, TrendingUp, TrendingDown, Shield, Target,
  CheckCircle, XCircle, Info, Zap, ArrowRight, RefreshCw,
  BarChart3, Wallet, Calendar,
} from "lucide-react";
import { formatCurrency } from "@/utils/format";

interface DailyBrief {
  greeting: string;
  summary: string;
  highlights: string[];
}

interface SmartAlert {
  id: string;
  type: "warning" | "danger" | "success" | "info";
  title: string;
  message: string;
  action?: string;
}

interface HealthExplanation {
  overall: string;
  factors: { name: string; passed: boolean; detail: string }[];
}

interface GoalForecast {
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  percentComplete: number;
  projectedCompletionDate: string | null;
  monthlyContributionNeeded: number;
  onTrack: boolean;
  recommendation: string;
}

interface CashFlowMonth {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface TwinInsight {
  profile: string;
  strengths: string[];
  weaknesses: string[];
  riskLevel: string;
  nextAction: string;
}

interface IntelligenceData {
  dailyBrief: DailyBrief;
  smartAlerts: SmartAlert[];
  healthExplanation: HealthExplanation;
  goalForecasts: GoalForecast[];
  cashFlowTimeline: CashFlowMonth[];
  twinInsight: TwinInsight;
  emptyStates: string[];
}

const alertIcons: Record<string, React.ReactNode> = {
  danger: <AlertTriangle size={14} className="text-red-400" />,
  warning: <AlertTriangle size={14} className="text-amber-400" />,
  success: <CheckCircle size={14} className="text-emerald-400" />,
  info: <Info size={14} className="text-blue-400" />,
};

const alertBorders: Record<string, string> = {
  danger: "border-red-500/20",
  warning: "border-amber-500/20",
  success: "border-emerald-500/20",
  info: "border-blue-500/20",
};

const alertBg: Record<string, string> = {
  danger: "bg-red-500/5",
  warning: "bg-amber-500/5",
  success: "bg-emerald-500/5",
  info: "bg-blue-500/5",
};

function MiniBarChart({ data }: { data: CashFlowMonth[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expenses)), 1);

  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
          <div className="w-full flex flex-col items-center gap-0.5" style={{ height: 60 }}>
            <div
              className="w-full rounded-t-sm bg-emerald-500/60"
              style={{ height: `${(d.income / maxVal) * 100}%`, minHeight: d.income > 0 ? 2 : 0 }}
            />
            <div
              className="w-full rounded-t-sm bg-red-500/60"
              style={{ height: `${(d.expenses / maxVal) * 100}%`, minHeight: d.expenses > 0 ? 2 : 0 }}
            />
          </div>
          <span className="text-[6px] text-zinc-500 truncate w-full text-center">{d.month.split(" ")[0]}</span>
        </div>
      ))}
    </div>
  );
}

async function fetchIntelligence(): Promise<IntelligenceData> {
  const res = await fetch("/api/dashboard/intelligence");
  if (!res.ok) throw new Error("Failed to fetch intelligence");
  return res.json();
}

export default function DashboardIntelligence() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"brief" | "alerts" | "health" | "goals" | "cashflow" | "twin">("brief");

  const { data, isLoading } = useQuery<IntelligenceData>({
    queryKey: ["intelligence"],
    queryFn: fetchIntelligence,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["intelligence"] });
  };

  if (isLoading && !data) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw size={14} className="text-[#D4AF37] animate-spin" />
          <span className="text-sm text-zinc-400">Loading intelligence...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-800/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tabs = [
    { key: "brief" as const, label: "Brief", icon: <Zap size={12} /> },
    { key: "alerts" as const, label: "Alerts", icon: <AlertTriangle size={12} />, count: data.smartAlerts.length },
    { key: "health" as const, label: "Health", icon: <Shield size={12} /> },
    { key: "goals" as const, label: "Goals", icon: <Target size={12} /> },
    { key: "cashflow" as const, label: "Cash Flow", icon: <BarChart3 size={12} /> },
    { key: "twin" as const, label: "Twin", icon: <Wallet size={12} /> },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex items-center gap-1 px-3 pt-3 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 text-red-400">
                {tab.count}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={handleRefresh}
          className="ml-auto p-1.5 rounded-lg text-zinc-500 hover:text-[#D4AF37] hover:bg-zinc-800/50 transition-all"
          title="Refresh"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === "brief" && (
            <motion.div
              key="brief"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-sm font-semibold text-white mb-1">
                {data.dailyBrief.greeting}
              </p>
              <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                {data.dailyBrief.summary}
              </p>
              <div className="space-y-2">
                {data.dailyBrief.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed"
                  >
                    <span className="mt-1 w-1 h-1 rounded-full bg-[#D4AF37] shrink-0" />
                    {h}
                  </div>
                ))}
              </div>
              {data.emptyStates.length > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                  {data.emptyStates.map((s, i) => (
                    <p key={i} className="text-xs text-[#D4AF37]/70 leading-relaxed">
                      {s}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {data.smartAlerts.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">
                  No alerts — your finances are looking good!
                </p>
              ) : (
                data.smartAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border ${alertBorders[alert.type]} ${alertBg[alert.type]}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {alertIcons[alert.type]}
                      <span className="text-xs font-semibold text-white">{alert.title}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed ml-5">
                      {alert.message}
                    </p>
                    {alert.action && (
                      <button className="mt-2 ml-5 flex items-center gap-1 text-[10px] font-medium text-[#D4AF37] hover:underline">
                        {alert.action} <ArrowRight size={10} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "health" && (
            <motion.div
              key="health"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs text-zinc-400 mb-3">{data.healthExplanation.overall}</p>
              <div className="space-y-2">
                {data.healthExplanation.factors.map((f, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2.5 rounded-lg ${
                      f.passed ? "bg-emerald-500/5 border border-emerald-500/10" : "bg-red-500/5 border border-red-500/10"
                    }`}
                  >
                    {f.passed ? (
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-red-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{f.name}</p>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "goals" && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {data.goalForecasts.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-4">
                  Set financial goals to see forecasts and recommendations.
                </p>
              ) : (
                data.goalForecasts.map((g) => (
                  <div
                    key={g.goalId}
                    className={`p-3 rounded-xl border ${
                      g.onTrack ? "border-emerald-500/10" : "border-amber-500/10"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{g.goalName}</span>
                      <span className={`text-[10px] font-bold ${g.onTrack ? "text-emerald-400" : "text-amber-400"}`}>
                        {g.percentComplete}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${g.onTrack ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${Math.min(100, g.percentComplete)}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>{formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}</span>
                      {g.projectedCompletionDate && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <Calendar size={10} />
                          <span>{g.projectedCompletionDate}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-1.5 text-[10px] text-zinc-500 leading-relaxed">{g.recommendation}</p>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "cashflow" && (
            <motion.div
              key="cashflow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-zinc-500">Income</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-zinc-500">Expenses</span>
                </div>
              </div>
              <MiniBarChart data={data.cashFlowTimeline} />
              <div className="mt-3 space-y-1">
                {data.cashFlowTimeline.slice(-3).map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">{d.month}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400">+{formatCurrency(d.income)}</span>
                      <span className="text-red-400">-{formatCurrency(d.expenses)}</span>
                      <span className={d.net >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                        {d.net >= 0 ? "+" : ""}{formatCurrency(d.net)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "twin" && (
            <motion.div
              key="twin"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-xs text-zinc-400 mb-3">{data.twinInsight.profile}</p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] font-semibold text-emerald-400 mb-1.5">Strengths</p>
                  {data.twinInsight.strengths.length === 0 ? (
                    <p className="text-[10px] text-zinc-500">None identified yet</p>
                  ) : (
                    data.twinInsight.strengths.map((s, i) => (
                      <p key={i} className="text-[10px] text-zinc-400 leading-relaxed flex items-start gap-1">
                        <CheckCircle size={9} className="text-emerald-400 mt-0.5 shrink-0" />
                        {s}
                      </p>
                    ))
                  )}
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[10px] font-semibold text-amber-400 mb-1.5">Weaknesses</p>
                  {data.twinInsight.weaknesses.length === 0 ? (
                    <p className="text-[10px] text-zinc-500">None identified</p>
                  ) : (
                    data.twinInsight.weaknesses.map((w, i) => (
                      <p key={i} className="text-[10px] text-zinc-400 leading-relaxed flex items-start gap-1">
                        <AlertTriangle size={9} className="text-amber-400 mt-0.5 shrink-0" />
                        {w}
                      </p>
                    ))
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-zinc-400">Risk Level:</span>
                  <span className="text-[10px] font-bold text-[#D4AF37]">{data.twinInsight.riskLevel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Zap size={10} className="text-[#D4AF37] mt-0.5 shrink-0" />
                  <p className="text-[10px] text-zinc-300 leading-relaxed">{data.twinInsight.nextAction}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
