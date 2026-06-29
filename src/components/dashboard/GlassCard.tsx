"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode, CSSProperties } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  hover?: boolean;
  glow?: "gold" | "blue" | "green" | "none";
  onClick?: () => void;
}

const GLOW_COLORS = {
  gold: {
    border: "rgba(212,175,55,0.22)",
    shadow: "0 0 32px rgba(212,175,55,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
    hoverShadow: "0 0 48px rgba(212,175,55,0.16), inset 0 1px 0 rgba(255,255,255,0.08)",
    bg: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(0,0,0,0.78) 100%)",
  },
  blue: {
    border: "rgba(60,120,220,0.22)",
    shadow: "0 0 32px rgba(60,120,220,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
    hoverShadow: "0 0 48px rgba(60,120,220,0.14), inset 0 1px 0 rgba(255,255,255,0.07)",
    bg: "linear-gradient(135deg, rgba(60,120,220,0.06) 0%, rgba(0,0,0,0.78) 100%)",
  },
  green: {
    border: "rgba(52,211,153,0.2)",
    shadow: "0 0 32px rgba(52,211,153,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
    hoverShadow: "0 0 48px rgba(52,211,153,0.12), inset 0 1px 0 rgba(255,255,255,0.07)",
    bg: "linear-gradient(135deg, rgba(52,211,153,0.05) 0%, rgba(0,0,0,0.78) 100%)",
  },
  none: {
    border: "rgba(255,255,255,0.07)",
    shadow: "0 0 24px rgba(0,0,0,0.4)",
    hoverShadow: "0 0 40px rgba(255,255,255,0.04)",
    bg: "rgba(0,0,0,0.72)",
  },
};

export default function GlassCard({
  children,
  className = "",
  style = {},
  delay = 0,
  hover = true,
  glow = "gold",
  onClick,
}: GlassCardProps) {
  const colors = GLOW_COLORS[glow];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        hover
          ? {
              y: -4,
              scale: 1.012,
              boxShadow: colors.hoverShadow,
              transition: { duration: 0.2, ease: "easeOut" },
            }
          : undefined
      }
      onClick={onClick}
      className={className}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: colors.shadow,
        borderRadius: 16,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated value bar ───────────────────────────────────────────────────────

export function GlassBar({
  value,
  color = "linear-gradient(90deg, #D4AF37, #34d399)",
  delay = 0,
}: {
  value: number;
  color?: string;
  delay?: number;
}) {
  return (
    <div
      className="h-[2px] w-full rounded-full mt-3 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.07)" }}
    >
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1.3, delay: delay + 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: color }}
      />
    </div>
  );
}