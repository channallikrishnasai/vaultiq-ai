"use client";

import { useEffect, useState } from "react";
import { useOrb } from "@/contexts/OrbContext";

export default function FlashOverlay() {
  const { thinkingStage } = useOrb();
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (thinkingStage === "flash") {
      setVisible(true);
      setPhase(1);

      const fadeTimer = setTimeout(() => setPhase(2), 80);
      const fadeTimer2 = setTimeout(() => setPhase(3), 200);

      const hideTimer = setTimeout(() => {
        setVisible(false);
        setPhase(0);
      }, 650);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(fadeTimer2);
        clearTimeout(hideTimer);
      };
    }
  }, [thinkingStage]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Outer radial — wide golden burst */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: "translate(-50%, -50%)",
          width: "120vw",
          height: "120vh",
          background: "radial-gradient(circle at center, rgba(255,220,100,0.85) 0%, rgba(232,184,48,0.5) 25%, rgba(212,175,55,0.25) 45%, transparent 70%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 60ms ease-out",
        }}
      />
      {/* Inner white core — hot center */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: "translate(-50%, -50%)",
          width: "35vw",
          height: "35vh",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(255,255,255,0.95) 0%, rgba(245,200,66,0.6) 35%, transparent 75%)",
          opacity: phase >= 1 ? 1 : 0,
          transition: "opacity 50ms ease-out",
        }}
      />
      {/* Fade ring — expanding ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: "translate(-50%, -50%)",
          width: phase >= 3 ? "80vw" : "30vw",
          height: phase >= 3 ? "80vh" : "30vh",
          borderRadius: "50%",
          border: "1px solid rgba(212,175,55,0.3)",
          opacity: phase >= 3 ? 0 : 0.4,
          transition: "all 400ms ease-out",
        }}
      />
    </div>
  );
}
