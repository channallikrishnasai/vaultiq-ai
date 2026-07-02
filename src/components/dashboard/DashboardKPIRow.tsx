"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronUp, ChevronDown } from "lucide-react";

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
        {!minimized && (
          <motion.div
            key="kpi-expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-8 gap-1.5 w-full">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="relative overflow-hidden rounded-xl px-3 py-2.5"
                  style={{
                    background: "rgba(10,10,14,0.95)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
                  }}
                >
                  {/* Label row */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(161,161,170,0.8)",
                        lineHeight: 1,
                      }}
                    >
                      {item.label}
                    </span>
                    <Info
                      size={9}
                      style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }}
                    />
                  </div>

                  {/* Value */}
                  <div className="flex items-baseline gap-1 mb-2">
                    <span
                      style={{
                        fontSize: 14,
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
                          fontSize: 8,
                          color: "rgba(161,161,170,0.6)",
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
                        duration: 1.2,
                        delay: i * 0.06 + 0.3,
                        ease: "easeOut",
                      }}
                      style={{
                        height: "100%",
                        borderRadius: 2,
                        background: item.barColor,
                        boxShadow: `0 0 6px ${item.barColor}88`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized view — single slim bar showing values */}
      <AnimatePresence initial={false}>
        {minimized && (
          <motion.div
            key="kpi-minimized"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-4 px-3 py-2 rounded-xl overflow-x-auto scrollbar-none"
              style={{
                background: "rgba(10,10,14,0.95)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 shrink-0">
                  <span
                    style={{
                      fontSize: 7.5,
                      color: "rgba(113,113,122,0.8)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {item.label.split(" ").slice(-1)[0]}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: item.valueColor ?? "#f4f4f5",
                    }}
                  >
                    {item.value}
                    {item.sub && (
                      <span style={{ fontSize: 7, color: "rgba(161,161,170,0.5)", marginLeft: 2 }}>
                        {item.sub}
                      </span>
                    )}
                  </span>
                  {/* Mini color dot */}
                  <span
                    className="h-1 w-1 rounded-full shrink-0"
                    style={{ background: item.barColor, boxShadow: `0 0 4px ${item.barColor}` }}
                  />
                  {i < items.length - 1 && (
                    <span style={{ color: "rgba(255,255,255,0.07)", fontSize: 12, marginLeft: 4 }}>|</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button — always visible, floats at right edge */}
      <motion.button
        onClick={() => setMinimized((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="absolute -bottom-3 right-3 z-30 flex items-center gap-1 rounded-full px-2 py-0.5"
        style={{
          background: "rgba(10,10,14,0.98)",
          border: "1px solid rgba(212,175,55,0.25)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        {minimized ? (
          <ChevronDown size={10} style={{ color: "#D4AF37" }} />
        ) : (
          <ChevronUp size={10} style={{ color: "#D4AF37" }} />
        )}
        <span style={{ fontSize: 7.5, color: "#D4AF37", fontWeight: 700, letterSpacing: "0.08em" }}>
          {minimized ? "EXPAND" : "MINIMIZE"}
        </span>
      </motion.button>
    </div>
  );
}
