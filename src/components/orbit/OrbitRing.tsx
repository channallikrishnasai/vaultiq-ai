"use client";

import { motion } from "framer-motion";
import type { OrbitRing as OrbitRingType } from "@/store/useOrbitStore";

interface OrbitRingProps {
  ring: OrbitRingType;
  radius: number;
  /** 0 = inner (most visible), 2 = outer */
  index: number;
  dimmed: boolean;
}

// One ring = three concentric SVG elements for depth
export default function OrbitRing({ ring: _ring, radius, index, dimmed }: OrbitRingProps) {
  const size = (radius + 12) * 2;
  const cx = size / 2;
  const cy = size / 2;

  // Visual tuning per ring depth
  const configs = [
    { strokeWidth: 0.6, opacity: 0.5, dashArray: "4 12",  glowOpacity: 0.25, color: "#D4AF37" },
    { strokeWidth: 0.5, opacity: 0.35, dashArray: "3 18",  glowOpacity: 0.18, color: "#D4AF37" },
    { strokeWidth: 0.4, opacity: 0.22, dashArray: "2 22",  glowOpacity: 0.12, color: "#D4AF37" },
  ];
  const cfg = configs[index] ?? configs[2];

  const baseOpacity = dimmed ? cfg.opacity * 0.3 : cfg.opacity;
  const glowOpacity = dimmed ? cfg.glowOpacity * 0.2 : cfg.glowOpacity;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        transform: `translate(-50%, -50%)`,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <defs>
          {/* Glow filter */}
          <filter id={`ringGlow${index}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradient stroke — brighter at top */}
          <linearGradient
            id={`ringGrad${index}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor={cfg.color} stopOpacity={baseOpacity * 1.8} />
            <stop offset="45%" stopColor={cfg.color} stopOpacity={baseOpacity * 0.6} />
            <stop offset="100%" stopColor={cfg.color} stopOpacity={baseOpacity * 0.2} />
          </linearGradient>
        </defs>

        {/* Faint glow ring underneath */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={cfg.color}
          strokeWidth={cfg.strokeWidth * 6}
          strokeOpacity={glowOpacity}
          filter={`url(#ringGlow${index})`}
        />

        {/* Dashed orbit path */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={`url(#ringGrad${index})`}
          strokeWidth={cfg.strokeWidth}
          strokeDasharray={cfg.dashArray}
          initial={{ rotate: 0 }}
          animate={{ rotate: index % 2 === 0 ? 360 : -360 }}
          transition={{
            duration: 60 + index * 30,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Tick marks at cardinal points */}
        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = cx + (radius - 5) * Math.cos(rad);
          const y1 = cy + (radius - 5) * Math.sin(rad);
          const x2 = cx + (radius + 5) * Math.cos(rad);
          const y2 = cy + (radius + 5) * Math.sin(rad);
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={cfg.color}
              strokeWidth={0.8}
              strokeOpacity={baseOpacity * 0.7}
            />
          );
        })}

        {/* Orbiting highlight dot */}
        <motion.circle
          cx={cx + radius}
          cy={cy}
          r={2.5}
          fill={cfg.color}
          fillOpacity={baseOpacity * 1.4}
          filter={`url(#ringGlow${index})`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 18 + index * 9,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      </svg>
    </div>
  );
}