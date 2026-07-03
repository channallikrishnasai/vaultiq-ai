"use client";

import React from "react";
import { motion } from "framer-motion";
import DashboardScene from "./DashboardScene";
import NeuralNetwork from "./NeuralNetwork";
import DashboardFloatingCards from "./DashboardFloatingCards";
import DashboardKPIRow from "./DashboardKPIRow";
import { DashboardData } from "@/types/dashboard";
import { useOrb } from "@/contexts/OrbContext";

interface DashboardLayoutProps {
  data: DashboardData;
  userId: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function DashboardLayout({ data, userId, user }: DashboardLayoutProps) {
  const { uiReady } = useOrb();

  return (
    <div className="relative flex h-full w-full overflow-hidden" style={{ background: "#020100" }}>
      {/* ── BACKGROUND LAYER: Deep Space ── */}
      <div className="absolute inset-0 -z-10" style={{ background: "#020100" }}>
        {/* Star field — dense, multi-layer, premium */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(1px 1px at 3% 8%, rgba(255,255,255,0.6), transparent),
              radial-gradient(1.2px 1.2px at 7% 18%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1px 1px at 11% 32%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1px 1px at 15% 52%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.5px 1.5px at 19% 72%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1px 1px at 23% 12%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1.2px 1.2px at 27% 42%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1px 1px at 31% 62%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1px 1px at 35% 82%, rgba(255,255,255,0.45), transparent),
              radial-gradient(1.5px 1.5px at 39% 28%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1px 1px at 43% 48%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1.2px 1.2px at 47% 68%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1px 1px at 51% 8%, rgba(255,255,255,0.6), transparent),
              radial-gradient(1px 1px at 55% 38%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.5px 1.5px at 59% 58%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1px 1px at 63% 78%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1.2px 1.2px at 67% 22%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1px 1px at 71% 42%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1px 1px at 75% 62%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1.5px 1.5px at 79% 82%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1px 1px at 83% 12%, rgba(255,255,255,0.6), transparent),
              radial-gradient(1.2px 1.2px at 87% 32%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1px 1px at 91% 52%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1px 1px at 95% 72%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.5px 1.5px at 5% 92%, rgba(255,255,255,0.45), transparent),
              radial-gradient(1px 1px at 9% 45%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1px 1px at 13% 88%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1.2px 1.2px at 17% 5%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1px 1px at 21% 55%, rgba(255,255,255,0.4), transparent),
              radial-gradient(1px 1px at 25% 95%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1.5px 1.5px at 29% 15%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1px 1px at 33% 35%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1.2px 1.2px at 37% 75%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1px 1px at 41% 25%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1px 1px at 45% 55%, rgba(255,255,255,0.4), transparent),
              radial-gradient(1.5px 1.5px at 49% 85%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1px 1px at 53% 18%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1.2px 1.2px at 57% 48%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1px 1px at 61% 68%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1px 1px at 65% 8%, rgba(245,208,96,0.45), transparent),
              radial-gradient(1.5px 1.5px at 69% 38%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1px 1px at 73% 58%, rgba(245,208,96,0.35), transparent),
              radial-gradient(1.2px 1.2px at 77% 78%, rgba(255,255,255,0.5), transparent),
              radial-gradient(1px 1px at 81% 48%, rgba(245,208,96,0.4), transparent),
              radial-gradient(1px 1px at 85% 68%, rgba(255,255,255,0.45), transparent),
              radial-gradient(1.5px 1.5px at 89% 18%, rgba(245,208,96,0.5), transparent),
              radial-gradient(1px 1px at 93% 38%, rgba(255,255,255,0.55), transparent),
              radial-gradient(1.2px 1.2px at 97% 58%, rgba(245,208,96,0.4), transparent)
            `,
            backgroundRepeat: "repeat",
            backgroundSize: "100% 100%",
            animation: "starTwinkle 12s ease-in-out infinite alternate",
            opacity: 0.85,
          }}
        />
        {/* Nebula — gold center glow (matching reference golden halo) */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 60% at 50% 46%, rgba(212,175,55,0.1) 0%, transparent 50%),
              radial-gradient(ellipse 85% 65% at 50% 44%, rgba(180,130,20,0.06) 0%, transparent 60%),
              radial-gradient(ellipse 55% 45% at 80% 15%, rgba(167,139,250,0.05) 0%, transparent 45%),
              radial-gradient(ellipse 50% 40% at 15% 75%, rgba(96,165,250,0.04) 0%, transparent 45%),
              radial-gradient(ellipse 45% 35% at 88% 70%, rgba(16,185,129,0.035) 0%, transparent 45%),
              radial-gradient(ellipse 60% 50% at 50% 46%, rgba(245,208,96,0.04) 0%, transparent 55%)
            `,
            animation: "nebulaDrift 30s ease-in-out infinite alternate",
          }}
        />
        {/* Deep vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 46%, transparent 20%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,0.98) 100%)",
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
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.2" />
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
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = -Math.PI / 2 + (i / 14) * Math.PI * 2;
            const x2 = 50 + Math.cos(angle) * 36;
            const y2 = 46 + Math.sin(angle) * 40;
            return (
              <line
                key={`line-${i}`}
                x1="50%" y1="46%"
                x2={`${x2}%`} y2={`${y2}%`}
                stroke="url(#lineGrad)"
                strokeWidth="0.5"
                filter="url(#glow-line)"
                style={{
                  animation: `constellationFade ${2.5 + (i % 4) * 0.5}s ease-in-out ${i * 0.12}s infinite`,
                }}
              />
            );
          })}
          {Array.from({ length: 14 }).map((_, i) => {
            const angle = -Math.PI / 2 + (i / 14) * Math.PI * 2;
            const cx = 50 + Math.cos(angle) * 36;
            const cy = 46 + Math.sin(angle) * 40;
            return (
              <circle
                key={`dot-${i}`}
                cx={`${cx}%`} cy={`${cy}%`}
                r="1.8"
                fill="#D4AF37"
                opacity="0.4"
                filter="url(#glow-line)"
                style={{
                  animation: `pulse-dot ${1.8 + (i % 3) * 0.4}s ease-in-out ${i * 0.1}s infinite`,
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
        />
      )}

      {/* ── Golden orb glow halo — CSS bloom overlay ── */}
      {uiReady && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: "46%",
              transform: "translate(-50%, -50%)",
              width: "42vmin",
              height: "42vmin",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 30%, rgba(212,175,55,0.03) 55%, transparent 75%)",
              filter: "blur(25px)",
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
              width: "55vmin",
              height: "55vmin",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(245,208,96,0.06) 0%, rgba(212,175,55,0.03) 40%, transparent 70%)",
              filter: "blur(40px)",
              zIndex: 2,
              animation: "orbGlow 6s ease-in-out infinite alternate-reverse",
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
      `}</style>
    </div>
  );
}
