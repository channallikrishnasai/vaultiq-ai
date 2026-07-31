"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Target, AlertTriangle, CheckCircle2,
  Clock, Wallet, PieChart, Activity, Brain, Zap, Calendar,
  ArrowUpRight, ArrowDownRight, RefreshCw, Loader2,
  Shield, DollarSign, BarChart3, Info, Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart,
} from "recharts";
import GlassCard from "./GlassCard";

interface CashFlowPrediction {
  horizon: number;
  currentBalance: number;
  predictedBalance: number;
  expectedIncome: number;
  expectedExpenses: number;
  remainingBudget: number;
  monthlySavings: number;
  dailySpendingAllowance: number;
  confidence: number;
}

interface GoalPrediction {
  name: string;
  target: number;
  current: number;
  remaining: number;
  percentComplete: number;
  estimatedCompletionDate: string | null;
  monthsRemaining: number | null;
  completionProbability: number;
  requiredMonthlyContribution: number;
  advice: string;
}

interface BudgetPrediction {
  category: string;
  budget: number;
  predictedSpend: number;
  remaining: number;
  risk: "low" | "medium" | "high";
  warning: string | null;
}

interface PortfolioPrediction {
  currentValue: number;
  predictedValue30d: number;
  predictedValue90d: number;
  predictedValue1y: number;
  riskDrift: number;
  diversificationScore: number;
  sipGrowth: number;
  allocationImbalance: string | null;
  recommendations: string[];
}

interface PredictionAlert {
  id: string;
  severity: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  confidence: number;
  recommendedAction: string;
  category: string;
}

interface TimelineEvent {
  date: string;
  label: string;
  type: string;
  amount: number | null;
  description: string;
  confidence: number;
}

interface PredictionData {
  cashFlow: CashFlowPrediction[];
  goals: GoalPrediction[];
  budget: BudgetPrediction[];
  portfolio: PortfolioPrediction;
  alerts: PredictionAlert[];
  timeline: TimelineEvent[];
  generatedAt: string;
}

interface ScenarioResult {
  current: { netWorth: number; savingsRate: number; emergencyMonths: number; healthScore: number; goalProgress: number; monthlyBalance: number };
  scenario: { netWorth: number; savingsRate: number; emergencyMonths: number; healthScore: number; goalProgress: number; monthlyBalance: number };
  difference: { netWorth: number; savingsRate: number; emergencyMonths: number; healthScore: number; goalProgress: number; monthlyBalance: number };
}

interface RiskAssessment {
  overallRisk: string;
  score: number;
  factors: { name: string; score: number; maxScore: number; status: string; detail: string }[];
  recommendations: string[];
}

const SEVERITY_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>; color: string; bg: string }> = {
  critical: { icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  info: { icon: Info, color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
  success: { icon: CheckCircle2, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
};

const RISK_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#ef4444",
};

const TIMELINE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  income: DollarSign,
  expense: Wallet,
  goal: Target,
  bill: AlertTriangle,
  insurance: Shield,
  tax: BarChart3,
  portfolio: PieChart,
  budget: Activity,
  savings: TrendingUp,
};

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

function getConfidenceColor(c: number): string {
  if (c >= 0.8) return "#10b981";
  if (c >= 0.6) return "#f59e0b";
  return "#ef4444";
}

// ── Cash Flow Card ───────────────────────────────────────────────────────────

function CashFlowSection({ cashFlow }: { cashFlow: CashFlowPrediction[] }) {
  const [horizon, setHorizon] = useState(30);
  const selected = cashFlow.find((c) => c.horizon === horizon) || cashFlow[1] || cashFlow[0];

  const chartData = cashFlow.map((c) => ({
    label: `${c.horizon}d`,
    balance: c.predictedBalance,
    income: c.expectedIncome,
    expenses: c.expectedExpenses,
  }));

  return (
    <GlassCard delay={0.1} glow="gold">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-amber-400" />
            <h3 className="text-xs font-medium text-amber-300">Cash Flow Forecast</h3>
          </div>
          <div className="flex gap-1">
            {[7, 30, 90].map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className="px-2 py-0.5 rounded-md text-[10px] font-medium transition-all"
                style={{
                  background: horizon === h ? "rgba(212,175,55,0.12)" : "transparent",
                  color: horizon === h ? "#D4AF37" : "#71717a",
                  border: horizon === h ? "1px solid rgba(212,175,55,0.2)" : "1px solid transparent",
                }}
              >
                {h}d
              </button>
            ))}
          </div>
        </div>

        {selected && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: "Current Balance", value: formatCurrency(selected.currentBalance), icon: Wallet, color: "#D4AF37" },
              { label: "Predicted Balance", value: formatCurrency(selected.predictedBalance), icon: TrendingUp, color: "#10b981" },
              { label: "Expected Income", value: formatCurrency(selected.expectedIncome), icon: ArrowUpRight, color: "#10b981" },
              { label: "Expected Expenses", value: formatCurrency(selected.expectedExpenses), icon: ArrowDownRight, color: "#ef4444" },
              { label: "Monthly Savings", value: formatCurrency(selected.monthlySavings), icon: Target, color: "#D4AF37" },
              { label: "Daily Allowance", value: formatCurrency(selected.dailySpendingAllowance), icon: Clock, color: "#3b82f6" },
            ].map((item) => (
              <div key={item.label} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-1 mb-1">
                  <item.icon size={10} style={{ color: item.color }} />
                  <span className="text-[9px] text-zinc-500">{item.label}</span>
                </div>
                <p className="text-sm font-bold text-zinc-100">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#71717a" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "rgba(10,7,3,0.95)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8, fontSize: 10 }} />
              <Area type="monotone" dataKey="balance" stroke="#D4AF37" fill="url(#balanceGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[9px] text-zinc-500">Confidence: {Math.round(selected.confidence * 100)}%</span>
          <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${selected.confidence * 100}%`, background: getConfidenceColor(selected.confidence) }} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Goal Forecast Card ───────────────────────────────────────────────────────

function GoalForecastSection({ goals }: { goals: GoalPrediction[] }) {
  return (
    <GlassCard delay={0.15} glow="green">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-emerald-400" />
          <h3 className="text-xs font-medium text-emerald-300">Goal Forecasts</h3>
        </div>
        {goals.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No goals to forecast</p>
        ) : (
          <div className="space-y-2">
            {goals.map((goal) => (
              <div key={goal.name} className="p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-zinc-200">{goal.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${goal.completionProbability >= 0.7 ? "#10b981" : goal.completionProbability >= 0.4 ? "#f59e0b" : "#ef4444"}15`, color: goal.completionProbability >= 0.7 ? "#10b981" : goal.completionProbability >= 0.4 ? "#f59e0b" : "#ef4444" }}>
                    {Math.round(goal.completionProbability * 100)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.percentComplete}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ background: goal.completionProbability >= 0.7 ? "#10b981" : "#f59e0b" }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-zinc-500">{goal.percentComplete}% done</span>
                  {goal.estimatedCompletionDate && (
                    <span className="text-zinc-400">ETA: {goal.estimatedCompletionDate}</span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">{goal.advice}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Budget Forecast Card ─────────────────────────────────────────────────────

function BudgetForecastSection({ budget }: { budget: BudgetPrediction[] }) {
  return (
    <GlassCard delay={0.2} glow="none">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-cyan-400" />
          <h3 className="text-xs font-medium text-cyan-300">Budget Forecast</h3>
        </div>
        {budget.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No budgets set</p>
        ) : (
          <div className="space-y-2">
            {budget.map((b) => {
              const ratio = b.budget > 0 ? b.predictedSpend / b.budget : 0;
              return (
                <div key={b.category} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-zinc-300">{b.category}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${RISK_COLORS[b.risk]}15`, color: RISK_COLORS[b.risk] }}>
                      {b.risk}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                      transition={{ duration: 0.6 }}
                      style={{ background: RISK_COLORS[b.risk] }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-zinc-500">Predicted: {formatCurrency(b.predictedSpend)}</span>
                    <span className="text-zinc-400">Budget: {formatCurrency(b.budget)}</span>
                  </div>
                  {b.warning && <p className="text-[9px] text-zinc-500 mt-1">{b.warning}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Predictive Alerts Card ───────────────────────────────────────────────────

function AlertsSection({ alerts }: { alerts: PredictionAlert[] }) {
  return (
    <GlassCard delay={0.25} glow="none">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-400" />
          <h3 className="text-xs font-medium text-amber-300">Predictive Alerts</h3>
          {alerts.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
              {alerts.length}
            </span>
          )}
        </div>
        {alerts.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No alerts</p>
        ) : (
          <div className="space-y-1.5">
            {alerts.slice(0, 5).map((alert) => {
              const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
              const Icon = config.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 p-2 rounded-lg"
                  style={{ background: config.bg, border: `1px solid ${config.color}18` }}
                >
                  <Icon size={12} style={{ color: config.color }} className="mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-zinc-200">{alert.title}</p>
                    <p className="text-[9px] text-zinc-400 mt-0.5">{alert.message}</p>
                    <p className="text-[8px] text-zinc-500 mt-0.5">Confidence: {Math.round(alert.confidence * 100)}%</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Timeline Card ────────────────────────────────────────────────────────────

function TimelineSection({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <GlassCard delay={0.3} glow="none">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} className="text-purple-400" />
          <h3 className="text-xs font-medium text-purple-300">Smart Timeline</h3>
        </div>
        {timeline.length === 0 ? (
          <p className="text-xs text-zinc-500 text-center py-4">No events</p>
        ) : (
          <div className="space-y-1.5">
            {timeline.slice(0, 6).map((event, i) => {
              const Icon = TIMELINE_ICONS[event.type] || Clock;
              return (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}>
                    <Icon size={12} className="text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium text-zinc-200">{event.label}</p>
                    <p className="text-[9px] text-zinc-500">{event.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-zinc-400">{event.date}</p>
                    {event.amount && <p className="text-[9px] font-medium text-zinc-300">{formatCurrency(event.amount)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Portfolio Forecast Card ──────────────────────────────────────────────────

function PortfolioSection({ portfolio }: { portfolio: PortfolioPrediction }) {
  if (portfolio.currentValue === 0) return null;

  const data = [
    { label: "Now", value: portfolio.currentValue },
    { label: "30d", value: portfolio.predictedValue30d },
    { label: "90d", value: portfolio.predictedValue90d },
    { label: "1Y", value: portfolio.predictedValue1y },
  ];

  return (
    <GlassCard delay={0.35} glow="none">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <PieChart size={14} className="text-blue-400" />
          <h3 className="text-xs font-medium text-blue-300">Portfolio Forecast</h3>
        </div>
        <div className="h-24 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#71717a" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#71717a" }} axisLine={false} tickLine={false} width={50} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "rgba(10,7,3,0.95)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 8, fontSize: 10 }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[9px] text-zinc-500">Expected Growth (1Y)</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(portfolio.predictedValue1y - portfolio.currentValue)}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-[9px] text-zinc-500">SIP Growth</p>
            <p className="text-sm font-bold text-blue-400">{formatCurrency(portfolio.sipGrowth)}</p>
          </div>
        </div>
        {portfolio.recommendations.length > 0 && (
          <div className="mt-2 space-y-1">
            {portfolio.recommendations.map((rec, i) => (
              <p key={i} className="text-[9px] text-zinc-400 flex items-start gap-1">
                <Sparkles size={8} className="text-blue-400 mt-0.5 shrink-0" />
                {rec}
              </p>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Scenario Simulator ───────────────────────────────────────────────────────

function ScenarioSimulator() {
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  const scenarios = [
    "What if I save ₹2000 more per month?",
    "What if I reduce food spending by ₹3000?",
    "What if my salary increases by ₹10000?",
    "What if I stop Netflix subscription?",
    "What if I increase SIP by ₹5000?",
  ];

  const handleRun = async (message: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scenario", params: parseScenarioInput(message) }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch {}
    setLoading(false);
  };

  const parseScenarioInput = (msg: string) => {
    const params: Record<string, number> = {};
    const saveMore = msg.match(/save\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (saveMore) params.extraMonthlySavings = parseInt(saveMore[1].replace(/,/g, ""), 10);
    const reduceFood = msg.match(/reduce.*food.*(?:by)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (reduceFood) params.expenseReduction = parseInt(reduceFood[1].replace(/,/g, ""), 10);
    const salaryUp = msg.match(/salary.*(?:by)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (salaryUp) params.incomeIncrease = parseInt(salaryUp[1].replace(/,/g, ""), 10);
    const stopSub = msg.match(/stop.*(?:netflix|hotstar|spotify|subscription)/);
    if (stopSub) params.stopSubscription = 500;
    const increaseSip = msg.match(/increase.*sip.*(?:by)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (increaseSip) params.extraMonthlySavings = parseInt(increaseSip[1].replace(/,/g, ""), 10);
    return params;
  };

  return (
    <GlassCard delay={0.4} glow="gold">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-amber-400" />
          <h3 className="text-xs font-medium text-amber-300">AI Scenario Simulator</h3>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {scenarios.map((s) => (
            <button
              key={s}
              onClick={() => handleRun(s)}
              className="px-2 py-1 rounded-lg text-[9px] transition-all hover:bg-[rgba(212,175,55,0.12)]"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa" }}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={18} className="text-amber-400 animate-spin" />
          </div>
        )}

        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            {[
              { label: "Net Worth", current: result.current.netWorth, scenario: result.scenario.netWorth, diff: result.difference.netWorth, fmt: true },
              { label: "Savings Rate", current: result.current.savingsRate, scenario: result.scenario.savingsRate, diff: result.difference.savingsRate, fmt: false, suffix: "%" },
              { label: "Monthly Savings", current: result.current.monthlyBalance, scenario: result.scenario.monthlyBalance, diff: result.difference.monthlyBalance, fmt: true },
              { label: "Health Score", current: result.current.healthScore, scenario: result.scenario.healthScore, diff: result.difference.healthScore, fmt: false, suffix: "/100" },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-[10px] text-zinc-400">{m.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500">{m.fmt ? formatCurrency(m.current) : `${m.current}${m.suffix || ""}`}</span>
                  <ArrowUpRight size={10} className={m.diff >= 0 ? "text-emerald-400" : "text-red-400"} />
                  <span className="text-[10px] font-medium text-zinc-200">{m.fmt ? formatCurrency(m.scenario) : `${m.scenario}${m.suffix || ""}`}</span>
                  <span className={`text-[9px] font-medium ${m.diff >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {m.diff >= 0 ? "+" : ""}{m.fmt ? formatCurrency(m.diff) : m.diff}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Risk Assessment Card ─────────────────────────────────────────────────────

function RiskSection({ risk }: { risk: RiskAssessment | null }) {
  if (!risk) return null;

  return (
    <GlassCard delay={0.45} glow="none">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-purple-400" />
          <h3 className="text-xs font-medium text-purple-300">Risk Assessment</h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${RISK_COLORS[risk.overallRisk] || "#f59e0b"}15`, color: RISK_COLORS[risk.overallRisk] || "#f59e0b" }}>
            {risk.overallRisk}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={RISK_COLORS[risk.overallRisk] || "#f59e0b"}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${risk.score}, 100` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-200">{risk.score}</span>
          </div>
          <div className="flex-1 space-y-1">
            {risk.factors.slice(0, 4).map((f) => (
              <div key={f.name} className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-400 w-20 truncate">{f.name}</span>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${f.score}%`, background: f.status === "good" ? "#10b981" : f.status === "warning" ? "#f59e0b" : "#ef4444" }} />
                </div>
                <span className="text-[8px] text-zinc-500 w-6 text-right">{f.score}</span>
              </div>
            ))}
          </div>
        </div>

        {risk.recommendations.length > 0 && (
          <div className="space-y-1">
            {risk.recommendations.map((rec, i) => (
              <p key={i} className="text-[9px] text-zinc-400 flex items-start gap-1">
                <Sparkles size={8} className="text-purple-400 mt-0.5 shrink-0" />
                {rec}
              </p>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function PredictiveFinanceClient() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "budget" | "alerts">("overview");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [predRes, riskRes] = await Promise.all([
        fetch("/api/predictions?type=predictions"),
        fetch("/api/predictions?type=risk"),
      ]);
      const predData = await predRes.json();
      const riskData = await riskRes.json();
      if (predData.success) setData(predData.data);
      if (riskData.success) setRisk(riskData.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "goals" as const, label: "Goals" },
    { key: "budget" as const, label: "Budget" },
    { key: "alerts" as const, label: `Alerts${data && data.alerts.length > 0 ? ` (${data.alerts.length})` : ""}` },
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-none">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Predictive Finance</h1>
            <p className="text-xs text-zinc-500 mt-0.5">AI-powered financial forecasting & scenario analysis</p>
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw size={14} className={`text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading && !data ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        ) : data ? (
          <>
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: activeTab === tab.key ? "rgba(212,175,55,0.1)" : "transparent",
                    color: activeTab === tab.key ? "#D4AF37" : "#71717a",
                    border: activeTab === tab.key ? "1px solid rgba(212,175,55,0.2)" : "1px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                  <CashFlowSection cashFlow={data.cashFlow} />
                  <GoalForecastSection goals={data.goals} />
                  <PortfolioSection portfolio={data.portfolio} />
                  <RiskSection risk={risk} />
                  <div className="col-span-2">
                    <ScenarioSimulator />
                  </div>
                </motion.div>
              )}

              {activeTab === "goals" && (
                <motion.div key="goals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <GoalForecastSection goals={data.goals} />
                  </div>
                  <PortfolioSection portfolio={data.portfolio} />
                  <RiskSection risk={risk} />
                </motion.div>
              )}

              {activeTab === "budget" && (
                <motion.div key="budget" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <BudgetForecastSection budget={data.budget} />
                  </div>
                  <CashFlowSection cashFlow={data.cashFlow} />
                  <RiskSection risk={risk} />
                </motion.div>
              )}

              {activeTab === "alerts" && (
                <motion.div key="alerts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <AlertsSection alerts={data.alerts} />
                  </div>
                  <TimelineSection timeline={data.timeline} />
                  <RiskSection risk={risk} />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.12)" }}>
              <Brain size={28} className="text-amber-500" />
            </div>
            <p className="text-sm text-zinc-400 font-medium">No prediction data available</p>
            <p className="text-xs text-zinc-600 mt-1">Add income, expenses, and goals to unlock predictions</p>
          </div>
        )}
      </div>
    </div>
  );
}
