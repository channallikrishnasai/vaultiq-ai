"use client";

import { motion } from "framer-motion";
import { useScene } from "@/contexts/SceneContext";
import { useEffect, useRef, useState } from "react";
import { DashboardData } from "@/types/dashboard";

// Import all existing cards unchanged
import HealthScoreCard from "./HealthScoreCard";
import ExpenseSummaryCard from "./ExpenseSummaryCard";
import PortfolioCard from "./PortfolioCard";
import GoalsCard from "./GoalsCard";
import KPICards from "./KPICards";
import QuickActionsCard from "./QuickActionsCard";
import LevelCard from "./LevelCard";
import FraudShieldCard from "./FraudShieldCard";
import FinancialTwinCard from "./FinancialTwinCard";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { GoalList } from "@/components/goals/GoalList";
import Link from "next/link";

// ─── Glass container for each widget ─────────────────────────────────────────

function HoloWidget({
  children,
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { mouse } = useScene();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Subtle mouse-parallax tilt — properly cleaned up
  useEffect(() => {
    let raf: number;
    let alive = true;

    const animate = () => {
      if (!alive) return;
      setTilt({
        x: mouse.current.y * 1.5,
        y: mouse.current.x * -1.5,
      });
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [mouse]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        y: -5,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      style={{
        background:
          "linear-gradient(135deg, rgba(212,175,55,0.055) 0%, rgba(0,0,0,0.8) 100%)",
        border: "1px solid rgba(212,175,55,0.14)",
        borderRadius: 20,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow:
          "0 0 30px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.05) inset",
        // Stable transform string prevents layout jitter
        transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        willChange: "transform",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {/* Top-edge shine */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "15%",
          right: "15%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Inner glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </motion.div>
  );
}

// ─── Adapt DashboardData health breakdown to HealthScoreCard format ───────────
// DashboardData.healthScore.breakdown is Record<string, number>
// HealthScoreCard expects { name: string; value: number }[]



// ─── Main DashboardWidgets ────────────────────────────────────────────────────

interface DashboardWidgetsProps {
  data: DashboardData;
  visible: boolean;
}

export default function DashboardWidgets({
  data,
  visible,
}: DashboardWidgetsProps) {
  if (!visible) return null;

 const healthScoreForCard = {
  score: data.healthScore.score,
  label: data.healthScore.label,
  grade: data.healthScore.grade,
  breakdown: data.healthScore.breakdown,
};

  return (
    <div
      style={{
        position: "relative",
        zIndex: 15,
        width: "100%",
        maxWidth: 1280,
        margin: "0 auto",
        padding: "140px 24px 320px",
      }}
    >
      {/* KPI row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        style={{ marginBottom: 24 }}
      >
        <KPICards
          netWorth={data.netWorth}
          netWorthChange={data.netWorthChange}
          netWorthChangePercent={data.netWorthChangePercent}
          monthlyIncome={data.monthlyIncome}
          monthlyExpenses={data.monthlyExpenses}
          savingsRate={data.savingsRate}
        />
      </motion.div>

      {/* Level / Health / Quick Actions row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <HoloWidget delay={0.55}>
          <LevelCard xp={data.profile?.xp ?? 0} streak={data.profile?.streak ?? 0} />
        </HoloWidget>
        <HoloWidget delay={0.62}>
          <HealthScoreCard healthScore={healthScoreForCard} />
        </HoloWidget>
        <HoloWidget delay={0.69}>
          <QuickActionsCard />
        </HoloWidget>
      </div>

      {/* Expense / Portfolio / Goals row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <HoloWidget delay={0.76}>
          <ExpenseSummaryCard expenses={data.expenses} />
        </HoloWidget>
        <HoloWidget delay={0.82}>
          <PortfolioCard portfolio={data.portfolio} />
        </HoloWidget>
        <HoloWidget delay={0.88}>
          <GoalsCard goals={data.goals} totalGoals={data.goalsTotal} />
        </HoloWidget>
      </div>

      {/* Fraud / Twin row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 18,
          marginBottom: 18,
        }}
      >
        <HoloWidget delay={0.94}>
          <FraudShieldCard
            scanCount={data.fraudStats.scanCount}
            highRiskCount={data.fraudStats.highRiskCount}
          />
        </HoloWidget>
        <HoloWidget delay={1.0}>
          <FinancialTwinCard
            hasTwin={data.twinStats.hasTwin}
            healthScore={data.twinStats.healthScore}
            netWorth={data.twinStats.netWorth}
            twinName={data.twinStats.twinName ?? undefined}
          />
        </HoloWidget>
      </div>

      {/* Expenses list / Goals list */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 18,
        }}
      >
        <HoloWidget delay={1.05} style={{ padding: 20 }}>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}
            >
              Recent expenses
            </h3>
            {data.expensesList.length >= 5 && (
              <Link href="#expenses" style={{ fontSize: 12, color: "#2dd4bf" }}>
                View all →
              </Link>
            )}
          </div>
          <ExpenseList expenses={data.expensesList} />
        </HoloWidget>

        <HoloWidget delay={1.1} style={{ padding: 20 }}>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h3
              style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}
            >
              All goals
            </h3>
            {data.goalsTotal > 4 && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                {data.goalsTotal} total
              </span>
            )}
          </div>
          <GoalList goals={data.goalsList} />
        </HoloWidget>
      </div>
    </div>
  );
}
