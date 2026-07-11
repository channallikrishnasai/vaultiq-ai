"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, Shield, Zap, Target, TrendingUp,
  PieChart as PieIcon, Activity, Wallet, AlertTriangle, Star,
  Trophy, Cpu, ArrowUpRight, ArrowDownRight, Flame, Send,
  MessageSquare, Minus, History, Plus, Trash2,
} from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Tooltip, AreaChart, Area,
} from "recharts";
import { useOrb } from "@/contexts/OrbContext";
import type { ThinkingStage } from "@/lib/thinking-stages";

// ── Empty chart data ──────────────────────────────────────────────────────────
const EMPTY_SPARK = [{ v: 0 }];
const EMPTY_CASH_D = [{ m: "", i: 0, o: 0 }];
const EMPTY_EXPENSE_D: { m: string; v: number }[] = [];
const EMPTY_PORT_ALLOC: { name: string; percent: number; color: string }[] = [];

const TT = { contentStyle: { display: "none" }, cursor: false as any };

// ── Animated number counter ───────────────────────────────────────────────────
function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 1400,
  delay = 0,
  style = {},
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const [displayed, setDisplayed] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(eased * value);
        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };
      frameRef.current = requestAnimationFrame(animate);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration, delay]);

  const formatted = displayed.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <span style={style}>{prefix}{formatted}{suffix}</span>;
}

// ── Seeded random for deterministic jitter ─────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Premium card wrapper ──────────────────────────────────────────────────────
function Card({
  children,
  style,
  accent = "#D4AF37",
  delay = 0,
  className = "",
  floatDelay = 0,
  floatDuration = 4,
  floatAmount = 3,
  thinkingStage = "idle",
  cardIndex = 0,
  cardWidth = 160,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
  delay?: number;
  className?: string;
  floatDelay?: number;
  floatDuration?: number;
  floatAmount?: number;
  thinkingStage?: ThinkingStage;
  cardIndex?: number;
  cardWidth?: number;
}) {
  // Card's starting position (percentage of viewport)
  const leftStr = String(style?.left || "50%");
  const topStr = String(style?.top || "46%");
  const cardLeft = parseFloat(leftStr) || 50;
  const cardTop = parseFloat(topStr) || 46;

  // Offset from planet center (50%, 46%) in vw/vh units
  const dxVW = 50 - cardLeft; // e.g., 37.5 if card is at 12.5%
  const dyVH = 46 - cardTop;  // e.g., 26.5 if card is at 19.5%
  const distFromCenter = Math.sqrt(dxVW * dxVW + dyVH * dyVH);
  const baseAngle = Math.atan2(dyVH, dxVW);

  const isJitter = thinkingStage === "jitter";
  const isConverge = thinkingStage === "converge";
  const isSwallow = thinkingStage === "swallow";
  const isHidden = thinkingStage === "swallow" || thinkingStage === "flash";
  const isReveal = thinkingStage === "reveal";
  const isActive = isJitter || isConverge || isSwallow;

  // Orbit keyframes: cards circle around planet in vw/vh
  const orbitKeyframes = useMemo(() => {
    const numSteps = 16;
    const orbitRadius = distFromCenter * 0.85;
    const angleOffset = (cardIndex / 15) * Math.PI * 2;
    return Array.from({ length: numSteps + 1 }, (_, i) => {
      const angle = angleOffset + (i / numSteps) * Math.PI * 2;
      return {
        x: `${Math.cos(angle) * orbitRadius}vw`,
        y: `${Math.sin(angle) * orbitRadius * 0.8}vh`,
      };
    });
  }, [cardIndex, distFromCenter]);

  // Converge keyframes: spiral toward center
  const convergeKeyframes = useMemo(() => {
    const numSteps = 12;
    return Array.from({ length: numSteps + 1 }, (_, i) => {
      const t = i / numSteps;
      const radius = distFromCenter * 0.85 * (1 - t * 0.95);
      const angle = baseAngle + t * Math.PI * 3;
      return {
        x: `${Math.cos(angle) * radius}vw`,
        y: `${Math.sin(angle) * radius * 0.8}vh`,
      };
    });
  }, [baseAngle, distFromCenter]);

  const getAnimate = () => {
    if (isJitter) {
      return {
        x: orbitKeyframes.map((k) => k.x),
        y: orbitKeyframes.map((k) => k.y),
        rotate: [0, 5, -5, 3, -3, 0],
        scale: 0.88,
        opacity: 0.9,
      };
    }
    if (isConverge) {
      return {
        x: convergeKeyframes.map((k) => k.x),
        y: convergeKeyframes.map((k) => k.y),
        rotate: [0, 15, -15, 8, 0],
        scale: [0.88, 0.65, 0.4, 0.2],
        opacity: [0.9, 0.6, 0.3, 0.1],
      };
    }
    if (isSwallow || isHidden) {
      // Final collapse: move exactly to center and shrink to nothing
      return {
        x: `${dxVW}vw`,
        y: `${dyVH}vh`,
        rotate: 720,
        scale: 0,
        opacity: 0,
      };
    }
    if (isReveal) {
      return {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
      };
    }
    // idle
    return {
      x: 0,
      y: [0, -floatAmount, 0, floatAmount * 0.6, 0],
      rotate: 0,
      scale: 1,
      opacity: 1,
    };
  };

  const getTransition = () => {
    if (isJitter) {
      return {
        x: { duration: 2.5, repeat: Infinity, ease: "linear" as const },
        y: { duration: 2.5, repeat: Infinity, ease: "linear" as const },
        rotate: { duration: 0.6, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const },
        scale: { duration: 0.4 },
        opacity: { duration: 0.4 },
      };
    }
    if (isConverge) {
      return {
        x: { duration: 1.8, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        y: { duration: 1.8, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        rotate: { duration: 1.5, ease: "easeOut" as const },
        scale: { duration: 1.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        opacity: { duration: 1.2 },
      };
    }
    if (isSwallow) {
      return {
        x: { duration: 0.6, ease: [0.6, 0, 0.8, 1] as [number, number, number, number] },
        y: { duration: 0.6, ease: [0.6, 0, 0.8, 1] as [number, number, number, number] },
        rotate: { duration: 0.6, ease: "easeIn" as const },
        scale: { duration: 0.5, ease: [0.6, 0, 0.8, 1] as [number, number, number, number] },
        opacity: { duration: 0.4 },
      };
    }
    if (isReveal) {
      return {
        x: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: delay * 0.1 },
        y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: delay * 0.1 },
        scale: { duration: 0.7, type: "spring" as const, stiffness: 200, damping: 18, delay: delay * 0.1 },
        opacity: { duration: 0.5, delay: delay * 0.1 },
        rotate: { duration: 0.6 },
      };
    }
    return {
      opacity: { delay, duration: 0.5 },
      scale: { delay, type: "spring" as const, stiffness: 180, damping: 20 },
      x: { duration: 0 },
      y: { delay: floatDelay, duration: floatDuration, repeat: Infinity, ease: "easeInOut" as const },
      rotate: { duration: 0 },
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={getAnimate()}
      transition={getTransition()}
      whileHover={
        !isActive
          ? { y: -5, scale: 1.025, boxShadow: `0 20px 56px rgba(0,0,0,0.82), 0 0 40px ${accent}18, 0 0 15px rgba(212,175,55,0.1)`, borderColor: `${accent}55` }
          : undefined
      }
      className={`absolute ${className}`}
      style={{
        background: "rgba(10,7,3,0.92)",
        border: `1px solid ${accent}28`,
        borderRadius: 14,
        backdropFilter: "blur(36px)",
        WebkitBackdropFilter: "blur(36px)",
        boxShadow: isJitter
          ? `0 0 30px ${accent}35, 0 14px 44px rgba(0,0,0,0.82), 0 0 12px rgba(212,175,55,0.1)`
          : `0 14px 44px rgba(0,0,0,0.82), 0 0 20px ${accent}0a, 0 0 10px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,220,100,0.04)`,
        overflow: "hidden",
        padding: "10px 12px",
        color: "#fff",
        zIndex: isJitter ? 20 : 5,
        animation: isActive ? "none" : `shimmerBorder 5.5s ease-in-out ${delay}s infinite`,
        marginLeft: `-${cardWidth / 2}px`,
        marginTop: "-38px",
        width: `${cardWidth}px`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "18%",
          right: "18%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}38, transparent)`,
        }}
      />
      {children}
    </motion.div>
  );
}

function CardHeader({
  label,
  accent = "#D4AF37",
  icon,
  isMinimized,
  onToggle,
}: {
  label: string;
  accent?: string;
  icon?: React.ReactNode;
  isMinimized: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        <div
          style={{
            width: 3,
            height: 10,
            borderRadius: 2,
            background: accent,
            boxShadow: `0 0 8px ${accent}88`,
          }}
        />
        {icon}
        <span
          style={{
            fontSize: 7.5,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {label}
        </span>
      </div>
      <button
        onClick={onToggle}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        style={{
          fontSize: 8,
          color: "rgba(255,255,255,0.25)",
          cursor: "pointer",
          border: "none",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isMinimized ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
    </div>
  );
}

// ── Interface ─────────────────────────────────────────────────────────────────
interface Props {
  netWorth?: number;
  netWorthChange?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  savingsRate?: number;
  healthScore?: number;
  goals?: { name: string; percent: number }[];
  portfolio?: {
    totalValue: number;
    cashBalance: number;
    change: number;
    changePercent: number;
    allocation: { name: string; percent: number; color: string }[];
    topHoldings: { name: string; value: number; change: number }[];
    isEmpty: boolean;
  };
  expenses?: { total: number; categories: { name: string; amount: number; color: string; percent: number }[] };
  fraudStats?: { scanCount: number; highRiskCount: number };
  twinStats?: { hasTwin: boolean; healthScore: number; netWorth: number; twinName: string | null };
  user?: { name?: string | null; email?: string | null; image?: string | null };
  profile?: { income: number; currency: string | null; riskAppetite: string | null; xp: number; streak: number } | null;
  orbState?: string;
}

export default function DashboardFloatingCards({
  netWorth = 0,
  netWorthChange = 0,
  monthlyIncome = 0,
  monthlyExpenses = 0,
  savingsRate = 0,
  healthScore = 0,
  goals = [],
  portfolio = { totalValue: 0, cashBalance: 0, change: 0, changePercent: 0, allocation: EMPTY_PORT_ALLOC, topHoldings: [], isEmpty: true },
  expenses = { total: 0, categories: [] },
  fraudStats = { scanCount: 0, highRiskCount: 0 },
  twinStats = { hasTwin: false, healthScore: 0, netWorth: 0, twinName: null },
  user,
  profile,
  orbState = "idle",
}: Props) {
  const [minimized, setMinimized] = useState<Record<string, boolean>>({});
  const { thinkingStage, setThinkingStage, setOrbState } = useOrb();
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatThinking, setChatThinking] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; session_id: string; messages: { role: "user" | "assistant"; content: string }[]; startedAt: number; summary: string }>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const activeSessionIdRef = useRef<string>(crypto.randomUUID());

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kpi-minimized-state");
      if (saved) setMinimized(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem("kpi-minimized-state", JSON.stringify(minimized));
  }, [minimized]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages, chatThinking]);

  // Load chat history from Supabase via /api/chat
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.conversations) {
        setChatHistory(data.conversations.map((c: any) => ({
          id: c.conversation_id,
          session_id: c.conversation_id,
          messages: [],
          startedAt: new Date(c.created_at).getTime(),
          summary: c.summary || "New chat",
        })));
      }
    } catch {}
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const sendChatMessage = useCallback(async (msg: string) => {
    if (!msg.trim() || chatThinking) return;
    setChatInput("");
    setChatMessages(p => [...p, { role: "user", content: msg }]);
    setChatThinking(true);

    // Trigger orb thinking animation
    setOrbState("thinking");
    const thinkStartTime = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: crypto.randomUUID() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message || `HTTP ${res.status}`);
      }

      // Handle SSE stream response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      setChatMessages(p => [...p, { role: "assistant", content: "" }]);

      if (reader) {
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
                if (parsed.content) {
                  fullContent += parsed.content;
                  setChatMessages(p => p.map((m, idx) =>
                    idx === p.length - 1 ? { ...m, content: fullContent } : m
                  ));
                }
              } catch {}
            }
          }
        }
      }

      // Ensure minimum 2.5 seconds of thinking animation
      const elapsed = Date.now() - thinkStartTime;
      const minDelay = 2500;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      // Switch to speaking state
      setOrbState("speaking");

      // Stream the response text character by character for dramatic effect
      const streamDelay = Math.min(fullContent.length * 8, 2000);
      await new Promise(resolve => setTimeout(resolve, streamDelay));

      // Back to idle
      setOrbState("idle");

      // Save to history
      setChatHistory(p => {
        const summary = msg.length > 40 ? msg.slice(0, 40) + "..." : msg;
        return [{ id: crypto.randomUUID(), session_id: activeSessionIdRef.current, messages: [...chatMessages, { role: "user" as const, content: msg }, { role: "assistant" as const, content: fullContent }], startedAt: Date.now(), summary }, ...p].slice(0, 50);
      });
    } catch (err: any) {
      const errorMsg = err?.message?.includes("401")
        ? "Please sign in to use AI advisor."
        : "Connection issue — please try again.";
      setChatMessages(p => [...p, { role: "assistant", content: errorMsg }]);
      setOrbState("idle");
      // Save failed conversation to history too
      setChatHistory(p => {
        const summary = msg.length > 40 ? msg.slice(0, 40) + "..." : msg;
        return [{ id: crypto.randomUUID(), session_id: activeSessionIdRef.current, messages: [...chatMessages, { role: "user" as const, content: msg }, { role: "assistant" as const, content: errorMsg }], startedAt: Date.now(), summary }, ...p].slice(0, 50);
      });
    } finally {
      setChatThinking(false);
    }
  }, [chatThinking, setOrbState]);

  const toggleMinimize = (key: string) => {
    setMinimized((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const goalList = goals.length
    ? goals.slice(0, 3)
    : [];

  const fmt = (n: number) =>
    `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const userName = user?.name?.split(" ")[0] || "";

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════════
          LEFT COLUMN — stacked vertically along left side
          ════════════════════════════════════════════════════════════════════════ */}

      {/* 1. FINANCIAL LEVEL — Left Top */}
      <Card
        delay={0.1}
        accent="#D4AF37"
        floatDelay={0}
        floatDuration={5}
        floatAmount={2.5}
        thinkingStage={thinkingStage}
        cardIndex={0}
        cardWidth={175}
        style={{ left: "18%", top: "19.5%" }}
      >
        <CardHeader
          label="Financial Level"
          icon={<Trophy size={8} style={{ color: "#D4AF37" }} />}
          isMinimized={minimized["finLevel"]}
          onToggle={() => toggleMinimize("finLevel")}
        />
        {!minimized["finLevel"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>
              Level {Math.floor((profile?.xp ?? 0) / 1000) + 1} · Wealth Builder
            </p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
              XP Progress
            </p>
            <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 3 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "68%" }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                style={{
                  height: "100%",
                  borderRadius: 4,
                  background: "linear-gradient(90deg, #D4AF37, #f5d060)",
                  boxShadow: "0 0 10px rgba(212,175,55,0.6)",
                }}
              />
            </div>
            <div className="flex items-center gap-1">
              <Flame size={7} style={{ color: "#fb923c" }} />
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>Savings Streak</span>
              <span style={{ fontSize: 7, color: "#D4AF37", fontWeight: 700 }}>{profile?.streak ?? 0} months</span>
            </div>
          </>
        )}
      </Card>

      {/* 2. AUTOMATION BADGES — Left Mid-Top */}
      <Card
        delay={0.18}
        accent="#a78bfa"
        floatDelay={0.5}
        floatDuration={4.5}
        floatAmount={2}
        thinkingStage={thinkingStage}
        cardIndex={1}
        cardWidth={175}
        style={{ left: "18.5%", top: "35.5%" }}
      >
        <CardHeader
          label="Automation Badges"
          accent="#a78bfa"
          icon={<Cpu size={8} style={{ color: "#a78bfa" }} />}
          isMinimized={minimized["badges"]}
          onToggle={() => toggleMinimize("badges")}
        />
        {!minimized["badges"] && (
          <div className="flex gap-1.5 flex-wrap">
            {["Auto-Save", "Bill Pay", "Invest", "Budget"].map((b, i) => (
              <span
                key={i}
                style={{
                  fontSize: 6.5,
                  padding: "2px 6px",
                  borderRadius: 6,
                  background: "rgba(167,139,250,0.12)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  color: "#a78bfa",
                  fontWeight: 600,
                }}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* 3. FRAUD SHIELD + AI TWIN — Left Mid */}
      <Card
        delay={0.25}
        accent="#fb923c"
        floatDelay={1}
        floatDuration={5.5}
        floatAmount={3}
        thinkingStage={thinkingStage}
        cardIndex={2}
        cardWidth={175}
        style={{ left: "19%", top: "49.5%" }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div style={{ width: 3, height: 10, borderRadius: 2, background: "#fb923c", boxShadow: "0 0 6px #fb923c88" }} />
            <Shield size={8} style={{ color: "#fb923c" }} />
            <span style={{ fontSize: 7.5, fontWeight: 700, color: "#fb923c", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Fraud Shield
            </span>
          </div>
          <button
            onClick={() => toggleMinimize("fraudShield")}
            className="p-0.5 hover:bg-white/10 rounded transition-colors"
            style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {minimized["fraudShield"] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        </div>
        {!minimized["fraudShield"] && (
          <div className="flex gap-2">
            <div
              style={{
                width: 42, height: 54, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(160deg,#1a3a5a,#0d2040)",
                border: "1px solid rgba(96,165,250,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 3,
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(96,165,250,0.2)", border: "1.5px solid rgba(96,165,250,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={10} style={{ color: "#60a5fa" }} />
              </div>
              <span style={{ fontSize: 5.5, color: "rgba(96,165,250,0.7)", fontWeight: 600 }}>AI TWIN</span>
            </div>
            <div className="space-y-0.5" style={{ flex: 1 }}>
              <p style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>Scans: {fraudStats.scanCount}</p>
              <p style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>Alerts: {fraudStats.highRiskCount}</p>
              <p style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>Active monitoring</p>
              <div className="flex items-center gap-1 mt-1">
                <AlertTriangle size={7} style={{ color: "#10b981" }} />
                <span style={{ fontSize: 7, color: "#10b981", fontWeight: 600 }}>All Clear</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 4. TAX PLANNER — Left Mid-Bottom */}
      <Card
        delay={0.32}
        accent="#60a5fa"
        floatDelay={1.5}
        floatDuration={4.8}
        floatAmount={2.2}
        thinkingStage={thinkingStage}
        cardIndex={3}
        cardWidth={175}
        style={{ left: "18.5%", top: "63.5%" }}
      >
        <CardHeader
          label="Tax Planner"
          accent="#60a5fa"
          isMinimized={minimized["taxPlanner"]}
          onToggle={() => toggleMinimize("taxPlanner")}
        />
        {!minimized["taxPlanner"] && (
          <div className="space-y-1">
            {[
              { k: "Amounts", v: fmt(monthlyIncome), c: "#f4f4f5" },
              { k: "Due date", v: "—", c: "rgba(255,255,255,0.45)" },
              { k: "Dep. cont", v: "—", c: "rgba(255,255,255,0.45)" },
              { k: "Tax tax", v: "—", c: "rgba(255,255,255,0.45)" },
              { k: "Deadlines", v: "—", c: "rgba(255,255,255,0.45)" },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#60a5fa", boxShadow: "0 0 4px #60a5fa88" }} />
                  <span style={{ fontSize: 7, color: "rgba(255,255,255,0.45)" }}>{r.k}</span>
                </div>
                <span style={{ fontSize: 7, color: r.c, fontWeight: r.c === "#f4f4f5" ? 700 : 400 }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 5. PORTFOLIO — Left Bottom */}
      <Card
        delay={0.38}
        accent="#10b981"
        floatDelay={2}
        floatDuration={5.2}
        floatAmount={2.8}
        thinkingStage={thinkingStage}
        cardIndex={4}
        cardWidth={175}
        style={{ left: "19%", top: "79.5%" }}
      >
        <CardHeader
          label="Portfolio"
          accent="#10b981"
          icon={<PieIcon size={8} style={{ color: "#10b981" }} />}
          isMinimized={minimized["portfolio2"]}
          onToggle={() => toggleMinimize("portfolio2")}
        />
        {!minimized["portfolio2"] && (
          <>
            <AnimatedNumber
              value={portfolio.totalValue}
              prefix="₹"
              decimals={2}
              duration={1600}
              delay={700}
              style={{
                fontSize: 9, fontWeight: 800, color: "#f4f4f5", marginBottom: 4,
              }}
            />
            <div className="flex items-center gap-1.5 mb-2">
              <span style={{ fontSize: 7.5, color: "#10b981", fontWeight: 700 }}>+{portfolio.changePercent}%</span>
              <span style={{ fontSize: 6.5, color: "rgba(255,255,255,0.25)" }}>this month</span>
            </div>
            <div style={{ height: 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={EMPTY_SPARK}>
                  <defs>
                    <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} fill="url(#portGrad)" />
                  <Tooltip {...TT} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          TOP ROW — floating above orb
          ════════════════════════════════════════════════════════════════════════ */}

      {/* 6. NET WORTH — Top Left */}
      <Card
        delay={0.12}
        accent="#D4AF37"
        floatDelay={0.3}
        floatDuration={4.8}
        floatAmount={2}
        thinkingStage={thinkingStage}
        cardIndex={5}
        cardWidth={190}
        style={{ left: "29.5%", top: "13.5%" }}
      >
        <CardHeader
          label="Net Worth"
          icon={<Wallet size={8} style={{ color: "#D4AF37" }} />}
          isMinimized={minimized["netWorth"]}
          onToggle={() => toggleMinimize("netWorth")}
        />
        {!minimized["netWorth"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Total assets</p>
            <AnimatedNumber
              value={netWorth}
              prefix="₹"
              decimals={2}
              duration={1800}
              delay={400}
              style={{
                fontSize: 16, fontWeight: 800, color: "#D4AF37", lineHeight: 1, marginBottom: 6,
                textShadow: "0 0 20px rgba(212,175,55,0.45)",
              }}
            />
            <div style={{ height: 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={EMPTY_SPARK}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} fill="url(#goldGrad)" />
                  <Tooltip {...TT} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{ fontSize: 7.5, color: "#10b981", fontWeight: 700 }}>
                {netWorthChange >= 0 ? "+" : ""}{fmt(netWorthChange)}
              </span>
              <span style={{ fontSize: 6.5, color: "rgba(255,255,255,0.2)" }}>this month</span>
            </div>
          </>
        )}
      </Card>

      {/* 7. PORTFOLIO PERFORMANCE — Top Center */}
      <Card
        delay={0.18}
        accent="#D4AF37"
        floatDelay={0.7}
        floatDuration={5}
        floatAmount={2.5}
        thinkingStage={thinkingStage}
        cardIndex={6}
        cardWidth={195}
        style={{ left: "51.5%", top: "11.5%" }}
      >
        <CardHeader
          label="Portfolio Performance"
          icon={<TrendingUp size={8} style={{ color: "#D4AF37" }} />}
          isMinimized={minimized["portfolioPerf"]}
          onToggle={() => toggleMinimize("portfolioPerf")}
        />
        {!minimized["portfolioPerf"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>Overall return</p>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ fontSize: 18, fontWeight: 800, color: "#D4AF37", lineHeight: 1 }}>
                {portfolio.changePercent >= 0 ? "+" : ""}{portfolio.changePercent}%
              </span>
              <span
                style={{
                  fontSize: 8, color: portfolio.changePercent >= 0 ? "#10b981" : "#ef4444", fontWeight: 700,
                  background: portfolio.changePercent >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  padding: "2px 5px", borderRadius: 4,
                }}
              >
                {portfolio.changePercent >= 0 ? "+" : ""}{portfolio.changePercent}%
              </span>
            </div>
            <div style={{ height: 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={EMPTY_SPARK}>
                  <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={2} dot={false} />
                  <Tooltip {...TT} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)" }}>Debt volume</span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)" }}>Best invest</span>
            </div>
          </>
        )}
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          RIGHT COLUMN — stacked vertically along right side
          ════════════════════════════════════════════════════════════════════════ */}

      {/* 8. MONTHLY INCOME — Right Top */}
      <Card
        delay={0.22}
        accent="#10b981"
        floatDelay={0.5}
        floatDuration={4.5}
        floatAmount={2.2}
        thinkingStage={thinkingStage}
        cardIndex={7}
        cardWidth={185}
        style={{ left: "73.5%", top: "13.5%" }}
      >
        <CardHeader
          label="Monthly Income"
          accent="#10b981"
          icon={<ArrowUpRight size={8} style={{ color: "#10b981" }} />}
          isMinimized={minimized["monthlyIncome"]}
          onToggle={() => toggleMinimize("monthlyIncome")}
        />
        {!minimized["monthlyIncome"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Primary/secondary sources</p>
            <AnimatedNumber
              value={monthlyIncome}
              prefix="₹"
              decimals={0}
              duration={1600}
              delay={500}
              style={{
                fontSize: 16, fontWeight: 800, color: "#f4f4f5", lineHeight: 1, marginBottom: 3,
              }}
            />
            <span
              style={{
                fontSize: 8, color: "#10b981", fontWeight: 700, display: "inline-block", marginBottom: 5,
                background: "rgba(16,185,129,0.1)", borderRadius: 4, padding: "2px 5px",
              }}
            >
              ↑ Growth
            </span>
            <div style={{ height: 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={EMPTY_SPARK}>
                  <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.8} dot={false} />
                  <Tooltip {...TT} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>

      {/* 9. CASH FLOW — Right Mid-Top */}
      <Card
        delay={0.28}
        accent="#60a5fa"
        floatDelay={1}
        floatDuration={5.5}
        floatAmount={3}
        thinkingStage={thinkingStage}
        cardIndex={8}
        cardWidth={185}
        style={{ left: "73.8%", top: "31.5%" }}
      >
        <CardHeader
          label="Cash Flow Tracker"
          accent="#60a5fa"
          isMinimized={minimized["cashFlow"]}
          onToggle={() => toggleMinimize("cashFlow")}
        />
        {!minimized["cashFlow"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>Inflow vs. outflow · Liquidity ratio</p>
            <div style={{ height: 50 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EMPTY_CASH_D}>
                  <Bar dataKey="i" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="o" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Tooltip {...TT} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#10b981" }} />
                <span style={{ fontSize: 7, color: "#10b981", fontWeight: 600 }}>Inflow</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#ef4444" }} />
                <span style={{ fontSize: 7, color: "#ef4444", fontWeight: 600 }}>Outflow</span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* 10. SAVINGS RATE — Right Mid */}
      <Card
        delay={0.34}
        accent="#D4AF37"
        floatDelay={1.5}
        floatDuration={4.8}
        floatAmount={2.5}
        thinkingStage={thinkingStage}
        cardIndex={9}
        cardWidth={185}
        style={{ left: "74.2%", top: "49.5%" }}
      >
        <CardHeader
          label="Savings Rate"
          isMinimized={minimized["savingsRate"]}
          onToggle={() => toggleMinimize("savingsRate")}
        />
        {!minimized["savingsRate"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Current savings rate</p>
            <p
              style={{
                fontSize: 18, fontWeight: 800, color: "#D4AF37", lineHeight: 1, marginBottom: 4,
                textShadow: "0 0 16px rgba(212,175,55,0.4)",
              }}
            >
              {savingsRate}%
            </p>
            <div style={{ height: 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={EMPTY_SPARK}>
                  <defs>
                    <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} fill="url(#savingsGrad)" />
                  <Tooltip {...TT} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
              Target: {savingsRate > 0 ? savingsRate : 50}%
            </p>
          </>
        )}
      </Card>

      {/* 11. EMERGENCY FUND — Right Mid-Bottom */}
      <Card
        delay={0.4}
        accent="#60a5fa"
        floatDelay={2}
        floatDuration={5.2}
        floatAmount={2.8}
        thinkingStage={thinkingStage}
        cardIndex={10}
        cardWidth={185}
        style={{ left: "73.7%", top: "65.5%" }}
      >
        <CardHeader
          label="Emergency Fund"
          accent="#60a5fa"
          isMinimized={minimized["emergencyFund"]}
          onToggle={() => toggleMinimize("emergencyFund")}
        />
        {!minimized["emergencyFund"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>Current balance vs. goal</p>
            <div className="flex items-center gap-3">
              <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ v: Math.round(savingsRate) || 0 }, { v: 100 - (Math.round(savingsRate) || 0) }]}
                      dataKey="v"
                      innerRadius={14}
                      outerRadius={23}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#60a5fa" />
                      <Cell fill="rgba(255,255,255,0.06)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#60a5fa",
                  }}
                >
                  {Math.round(savingsRate) || 0}%
                </span>
              </div>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#f4f4f5", marginBottom: 2 }}>
                  {fmt(portfolio.cashBalance)}
                </p>
                <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)" }}>Month coverage</p>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* 12. EXPENSE ANALYTICS — Right Bottom */}
      <Card
        delay={0.46}
        accent="#ef4444"
        floatDelay={2.5}
        floatDuration={4.6}
        floatAmount={2.3}
        thinkingStage={thinkingStage}
        cardIndex={11}
        cardWidth={185}
        style={{ left: "74.3%", top: "81.5%" }}
      >
        <CardHeader
          label="Expense Analytics"
          accent="#ef4444"
          isMinimized={minimized["expenseAnalytics"]}
          onToggle={() => toggleMinimize("expenseAnalytics")}
        />
        {!minimized["expenseAnalytics"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>Monthly breakdown</p>
            <AnimatedNumber
              value={monthlyExpenses}
              prefix="₹"
              decimals={2}
              duration={1600}
              delay={600}
              style={{
                fontSize: 14, fontWeight: 800, color: "#ef4444", lineHeight: 1, marginBottom: 4,
              }}
            />
            <div style={{ height: 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={EMPTY_EXPENSE_D}>
                  <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                    {EMPTY_EXPENSE_D.map((_, i) => (
                      <Cell
                        key={i}
                        fill={["#ef4444", "#f59e0b", "#D4AF37", "#10b981", "#60a5fa", "#a78bfa"][i]}
                      />
                    ))}
                  </Bar>
                  <Tooltip {...TT} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)" }}>This month</span>
            </div>
          </>
        )}
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          BOTTOM ROW — below orb
          ════════════════════════════════════════════════════════════════════════ */}

      {/* 13. GOALS PROGRESS — Bottom Left */}
      <Card
        delay={0.5}
        accent="#a78bfa"
        floatDelay={1.8}
        floatDuration={5}
        floatAmount={2.5}
        thinkingStage={thinkingStage}
        cardIndex={12}
        cardWidth={175}
        style={{ left: "29.5%", top: "81.5%" }}
      >
        <CardHeader
          label="Goal Progress"
          accent="#a78bfa"
          icon={<Target size={8} style={{ color: "#a78bfa" }} />}
          isMinimized={minimized["goalsProgress"]}
          onToggle={() => toggleMinimize("goalsProgress")}
        />
        {!minimized["goalsProgress"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>Visualisation of progress</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                {goalList.map((g, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ fontSize: 7, color: "rgba(255,255,255,0.45)" }}>{g.name}</span>
                      <span style={{ fontSize: 7, color: ["#D4AF37", "#10b981", "#60a5fa"][i], fontWeight: 700 }}>
                        {g.percent}%
                      </span>
                    </div>
                    <div style={{ height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          width: `${g.percent}%`,
                          background: `linear-gradient(90deg, ${["#D4AF37", "#10b981", "#60a5fa"][i]}88, ${["#D4AF37", "#10b981", "#60a5fa"][i]})`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ v: Math.round(savingsRate) || 0 }, { v: 100 - (Math.round(savingsRate) || 0) }]} dataKey="v" innerRadius={12} outerRadius={20} startAngle={90} endAngle={-270}>
                      <Cell fill="#10b981" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 7.5,
                    fontWeight: 800,
                    color: "#10b981",
                  }}
                >
                  {Math.round(savingsRate) || 0}%
                </span>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* 14. FINANCIAL HEALTH SCORE — Bottom Center */}
      <Card
        delay={0.55}
        accent="#10b981"
        floatDelay={2.2}
        floatDuration={4.8}
        floatAmount={2.2}
        thinkingStage={thinkingStage}
        cardIndex={13}
        cardWidth={185}
        style={{ left: "49.5%", top: "83.5%" }}
      >
        <CardHeader
          label="Financial Health Score"
          accent="#10b981"
          icon={<Activity size={8} style={{ color: "#10b981" }} />}
          isMinimized={minimized["healthScore"]}
          onToggle={() => toggleMinimize("healthScore")}
        />
        {!minimized["healthScore"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>Calculated by AI · Real-time</p>
            <div className="flex items-center gap-3">
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 7, color: "rgba(255,255,255,0.45)", marginBottom: 1 }}>• Key factors</p>
                <p style={{ fontSize: 7, color: "rgba(255,255,255,0.45)", marginBottom: 1 }}>• Improvement suggestions</p>
                <p style={{ fontSize: 7, color: "rgba(255,255,255,0.45)" }}>• Colour score</p>
              </div>
              <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ v: healthScore }, { v: 100 - healthScore }]}
                      dataKey="v"
                      innerRadius={13}
                      outerRadius={22}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="rgba(255,255,255,0.05)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 8,
                    fontWeight: 800,
                    color: "#10b981",
                  }}
                >
                  {healthScore}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#10b981", marginTop: 4, textShadow: "0 0 12px rgba(16,185,129,0.5)" }}>
              {healthScore}/100
            </p>
          </>
        )}
      </Card>

      {/* 15. INVESTMENT RETURNS — Bottom Right */}
      <Card
        delay={0.6}
        accent="#a78bfa"
        floatDelay={2.7}
        floatDuration={5.2}
        floatAmount={2.8}
        thinkingStage={thinkingStage}
        cardIndex={14}
        cardWidth={175}
        style={{ left: "69.5%", top: "83.5%" }}
      >
        <CardHeader
          label="Investment Returns"
          accent="#a78bfa"
          isMinimized={minimized["investmentReturns"]}
          onToggle={() => toggleMinimize("investmentReturns")}
        />
        {!minimized["investmentReturns"] && (
          <>
            <p style={{ fontSize: 7, color: "rgba(255,255,255,0.35)", marginBottom: 5 }}>YTD performance</p>
            <div style={{ height: 42 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={EMPTY_SPARK}>
                  <Line type="monotone" dataKey="v" stroke="#a78bfa" strokeWidth={1.8} dot={false} />
                  <Tooltip {...TT} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-1.5">
              {portfolio.allocation.length > 0
                ? portfolio.allocation.map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.color }} />
                        <span style={{ fontSize: 7, color: "rgba(255,255,255,0.45)" }}>{r.name}</span>
                      </div>
                      <span style={{ fontSize: 7.5, color: r.color, fontWeight: 700 }}>{r.percent}%</span>
                    </div>
                  ))
                : [
                    { n: "Equities", v: "—", c: "#10b981" },
                    { n: "Real Estate", v: "—", c: "#D4AF37" },
                    { n: "Bonds", v: "—", c: "#60a5fa" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: r.c }} />
                        <span style={{ fontSize: 7, color: "rgba(255,255,255,0.45)" }}>{r.n}</span>
                      </div>
                      <span style={{ fontSize: 7.5, color: r.c, fontWeight: 700 }}>{r.v}</span>
                    </div>
                  ))
              }
            </div>
          </>
        )}
      </Card>

      {/* ════════════════════════════════════════════════════════════════════════
          AI ASSISTANT BAR — Bottom center (functional chat with minimize)
          ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {chatMinimized ? (
          /* ── Minimized floating button ── */
          <motion.div
            key="minimized-btn"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setChatMinimized(false)}
            style={{
              position: "absolute",
              left: "50%",
              bottom: "3%",
              transform: "translateX(-50%)",
              zIndex: 10,
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "rgba(4,3,2,0.97)",
              border: "1.5px solid rgba(212,175,55,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: chatThinking
                ? "0 0 24px rgba(212,175,55,0.5), 0 0 48px rgba(212,175,55,0.2)"
                : "0 4px 24px rgba(0,0,0,0.8), 0 0 16px rgba(212,175,55,0.15)",
            }}
          >
            {chatThinking ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Zap size={18} style={{ color: "#D4AF37" }} />
              </motion.div>
            ) : (
              <MessageSquare size={18} style={{ color: "#D4AF37" }} />
            )}
            {!chatThinking && chatMessages.length > 0 && (
              <div style={{
                position: "absolute", top: -2, right: -2, width: 10, height: 10,
                borderRadius: "50%", background: "#D4AF37", border: "2px solid rgba(4,3,2,0.97)",
              }} />
            )}
          </motion.div>
        ) : (
          /* ── Full chat bar ── */
          <motion.div
            key="full-chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="absolute"
            style={{
              left: "50%",
              bottom: "3%",
              transform: "translateX(-50%)",
              zIndex: 10,
              width: 440,
              maxHeight: chatMessages.length > 0 ? "55vh" : "auto",
            }}
          >
            <div
              style={{
                background: "rgba(4,3,2,0.97)",
                border: "1px solid rgba(212,175,55,0.25)",
                borderRadius: 14,
                backdropFilter: "blur(32px)",
                WebkitBackdropFilter: "blur(32px)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.9), 0 0 25px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,255,255,0.03)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Top accent line */}
              <div style={{ position: "absolute", top: 0, left: "12%", right: "12%", height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)", zIndex: 1 }} />

              {/* ── Header bar ── */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 14px",
                  borderBottom: chatMessages.length > 0 ? "1px solid rgba(212,175,55,0.1)" : "none",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={12} style={{ color: "#D4AF37" }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(212,175,55,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    VaultIQ AI
                  </span>
                  {chatThinking && (
                    <span style={{ fontSize: 8, color: "rgba(212,175,55,0.5)", letterSpacing: "0.05em" }}>
                      Thinking...
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {/* History toggle → opens right panel */}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowHistory(h => !h)}
                    style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: showHistory ? "rgba(212,175,55,0.15)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer",
                      border: showHistory ? "1px solid rgba(212,175,55,0.25)" : "1px solid transparent",
                      transition: "all 0.2s",
                    }}
                    title="Chat History"
                  >
                    <History size={12} style={{ color: showHistory ? "#D4AF37" : "rgba(255,255,255,0.3)" }} />
                  </motion.div>
                  {/* Clear chat */}
                  {chatMessages.length > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setChatMessages([])}
                      style={{
                        width: 26, height: 26, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", border: "1px solid transparent", transition: "all 0.2s",
                      }}
                      title="New Chat"
                    >
                      <Plus size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                    </motion.div>
                  )}
                  {/* Minimize */}
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setChatMinimized(true)}
                    style={{
                      width: 26, height: 26, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", border: "1px solid transparent", transition: "all 0.2s",
                    }}
                    title="Minimize"
                  >
                    <Minus size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
                  </motion.div>
                </div>
              </div>

              {/* ── Messages area ── */}
              {chatMessages.length > 0 && (
                <div
                  ref={chatScrollRef}
                  style={{
                    maxHeight: "40vh",
                    overflowY: "auto",
                    padding: "12px 16px 8px",
                    scrollbarWidth: "thin",
                  }}
                >
                  <AnimatePresence initial={false}>
                    {chatMessages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{ marginBottom: 10, display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
                      >
                        {m.role === "user" ? (
                          <span style={{
                            fontSize: 11, color: "rgba(52,211,153,0.9)", padding: "7px 14px",
                            borderRadius: 12, background: "rgba(52,211,153,0.07)",
                            border: "1px solid rgba(52,211,153,0.14)", maxWidth: "80%", lineHeight: 1.5,
                          }}>
                            {m.content}
                          </span>
                        ) : (
                          <div style={{ maxWidth: "85%" }}>
                            <p style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(212,175,55,0.5)", marginBottom: 4, textTransform: "uppercase" }}>
                              VaultIQ AI
                            </p>
                            <div style={{
                              fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.7,
                              padding: "10px 14px", borderRadius: 12,
                              background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)",
                            }}>
                              {m.content || (
                                <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
                                  {[0,1,2].map(j => (
                                    <motion.span key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(212,175,55,0.5)" }}
                                      animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.15 }} />
                                  ))}
                                </span>
                              )}
                              {m.content && (
                                <motion.span
                                  style={{ display: "inline-block", width: 2, height: 12, background: "rgba(212,175,55,0.7)", marginLeft: 1, verticalAlign: "text-bottom" }}
                                  animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {chatThinking && chatMessages[chatMessages.length - 1]?.role === "user" && (
                      <motion.div key="thinking" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "rgba(212,175,55,0.03)", border: "1px solid rgba(212,175,55,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 1.5, height: 20 }}>
                          {[3,7,12,15,10,6,14,16,11,7,4,9,14,10,6,3].map((h, i) => (
                            <motion.div key={i} style={{ width: 1.8, height: h, borderRadius: 2, background: "linear-gradient(to top, rgba(212,175,55,0.15), rgba(212,175,55,0.65))" }}
                              animate={{ scaleY: [0.2, 1, 0.2] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.03em" }}>Analyzing your finances...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── Input area ── */}
              <div style={{ padding: chatMessages.length > 0 ? "6px 14px 10px" : "10px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: chatThinking ? "linear-gradient(135deg, rgba(212,175,55,0.4), rgba(212,175,55,0.12))" : "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.06))",
                    border: "1.5px solid rgba(212,175,55,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    boxShadow: chatThinking ? "0 0 14px rgba(212,175,55,0.35)" : "0 0 10px rgba(212,175,55,0.15)",
                    transition: "all 0.3s",
                  }}>
                    {chatThinking ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Zap size={13} style={{ color: "#D4AF37" }} />
                      </motion.div>
                    ) : <Zap size={13} style={{ color: "#D4AF37" }} />}
                  </div>

                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendChatMessage(chatInput)}
                    placeholder="Ask your AI Financial Advisor anything..."
                    disabled={chatThinking}
                    style={{ flex: 1, fontSize: 10.5, color: "rgba(255,255,255,0.85)", background: "transparent", border: "none", outline: "none", padding: "6px 0", letterSpacing: "0.01em" }}
                  />

                  {chatMessages.length === 0 && !chatThinking && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {["Analyze spending", "Investment tips"].map((p, i) => (
                        <span key={i} onClick={() => sendChatMessage(p)}
                          style={{ fontSize: 8, padding: "3px 10px", borderRadius: 8, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)", color: "rgba(212,175,55,0.6)", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,175,55,0.15)"; e.currentTarget.style.color = "rgba(212,175,55,0.9)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(212,175,55,0.08)"; e.currentTarget.style.color = "rgba(212,175,55,0.6)"; }}
                        >{p}</span>
                      ))}
                    </div>
                  )}

                  {chatThinking && (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 1.5, height: 20, flexShrink: 0 }}>
                      {[4,8,14,12,6,10,16,14,8,5,10,14,12,6,4].map((h, i) => (
                        <motion.div key={i} style={{ width: 2, height: h, borderRadius: 2, background: "linear-gradient(to top, rgba(212,175,55,0.2), rgba(212,175,55,0.7))" }}
                          animate={{ scaleY: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.06, ease: "easeInOut" }} />
                      ))}
                    </div>
                  )}

                  <motion.div
                    whileHover={!chatThinking && chatInput.trim() ? { scale: 1.08, boxShadow: "0 0 18px rgba(212,175,55,0.45)" } : {}}
                    whileTap={!chatThinking && chatInput.trim() ? { scale: 0.92 } : {}}
                    onClick={() => sendChatMessage(chatInput)}
                    style={{
                      width: 30, height: 30, borderRadius: "50%",
                      background: chatInput.trim() && !chatThinking ? "linear-gradient(135deg, #F5D060, #C8922A)" : "rgba(255,255,255,0.04)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      cursor: chatInput.trim() && !chatThinking ? "pointer" : "default",
                      boxShadow: chatInput.trim() && !chatThinking ? "0 2px 10px rgba(212,175,55,0.25)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <Send size={12} style={{ color: chatInput.trim() && !chatThinking ? "#000" : "rgba(255,255,255,0.18)" }} />
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════════
          RIGHT-SIDE HISTORY PANEL — Slides in from right
          ════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            key="history-panel"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
            style={{
              position: "absolute",
              right: "1%",
              top: "11%",
              bottom: "12%",
              width: 300,
              zIndex: 20,
              background: "rgba(4,3,2,0.97)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 16,
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.9), 0 0 30px rgba(212,175,55,0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: "1px solid rgba(212,175,55,0.12)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <History size={14} style={{ color: "#D4AF37" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.85)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Chat History
                </span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", background: "rgba(212,175,55,0.08)", padding: "1px 7px", borderRadius: 8 }}>
                  {chatHistory.length}
                </span>
              </div>
              <motion.div
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowHistory(false)}
                style={{
                  width: 24, height: 24, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.2s",
                }}
              >
                <Minus size={10} style={{ color: "rgba(255,255,255,0.4)" }} />
              </motion.div>
            </div>

            {/* History list */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}>
              {chatHistory.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <History size={28} style={{ color: "rgba(212,175,55,0.15)", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                    No conversations yet.
                  </p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 4 }}>
                    Start chatting to build your history.
                  </p>
                </div>
              ) : (
                chatHistory.map((session, idx) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => {
                      setChatMessages(session.messages);
                      setShowHistory(false);
                    }}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(212,175,55,0.06)",
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(212,175,55,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.65)", lineHeight: 1.4, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {session.summary}
                      </p>
                      <motion.div
                        whileHover={{ scale: 1.2, color: "#ef4444" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatHistory(p => p.filter(h => h.id !== session.id));
                        }}
                        style={{ marginLeft: 8, flexShrink: 0, cursor: "pointer", padding: 2 }}
                      >
                        <Trash2 size={10} style={{ color: "rgba(255,255,255,0.2)" }} />
                      </motion.div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 8, color: "rgba(212,175,55,0.45)" }}>
                        {session.messages.length} messages
                      </span>
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.12)" }}>•</span>
                      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.22)" }}>
                        {new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                        {new Date(session.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {/* Preview of last message */}
                    {session.messages.length > 0 && (
                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 6, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {session.messages[session.messages.length - 1].content.slice(0, 80)}...
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer with clear all */}
            {chatHistory.length > 0 && (
              <div style={{
                padding: "10px 16px",
                borderTop: "1px solid rgba(212,175,55,0.1)",
                flexShrink: 0,
              }}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setChatHistory([])}
                  style={{
                    width: "100%", padding: "7px 0", borderRadius: 8,
                    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                >
                  <Trash2 size={10} style={{ color: "rgba(239,68,68,0.6)" }} />
                  <span style={{ fontSize: 9, color: "rgba(239,68,68,0.6)", letterSpacing: "0.03em" }}>
                    Clear All History
                  </span>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
