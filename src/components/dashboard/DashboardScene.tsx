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
  const { orbState, uiReady, setUiReady, thinkingStage } = useOrb();
  const { mouse } = useScene();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        background: "radial-gradient(ellipse 80% 70% at 50% 46%, rgba(40,20,0,0.95) 0%, rgba(15,8,0,0.97) 35%, rgba(6,3,0,0.99) 60%, #020100 85%)",
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
        {/* Cinematic lighting — warm gold, HDR feel */}
        <ambientLight intensity={0.03} color={0xd4a020} />
        <directionalLight position={[-3, 4, 2]} intensity={0.35} color={0xF5D060} />
        <directionalLight position={[3, -2, -1]} intensity={0.06} color={0x4466aa} />
        <pointLight position={[0, 0, 1.5]} intensity={0.8} color={0xD4AF37} distance={8} decay={2} />
        {/* Rim light for depth */}
        <pointLight position={[3, 2, -2]} intensity={0.3} color={0xd4a020} distance={12} decay={2} />
        <pointLight position={[-3, -1, -2]} intensity={0.15} color={0x6688bb} distance={10} decay={2} />

        <Suspense fallback={null}>
          <FloatingParticles />
          {!uiReady && (
            <ExplosionSequence onDone={() => setTimeout(() => setUiReady(true), 180)} />
          )}
          {uiReady && <AICore state={orbState} thinkingStage={thinkingStage} />}
        </Suspense>

        <CameraRig mouse={mouse} />
      </Canvas>

      {/* Golden radial glow around orb — illuminates UI */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse 40% 35% at 50% 46%, rgba(212,175,55,0.06) 0%, rgba(212,175,55,0.02) 40%, transparent 65%)",
          zIndex: 1,
        }}
      />

      {/* Cinematic vignette — softer, reveals more orb */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 46%, transparent 22%, rgba(0,0,0,0.35) 52%, rgba(0,0,0,0.78) 80%, rgba(0,0,0,0.94) 100%)",
          zIndex: 1,
        }}
      />

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "20%",
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(2,1,0,0.96) 0%, transparent 100%)",
          zIndex: 1,
        }}
      />

      {/* Top fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "10%",
          pointerEvents: "none",
          background: "linear-gradient(to bottom, rgba(2,1,0,0.7) 0%, transparent 100%)",
          zIndex: 1,
        }}
      />
    </div>
  );
}
