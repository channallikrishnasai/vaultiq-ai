"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import DashboardKPIRow from "./DashboardKPIRow";
import FlashOverlay from "./FlashOverlay";
import DashboardParticles from "./DashboardParticles";
import LightRays from "./LightRays";
import MarketPanel from "./MarketPanel";
import { useOrb } from "@/contexts/OrbContext";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { Eye, EyeOff, X, RotateCcw } from "lucide-react";

const DashboardScene = dynamic(() => import("./DashboardScene"), { ssr: false });
const NeuralNetwork = dynamic(() => import("./NeuralNetwork"), { ssr: false });
const DashboardFloatingCards = dynamic(() => import("./DashboardFloatingCards"), { ssr: false });
const FinancialCopilotCard = dynamic(() => import("./FinancialCopilotCard"), { ssr: false });
const DocumentCenterCard = dynamic(() => import("./DocumentCenterCard"), { ssr: false });

interface DashboardLayoutProps {
  userId: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function DashboardLayout({ userId, user }: DashboardLayoutProps) {
  const { data } = useDashboardContext();
  const { uiReady, orbState, thinkingStage, setThinkingStage } = useOrb();
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cleanMode, setCleanMode] = useState(false);
  const [closedWidgets, setClosedWidgets] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboard-clean-mode");
      if (saved) setCleanMode(JSON.parse(saved));
      const savedClosed = localStorage.getItem("dashboard-closed-widgets");
      if (savedClosed) setClosedWidgets(new Set(JSON.parse(savedClosed)));
    } catch {}
  }, []);

  const toggleCleanMode = () => {
    const next = !cleanMode;
    setCleanMode(next);
    try {
      localStorage.setItem("dashboard-clean-mode", JSON.stringify(next));
    } catch {}
  };

  const closeWidget = (key: string) => {
    setClosedWidgets((prev) => {
      const next = new Set(prev);
      next.add(key);
      try {
        localStorage.setItem("dashboard-closed-widgets", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const restoreWidget = (key: string) => {
    setClosedWidgets((prev) => {
      const next = new Set(prev);
      next.delete(key);
      try {
        localStorage.setItem("dashboard-closed-widgets", JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const restoreAllWidgets = () => {
    setClosedWidgets(new Set());
    try {
      localStorage.setItem("dashboard-closed-widgets", JSON.stringify([]));
    } catch {}
  };

  const isWidgetClosed = (key: string) => closedWidgets.has(key);
  const hasClosedWidgets = closedWidgets.size > 0;

  // Multi-stage thinking animation sequencer
  useEffect(() => {
    if (orbState === "thinking") {
      setThinkingStage("jitter");
      stageTimerRef.current = setTimeout(() => {
        setThinkingStage("converge");
        stageTimerRef.current = setTimeout(() => {
          setThinkingStage("swallow");
          stageTimerRef.current = setTimeout(() => {
            setThinkingStage("flash");
            stageTimerRef.current = setTimeout(() => {}, 600);
          }, 800);
        }, 2000);
      }, 3000);
    } else if (orbState === "speaking" || orbState === "idle") {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
      setThinkingStage("reveal");
      const t = setTimeout(() => setThinkingStage("idle"), 1200);
      return () => clearTimeout(t);
    }

    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    };
  }, [orbState, setThinkingStage]);

  return (
    <div className="flex h-full w-full overflow-hidden" style={{ background: "#030201" }}>
      {/* ── Main Content Area (Orb + Cards) ── */}
      <div className="flex-1 relative overflow-hidden">
        {/* ── BACKGROUND LAYER: Warm Golden Nebula ── */}
        <div className="absolute inset-0 -z-10" style={{ background: "#030201" }}>
          <div className="absolute inset-0" style={{ background: "#030201" }} />
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 70% at 50% 46%, rgba(212,175,55,0.1) 0%, transparent 55%),
                radial-gradient(ellipse 60% 55% at 50% 44%, rgba(180,140,30,0.07) 0%, transparent 50%),
                radial-gradient(ellipse 90% 80% at 50% 50%, rgba(20,10,30,0.3) 0%, transparent 60%),
                radial-gradient(ellipse 70% 60% at 25% 20%, rgba(15,8,25,0.2) 0%, transparent 45%),
                radial-gradient(ellipse 65% 55% at 80% 75%, rgba(12,6,22,0.18) 0%, transparent 42%),
                radial-gradient(ellipse 50% 45% at 88% 12%, rgba(40,20,60,0.1) 0%, transparent 38%),
                radial-gradient(ellipse 45% 40% at 8% 82%, rgba(35,18,55,0.08) 0%, transparent 35%)
              `,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 50% 45% at 50% 46%, rgba(212,175,55,0.07) 0%, transparent 50%),
                radial-gradient(ellipse 35% 30% at 50% 46%, rgba(245,200,66,0.05) 0%, transparent 40%),
                radial-gradient(ellipse 20% 18% at 50% 46%, rgba(255,220,100,0.035) 0%, transparent 35%)
              `,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                radial-gradient(0.5px 0.5px at 3% 9%, rgba(255,255,255,0.35), transparent),
                radial-gradient(0.6px 0.6px at 11% 31%, rgba(255,255,255,0.25), transparent),
                radial-gradient(0.4px 0.4px at 19% 63%, rgba(255,255,255,0.3), transparent),
                radial-gradient(0.5px 0.5px at 34% 14%, rgba(255,255,255,0.22), transparent),
                radial-gradient(0.4px 0.4px at 48% 51%, rgba(255,255,255,0.32), transparent),
                radial-gradient(0.6px 0.6px at 62% 78%, rgba(255,255,255,0.2), transparent),
                radial-gradient(0.4px 0.4px at 76% 22%, rgba(255,255,255,0.28), transparent),
                radial-gradient(0.5px 0.5px at 89% 58%, rgba(255,255,255,0.18), transparent),
                radial-gradient(0.4px 0.4px at 40% 87%, rgba(255,255,255,0.25), transparent),
                radial-gradient(0.5px 0.5px at 68% 6%, rgba(212,175,55,0.15), transparent),
                radial-gradient(0.4px 0.4px at 55% 72%, rgba(212,175,55,0.12), transparent)
              `,
              backgroundRepeat: "repeat",
              backgroundSize: "100% 100%",
              opacity: 0.5,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 40% 35% at 18% 28%, rgba(50,25,70,0.06) 0%, transparent 40%),
                radial-gradient(ellipse 35% 30% at 82% 68%, rgba(40,20,65,0.05) 0%, transparent 38%),
                radial-gradient(ellipse 30% 25% at 12% 72%, rgba(30,15,50,0.04) 0%, transparent 35%),
                radial-gradient(ellipse 28% 22% at 88% 22%, rgba(45,22,68,0.04) 0%, transparent 32%)
              `,
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 46%, transparent 10%, rgba(3,2,1,0.35) 35%, rgba(3,2,1,0.7) 55%, rgba(3,2,1,0.9) 75%, rgba(3,2,1,0.97) 100%)",
            }}
          />
        </div>

        {/* ── CANVAS: Three.js space scene ── */}
        <div className="absolute inset-0">
          <DashboardScene />
        </div>

        {/* ── Top Controls: Clean Mode + Restore All ── */}
        {uiReady && (
          <div className="absolute top-2 right-2 z-50 flex items-center gap-2">
            {hasClosedWidgets && !cleanMode && (
              <button
                onClick={restoreAllWidgets}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition text-xs font-medium backdrop-blur-sm"
                title="Restore all closed widgets"
              >
                <RotateCcw size={14} />
                Restore All
              </button>
            )}
            <button
              onClick={toggleCleanMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition text-xs font-medium backdrop-blur-sm"
              title={cleanMode ? "Show all widgets" : "Hide all widgets (clean mode)"}
            >
              {cleanMode ? <Eye size={14} /> : <EyeOff size={14} />}
              {cleanMode ? "Show Widgets" : "Clean Mode"}
            </button>
          </div>
        )}

        {/* ── Top KPI Bar ── */}
        {uiReady && !cleanMode && !isWidgetClosed("kpi") && (
          <div className="absolute top-1 left-0 right-0 z-10 px-6 pt-3">
            <div className="relative">
              <button
                onClick={() => closeWidget("kpi")}
                className="absolute -top-2 -right-2 z-20 p-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition"
                title="Close KPI bar"
              >
                <X size={12} />
              </button>
              <DashboardKPIRow
                netWorth={data.netWorth}
                monthlyIncome={data.monthlyIncome}
                monthlyExpenses={data.monthlyExpenses}
                savingsRate={data.savingsRate}
                healthScore={data.healthScore.score}
                emergencyFund={data.emergencyFund}
                emergencyFundTarget={data.emergencyFundTarget}
                user={user}
              />
            </div>
          </div>
        )}

        {/* ── AI Financial Copilot Card ── */}
        {uiReady && !cleanMode && !isWidgetClosed("copilot") && (
          <div className="absolute top-28 right-6 z-10 w-[340px]">
            <div className="relative">
              <button
                onClick={() => closeWidget("copilot")}
                className="absolute -top-2 -right-2 z-20 p-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition"
                title="Close copilot card"
              >
                <X size={12} />
              </button>
              <FinancialCopilotCard />
            </div>
          </div>
        )}

        {/* ── Neural network SVG ── */}
        <NeuralNetwork visible={uiReady && !cleanMode && !isWidgetClosed("neural")} />

        {/* ── Dashboard-wide floating gold particles ── */}
        {uiReady && !cleanMode && !isWidgetClosed("particles") && <DashboardParticles />}

        {/* ── Light rays from orb ── */}
        {uiReady && !cleanMode && !isWidgetClosed("rays") && <LightRays />}

        {/* ── Constellation lines connecting orb to cards ── */}
        {uiReady && !cleanMode && !isWidgetClosed("constellation") && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%", zIndex: 4 }}
          >
            <defs>
              <radialGradient id="lineGrad" cx="50%" cy="46%" r="50%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.5" />
                <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </radialGradient>
              <filter id="glow-line">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = -Math.PI / 2 + (i / 6) * Math.PI * 2;
              const x2 = 50 + Math.cos(angle) * 28;
              const y2 = 46 + Math.sin(angle) * 32;
              return (
                <line
                  key={`line-${i}`}
                  x1="50%" y1="46%"
                  x2={`${x2}%`} y2={`${y2}%`}
                  stroke="url(#lineGrad)"
                  strokeWidth="0.2"
                  filter="url(#glow-line)"
                  style={{
                    animation: `constellationFade ${3.5 + (i % 3) * 0.5}s ease-in-out ${i * 0.25}s infinite`,
                  }}
                />
              );
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const angle = -Math.PI / 2 + (i / 6) * Math.PI * 2;
              const cx = 50 + Math.cos(angle) * 28;
              const cy = 46 + Math.sin(angle) * 32;
              return (
                <circle
                  key={`dot-${i}`}
                  cx={`${cx}%`} cy={`${cy}%`}
                  r="1"
                  fill="#D4AF37"
                  opacity="0.15"
                  filter="url(#glow-line)"
                  style={{
                    animation: `pulse-dot ${2.8 + (i % 3) * 0.4}s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              );
            })}
          </svg>
        )}

        {/* ── Floating data cards around the orb ── */}
        {uiReady && !cleanMode && !isWidgetClosed("cards") && (
          <DashboardFloatingCards
            netWorth={data.netWorth}
            netWorthChange={data.netWorthChange}
            monthlyIncome={data.monthlyIncome}
            monthlyExpenses={data.monthlyExpenses}
            savingsRate={data.savingsRate}
            healthScore={data.healthScore.score}
            goals={data.goals}
            portfolio={data.portfolio}
            virtualPortfolio={data.virtualPortfolio}
            expenses={data.expenses}
            fraudStats={data.fraudStats}
            twinStats={data.twinStats}
            emergencyFund={data.emergencyFund}
            emergencyFundTarget={data.emergencyFundTarget}
            user={user}
            profile={data.profile}
            orbState={orbState}
          />
        )}

        {/* ── Flash overlay for AI thinking animation ── */}
        <FlashOverlay />

        {/* ── Document Center Card — bottom right of main area ── */}
        {uiReady && !cleanMode && !isWidgetClosed("documents") && (
          <div className="absolute bottom-4 right-4 z-10 w-[260px]">
            <div className="relative">
              <button
                onClick={() => closeWidget("documents")}
                className="absolute -top-1 -right-1 z-20 p-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition"
                title="Close document center"
              >
                <X size={12} />
              </button>
              <DocumentCenterCard />
            </div>
          </div>
        )}

        {/* ── Orb glow halo — bright golden core ── */}
        {uiReady && (
          <>
            <div
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                top: "46%",
                transform: "translate(-50%, -50%)",
                width: "48vmin",
                height: "48vmin",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 35%, transparent 58%)",
                filter: "blur(28px)",
                zIndex: 3,
                animation: "orbGlow 5s ease-in-out infinite alternate",
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                top: "46%",
                transform: "translate(-50%, -50%)",
                width: "30vmin",
                height: "30vmin",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(245,200,66,0.06) 0%, rgba(212,175,55,0.025) 45%, transparent 62%)",
                filter: "blur(18px)",
                zIndex: 3,
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                top: "46%",
                transform: "translate(-50%, -50%)",
                width: "18vmin",
                height: "18vmin",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,220,100,0.04) 0%, transparent 55%)",
                filter: "blur(12px)",
                zIndex: 3,
              }}
            />
          </>
        )}

        {/* ── Bottom dark fade — warm edge ── */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "20%",
            background: "linear-gradient(to top, rgba(3,2,1,0.97) 0%, rgba(3,2,1,0.6) 40%, transparent 100%)",
            zIndex: 1,
          }}
        />
        {/* ── Top dark fade — warm edge ── */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: "9%",
            background: "linear-gradient(to bottom, rgba(3,2,1,0.85) 0%, transparent 100%)",
            zIndex: 1,
          }}
        />

        {/* Global animation keyframes */}
        <style jsx global>{`
          @keyframes pulse-dot {
            0%, 100% { opacity: 0.12; }
            50% { opacity: 0.4; }
          }
          @keyframes constellationFade {
            0%, 100% { opacity: 0.04; }
            50% { opacity: 0.16; }
          }
          @keyframes shimmerBorder {
            0% { border-color: rgba(212,175,55,0.15); }
            50% { border-color: rgba(212,175,55,0.35); }
            100% { border-color: rgba(212,175,55,0.15); }
          }
          @keyframes orbGlow {
            0% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0.75; transform: translate(-50%, -50%) scale(1.05); }
          }
        `}</style>
      </div>

      {/* ── Right Side: Market Panel ── */}
      {uiReady && !cleanMode && !isWidgetClosed("market") && (
        <div className="h-full z-10 relative">
          <button
            onClick={() => closeWidget("market")}
            className="absolute top-2 left-2 z-20 p-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition"
            title="Close market panel"
          >
            <X size={12} />
          </button>
          <MarketPanel />
        </div>
      )}
    </div>
  );
}