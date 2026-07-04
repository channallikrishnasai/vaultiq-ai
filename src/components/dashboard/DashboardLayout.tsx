"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import DashboardScene from "./DashboardScene";
import NeuralNetwork from "./NeuralNetwork";
import DashboardFloatingCards from "./DashboardFloatingCards";
import DashboardKPIRow from "./DashboardKPIRow";
import FlashOverlay from "./FlashOverlay";
import { DashboardData } from "@/types/dashboard";
import { useOrb } from "@/contexts/OrbContext";

interface DashboardLayoutProps {
  data: DashboardData;
  userId: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function DashboardLayout({ data, userId, user }: DashboardLayoutProps) {
  const { uiReady, orbState, thinkingStage, setThinkingStage } = useOrb();
  const stageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-stage thinking animation sequencer
  useEffect(() => {
    if (orbState === "thinking") {
      // Start the dramatic sequence
      setThinkingStage("jitter");
      stageTimerRef.current = setTimeout(() => {
        setThinkingStage("converge");
        stageTimerRef.current = setTimeout(() => {
          setThinkingStage("swallow");
          stageTimerRef.current = setTimeout(() => {
            setThinkingStage("flash");
            stageTimerRef.current = setTimeout(() => {
              // Flash stays until orbState changes to speaking/idle
            }, 600);
          }, 800);
        }, 2000);
      }, 3000);
    } else if (orbState === "speaking" || orbState === "idle") {
      // Response arriving — reveal cards
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
      setThinkingStage("reveal");
      // After reveal animation, go back to idle
      const t = setTimeout(() => setThinkingStage("idle"), 1200);
      return () => clearTimeout(t);
    }

    return () => {
      if (stageTimerRef.current) clearTimeout(stageTimerRef.current);
    };
  }, [orbState, setThinkingStage]);

  return (
    <div className="relative flex h-full w-full overflow-hidden" style={{ background: "#020100" }}>
      {/* ── BACKGROUND LAYER: Deep Space ── */}
      <div className="absolute inset-0 -z-10" style={{ background: "#020100" }}>
        {/* Star field — sparse, elegant */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(0.6px 0.6px at 5% 12%, rgba(255,255,255,0.5), transparent),
              radial-gradient(0.8px 0.8px at 15% 35%, rgba(212,175,55,0.35), transparent),
              radial-gradient(0.5px 0.5px at 25% 68%, rgba(255,255,255,0.4), transparent),
              radial-gradient(0.7px 0.7px at 38% 18%, rgba(212,175,55,0.3), transparent),
              radial-gradient(0.6px 0.6px at 52% 55%, rgba(255,255,255,0.45), transparent),
              radial-gradient(0.8px 0.8px at 65% 82%, rgba(212,175,55,0.3), transparent),
              radial-gradient(0.5px 0.5px at 78% 28%, rgba(255,255,255,0.35), transparent),
              radial-gradient(0.7px 0.7px at 88% 62%, rgba(212,175,55,0.25), transparent),
              radial-gradient(0.6px 0.6px at 42% 90%, rgba(255,255,255,0.4), transparent),
              radial-gradient(0.5px 0.5px at 72% 8%, rgba(212,175,55,0.3), transparent)
            `,
            backgroundRepeat: "repeat",
            backgroundSize: "100% 100%",
            opacity: 0.7,
          }}
        />
        {/* Nebula — subtle golden center glow */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% 46%, rgba(212,175,55,0.1) 0%, transparent 50%),
              radial-gradient(ellipse 75% 55% at 50% 44%, rgba(180,140,30,0.06) 0%, transparent 60%),
              radial-gradient(ellipse 45% 35% at 82% 15%, rgba(100,80,180,0.03) 0%, transparent 40%),
              radial-gradient(ellipse 40% 30% at 15% 75%, rgba(60,100,180,0.03) 0%, transparent 40%)
            `,
          }}
        />
        {/* Floating dust — very subtle */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(0.8px 0.8px at 20% 35%, rgba(212,175,55,0.15), transparent),
              radial-gradient(1px 1px at 45% 65%, rgba(212,175,55,0.12), transparent),
              radial-gradient(0.8px 0.8px at 70% 25%, rgba(212,175,55,0.1), transparent),
              radial-gradient(0.6px 0.6px at 85% 55%, rgba(212,175,55,0.08), transparent)
            `,
          }}
        />
        {/* Deep vignette — stronger edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 46%, transparent 15%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.88) 70%, rgba(0,0,0,0.98) 100%)",
          }}
        />
      </div>

      {/* ── CANVAS: Three.js space scene ── */}
      <div className="absolute inset-0">
        <DashboardScene />
      </div>

      {/* ── Top KPI Bar ── */}
      {uiReady && (
        <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-2">
          <DashboardKPIRow
            netWorth={data.netWorth}
            monthlyIncome={data.monthlyIncome}
            monthlyExpenses={data.monthlyExpenses}
            savingsRate={data.savingsRate}
            healthScore={data.healthScore.score}
            user={user}
          />
        </div>
      )}

      {/* ── Neural network SVG ── */}
      <NeuralNetwork visible={uiReady} />

      {/* ── Constellation lines connecting orb to cards ── */}
      {uiReady && (
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
            const x2 = 50 + Math.cos(angle) * 32;
            const y2 = 46 + Math.sin(angle) * 36;
            return (
              <line
                key={`line-${i}`}
                x1="50%" y1="46%"
                x2={`${x2}%`} y2={`${y2}%`}
                stroke="url(#lineGrad)"
                strokeWidth="0.25"
                filter="url(#glow-line)"
                style={{
                  animation: `constellationFade ${3 + (i % 3) * 0.6}s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            );
          })}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = -Math.PI / 2 + (i / 6) * Math.PI * 2;
            const cx = 50 + Math.cos(angle) * 32;
            const cy = 46 + Math.sin(angle) * 36;
            return (
              <circle
                key={`dot-${i}`}
                cx={`${cx}%`} cy={`${cy}%`}
                r="1.2"
                fill="#D4AF37"
                opacity="0.18"
                filter="url(#glow-line)"
                style={{
                  animation: `pulse-dot ${2.5 + (i % 3) * 0.4}s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            );
          })}
        </svg>
      )}

      {/* ── Floating data cards around the orb ── */}
      {uiReady && (
        <DashboardFloatingCards
          netWorth={data.netWorth}
          monthlyIncome={data.monthlyIncome}
          monthlyExpenses={data.monthlyExpenses}
          savingsRate={data.savingsRate}
          healthScore={data.healthScore.score}
          goals={data.goals}
          portfolio={data.portfolio}
          expenses={data.expenses}
          fraudStats={data.fraudStats}
          twinStats={data.twinStats}
          user={user}
          profile={data.profile}
          orbState={orbState}
        />
      )}

      {/* ── Flash overlay for AI thinking animation ── */}
      <FlashOverlay />

      {/* ── Orb glow halo — subtle, premium ── */}
      {uiReady && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "46%",
              transform: "translate(-50%, -50%)",
              width: "40vmin",
              height: "40vmin",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 35%, transparent 60%)",
              filter: "blur(25px)",
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
              width: "24vmin",
              height: "24vmin",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,200,66,0.05) 0%, rgba(212,175,55,0.02) 45%, transparent 65%)",
              filter: "blur(15px)",
              zIndex: 3,
            }}
          />
        </>
      )}

      {/* ── Bottom dark fade ── */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "18%",
          background: "linear-gradient(to top, rgba(2,1,0,0.95) 0%, transparent 100%)",
          zIndex: 1,
        }}
      />
      {/* ── Top dark fade ── */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "8%",
          background: "linear-gradient(to bottom, rgba(2,1,0,0.8) 0%, transparent 100%)",
          zIndex: 1,
        }}
      />

      {/* Global animation keyframes */}
      <style jsx global>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.45; }
        }
        @keyframes constellationFade {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.2; }
        }
        @keyframes shimmerBorder {
          0% { border-color: rgba(212,175,55,0.15); }
          50% { border-color: rgba(212,175,55,0.35); }
          100% { border-color: rgba(212,175,55,0.15); }
        }
        @keyframes orbGlow {
          0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.06); }
        }
      `}</style>
    </div>
  );
}
