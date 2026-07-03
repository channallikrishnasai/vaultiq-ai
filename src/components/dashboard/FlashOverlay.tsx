"use client";

import { useEffect, useState } from "react";
import { useOrb } from "@/contexts/OrbContext";

export default function FlashOverlay() {
  const { thinkingStage } = useOrb();
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (thinkingStage === "flash") {
      setVisible(true);
      setOpacity(1);

      const fadeTimer = setTimeout(() => {
        setOpacity(0);
      }, 50);

      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 600);

      return () => {
        clearTimeout(fadeTimer);
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
      {/* Central flash */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: "translate(-50%, -50%)",
          width: "100vw",
          height: "100vh",
          background: "radial-gradient(circle at center, rgba(255,220,100,0.95) 0%, rgba(232,184,48,0.7) 20%, rgba(212,175,55,0.4) 40%, transparent 70%)",
          opacity,
          transition: "opacity 550ms ease-out",
        }}
      />
      {/* Secondary inner flash */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: "translate(-50%, -50%)",
          width: "40vw",
          height: "40vh",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(245,200,66,0.5) 40%, transparent 80%)",
          opacity,
          transition: "opacity 400ms ease-out",
        }}
      />
    </div>
  );
}
