"use client";

import { motion } from "framer-motion";

export default function OrbitGlow() {
  return (
    <>
      {/* Gold glow */}
      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.18, 0.35, 0.18],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 220,
          height: 220,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0.08) 45%, transparent 75%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Blue glow */}
      <motion.div
        animate={{
          scale: [1.05, 1.2, 1.05],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 300,
          height: 300,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    </>
  );
}