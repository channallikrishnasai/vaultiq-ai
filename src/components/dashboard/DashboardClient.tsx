"use client";

import { OrbProvider, useOrb } from "@/contexts/OrbContext";
import { SceneProvider } from "@/contexts/SceneContext";
import DashboardScene from "./DashboardScene";
import DashboardKPIRow from "./DashboardKPIRow";
import FinancialLevelOverlay from "./FinancialLevelOverlay";
import AnalyticsWorkspace from "./AnalyticsWorkspace";
import DashboardFloatingCards from "./DashboardFloatingCards";
import NeuralNetwork from "./NeuralNetwork";
import AIChat from "./AIChat";
import { DashboardData } from "@/types/dashboard";

function DashboardInner({ data, userId }: { data: DashboardData; userId: string }) {
  const { uiReady } = useOrb();

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: "#040200" }}
    >
      {/* ── TOP STRIP: KPI bar (minimizable) ── */}
      <div className="relative z-20 shrink-0 px-3 pt-2.5 pb-4">
        <DashboardKPIRow
          netWorth={data.netWorth}
          monthlyIncome={data.monthlyIncome}
          monthlyExpenses={data.monthlyExpenses}
          savingsRate={data.savingsRate}
          healthScore={data.healthScore.score}
          portfolioReturn={data.portfolio.changePercent}
          emergencyFund={data.twinStats.netWorth * 0.05 || 25000}
          creditScore={812}
        />
      </div>

      {/* ── CANVAS: fills all remaining height ── */}
      <div className="relative flex-1 overflow-hidden">

        {/* Layer 0 — Three.js space scene */}
        <DashboardScene />

        {/* Layer 1 — Neural network SVG */}
        <NeuralNetwork visible={uiReady} />

        {/* Layer 1.5 — Constellation lines connecting orb to cards */}
        {uiReady && (
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 4,
            }}
          >
            <defs>
              <radialGradient id="lineGrad" cx="50%" cy="48%" r="50%">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.55"/>
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
              </radialGradient>
            </defs>
            {/* Lines from center orb outward to card positions */}
            {[
              // Left cards
              { x2: "21%",  y2: "20%" },
              { x2: "21%",  y2: "40%" },
              { x2: "21%",  y2: "58%" },
              { x2: "21%",  y2: "75%" },
              // Right cards
              { x2: "77%",  y2: "20%" },
              { x2: "77%",  y2: "40%" },
              { x2: "77%",  y2: "58%" },
              { x2: "77%",  y2: "74%" },
              // Top/bottom center
              { x2: "50%",  y2: "5%"  },
              { x2: "32%",  y2: "92%" },
              { x2: "50%",  y2: "92%" },
              { x2: "68%",  y2: "92%" },
            ].map((pt, i) => (
              <line
                key={i}
                x1="50%" y1="48%"
                x2={pt.x2} y2={pt.y2}
                stroke="url(#lineGrad)"
                strokeWidth="0.6"
                style={{
                  animation: `constellationFade ${2.5 + (i % 4) * 0.5}s ease-in-out ${i * 0.18}s infinite`,
                }}
              />
            ))}
            {/* Subtle dots at card anchor points */}
            {[
              { cx: "21%", cy: "20%" }, { cx: "21%", cy: "40%" }, { cx: "21%", cy: "58%" }, { cx: "21%", cy: "75%" },
              { cx: "77%", cy: "20%" }, { cx: "77%", cy: "40%" }, { cx: "77%", cy: "58%" }, { cx: "77%", cy: "74%" },
              { cx: "50%", cy: "5%"  }, { cx: "32%", cy: "92%" }, { cx: "50%", cy: "92%" }, { cx: "68%", cy: "92%" },
            ].map((dot, i) => (
              <circle
                key={i}
                cx={dot.cx} cy={dot.cy}
                r="2"
                fill="#D4AF37"
                opacity="0.25"
              />
            ))}
          </svg>
        )}

        {/* Layer 2 — 11 rich floating data cards around the orb */}
        {uiReady && (
          <DashboardFloatingCards
            netWorth={data.netWorth}
            monthlyIncome={data.monthlyIncome}
            savingsRate={data.savingsRate}
            healthScore={data.healthScore.score}
            goals={data.goals}
          />
        )}

        {/* Layer 3 — Left panel: Financial Level, Badges, Goal Rings, Quick Actions */}
        {uiReady && <FinancialLevelOverlay data={data} />}

        {/* Layer 4 — Right panel: Notifications + Analytics + AI */}
        {uiReady && (
          <div
            className="absolute right-0 top-0 bottom-0 z-10"
            style={{ width: 248 }}
          >
            <AnalyticsWorkspace data={data} />
          </div>
        )}

        {/* Layer 5 — AI Chat bar, bottom center */}
        <AIChat userId={userId} />
      </div>
    </div>
  );
}

interface Props { data: DashboardData; userId: string }

export default function DashboardClient({ data, userId }: Props) {
  return (
    <OrbProvider>
      <SceneProvider>
        <DashboardInner data={data} userId={userId} />
      </SceneProvider>
    </OrbProvider>
  );
}