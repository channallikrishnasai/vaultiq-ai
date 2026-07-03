"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import DashboardScene from "./DashboardScene";
import NeuralNetwork from "./NeuralNetwork";
import DashboardFloatingCards from "./DashboardFloatingCards";
import DashboardKPIRow from "./DashboardKPIRow";
import DashboardHeader from "./DashboardHeader";
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
        {/* Star field — dense, multi-layer, premium */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(0.8px 0.8px at 2% 5%, rgba(255,255,255,0.7), transparent),
              radial-gradient(1px 1px at 5% 15%, rgba(245,208,96,0.5), transparent),
              radial-gradient(0.8px 0.8px at 8% 28%, rgba(255,255,255,0.6), transparent),
              radial-gradient(1.2px 1.2px at 12% 42%, rgba(245,208,96,0.4), transparent),
              radial-gradient(0.8px 0.8px at 16% 58%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1px 1px at 20% 72%, rgba(245,208,96,0.45), transparent),
              radial-gradient(0.8px 0.8px at 24% 88%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1.5px 1.5px at 28% 8%, rgba(255,255,255,0.65), transparent),
              radial-gradient(0.8px 0.8px at 32% 22%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1px 1px at 36% 38%, rgba(255,255,255,0.6), transparent),
              radial-gradient(0.8px 0.8px at 40% 52%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.2px 1.2px at 44% 68%, rgba(255,255,255,0.55), transparent),
              radial-gradient(0.8px 0.8px at 48% 82%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1px 1px at 52% 12%, rgba(255,255,255,0.7), transparent),
              radial-gradient(0.8px 0.8px at 56% 28%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1.5px 1.5px at 60% 45%, rgba(255,255,255,0.6), transparent),
              radial-gradient(0.8px 0.8px at 64% 62%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1px 1px at 68% 78%, rgba(255,255,255,0.55), transparent),
              radial-gradient(0.8px 0.8px at 72% 92%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1.2px 1.2px at 76% 18%, rgba(255,255,255,0.65), transparent),
              radial-gradient(0.8px 0.8px at 80% 35%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1px 1px at 84% 52%, rgba(255,255,255,0.6), transparent),
              radial-gradient(0.8px 0.8px at 88% 68%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.5px 1.5px at 92% 85%, rgba(255,255,255,0.55), transparent),
              radial-gradient(0.8px 0.8px at 96% 25%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1px 1px at 4% 35%, rgba(255,255,255,0.5), transparent),
              radial-gradient(0.8px 0.8px at 10% 65%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1.2px 1.2px at 14% 82%, rgba(255,255,255,0.6), transparent),
              radial-gradient(0.8px 0.8px at 18% 12%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1px 1px at 22% 48%, rgba(255,255,255,0.55), transparent),
              radial-gradient(0.8px 0.8px at 26% 58%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.5px 1.5px at 30% 75%, rgba(255,255,255,0.65), transparent),
              radial-gradient(0.8px 0.8px at 34% 5%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1px 1px at 38% 92%, rgba(255,255,255,0.6), transparent),
              radial-gradient(0.8px 0.8px at 42% 18%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.2px 1.2px at 46% 32%, rgba(255,255,255,0.55), transparent),
              radial-gradient(0.8px 0.8px at 50% 78%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1px 1px at 54% 95%, rgba(255,255,255,0.5), transparent),
              radial-gradient(0.8px 0.8px at 58% 8%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1.5px 1.5px at 62% 22%, rgba(255,255,255,0.7), transparent),
              radial-gradient(0.8px 0.8px at 66% 42%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1px 1px at 70% 55%, rgba(255,255,255,0.6), transparent),
              radial-gradient(0.8px 0.8px at 74% 72%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.2px 1.2px at 78% 88%, rgba(255,255,255,0.55), transparent),
              radial-gradient(0.8px 0.8px at 82% 15%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1px 1px at 86% 45%, rgba(255,255,255,0.65), transparent),
              radial-gradient(0.8px 0.8px at 90% 62%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1.5px 1.5px at 94% 78%, rgba(255,255,255,0.6), transparent),
              radial-gradient(0.8px 0.8px at 98% 32%, rgba(245,208,96,0.4), transparent)
            `,
            backgroundRepeat: "repeat",
            backgroundSize: "100% 100%",
            animation: "starTwinkle 12s ease-in-out infinite alternate",
            opacity: 0.9,
          }}
        />
        {/* Nebula — golden center glow + colored accents */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 65% 55% at 50% 46%, rgba(232,184,48,0.14) 0%, transparent 50%),
              radial-gradient(ellipse 80% 60% at 50% 44%, rgba(200,160,40,0.08) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 82% 12%, rgba(167,139,250,0.06) 0%, transparent 45%),
              radial-gradient(ellipse 45% 35% at 12% 78%, rgba(96,165,250,0.05) 0%, transparent 45%),
              radial-gradient(ellipse 40% 30% at 90% 72%, rgba(16,185,129,0.04) 0%, transparent 45%),
              radial-gradient(ellipse 55% 45% at 50% 46%, rgba(245,208,96,0.06) 0%, transparent 55%),
              radial-gradient(ellipse 90% 70% at 50% 50%, rgba(40,20,0,0.3) 0%, transparent 70%)
            `,
            animation: "nebulaDrift 25s ease-in-out infinite alternate",
          }}
        />
        {/* Floating dust particles — CSS */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 10% 20%, rgba(245,208,96,0.3), transparent),
              radial-gradient(1.5px 1.5px at 25% 40%, rgba(245,208,96,0.2), transparent),
              radial-gradient(1px 1px at 40% 60%, rgba(245,208,96,0.25), transparent),
              radial-gradient(1.2px 1.2px at 55% 80%, rgba(245,208,96,0.15), transparent),
              radial-gradient(1px 1px at 70% 15%, rgba(245,208,96,0.2), transparent),
              radial-gradient(1.5px 1.5px at 85% 35%, rgba(245,208,96,0.25), transparent),
              radial-gradient(1px 1px at 15% 70%, rgba(245,208,96,0.2), transparent),
              radial-gradient(1.2px 1.2px at 60% 30%, rgba(245,208,96,0.15), transparent)
            `,
            animation: "dustFloat 20s ease-in-out infinite",
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

      {/* ── Header with profile ── */}
      {uiReady && <DashboardHeader user={{ name: user.name ?? null, email: user.email ?? null, image: user.image ?? null }} />}

      {/* ── Top KPI Bar ── */}
      {uiReady && (
        <div className="absolute top-[52px] left-0 right-0 z-10 px-4 pt-2">
          <DashboardKPIRow
            netWorth={data.netWorth}
            monthlyIncome={data.monthlyIncome}
            monthlyExpenses={data.monthlyExpenses}
            savingsRate={data.savingsRate}
            healthScore={data.healthScore.score}
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
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2;
            const x2 = 50 + Math.cos(angle) * 35;
            const y2 = 46 + Math.sin(angle) * 39;
            return (
              <line
                key={`line-${i}`}
                x1="50%" y1="46%"
                x2={`${x2}%`} y2={`${y2}%`}
                stroke="url(#lineGrad)"
                strokeWidth="0.35"
                filter="url(#glow-line)"
                style={{
                  animation: `constellationFade ${2.8 + (i % 3) * 0.5}s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            );
          })}
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2;
            const cx = 50 + Math.cos(angle) * 35;
            const cy = 46 + Math.sin(angle) * 39;
            return (
              <circle
                key={`dot-${i}`}
                cx={`${cx}%`} cy={`${cy}%`}
                r="1.4"
                fill="#D4AF37"
                opacity="0.25"
                filter="url(#glow-line)"
                style={{
                  animation: `pulse-dot ${2 + (i % 3) * 0.3}s ease-in-out ${i * 0.12}s infinite`,
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

      {/* ── Golden wireframe glow halo — rich gold, Saturn style ── */}
      {uiReady && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "46%",
              transform: "translate(-50%, -50%)",
              width: "44vmin",
              height: "44vmin",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(232,184,48,0.1) 0%, rgba(232,184,48,0.04) 35%, transparent 60%)",
              filter: "blur(20px)",
              zIndex: 3,
              animation: "orbGlow 4s ease-in-out infinite alternate",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "46%",
              transform: "translate(-50%, -50%)",
              width: "28vmin",
              height: "28vmin",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,200,66,0.07) 0%, rgba(232,184,48,0.03) 45%, transparent 65%)",
              filter: "blur(12px)",
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
        @keyframes starTwinkle {
          0% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.02); }
          100% { opacity: 0.65; transform: scale(1); }
        }
        @keyframes nebulaDrift {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(0.5%, -0.3%) rotate(0.15deg); }
          50% { transform: translate(-0.3%, 0.5%) rotate(-0.1deg); }
          75% { transform: translate(0.3%, -0.5%) rotate(0.05deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.55; }
        }
        @keyframes constellationFade {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.25; }
        }
        @keyframes shimmerBorder {
          0% { border-color: rgba(212,175,55,0.2); }
          50% { border-color: rgba(212,175,55,0.45); }
          100% { border-color: rgba(212,175,55,0.2); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbGlow {
          0% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.95; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes dustFloat {
          0% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-8px) translateX(4px); }
          50% { transform: translateY(-4px) translateX(-3px); }
          75% { transform: translateY(-12px) translateX(2px); }
          100% { transform: translateY(0) translateX(0); }
        }
      `}</style>
    </div>
  );
}
