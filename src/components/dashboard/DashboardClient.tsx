"use client";

import { OrbProvider, useOrb } from "@/contexts/OrbContext";
import { SceneProvider } from "@/contexts/SceneContext";
import DashboardScene from "./DashboardScene";
import DashboardHeader from "./DashboardHeader";
import DashboardHUD from "./DashboardHUD";
import DashboardWidgets from "./DashboardWidgets";
import NeuralNetwork from "./NeuralNetwork";
import FloatingNews from "./FloatingNews";
import AIChat from "./AIChat";
import { DashboardData, AIProfile } from "@/types/dashboard";

// ─── Inner component (inside OrbProvider so hooks work) ───────────────────────

function DashboardInner({
  data,
  userId,
  aiProfile,
}: {
  data: DashboardData;
  userId: string;
  aiProfile: AIProfile;
}) {
  const { uiReady } = useOrb();

  return (
    <>
      {/* Layer 0: Fullscreen Three.js scene + vignette */}
      <DashboardScene />

      {/* Layer 1: Neural network SVG overlay */}
      <NeuralNetwork visible={uiReady} />

      {/* Layer 2: Floating header */}
      <DashboardHeader user={data.user} visible={uiReady} />

      {/* Layer 3: Floating news */}
      <FloatingNews visible={uiReady} />

      {/* Layer 4: Holographic data panels (health, portfolio, goal, net worth) */}
      <DashboardHUD
        profile={aiProfile}
        netWorth={data.netWorth}
        visible={uiReady}
      />

      {/* Layer 5: Scrollable widget grid */}
      <div
        style={{
          position: "relative",
          zIndex: 15,
          overflowY: "auto",
          minHeight: "100vh",
          // Scrolling is on this container, not the fixed layers
        }}
      >
        <DashboardWidgets data={data} visible={uiReady} />
      </div>

      {/* Layer 6: AI chat panel (always on top) */}
      <AIChat userId={userId} />
    </>
  );
}

// ─── Root exported component ──────────────────────────────────────────────────

interface DashboardClientProps {
  data: DashboardData;
  userId: string;
}

export default function DashboardClient({
  data,
  userId,
}: DashboardClientProps) {
  const aiProfile: AIProfile = {
    income: data.profile?.income ?? null,
    goal: data.goals[0]
      ? { name: data.goals[0].name, targetAmount: data.goals[0].target }
      : null,
    riskAppetite: data.profile?.riskAppetite ?? null,
    portfolioValue: data.portfolio.isEmpty ? null : data.portfolio.totalValue,
    healthScore: data.healthScore.score,
    healthLabel: data.healthScore.label,
  };

  return (
    <OrbProvider>
      <SceneProvider>
        <div
          style={{
            position: "relative",
            minHeight: "100vh",
            background: "#000",
            overflowX: "hidden",
          }}
        >
          <DashboardInner data={data} userId={userId} aiProfile={aiProfile} />
        </div>
      </SceneProvider>
    </OrbProvider>
  );
}