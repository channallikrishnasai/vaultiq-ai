"use client";

import { motion } from "framer-motion";

// Nodes positioned to match floating card locations
// Orb is center (50, 46)
const NODES = [
  { id: "orb",       x: 50,  y: 46 },
  { id: "finLevel",  x: 13,  y: 20 },
  { id: "badges",    x: 13,  y: 36 },
  { id: "fraud",     x: 13,  y: 50 },
  { id: "tax",       x: 13,  y: 64 },
  { id: "portfolio", x: 13,  y: 80 },
  { id: "netWorth",  x: 30,  y: 14 },
  { id: "perf",      x: 52,  y: 12 },
  { id: "income",    x: 74,  y: 14 },
  { id: "cashflow",  x: 74,  y: 32 },
  { id: "savings",   x: 74,  y: 50 },
  { id: "emergency", x: 74,  y: 66 },
  { id: "expense",   x: 74,  y: 82 },
  { id: "goals",     x: 30,  y: 82 },
  { id: "health",    x: 50,  y: 84 },
  { id: "invest",    x: 70,  y: 84 },
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
      transition={{ duration: 1.6, delay: 0.5 }}
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
          <style>{`
            @keyframes dashFlow {
              to { stroke-dashoffset: -24; }
            }
            @keyframes dashFlowFast {
              to { stroke-dashoffset: -16; }
            }
            .neural-line {
              animation: dashFlow 5s linear infinite;
            }
            .neural-line-active {
              animation: dashFlowFast 1.5s linear infinite;
            }
            @keyframes pulse-dot {
              0%, 100% { opacity: 0.3; r: 0.5; }
              50% { opacity: 0.85; r: 0.7; }
            }
            .neural-dot { animation: pulse-dot 3s ease-in-out infinite; }
            .neural-dot-active { animation: pulse-dot 1s ease-in-out infinite; }
          `}</style>
          <filter id="neural-glow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Neural edge lines */}
        {EDGES.map(([fromId, toId], i) => {
          const from = nodeMap[fromId];
          const to = nodeMap[toId];
          if (!from || !to) return null;

          const midX = (from.x + to.x) / 2 + ((i % 3) - 1) * 2;
          const midY = (from.y + to.y) / 2 + ((i % 2) - 0.5) * 3;

          return (
            <path
              key={i}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke="rgba(212,175,55,0.12)"
              strokeWidth="0.18"
              strokeDasharray="2 4"
              className="neural-line"
              filter="url(#neural-glow)"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          );
        })}

        {/* Hidden paths for animateMotion */}
        {EDGES.map(([fromId, toId], i) => {
          const from = nodeMap[fromId];
          const to = nodeMap[toId];
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2 + ((i % 3) - 1) * 2;
          const midY = (from.y + to.y) / 2 + ((i % 2) - 0.5) * 3;
          return (
            <path
              key={`hidden-${i}`}
              id={`neural-path-${i}`}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke="none"
            />
          );
        })}

        {/* Peripheral node dots */}
        {NODES.filter((n) => n.id !== "orb").map((n, i) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r="0.55"
            fill="rgba(212,175,55,0.35)"
            stroke="rgba(212,175,55,0.5)"
            strokeWidth="0.2"
            className="neural-dot"
            filter="url(#neural-glow)"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        ))}
      </svg>
    </motion.div>
  );
}
