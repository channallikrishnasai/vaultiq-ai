"use client";

import { motion } from "framer-motion";

const NEWS_ITEMS = [
  {
    text: "NIFTY 50 hits 52-week high on FII inflows",
    time: "2m ago",
    dot: "#34d399",
    label: "+0.82%",
  },
  {
    text: "RBI holds repo rate — debt funds rally",
    time: "18m ago",
    dot: "#f59e0b",
    label: "Neutral",
  },
  {
    text: "Gold +1.8% — your allocation gains ₹22K",
    time: "1h ago",
    dot: "#60a5fa",
    label: "+1.8%",
  },
];

export default function FloatingNews({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -8 }}
      transition={{ duration: 0.8, delay: 0.6 }}
      style={{
        position: "fixed",
        top: "6%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 248,
        zIndex: 10,
        pointerEvents: "auto",
      }}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(0,0,0,0.82) 100%)",
          border: "1px solid rgba(212,175,55,0.18)",
          borderRadius: 14,
          backdropFilter: "blur(14px)",
          padding: "12px 14px",
          boxShadow:
            "0 0 30px rgba(212,175,55,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <p
          style={{
            fontSize: 9,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(212,175,55,0.55)",
            marginBottom: 10,
          }}
        >
          Live market signals
        </p>

        {NEWS_ITEMS.map((n, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.12 }}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              paddingTop: i > 0 ? 10 : 0,
              paddingBottom: i < NEWS_ITEMS.length - 1 ? 10 : 0,
              borderBottom:
                i < NEWS_ITEMS.length - 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "none",
            }}
          >
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: n.dot,
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", lineHeight: 1.45 }}>
                {n.text}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{n.time}</p>
                <span
                  style={{
                    fontSize: 10,
                    color: n.dot,
                    fontWeight: 500,
                  }}
                >
                  {n.label}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}