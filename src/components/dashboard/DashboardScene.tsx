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
        background: "radial-gradient(ellipse 80% 70% at 50% 46%, rgba(20,12,4,0.97) 0%, rgba(8,5,2,0.98) 35%, rgba(3,2,1,0.99) 60%, #030201 85%)",
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
        {/* Cinematic lighting — warm gold, HDR feel, card illumination */}
        <ambientLight intensity={0.025} color={0xd4a020} />
        {/* Key light — warm gold from top-left */}
        <directionalLight position={[-3, 4, 2]} intensity={0.3} color={0xF5D060} />
        {/* Fill light — subtle cool from opposite */}
        <directionalLight position={[3, -2, -1]} intensity={0.05} color={0x4466aa} />
        {/* Front glow — illuminates nearby cards */}
        <pointLight position={[0, 0, 2]} intensity={1.0} color={0xD4AF37} distance={10} decay={2} />
        {/* Rim lights — depth and dimension */}
        <pointLight position={[3.5, 2, -2]} intensity={0.25} color={0xd4a020} distance={14} decay={2} />
        <pointLight position={[-3.5, -1, -2]} intensity={0.12} color={0x6688bb} distance={12} decay={2} />
        {/* Bottom fill — subtle uplight for depth */}
        <pointLight position={[0, -3, 1]} intensity={0.08} color={0xd4a020} distance={8} decay={2} />

        <Suspense fallback={null}>
          <FloatingParticles />
          {!uiReady && (
            <ExplosionSequence onDone={() => setTimeout(() => setUiReady(true), 180)} />
          )}
          {uiReady && <AICore state={orbState} thinkingStage={thinkingStage} />}
        </Suspense>

        <CameraRig mouse={mouse} />
      </Canvas>

      {/* Golden radial glow — illuminates cards with gold light */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(ellipse 55% 50% at 50% 46%, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.04) 30%, transparent 55%),
            radial-gradient(ellipse 35% 32% at 50% 46%, rgba(245,200,66,0.06) 0%, transparent 45%),
            radial-gradient(ellipse 75% 65% at 50% 46%, rgba(212,175,55,0.03) 0%, transparent 70%)
          `,
          zIndex: 1,
        }}
      />

      {/* Cinematic vignette — premium reveal */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 46%, transparent 18%, rgba(0,0,0,0.3) 48%, rgba(0,0,0,0.75) 75%, rgba(0,0,0,0.92) 100%)",
          zIndex: 1,
        }}
      />

      {/* Bottom fade — seamless transition */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "22%",
          pointerEvents: "none",
          background: "linear-gradient(to top, rgba(1,0,0,0.98) 0%, rgba(1,0,0,0.5) 40%, transparent 100%)",
          zIndex: 1,
        }}
      />

      {/* Top fade — subtle */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "9%",
          pointerEvents: "none",
          background: "linear-gradient(to bottom, rgba(1,0,0,0.75) 0%, transparent 100%)",
          zIndex: 1,
        }}
      />
    </div>
  );
}
