"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Heart, Compass, Wallet, Target, Receipt, PiggyBank,
  Shield, Bot, Zap, Star,
} from "lucide-react";
import type { OrbitCardId } from "@/store/useOrbitStore";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ComponentType<any>> = {
  Heart, Compass, Wallet, Target, Receipt, PiggyBank,
  Shield, Bot, Zap, Star,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OrbitCardProps {
  id: OrbitCardId;
  label: string;
  icon: string;
  accentColor: string;
  /** Position from orbit calculation — pixels from centre */
  x: number;
  y: number;
  /** 0–1 depth cue: cards behind orb are smaller/dimmer */
  depth: number;
  badge?: number;
  onClick: (id: OrbitCardId) => void;
  /** Whether any other card is expanded (dims this one) */
  dimmed: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrbitCard({
  id,
  label,
  icon,
  accentColor,
  x,
  y,
  depth,
  badge,
  onClick,
  dimmed,
}: OrbitCardProps) {
  const Icon = ICONS[icon] ?? Wallet;
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // depth: 1 = front, 0 = behind. Scale + opacity follow depth.
  const scale = 0.72 + depth * 0.38;          // 0.72 → 1.10
  const opacity = dimmed ? 0.18 : 0.45 + depth * 0.55; // 0.45 → 1.0

  // Mouse-tilt on hover
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const shadowX = useTransform(rotY, [-15, 15], [8, -8]);
  const shadowY = useTransform(rotX, [-15, 15], [-8, 8]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      animate(rotX, dy * -12, { duration: 0.15 });
      animate(rotY, dx * 12, { duration: 0.15 });
    },
    [rotX, rotY],
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    animate(rotX, 0, { duration: 0.4, ease: "easeOut" });
    animate(rotY, 0, { duration: 0.4, ease: "easeOut" });
  }, [rotX, rotY]);

  return (
    <motion.div
      ref={cardRef}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        x: x - 52,   // 52 = half card width
        y: y - 52,   // 52 = half card height
        width: 104,
        height: 104,
        zIndex: Math.round(depth * 10) + 1,
        cursor: dimmed ? "default" : "pointer",
        // 3-D perspective tilt
        perspective: 800,
        rotateX: rotX,
        rotateY: rotY,
      }}
      animate={{
        scale,
        opacity,
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={dimmed ? {} : { scale: scale * 1.12 }}
      onMouseMove={dimmed ? undefined : handleMouseMove}
      onMouseEnter={dimmed ? undefined : () => setHovered(true)}
      onMouseLeave={dimmed ? undefined : handleMouseLeave}
      onClick={dimmed ? undefined : () => onClick(id)}
    >
      {/* ── Card shell ──────────────────────────────────────────────────────── */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 20,
          background: `linear-gradient(
            145deg,
            rgba(20,20,20,0.92) 0%,
            rgba(10,10,10,0.96) 100%
          )`,
          border: `1px solid ${hovered ? accentColor + "55" : "rgba(212,175,55,0.14)"}`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: hovered
            ? `0 0 28px ${accentColor}33, 0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)`
            : "0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          position: "relative",
          overflow: "hidden",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      >
        {/* Top-edge specular */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "20%",
            right: "20%",
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}44, transparent)`,
            pointerEvents: "none",
          }}
        />

        {/* Radial ambient glow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: hovered
              ? `radial-gradient(ellipse at 50% 0%, ${accentColor}18 0%, transparent 70%)`
              : "none",
            pointerEvents: "none",
            transition: "background 0.3s",
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: `${accentColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon
            size={18}
            style={{
              color: accentColor,
              filter: hovered ? `drop-shadow(0 0 6px ${accentColor}88)` : "none",
              transition: "filter 0.2s",
            }}
          />
        </div>

        {/* Label */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)",
            transition: "color 0.2s",
            textAlign: "center",
            lineHeight: 1.2,
            paddingInline: 6,
          }}
        >
          {label}
        </span>

        {/* Badge */}
        {badge && badge > 0 ? (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "#000",
            }}
          >
            {badge > 9 ? "9+" : badge}
          </div>
        ) : null}

        {/* Scan line (subtle) */}
        <motion.div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}22, transparent)`,
            pointerEvents: "none",
          }}
          animate={{ top: ["0%", "100%"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Shadow */}
      <motion.div
        style={{
          position: "absolute",
          bottom: -8,
          left: "15%",
          right: "15%",
          height: 12,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${accentColor}33 0%, transparent 70%)`,
          filter: "blur(4px)",
          x: shadowX,
          y: shadowY,
          pointerEvents: "none",
          opacity: depth * 0.8,
        }}
      />
    </motion.div>
  );
}