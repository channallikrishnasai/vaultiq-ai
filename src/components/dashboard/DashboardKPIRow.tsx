"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronUp, BarChart3 } from "lucide-react";

interface KPIItem {
  label: string;
  value: string;
  sub?: string;
  bar: number;
  barColor: string;
  valueColor?: string;
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
    },
    {
      label: "Monthly Income",
      value: currency(monthlyIncome || 15450),
      bar: 60,
      barColor: "#2dd4bf",
    },
    {
      label: "Monthly Expenses",
      value: currency(monthlyExpenses || 7890.12),
      bar: 51,
      barColor: "#ef4444",
    },
    {
      label: "Savings Rate",
      value: `${(savingsRate || 48.9).toFixed(1)}%`,
      bar: savingsRate || 48.9,
      barColor: "#facc15",
    },
    {
      label: "Credit Score",
      value: String(creditScore),
      bar: ((creditScore) / 850) * 100,
      barColor: "#f59e0b",
    },
    {
      label: "Portfolio Return",
      value: `+${portfolioReturn}%`,
      sub: "YTD",
      bar: 68,
      barColor: "#10b981",
      valueColor: "#10b981",
    },
    {
      label: "Financial Health Score",
      value: `${healthScore}/100`,
      bar: healthScore,
      barColor: "#10b981",
    },
    {
      label: "Emergency Fund",
      value: currency(emergencyFund),
      sub: "3 Months",
      bar: 85,
      barColor: "#60a5fa",
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
            className="overflow-hidden pb-3"
          >
            <div className="grid grid-cols-8 gap-1.5 w-full pr-24">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="relative overflow-hidden rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(8,8,13,0.96)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
                  }}
                >
                  {/* Label row */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      style={{
                        fontSize: 7.5,
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(161,161,170,0.75)",
                        lineHeight: 1,
                      }}
                    >
                      {item.label}
                    </span>
                    <Info
                      size={8}
                      style={{ color: "rgba(255,255,255,0.12)", flexShrink: 0 }}
                    />
                  </div>

                  {/* Value */}
                  <div className="flex items-baseline gap-1 mb-1.5">
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        lineHeight: 1,
                        color: item.valueColor ?? "#f4f4f5",
                      }}
                    >
                      {item.value}
                    </span>
                    {item.sub && (
                      <span
                        style={{
                          fontSize: 7.5,
                          color: "rgba(161,161,170,0.55)",
                          fontWeight: 500,
                        }}
                      >
                        {item.sub}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: 2,
                      width: "100%",
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.bar}%` }}
                      transition={{
                        duration: 1.1,
                        delay: i * 0.05 + 0.2,
                        ease: "easeOut",
                      }}
                      style={{
                        height: "100%",
                        borderRadius: 2,
                        background: item.barColor,
                        boxShadow: `0 0 5px ${item.barColor}88`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Minimize toggle pill inside expanded state */}
            <motion.button
              onClick={() => setMinimized(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className="absolute top-2 right-2 z-30 flex items-center gap-1 rounded-full px-2.5 py-1.5"
              style={{
                background: "rgba(10,10,14,0.98)",
                border: "1px solid rgba(212,175,55,0.25)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              <ChevronUp size={10} style={{ color: "#D4AF37" }} />
              <span style={{ fontSize: 7.5, color: "#D4AF37", fontWeight: 700, letterSpacing: "0.08em" }}>
                MINIMIZE
              </span>
            </motion.button>
          </motion.div>
        ) : (
          /* Minimized state: Completely vanished bar, only a glowing floating button launcher icon */
          <motion.div
            key="kpi-minimized-trigger"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute top-2 right-2 z-40"
          >
            <motion.button
              onClick={() => setMinimized(false)}
              whileHover={{ scale: 1.1, boxShadow: "0 0 14px rgba(212,175,55,0.7)" }}
              whileTap={{ scale: 0.92 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(8,8,13,0.96)",
                border: "1.5px solid #D4AF37",
                boxShadow: "0 0 8px rgba(212,175,55,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title="Show KPI metrics"
            >
              <BarChart3 size={15} style={{ color: "#D4AF37" }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
