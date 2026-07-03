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
      style={{ background: "transparent" }}
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
            style={{ width: 230 }}
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