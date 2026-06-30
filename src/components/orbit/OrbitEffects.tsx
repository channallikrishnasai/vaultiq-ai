"use client";

import { motion } from "framer-motion";

export default function OrbitEffects() {
  return (
    <>
      {/* Rotating energy ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 620,
          height: 620,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.08)",
          pointerEvents: "none",
        }}
      />

      {/* Counter rotating ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 760,
          height: 760,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "1px dashed rgba(96,165,250,0.06)",
          pointerEvents: "none",
        }}
      />

      {/* Orbit particles */}
      {[...Array(16)].map((_, i) => {
        const angle = (360 / 16) * i;

        return (
          <motion.div
            key={i}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20 + i,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 0,
              height: 0,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              transformOrigin: "0 0",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#D4AF37",
                transform: "translateX(320px)",
                boxShadow: "0 0 12px rgba(212,175,55,0.8)",
              }}
            />
          </motion.div>
        );
      })}
    </>
  );
}