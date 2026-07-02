"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useOrbitStore } from "@/store/useOrbitStore";
import type { OrbitCardId, OrbitCardDef } from "@/store/useOrbitStore";
import type { DashboardData } from "@/types/dashboard";

// ─── Card content components ──────────────────────────────────────────────────
// Each renders the existing card but inside the holographic panel.

import HealthScoreCard from "@/components/dashboard/HealthScoreCard";
import ExpenseSummaryCard from "@/components/dashboard/ExpenseSummaryCard";
import PortfolioCard from "@/components/dashboard/PortfolioCard";
import GoalsCard from "@/components/dashboard/GoalsCard";
import KPICards from "@/components/dashboard/KPICards";
import QuickActionsCard from "@/components/dashboard/QuickActionsCard";
import LevelCard from "@/components/dashboard/LevelCard";
import FraudShieldCard from "@/components/dashboard/FraudShieldCard";
import FinancialTwinCard from "@/components/dashboard/FinancialTwinCard";


// ─── Map card id → content renderer ──────────────────────────────────────────

function CardContent({
  id,
  data,
}: {
  id: OrbitCardId;
  data: DashboardData;
}) {
  const healthScoreForCard = {
    score: data.healthScore.score,
    label: data.healthScore.label,
    grade: data.healthScore.grade,
    breakdown: data.healthScore.breakdown,
  };

  switch (id) {
    case "health":
      return <HealthScoreCard healthScore={healthScoreForCard} />;

    case "portfolio":
      return <PortfolioCard portfolio={data.portfolio} />;

    case "networth":
      return (
        <KPICards
          netWorth={data.netWorth}
          netWorthChange={data.netWorthChange}
          netWorthChangePercent={data.netWorthChangePercent}
          monthlyIncome={data.monthlyIncome}
          monthlyExpenses={data.monthlyExpenses}
          savingsRate={data.savingsRate}
        />
      );

    case "goals":
      return <GoalsCard goals={data.goals} totalGoals={data.goalsTotal} />;

    case "expenses":
      return <ExpenseSummaryCard expenses={data.expenses} />;

    case "savings":
      return (
        <div style={{ color: "rgba(255,255,255,0.7)", padding: "12px 0" }}>
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Savings Rate
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#2dd4bf",
              lineHeight: 1,
            }}
          >
            {data.savingsRate.toFixed(1)}%
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
            {data.savingsRate >= 30
              ? "Excellent savings discipline"
              : data.savingsRate >= 20
              ? "Good — keep pushing"
              : data.savingsRate > 0
              ? "Room to improve"
              : "Start saving this month"}
          </div>
          <div
            style={{
              marginTop: 20,
              height: 6,
              borderRadius: 3,
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, data.savingsRate)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                height: "100%",
                borderRadius: 3,
                background: "linear-gradient(90deg, #2dd4bf, #14b8a6)",
              }}
            />
          </div>
        </div>
      );

    case "fraud":
      return (
        <FraudShieldCard
          scanCount={data.fraudStats.scanCount}
          highRiskCount={data.fraudStats.highRiskCount}
        />
      );

    case "twin":
      return (
        <FinancialTwinCard
          hasTwin={data.twinStats.hasTwin}
          healthScore={data.twinStats.healthScore}
          netWorth={data.twinStats.netWorth}
          twinName={data.twinStats.twinName ?? undefined}
        />
      );

    case "actions":
      return <QuickActionsCard />;

    case "level":
      return (
        <LevelCard
          xp={data.profile?.xp ?? 0}
          streak={data.profile?.streak ?? 0}
        />
      );

    default:
      return (
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
          No content available.
        </div>
      );
  }
}

// ─── HUD lines (decorative) ───────────────────────────────────────────────────

function HUDCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const isTop = position.startsWith("t");
  const isLeft = position.endsWith("l");

  return (
    <div
      style={{
        position: "absolute",
        top: isTop ? 12 : undefined,
        bottom: isTop ? undefined : 12,
        left: isLeft ? 12 : undefined,
        right: isLeft ? undefined : 12,
        width: 20,
        height: 20,
        pointerEvents: "none",
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20">
        {isTop && isLeft && (
          <>
            <line x1="0" y1="0" x2="20" y2="0" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.6" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.6" />
          </>
        )}
        {isTop && !isLeft && (
          <>
            <line x1="0" y1="0" x2="20" y2="0" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.6" />
            <line x1="20" y1="0" x2="20" y2="20" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.6" />
          </>
        )}
        {!isTop && isLeft && (
          <>
            <line x1="0" y1="20" x2="20" y2="20" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.6" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.6" />
          </>
        )}
        {!isTop && !isLeft && (
          <>
            <line x1="0" y1="20" x2="20" y2="20" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.6" />
            <line x1="20" y1="0" x2="20" y2="20" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.6" />
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Main panel ────────────────────────────────────────────────────────────────

interface CardExpandedProps {
  card: OrbitCardDef;
  data: DashboardData;
}

export default function CardExpanded({ card, data }: CardExpandedProps) {
  const { dismissCard, setAnimating, activeCard } = useOrbitStore();
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard dismiss
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Click-outside dismiss
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleDismiss();
      }
    },
    [],
  );

  const handleDismiss = useCallback(() => {
    dismissCard();
    // The store sets animating=true; we clear it after exit animation
    setTimeout(() => setAnimating(false), 500);
  }, [dismissCard, setAnimating]);

  return (
    <AnimatePresence>
      {activeCard === card.id && (
        <>
          {/* ── Backdrop ──────────────────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleBackdropClick}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 60,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              cursor: "pointer",
            }}
          />

          {/* ── Panel ─────────────────────────────────────────────────────── */}
          <motion.div
            key="panel"
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.82, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 61,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              pointerEvents: "none",
            }}
          >
            <div
              ref={panelRef}
              style={{
                width: "100%",
                maxWidth: 640,
                maxHeight: "80vh",
                overflowY: "auto",
                pointerEvents: "all",
                position: "relative",

                // Holographic glass
                background:
                  "linear-gradient(150deg, rgba(16,14,10,0.97) 0%, rgba(8,8,8,0.99) 100%)",
                border: `1px solid ${card.accentColor}33`,
                borderRadius: 24,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: `
                  0 0 0 0.5px rgba(255,255,255,0.04) inset,
                  0 0 60px ${card.accentColor}22,
                  0 24px 80px rgba(0,0,0,0.8)
                `,
                padding: "28px 28px 32px",
              }}
            >
              {/* HUD corners */}
              <HUDCorner position="tl" />
              <HUDCorner position="tr" />
              <HUDCorner position="bl" />
              <HUDCorner position="br" />

              {/* Top edge glow */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "20%",
                  right: "20%",
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${card.accentColor}66, transparent)`,
                  pointerEvents: "none",
                }}
              />

              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Accent dot */}
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: card.accentColor,
                      boxShadow: `0 0 8px ${card.accentColor}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: card.accentColor,
                    }}
                  >
                    {card.label}
                  </span>
                </div>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.5)",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.1)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.9)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.5)";
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Divider */}
              <div
                style={{
                  height: 1,
                  background: `linear-gradient(90deg, ${card.accentColor}33, rgba(255,255,255,0.04), transparent)`,
                  marginBottom: 24,
                }}
              />

              {/* Card content */}
              <CardContent id={card.id} data={data} />

              {/* Bottom scanning line */}
              <motion.div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent 0%, ${card.accentColor}44 40%, ${card.accentColor}44 60%, transparent 100%)`,
                  pointerEvents: "none",
                  opacity: 0.5,
                }}
                animate={{ top: ["10%", "95%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}