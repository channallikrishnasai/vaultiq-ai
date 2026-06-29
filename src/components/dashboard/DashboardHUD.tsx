"use client";

import { motion } from "framer-motion";
import GlassCard, { GlassBar } from "./GlassCard";
import { AIProfile } from "@/types/dashboard";

function formatINR(n: number | null) {
  if (n == null) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

interface DashboardHUDProps {
  profile: AIProfile;
  netWorth?: number;
  visible: boolean;
}

export default function DashboardHUD({
  profile,
  netWorth,
  visible,
}: DashboardHUDProps) {
  const goalPct =
    profile.portfolioValue && profile.goal?.targetAmount
      ? Math.min(100, Math.round((profile.portfolioValue / profile.goal.targetAmount) * 100))
      : 41;

  return (
    <>
      {/* ── Top-left: Financial Health ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -20 }}
        transition={{ duration: 0.65, delay: 0.15 }}
        style={{
          position: "fixed",
          top: "10%",
          left: "2%",
          width: 172,
          zIndex: 10,
          pointerEvents: "auto",
        }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <GlassCard delay={0} hover glow="gold" style={{ padding: "14px 16px" }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.55)",
                marginBottom: 6,
              }}
            >
              Financial health
            </p>
            <p style={{ fontSize: 28, fontWeight: 600, color: "#E8C84A", lineHeight: 1 }}>
              {profile.healthScore ?? 82}
              <span style={{ fontSize: 14, color: "rgba(232,200,74,0.45)" }}>%</span>
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
              {profile.healthLabel ?? "Excellent"} · ↑ 4pts this month
            </p>
            <GlassBar value={profile.healthScore ?? 82} delay={0} />
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Top-right: Portfolio ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 20 }}
        transition={{ duration: 0.65, delay: 0.25 }}
        style={{
          position: "fixed",
          top: "10%",
          right: "2%",
          width: 172,
          zIndex: 10,
          pointerEvents: "auto",
        }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <GlassCard delay={0} hover glow="gold" style={{ padding: "14px 16px" }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.55)",
                marginBottom: 6,
              }}
            >
              Portfolio
            </p>
            <p style={{ fontSize: 22, fontWeight: 600, color: "#E8C84A", lineHeight: 1 }}>
              {formatINR(profile.portfolioValue)}
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
              +12.4% YTD · {profile.riskAppetite ?? "Moderate"}
            </p>
            <GlassBar
              value={68}
              color="linear-gradient(90deg, #60a5fa, #D4AF37)"
              delay={0.1}
            />
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Bottom-left: Goal ──
           Positioned at bottom 38% (was 28%) to clear the AI chat panel at bottom 2%
           Chat panel is ~200px tall; 38% on a 900px screen ≈ 342px from bottom — safe gap
      ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -20 }}
        transition={{ duration: 0.65, delay: 0.35 }}
        style={{
          position: "fixed",
          bottom: "38%",
          left: "2%",
          width: 184,
          zIndex: 10,
          pointerEvents: "auto",
        }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <GlassCard delay={0} hover glow="green" style={{ padding: "14px 16px" }}>
            <p
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(52,211,153,0.5)",
                marginBottom: 6,
              }}
            >
              {profile.goal?.name ?? "House purchase"}
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#E8C84A", lineHeight: 1 }}>
              ₹{((profile.goal?.targetAmount ?? 4500000) / 100000).toFixed(0)}L{" "}
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>target</span>
            </p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
              {formatINR(profile.portfolioValue)} saved · {goalPct}% done
            </p>
            <GlassBar
              value={goalPct}
              color="linear-gradient(90deg, #34d399, #D4AF37)"
              delay={0.2}
            />
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Right-mid: Net Worth ── */}
      {netWorth != null && netWorth > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 20 }}
          transition={{ duration: 0.65, delay: 0.45 }}
          style={{
            position: "fixed",
            top: "50%",
            right: "2%",
            transform: "translateY(-50%)",
            width: 156,
            zIndex: 10,
            pointerEvents: "auto",
          }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <GlassCard delay={0} hover glow="blue" style={{ padding: "14px 16px" }}>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(96,165,250,0.5)",
                  marginBottom: 6,
                }}
              >
                Net worth
              </p>
              <p style={{ fontSize: 20, fontWeight: 600, color: "#E8C84A", lineHeight: 1 }}>
                {formatINR(netWorth)}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                All assets combined
              </p>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* ── Bottom-right: Context strip ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        style={{
          position: "fixed",
          bottom: "2%",
          right: "2%",
          zIndex: 10,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.72)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12,
            backdropFilter: "blur(10px)",
            padding: "10px 14px",
          }}
        >
          <p
            style={{
              fontSize: 9,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.2)",
              marginBottom: 6,
            }}
          >
            AI context
          </p>
          {["Income", "Goals", "Portfolio", "Health", "Market"].map((item, i) => (
            <div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: i > 0 ? 4 : 0,
              }}
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#34d399",
                }}
              />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
