"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ThinkingStage } from "@/lib/thinking-stages";

export function Card({
  children,
  style,
  accent = "#D4AF37",
  delay = 0,
  className = "",
  floatDelay = 0,
  floatDuration = 4,
  floatAmount = 3,
  thinkingStage = "idle",
  cardIndex = 0,
  cardWidth = 160,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
  delay?: number;
  className?: string;
  floatDelay?: number;
  floatDuration?: number;
  floatAmount?: number;
  thinkingStage?: ThinkingStage;
  cardIndex?: number;
  cardWidth?: number;
}) {
  const leftStr = String(style?.left || "50%");
  const topStr = String(style?.top || "46%");
  const cardLeft = parseFloat(leftStr) || 50;
  const cardTop = parseFloat(topStr) || 46;

  const dxVW = 50 - cardLeft;
  const dyVH = 46 - cardTop;
  const distFromCenter = Math.sqrt(dxVW * dxVW + dyVH * dyVH);
  const baseAngle = Math.atan2(dyVH, dxVW);

  const isJitter = thinkingStage === "jitter";
  const isConverge = thinkingStage === "converge";
  const isSwallow = thinkingStage === "swallow";
  const isHidden = thinkingStage === "swallow" || thinkingStage === "flash";
  const isReveal = thinkingStage === "reveal";
  const isActive = isJitter || isConverge || isSwallow;

  const orbitKeyframes = useMemo(() => {
    const numSteps = 16;
    const orbitRadius = distFromCenter * 0.85;
    const angleOffset = (cardIndex / 15) * Math.PI * 2;
    return Array.from({ length: numSteps + 1 }, (_, i) => {
      const angle = angleOffset + (i / numSteps) * Math.PI * 2;
      return {
        x: `${Math.cos(angle) * orbitRadius}vw`,
        y: `${Math.sin(angle) * orbitRadius * 0.8}vh`,
      };
    });
  }, [cardIndex, distFromCenter]);

  const convergeKeyframes = useMemo(() => {
    const numSteps = 12;
    return Array.from({ length: numSteps + 1 }, (_, i) => {
      const t = i / numSteps;
      const radius = distFromCenter * 0.85 * (1 - t * 0.95);
      const angle = baseAngle + t * Math.PI * 3;
      return {
        x: `${Math.cos(angle) * radius}vw`,
        y: `${Math.sin(angle) * radius * 0.8}vh`,
      };
    });
  }, [baseAngle, distFromCenter]);

  const getAnimate = () => {
    if (isJitter) {
      return {
        x: orbitKeyframes.map((k) => k.x),
        y: orbitKeyframes.map((k) => k.y),
        rotate: [0, 5, -5, 3, -3, 0],
        scale: 0.88,
        opacity: 0.9,
      };
    }
    if (isConverge) {
      return {
        x: convergeKeyframes.map((k) => k.x),
        y: convergeKeyframes.map((k) => k.y),
        rotate: [0, 15, -15, 8, 0],
        scale: [0.88, 0.65, 0.4, 0.2],
        opacity: [0.9, 0.6, 0.3, 0.1],
      };
    }
    if (isSwallow || isHidden) {
      return {
        x: `${dxVW}vw`,
        y: `${dyVH}vh`,
        rotate: 720,
        scale: 0,
        opacity: 0,
      };
    }
    if (isReveal) {
      return {
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        opacity: 1,
      };
    }
    return {
      x: 0,
      y: [0, -floatAmount, 0, floatAmount * 0.6, 0],
      rotate: 0,
      scale: 1,
      opacity: 1,
    };
  };

  const getTransition = () => {
    if (isJitter) {
      return {
        x: { duration: 2.5, repeat: Infinity, ease: "linear" as const },
        y: { duration: 2.5, repeat: Infinity, ease: "linear" as const },
        rotate: { duration: 0.6, repeat: Infinity, repeatType: "mirror" as const, ease: "easeInOut" as const },
        scale: { duration: 0.4 },
        opacity: { duration: 0.4 },
      };
    }
    if (isConverge) {
      return {
        x: { duration: 1.8, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        y: { duration: 1.8, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        rotate: { duration: 1.5, ease: "easeOut" as const },
        scale: { duration: 1.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
        opacity: { duration: 1.2 },
      };
    }
    if (isSwallow) {
      return {
        x: { duration: 0.6, ease: [0.6, 0, 0.8, 1] as [number, number, number, number] },
        y: { duration: 0.6, ease: [0.6, 0, 0.8, 1] as [number, number, number, number] },
        rotate: { duration: 0.6, ease: "easeIn" as const },
        scale: { duration: 0.5, ease: [0.6, 0, 0.8, 1] as [number, number, number, number] },
        opacity: { duration: 0.4 },
      };
    }
    if (isReveal) {
      return {
        x: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: delay * 0.1 },
        y: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: delay * 0.1 },
        scale: { duration: 0.7, type: "spring" as const, stiffness: 200, damping: 18, delay: delay * 0.1 },
        opacity: { duration: 0.5, delay: delay * 0.1 },
        rotate: { duration: 0.6 },
      };
    }
    return {
      opacity: { delay, duration: 0.5 },
      scale: { delay, type: "spring" as const, stiffness: 180, damping: 20 },
      x: { duration: 0 },
      y: { delay: floatDelay, duration: floatDuration, repeat: Infinity, ease: "easeInOut" as const },
      rotate: { duration: 0 },
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={getAnimate()}
      transition={getTransition()}
      whileHover={
        !isActive
          ? { y: -5, scale: 1.025, boxShadow: `0 20px 56px rgba(0,0,0,0.82), 0 0 40px ${accent}18, 0 0 15px rgba(212,175,55,0.1)`, borderColor: `${accent}55` }
          : undefined
      }
      className={`absolute ${className}`}
      style={{
        background: "rgba(10,7,3,0.92)",
        border: `1px solid ${accent}28`,
        borderRadius: 14,
        backdropFilter: "blur(36px)",
        WebkitBackdropFilter: "blur(36px)",
        boxShadow: isJitter
          ? `0 0 30px ${accent}35, 0 14px 44px rgba(0,0,0,0.82), 0 0 12px rgba(212,175,55,0.1)`
          : `0 14px 44px rgba(0,0,0,0.82), 0 0 20px ${accent}0a, 0 0 10px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,220,100,0.04)`,
        overflow: "hidden",
        padding: "10px 12px",
        color: "#fff",
        zIndex: isJitter ? 20 : 5,
        animation: isActive ? "none" : `shimmerBorder 5.5s ease-in-out ${delay}s infinite`,
        marginLeft: `-${cardWidth / 2}px`,
        marginTop: "-38px",
        width: `${cardWidth}px`,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "18%",
          right: "18%",
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}38, transparent)`,
        }}
      />
      {children}
    </motion.div>
  );
}

export function CardHeader({
  label,
  accent = "#D4AF37",
  icon,
  isMinimized,
  onToggle,
}: {
  label: string;
  accent?: string;
  icon?: React.ReactNode;
  isMinimized: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <div className="flex items-center gap-1.5">
        <div
          style={{
            width: 3,
            height: 10,
            borderRadius: 2,
            background: accent,
            boxShadow: `0 0 8px ${accent}88`,
          }}
        />
        {icon}
        <span
          style={{
            fontSize: 7.5,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: accent,
          }}
        >
          {label}
        </span>
      </div>
      <button
        onClick={onToggle}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        style={{
          fontSize: 8,
          color: "rgba(255,255,255,0.25)",
          cursor: "pointer",
          border: "none",
          background: "rgba(0,0,0,0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isMinimized ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      </button>
    </div>
  );
}
