"use client";

import { motion } from "framer-motion";
import { useOrb } from "@/contexts/OrbContext";

// Nodes in % of screen — orb is center (50, 45)
// Peripheral nodes map to widget positions
const NODES = [
  { id: "orb",       x: 50,  y: 45 }, // center orb
  { id: "health",    x: 8,   y: 18 },
  { id: "portfolio", x: 92,  y: 18 },
  { id: "goals",     x: 8,   y: 72 },
  { id: "fraud",     x: 92,  y: 72 },
  { id: "news",      x: 50,  y: 8  },
  { id: "twin",      x: 25,  y: 55 },
  { id: "expenses",  x: 75,  y: 55 },
];

const EDGES = [
  ["orb", "health"],
  ["orb", "portfolio"],
  ["orb", "goals"],
  ["orb", "fraud"],
  ["orb", "news"],
  ["orb", "twin"],
  ["orb", "expenses"],
];

export default function NeuralNetwork({ visible }: { visible: boolean }) {
  const { orbState } = useOrb();
  const isActive = orbState === "thinking" || orbState === "speaking";

  const nodeMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1.4, delay: 0.5 }}
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
              animation: dashFlow 4s linear infinite;
            }
            .neural-line-active {
              animation: dashFlowFast 1.2s linear infinite;
            }
            @keyframes pulse-dot {
              0%, 100% { opacity: 0.3; r: 0.6; }
              50% { opacity: 0.9; r: 0.9; }
            }
            .neural-dot { animation: pulse-dot 2.5s ease-in-out infinite; }
            .neural-dot-active { animation: pulse-dot 0.8s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* Neural edge lines */}
        {EDGES.map(([fromId, toId], i) => {
          const from = nodeMap[fromId];
          const to = nodeMap[toId];
          if (!from || !to) return null;

          // Slight curve via midpoint offset
          const midX = (from.x + to.x) / 2 + ((i % 3) - 1) * 3;
          const midY = (from.y + to.y) / 2 + ((i % 2) - 0.5) * 4;

          return (
            <path
              key={i}
              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
              fill="none"
              stroke={isActive ? "rgba(212,175,55,0.28)" : "rgba(212,175,55,0.1)"}
              strokeWidth={isActive ? "0.3" : "0.2"}
              strokeDasharray="2 4"
              className={isActive ? "neural-line-active" : "neural-line"}
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          );
        })}

        {/* Energy packet dots travelling along lines */}
        {isActive &&
          EDGES.map(([fromId, toId], i) => {
            const from = nodeMap[fromId];
            const to = nodeMap[toId];
            if (!from || !to) return null;

            return (
              <circle key={`packet-${i}`} r="0.55" fill="rgba(245,208,96,0.85)">
                <animateMotion
                  dur={`${1.2 + i * 0.15}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.2}s`}
                >
                  <mpath href={`#neural-path-${i}`} />
                </animateMotion>
              </circle>
            );
          })}

        {/* Hidden paths for animateMotion */}
        {EDGES.map(([fromId, toId], i) => {
          const from = nodeMap[fromId];
          const to = nodeMap[toId];
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2 + ((i % 3) - 1) * 3;
          const midY = (from.y + to.y) / 2 + ((i % 2) - 0.5) * 4;
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
            r="0.7"
            fill={isActive ? "rgba(212,175,55,0.55)" : "rgba(212,175,55,0.25)"}
            stroke={isActive ? "rgba(212,175,55,0.7)" : "rgba(212,175,55,0.35)"}
            strokeWidth="0.25"
            className={isActive ? "neural-dot-active" : "neural-dot"}
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        ))}
      </svg>
    </motion.div>
  );
}