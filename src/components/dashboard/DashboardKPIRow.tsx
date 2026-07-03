"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronUp, BarChart3, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";

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
}

function currency(n: number) {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DashboardKPIRow({
  netWorth,
  monthlyIncome,
  monthlyExpenses,
  savingsRate,
  healthScore,
  portfolioReturn = 14.5,
  creditScore = 812,
  emergencyFund = 25000,
}: DashboardKPIRowProps) {
  const [minimized, setMinimized] = useState(false);

  const items: KPIItem[] = [
    {
      label: "Total Net Worth",
      value: currency(netWorth || 1280450.78),
      bar: 75,
      barColor: "#D4AF37",
      glowColor: "rgba(212,175,55,0.15)",
      trend: "up",
    },
    {
      label: "Monthly Income",
      value: currency(monthlyIncome || 15450),
      bar: 60,
      barColor: "#2dd4bf",
      glowColor: "rgba(45,212,191,0.12)",
      trend: "up",
    },
    {
      label: "Monthly Expenses",
      value: currency(monthlyExpenses || 7890.12),
      bar: 51,
      barColor: "#ef4444",
      glowColor: "rgba(239,68,68,0.12)",
      trend: "down",
    },
    {
      label: "Savings Rate",
      value: `${(savingsRate || 48.9).toFixed(1)}%`,
      bar: savingsRate || 48.9,
      barColor: "#facc15",
      glowColor: "rgba(250,204,21,0.12)",
      trend: "up",
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
      label: "Portfolio Return",
      value: `+${portfolioReturn}%`,
      sub: "YTD",
      bar: 68,
      barColor: "#10b981",
      valueColor: "#10b981",
      glowColor: "rgba(16,185,129,0.12)",
      trend: "up",
    },
    {
      label: "Financial Health",
      value: `${healthScore}/100`,
      bar: healthScore,
      barColor: "#10b981",
      glowColor: "rgba(16,185,129,0.12)",
      trend: "up",
    },
    {
      label: "Emergency Fund",
      value: currency(emergencyFund),
      sub: "3 Months",
      bar: 85,
      barColor: "#60a5fa",
      glowColor: "rgba(96,165,250,0.12)",
      trend: "up",
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
                    y: -2,
                    boxShadow: `0 8px 28px rgba(0,0,0,0.7), 0 0 16px ${item.glowColor}`,
                  }}
                  className="relative overflow-hidden rounded-xl px-3 py-2.5"
                  style={{
                    background: "rgba(5,4,2,0.97)",
                    border: "1px solid rgba(212,175,55,0.18)",
                    boxShadow: `0 2px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)`,
                    borderBottom: `2px solid ${item.barColor}44`,
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

                  {/* Progress bar */}
                  <div
                    style={{
                      height: 2.5,
                      width: "100%",
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.bar}%` }}
                      transition={{ duration: 1.3, delay: i * 0.06 + 0.3, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${item.barColor}88, ${item.barColor})`,
                        boxShadow: `0 0 6px ${item.barColor}66`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Minimize toggle */}
            <motion.button
              onClick={() => setMinimized(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="absolute top-1 right-2 z-30 flex items-center gap-1 rounded-full px-2.5 py-1"
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
