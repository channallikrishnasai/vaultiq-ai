"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Zap, Activity,
  Target, Wallet, Bell, Brain,
  ChevronRight, RefreshCw, Clock,
  X, DollarSign, TrendingDown,
} from "lucide-react";
import GlassCard from "./GlassCard";
import UniversalSearch from "./UniversalSearch";
import VoiceAssistant from "./VoiceAssistant";
import ActionConfirmation from "./ActionConfirmation";
import { formatCurrency } from "@/utils/format";

interface DashboardStats {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: { score: number; label: string; grade: string };
  emergencyFund: number;
  emergencyFundTarget: number;
}

interface AgentActivity {
  id: string;
  type: string;
  description: string;
  status: string;
  timestamp: string;
}

interface ActionPreview {
  actionType: string;
  description: string;
  impact: string;
  reversible: boolean;
  params: Record<string, unknown>;
}

interface UserProfile {
  income: number | null;
  currency: string | null;
  riskAppetite: string | null;
  xp: number;
  streak: number;
  occupation?: string | null;
  monthlyExpenses?: number | null;
  emergencyFundTarget?: number | null;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
  icon: string;
  percent: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
}

interface AICommandCenterProps {
  userId: string;
}

type ActionModal = "goal" | "expense" | "budget" | "alert" | null;

export default function AICommandCenter({ userId }: AICommandCenterProps) {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [recentActions, setRecentActions] = useState<AgentActivity[]>([]);
  const [pendingAction, setPendingAction] = useState<ActionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [activeModal, setActiveModal] = useState<ActionModal>(null);
  const [submitting, setSubmitting] = useState(false);

  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", type: "SAVINGS" as string, deadline: "" });
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "", notes: "", date: new Date().toISOString().split("T")[0] });
  const [budgetForm, setBudgetForm] = useState({ category: "", limit: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) });
  const [alertForm, setAlertForm] = useState({ symbol: "", companyName: "", type: "PRICE_ABOVE", threshold: "" });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, actionsRes, profileRes, goalsRes, expensesRes] = await Promise.allSettled([
        fetch("/api/dashboard/stats"),
        fetch("/api/financial-hub/recent-actions"),
        fetch("/api/user/profile"),
        fetch("/api/goals"),
        fetch("/api/expenses"),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsJson = await statsRes.value.json();
        const d = statsJson.data ?? statsJson;
        setDashboardData({
          netWorth: d.netWorth ?? 0,
          monthlyIncome: d.monthlyIncome ?? 0,
          monthlyExpenses: d.monthlyExpenses ?? 0,
          savingsRate: d.savingsRate ?? 0,
          healthScore: d.healthScore ?? { score: 0, label: "", grade: "" },
          emergencyFund: d.emergencyFund ?? 0,
          emergencyFundTarget: d.emergencyFundTarget ?? 0,
        });
      }
      if (actionsRes.status === "fulfilled" && actionsRes.value.ok) {
        const actionsJson = await actionsRes.value.json();
        setRecentActions(Array.isArray(actionsJson) ? actionsJson : (actionsJson.data ?? []));
      }
      if (profileRes.status === "fulfilled" && profileRes.value.ok) {
        const profileJson = await profileRes.value.json();
        setProfile(profileJson.data?.profile ?? profileJson.profile ?? profileJson.data ?? null);
      }
      if (goalsRes.status === "fulfilled" && goalsRes.value.ok) {
        const goalsJson = await goalsRes.value.json();
        const raw = Array.isArray(goalsJson) ? goalsJson : (goalsJson.data ?? []);
        setGoals(raw.map((g: Record<string, unknown>) => ({
          id: g.id as string,
          name: g.name as string,
          target: g.targetAmount as number,
          current: (g.currentAmount as number) ?? 0,
          color: "text-blue-400",
          icon: "target",
          percent: Math.min(100, Math.round(((g.currentAmount as number) ?? 0) / (g.targetAmount as number) * 100)),
        })));
      }
      if (expensesRes.status === "fulfilled" && expensesRes.value.ok) {
        const expJson = await expensesRes.value.json();
        const raw = Array.isArray(expJson) ? expJson : (expJson.data ?? []);
        setExpenses(raw.slice(0, 10).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          amount: e.amount as number,
          category: e.category as string,
          notes: (e.notes as string) ?? "",
          date: e.date as string,
        })));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatMessage.trim() || chatLoading) return;
    setChatLoading(true);
    setChatResponse(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage }),
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                if (parsed.content) fullContent += parsed.content;
              } catch {}
            }
          }
        }
        setChatResponse(fullContent || "No response received.");
      }
    } catch {
      setChatResponse("Failed to get response. Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleActionConfirm = async () => {
    if (!pendingAction) return;
    setPendingAction(null);
    fetchAllData();
  };

  const submitGoal = async () => {
    if (!goalForm.name || !goalForm.targetAmount) return;
    setSubmitting(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: goalForm.name,
          targetAmount: parseFloat(goalForm.targetAmount),
          type: goalForm.type,
          deadline: goalForm.deadline || undefined,
        }),
      });
      setActiveModal(null);
      setGoalForm({ name: "", targetAmount: "", type: "SAVINGS", deadline: "" });
      fetchAllData();
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const submitExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category) return;
    setSubmitting(true);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          notes: expenseForm.notes || undefined,
          date: expenseForm.date,
        }),
      });
      setActiveModal(null);
      setExpenseForm({ amount: "", category: "", notes: "", date: new Date().toISOString().split("T")[0] });
      fetchAllData();
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const submitBudget = async () => {
    if (!budgetForm.category || !budgetForm.limit) return;
    setSubmitting(true);
    try {
      await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: budgetForm.category,
          limit: parseFloat(budgetForm.limit),
          month: parseInt(budgetForm.month),
          year: parseInt(budgetForm.year),
        }),
      });
      setActiveModal(null);
      setBudgetForm({ category: "", limit: "", month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()) });
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const submitAlert = async () => {
    if (!alertForm.symbol || !alertForm.threshold) return;
    setSubmitting(true);
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: alertForm.symbol.toUpperCase(),
          companyName: alertForm.companyName || undefined,
          type: alertForm.type,
          threshold: parseFloat(alertForm.threshold),
        }),
      });
      setActiveModal(null);
      setAlertForm({ symbol: "", companyName: "", type: "PRICE_ABOVE", threshold: "" });
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const quickActions = [
    { icon: Target, label: "New Goal", color: "text-blue-400", action: () => setActiveModal("goal") },
    { icon: Wallet, label: "Set Budget", color: "text-green-400", action: () => setActiveModal("budget") },
    { icon: Bell, label: "Add Alert", color: "text-yellow-400", action: () => setActiveModal("alert") },
    { icon: TrendingDown, label: "Log Expense", color: "text-red-400", action: () => setActiveModal("expense") },
  ];

  const savingsRate = profile?.income && profile?.income > 0
    ? Math.max(0, Math.round(((profile.income - (profile.monthlyExpenses ?? 0)) / profile.income) * 100))
    : 0;

  const riskLabel: Record<string, string> = {
    VERY_CONSERVATIVE: "Very Conservative",
    CONSERVATIVE: "Conservative",
    MODERATE: "Moderate",
    GROWTH: "Growth",
    AGGRESSIVE: "Aggressive",
  };

  return (
    <div className="min-h-screen bg-[#060608] p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-400" />
              AI Command Center
            </h1>
            <p className="text-sm text-white/40 mt-1">Your autonomous financial operating system</p>
          </div>
          <div className="flex items-center gap-3">
            <UniversalSearch userId={userId} />
            <button
              onClick={fetchAllData}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* KPI Row */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <GlassCard glow="gold" delay={0}>
            <div className="p-4">
              <p className="text-xs text-white/40 mb-1">Net Worth</p>
              <p className="text-xl font-bold text-white">{formatCurrency(dashboardData?.netWorth ?? 0)}</p>
            </div>
          </GlassCard>
          <GlassCard glow="green" delay={0.05}>
            <div className="p-4">
              <p className="text-xs text-white/40 mb-1">Monthly Income</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(dashboardData?.monthlyIncome ?? 0)}</p>
            </div>
          </GlassCard>
          <GlassCard glow="blue" delay={0.1}>
            <div className="p-4">
              <p className="text-xs text-white/40 mb-1">Health Score</p>
              <p className="text-xl font-bold text-blue-400">{dashboardData?.healthScore?.score ?? 0}/100</p>
            </div>
          </GlassCard>
          <GlassCard glow="none" delay={0.15}>
            <div className="p-4">
              <p className="text-xs text-white/40 mb-1">Savings Rate</p>
              <p className="text-xl font-bold text-yellow-400">{dashboardData?.savingsRate ?? 0}%</p>
            </div>
          </GlassCard>
        </div>

        {/* Financial Profile from Onboarding */}
        {profile && (
          <div className="mb-6">
            <GlassCard glow="gold" delay={0.18}>
              <div className="p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-400" />
                  Financial Profile
                </h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Monthly Income</p>
                    <p className="text-sm font-semibold text-green-400">{formatCurrency(profile.income ?? 0)}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Monthly Expenses</p>
                    <p className="text-sm font-semibold text-red-400">{formatCurrency(profile.monthlyExpenses ?? 0)}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Savings Rate</p>
                    <p className="text-sm font-semibold text-blue-400">{savingsRate}%</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Risk Appetite</p>
                    <p className="text-sm font-semibold text-purple-400">{riskLabel[profile.riskAppetite ?? ""] ?? "Not set"}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Streak</p>
                    <p className="text-sm font-semibold text-amber-400">{profile.streak ?? 0} days</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Goals from Onboarding */}
        {goals.length > 0 && (
          <div className="mb-6">
            <GlassCard glow="blue" delay={0.2}>
              <div className="p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  Your Goals
                </h3>
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div key={goal.id} className="rounded-xl bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white/80">{goal.name}</span>
                        <span className="text-xs text-white/40">{goal.percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${goal.percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[10px] text-white/30">{formatCurrency(goal.current)}</span>
                        <span className="text-[10px] text-white/30">{formatCurrency(goal.target)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Voice, Actions & Expenses */}
          <div className="lg:col-span-1 space-y-6">
            <GlassCard glow="blue" delay={0.2}>
              <div className="p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Mic className="h-4 w-4 text-blue-400" />
                  Voice Assistant
                </h3>
                <VoiceAssistant userId={userId} />
              </div>
            </GlassCard>

            <GlassCard glow="none" delay={0.25}>
              <div className="p-5">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((qa) => (
                    <button
                      key={qa.label}
                      onClick={qa.action}
                      className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                    >
                      <qa.icon className={`h-4 w-4 ${qa.color}`} />
                      <span className="text-xs text-white/70">{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Recent Expenses */}
            {expenses.length > 0 && (
              <GlassCard glow="none" delay={0.3}>
                <div className="p-5">
                  <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    Recent Expenses
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {expenses.map((exp) => (
                      <div key={exp.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2">
                        <div>
                          <p className="text-xs text-white/70">{exp.category}</p>
                          <p className="text-[10px] text-white/30">{new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                        </div>
                        <span className="text-xs font-medium text-red-400">{formatCurrency(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            )}
          </div>

          {/* Right Column - AI Chat & Activity */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard glow="gold" delay={0.3}>
              <div className="p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  AI Assistant
                </h3>
                <div className="flex gap-2">
                  <input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChat()}
                    placeholder="Ask anything about your finances..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 transition-colors focus:border-white/20"
                  />
                  <button
                    onClick={handleChat}
                    disabled={chatLoading || !chatMessage.trim()}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                  >
                    {chatLoading ? "..." : "Ask"}
                  </button>
                </div>
                {chatResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl bg-white/5 p-4 text-sm text-white/80 whitespace-pre-wrap"
                  >
                    {chatResponse}
                  </motion.div>
                )}
              </div>
            </GlassCard>

            {/* Recent Agent Activity */}
            <GlassCard glow="none" delay={0.35}>
              <div className="p-5">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Recent Agent Activity
                </h3>
                {recentActions.length === 0 ? (
                  <p className="text-sm text-white/30">No recent activity</p>
                ) : (
                  <div className="space-y-2">
                    {recentActions.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${
                            action.status === "completed" ? "bg-green-400" :
                            action.status === "executing" ? "bg-blue-400" :
                            action.status === "failed" ? "bg-red-400" : "bg-yellow-400"
                          }`} />
                          <span className="text-sm text-white/70">{action.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(action.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <ChevronRight className="h-3 w-3 text-white/20" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Action Confirmation Modal */}
        {pendingAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <ActionConfirmation
              preview={pendingAction}
              onConfirm={handleActionConfirm}
              onReject={() => setPendingAction(null)}
            />
          </div>
        )}

        {/* Quick Action Modals */}
        <AnimatePresence>
          {activeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
              onClick={() => setActiveModal(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0f] p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-white">
                    {activeModal === "goal" && "Create New Goal"}
                    {activeModal === "expense" && "Log Expense"}
                    {activeModal === "budget" && "Set Budget"}
                    {activeModal === "alert" && "Add Price Alert"}
                  </h3>
                  <button onClick={() => setActiveModal(null)} className="text-white/40 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {activeModal === "goal" && (
                  <div className="space-y-4">
                    <input
                      placeholder="Goal name"
                      value={goalForm.name}
                      onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <input
                      type="number"
                      placeholder="Target amount"
                      value={goalForm.targetAmount}
                      onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <select
                      value={goalForm.type}
                      onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
                    >
                      <option value="SAVINGS">Savings</option>
                      <option value="EMERGENCY">Emergency Fund</option>
                      <option value="INVESTMENT">Investment</option>
                    </select>
                    <input
                      type="date"
                      placeholder="Deadline (optional)"
                      value={goalForm.deadline}
                      onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
                    />
                    <button
                      onClick={submitGoal}
                      disabled={submitting || !goalForm.name || !goalForm.targetAmount}
                      className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Creating..." : "Create Goal"}
                    </button>
                  </div>
                )}

                {activeModal === "expense" && (
                  <div className="space-y-4">
                    <input
                      type="number"
                      placeholder="Amount"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <input
                      placeholder="Category (e.g. Food, Transport, Shopping)"
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <input
                      placeholder="Notes (optional)"
                      value={expenseForm.notes}
                      onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
                    />
                    <button
                      onClick={submitExpense}
                      disabled={submitting || !expenseForm.amount || !expenseForm.category}
                      className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Logging..." : "Log Expense"}
                    </button>
                  </div>
                )}

                {activeModal === "budget" && (
                  <div className="space-y-4">
                    <input
                      placeholder="Category (e.g. Food, Entertainment)"
                      value={budgetForm.category}
                      onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <input
                      type="number"
                      placeholder="Budget limit"
                      value={budgetForm.limit}
                      onChange={(e) => setBudgetForm({ ...budgetForm, limit: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={budgetForm.month}
                        onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString("en", { month: "long" })}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={budgetForm.year}
                        onChange={(e) => setBudgetForm({ ...budgetForm, year: e.target.value })}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
                      />
                    </div>
                    <button
                      onClick={submitBudget}
                      disabled={submitting || !budgetForm.category || !budgetForm.limit}
                      className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Setting..." : "Set Budget"}
                    </button>
                  </div>
                )}

                {activeModal === "alert" && (
                  <div className="space-y-4">
                    <input
                      placeholder="Stock symbol (e.g. RELIANCE)"
                      value={alertForm.symbol}
                      onChange={(e) => setAlertForm({ ...alertForm, symbol: e.target.value.toUpperCase() })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <input
                      placeholder="Company name (optional)"
                      value={alertForm.companyName}
                      onChange={(e) => setAlertForm({ ...alertForm, companyName: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <select
                      value={alertForm.type}
                      onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none"
                    >
                      <option value="PRICE_ABOVE">Price Goes Above</option>
                      <option value="PRICE_BELOW">Price Goes Below</option>
                      <option value="PERCENT_CHANGE">Percent Change</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Threshold price"
                      value={alertForm.threshold}
                      onChange={(e) => setAlertForm({ ...alertForm, threshold: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <button
                      onClick={submitAlert}
                      disabled={submitting || !alertForm.symbol || !alertForm.threshold}
                      className="w-full rounded-xl bg-yellow-600 py-2.5 text-sm font-medium text-white hover:bg-yellow-500 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Adding..." : "Add Alert"}
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
