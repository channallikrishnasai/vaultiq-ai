"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mic, Search, Zap, Activity, TrendingUp,
  Target, Wallet, Bell, BarChart3, Brain,
  ChevronRight, RefreshCw, Clock, Star,
} from "lucide-react";
import GlassCard from "./GlassCard";
import UniversalSearch from "./UniversalSearch";
import VoiceAssistant from "./VoiceAssistant";
import ActionConfirmation from "./ActionConfirmation";
import { formatCurrency, formatCompactINR } from "@/utils/format";

interface HubSummary {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  healthScore: number;
  healthGrade: string;
  watchlistCount: number;
  activeAlertCount: number;
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

interface AICommandCenterProps {
  userId: string;
}

export default function AICommandCenter({ userId }: AICommandCenterProps) {
  const [hubData, setHubData] = useState<HubSummary | null>(null);
  const [recentActions, setRecentActions] = useState<AgentActivity[]>([]);
  const [pendingAction, setPendingAction] = useState<ActionPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    setLoading(true);
    try {
      const [hubRes, actionsRes] = await Promise.all([
        fetch("/api/financial-hub/summary"),
        fetch("/api/financial-hub/recent-actions"),
      ]);

      if (hubRes.ok) setHubData(await hubRes.json());
      if (actionsRes.ok) setRecentActions(await actionsRes.json());
    } catch {
      // Fallback data
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

      if (res.ok) {
        const data = await res.json();
        setChatResponse(data.message);
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
    fetchHubData();
  };

  const quickActions = [
    { icon: Target, label: "New Goal", color: "text-blue-400", action: "create_goal" },
    { icon: Wallet, label: "Set Budget", color: "text-green-400", action: "create_budget" },
    { icon: Bell, label: "Add Alert", color: "text-yellow-400", action: "create_alert" },
    { icon: Star, label: "Watchlist", color: "text-purple-400", action: "add_watchlist" },
    { icon: BarChart3, label: "Trade", color: "text-emerald-400", action: "create_virtual_trade" },
  ];

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
              onClick={fetchHubData}
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
              <p className="text-xl font-bold text-white">{formatCurrency(hubData?.netWorth ?? 0)}</p>
            </div>
          </GlassCard>
          <GlassCard glow="green" delay={0.05}>
            <div className="p-4">
              <p className="text-xs text-white/40 mb-1">Total Assets</p>
              <p className="text-xl font-bold text-green-400">{formatCompactINR(hubData?.totalAssets ?? 0)}</p>
            </div>
          </GlassCard>
          <GlassCard glow="blue" delay={0.1}>
            <div className="p-4">
              <p className="text-xs text-white/40 mb-1">Health Score</p>
              <p className="text-xl font-bold text-blue-400">{hubData?.healthScore ?? 0}/100</p>
            </div>
          </GlassCard>
          <GlassCard glow="none" delay={0.15}>
            <div className="p-4">
              <p className="text-xs text-white/40 mb-1">Active Alerts</p>
              <p className="text-xl font-bold text-yellow-400">{hubData?.activeAlertCount ?? 0}</p>
            </div>
          </GlassCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Voice & Chat */}
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
                      key={qa.action}
                      className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                    >
                      <qa.icon className={`h-4 w-4 ${qa.color}`} />
                      <span className="text-xs text-white/70">{qa.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
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
      </div>
    </div>
  );
}
