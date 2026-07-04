"use client";

import { motion } from "framer-motion";

const NODES = [
  { id: "orb",       x: 50,  y: 46 },
  { id: "finLevel",  x: 19,  y: 20 },
  { id: "badges",    x: 19,  y: 36 },
  { id: "fraud",     x: 19,  y: 50 },
  { id: "tax",       x: 19,  y: 64 },
  { id: "portfolio", x: 19,  y: 80 },
  { id: "netWorth",  x: 29.5,  y: 14 },
  { id: "perf",      x: 51.5,  y: 12 },
  { id: "income",    x: 73.5,  y: 14 },
  { id: "cashflow",  x: 73.5,  y: 32 },
  { id: "savings",   x: 74,  y: 50 },
  { id: "emergency", x: 73.5,  y: 66 },
  { id: "expense",   x: 74,  y: 82 },
  { id: "goals",     x: 29.5,  y: 82 },
  { id: "health",    x: 49.5,  y: 84 },
  { id: "invest",    x: 69.5,  y: 84 },
];

const EDGES = [
  ["orb", "finLevel"],
  ["orb", "badges"],
  ["orb", "fraud"],
  ["orb", "tax"],
  ["orb", "portfolio"],
  ["orb", "netWorth"],
  ["orb", "perf"],
  ["orb", "income"],
  ["orb", "cashflow"],
  ["orb", "savings"],
  ["orb", "emergency"],
  ["orb", "expense"],
  ["orb", "goals"],
  ["orb", "health"],
  ["orb", "invest"],
];

export default function NeuralNetwork({ visible }: { visible: boolean }) {
  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 2.2, delay: 0.8 }}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="neural-glow">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Connection lines — ultra subtle */}
        {EDGES.map(([fromId, toId], i) => {
          const from = nodeMap[fromId];
          const to = nodeMap[toId];
          if (!from || !to) return null;

          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(212,175,55,0.04)"
              strokeWidth="0.1"
              filter="url(#neural-glow)"
            />
          );
        })}

        {/* Node dots — softer glow */}
        {NODES.filter((n) => n.id !== "orb").map((n) => (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r="0.35"
              fill="rgba(212,175,55,0.1)"
              filter="url(#neural-glow)"
            />
        ))}
      </svg>
    </motion.div>
  );
}
