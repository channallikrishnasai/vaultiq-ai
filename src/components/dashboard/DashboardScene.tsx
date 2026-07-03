"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import AICore from "./AICore";
import ExplosionSequence from "./ExplosionSequence";
import FloatingParticles from "./FloatingParticles";
import CameraRig from "./CameraRig";
import { useOrb } from "@/contexts/OrbContext";
import { useScene } from "@/contexts/SceneContext";

export default function DashboardScene() {
  const { orbState, uiReady, setUiReady } = useOrb();
  const { mouse } = useScene();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        background: "radial-gradient(ellipse 75% 65% at 50% 46%, rgba(50,25,0,0.98) 0%, rgba(20,10,0,0.96) 30%, rgba(8,4,0,0.98) 55%, #020100 80%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 46 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        style={{ position: "absolute", inset: 0 }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        {/* Scene lighting */}
        <ambientLight intensity={0.04} />
        <directionalLight position={[-4, 4, 3]} intensity={0.7} color={0xF5D060} />
        <directionalLight position={[4, -3, -2]} intensity={0.12} color={0x2244aa} />
        <pointLight position={[0, 0, 2]} intensity={1.5} color={0xD4AF37} distance={12} decay={2} />

        <Suspense fallback={null}>
          {/* Ambient golden dust */}
          <FloatingParticles />

          {/* Boot explosion sequence */}
          {!uiReady && (
            <ExplosionSequence onDone={() => setTimeout(() => setUiReady(true), 180)} />
          )}

          {/* The orb — JARVIS core */}
          {uiReady && <AICore state={orbState} />}
        </Suspense>

        <CameraRig mouse={mouse} />
      </Canvas>

      {/* Vignette overlay — softened to reveal more of the enhanced orb */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 46%, transparent 18%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0.96) 100%)",
          zIndex: 1,
        }}
      />

      {/* Bottom dark fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "22%",
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(2,1,0,0.97) 0%, transparent 100%)",
          zIndex: 1,
        }}
      />
    </div>
  );
}
