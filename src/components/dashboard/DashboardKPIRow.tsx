"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronUp, BarChart3, TrendingUp, TrendingDown, ChevronDown, LogOut, Mail } from "lucide-react";
import { signOut } from "next-auth/react";
import { formatCurrencyDecimals } from "@/utils/format";

interface KPIItem {
  label: string;
  value: string;
  sub?: string;
  bar: number;
  barColor: string;
  valueColor?: string;
  trend?: "up" | "down" | "neutral";
  glowColor?: string;
}

interface DashboardKPIRowProps {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: number;
  portfolioReturn?: number;
  creditScore?: number;
  emergencyFund?: number;
  emergencyFundTarget?: number;
  user?: { name?: string | null; email?: string | null; image?: string | null };
}

export default function DashboardKPIRow({
  netWorth,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
  healthScore,
  portfolioReturn = 0,
  creditScore = 0,
  emergencyFund = 0,
  emergencyFundTarget = 0,
  user,
}: DashboardKPIRowProps) {
  const [minimized, setMinimized] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const maxNetWorthRef = Math.max(netWorth, monthlyIncome, 1);
  const maxIncomeRef = Math.max(monthlyIncome, 1);
  const maxExpenseRef = Math.max(monthlyExpenses, 1);

  const items: KPIItem[] = [
    {
      label: "Total Net Worth",
      value: formatCurrencyDecimals(netWorth),
      bar: maxNetWorthRef > 0 ? Math.min(100, Math.round((netWorth / maxNetWorthRef) * 100)) : 0,
      barColor: "#D4AF37",
      glowColor: "rgba(212,175,55,0.15)",
      trend: netWorth >= 0 ? "up" : "down",
    },
    {
      label: "Monthly Income",
      value: formatCurrencyDecimals(monthlyIncome),
      bar: maxIncomeRef > 0 ? Math.min(100, Math.round((monthlyIncome / maxIncomeRef) * 100)) : 0,
      barColor: "#2dd4bf",
      glowColor: "rgba(45,212,191,0.12)",
      trend: monthlyIncome > 0 ? "up" : "neutral",
    },
    {
      label: "Monthly Expenses",
      value: formatCurrencyDecimals(monthlyExpenses),
      bar: maxExpenseRef > 0 ? Math.min(100, Math.round((monthlyExpenses / maxExpenseRef) * 100)) : 0,
      barColor: "#ef4444",
      glowColor: "rgba(239,68,68,0.12)",
      trend: monthlyExpenses > 0 ? "down" : "neutral",
    },
    {
      label: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      bar: Math.min(100, Math.max(0, savingsRate)),
      barColor: "#facc15",
      glowColor: "rgba(250,204,21,0.12)",
      trend: savingsRate >= 20 ? "up" : savingsRate > 0 ? "neutral" : "down",
    },
    {
      label: "Debt Score",
      value: String(creditScore),
      bar: ((creditScore) / 850) * 100,
      barColor: "#f59e0b",
      glowColor: "rgba(245,158,11,0.12)",
      trend: "neutral",
    },
    {
      label: "Virtual Return",
      value: `+${portfolioReturn}%`,
      sub: "YTD",
      bar: Math.min(100, Math.max(0, portfolioReturn)),
      barColor: "#10b981",
      valueColor: "#10b981",
      glowColor: "rgba(16,185,129,0.12)",
      trend: portfolioReturn >= 0 ? "up" : "down",
    },
    {
      label: "Financial Health",
      value: `${healthScore}/100`,
      bar: healthScore,
      barColor: "#10b981",
      glowColor: "rgba(16,185,129,0.12)",
      trend: healthScore >= 60 ? "up" : healthScore > 0 ? "neutral" : "down",
    },
    {
      label: "Emergency Fund",
      value: formatCurrencyDecimals(emergencyFund),
      sub: "3 Months",
      bar: emergencyFundTarget > 0 ? Math.min(100, Math.round((emergencyFund / emergencyFundTarget) * 100)) : 0,
      barColor: "#60a5fa",
      glowColor: "rgba(96,165,250,0.12)",
      trend: emergencyFundTarget > 0 && emergencyFund >= emergencyFundTarget ? "up" : "neutral",
    },
  ];

  return (
    <div className="relative w-full">
      <AnimatePresence initial={false}>
        {!minimized ? (
          <motion.div
            key="kpi-expanded"
            initial={{ opacity: 0, height: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, height: "auto", scaleY: 1 }}
            exit={{ opacity: 0, height: 0, scaleY: 0.95 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden pb-2"
          >
            <div className="grid grid-cols-8 gap-1.5 w-full pr-28">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  whileHover={{
                    y: -3,
                    boxShadow: `0 10px 32px rgba(0,0,0,0.75), 0 0 20px ${item.glowColor}`,
                  }}
                  className="relative overflow-hidden rounded-xl px-3 py-2.5"
                  style={{
                    background: "rgba(12,8,4,0.94)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    boxShadow: `0 4px 20px rgba(0,0,0,0.65), 0 0 18px ${item.glowColor}, 0 0 10px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,220,100,0.06)`,
                    borderBottom: `2.5px solid ${item.barColor}66`,
                    backdropFilter: "blur(36px)",
                    WebkitBackdropFilter: "blur(36px)",
                  }}
                >
                  {/* Top accent glow */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "15%",
                      right: "15%",
                      height: 1,
                      background: `linear-gradient(90deg, transparent, ${item.barColor}44, transparent)`,
                    }}
                  />

                  {/* Label */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      style={{
                        fontSize: 7.5,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(161,161,170,0.65)",
                        lineHeight: 1,
                      }}
                    >
                      {item.label}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {item.trend === "up" && <TrendingUp size={7} style={{ color: "#10b981" }} />}
                      {item.trend === "down" && <TrendingDown size={7} style={{ color: "#ef4444" }} />}
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                        lineHeight: 1,
                        color: item.valueColor ?? "#f4f4f5",
                        textShadow: item.valueColor
                          ? `0 0 12px ${item.valueColor}55`
                          : undefined,
                      }}
                    >
                      {item.value}
                    </span>
                    {item.sub && (
                      <span style={{ fontSize: 7.5, color: "rgba(161,161,170,0.45)", fontWeight: 500 }}>
                        {item.sub}
                      </span>
                    )}
                  </div>

                  {/* Progress bar — more prominent */}
                  <div
                    style={{
                      height: 3.5,
                      width: "100%",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                      boxShadow: `inset 0 1px 2px rgba(0,0,0,0.3)`,
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.bar}%` }}
                      transition={{ duration: 1.3, delay: i * 0.06 + 0.3, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        borderRadius: 4,
                        background: `linear-gradient(90deg, ${item.barColor}99, ${item.barColor})`,
                        boxShadow: `0 0 10px ${item.barColor}88, 0 0 4px ${item.barColor}aa`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Profile + Minimize */}
            <div className="absolute top-1 right-2 z-30 flex items-center gap-1.5">
              {/* Profile button */}
              {user && (
                <div className="relative">
                  <motion.button
                    onClick={() => setProfileOpen(!profileOpen)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex items-center gap-1.5 rounded-full px-2 py-1 cursor-pointer"
                    style={{
                      background: "rgba(5,4,2,0.98)",
                      border: "1px solid rgba(212,175,55,0.25)",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(212,175,55,0.1)",
                    }}
                  >
                    {user.image ? (
                      <img src={user.image} alt="" style={{ width: 14, height: 14, borderRadius: "50%" }} />
                    ) : (
                      <div style={{
                        width: 14, height: 14, borderRadius: "50%",
                        background: "linear-gradient(135deg, #D4AF37, #8B6914)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 7, fontWeight: 700, color: "#000",
                      }}>
                        {(user.name ?? "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span style={{ fontSize: 7, color: "#D4AF37", fontWeight: 700, letterSpacing: "0.06em" }}>
                      {(user.name ?? "User").split(" ")[0].toUpperCase()}
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setProfileOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          style={{
                            position: "absolute", right: 0, top: "100%", marginTop: 6,
                            width: 220, borderRadius: 10,
                            background: "rgba(10,10,14,0.97)",
                            border: "1px solid rgba(212,175,55,0.15)",
                            backdropFilter: "blur(12px)", zIndex: 50, overflow: "hidden",
                          }}
                        >
                          <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
                              {user.name ?? "User"}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <Mail size={10} style={{ color: "rgba(212,175,55,0.5)" }} />
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <div style={{ padding: 4 }}>
                            <button
                              onClick={async () => { await signOut({ callbackUrl: "/" }); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 6, width: "100%",
                                padding: "8px 10px", borderRadius: 6, background: "rgba(0,0,0,0)",
                                border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 11,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                            >
                              <LogOut size={12} />
                              Log Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <motion.button
              onClick={() => setMinimized(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{
                background: "rgba(5,4,2,0.98)",
                border: "1px solid rgba(212,175,55,0.25)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.6), 0 0 8px rgba(212,175,55,0.1)",
              }}
            >
              <ChevronUp size={9} style={{ color: "#D4AF37" }} />
              <span style={{ fontSize: 7, color: "#D4AF37", fontWeight: 700, letterSpacing: "0.08em" }}>
                MINIMIZE
              </span>
            </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="kpi-minimized-trigger"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute top-1 right-2 z-40"
          >
            <motion.button
              onClick={() => setMinimized(false)}
              whileHover={{ scale: 1.1, boxShadow: "0 0 18px rgba(212,175,55,0.75)" }}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "rgba(5,4,2,0.98)",
                border: "1.5px solid #D4AF37",
                boxShadow: "0 0 10px rgba(212,175,55,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Show KPI metrics"
            >
              <BarChart3 size={13} style={{ color: "#D4AF37" }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
