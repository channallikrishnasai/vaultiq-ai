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
        background: [
          "radial-gradient(ellipse 70% 60% at 50% 46%, rgba(35,18,0,1) 0%, rgba(14,8,0,0.92) 35%, rgba(4,3,1,0.98) 70%, #040200 100%)",
        ].join(","),
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 58 }}
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
        <ambientLight intensity={0.05} />
        <directionalLight
          position={[-3, 3, 2]}
          intensity={0.4}
          color={0xF5D060}
        />
        <directionalLight
          position={[3, -2, -1]}
          intensity={0.15}
          color={0x2244aa}
        />

        <Suspense fallback={null}>
          {/* Ambient background dust */}
          <FloatingParticles />

          {/* Explosion boot sequence — only shown until uiReady */}
          {!uiReady && (
            <ExplosionSequence
              onDone={() => setTimeout(() => setUiReady(true), 180)}
            />
          )}

          {/* The orb — always present after scene loads */}
          {uiReady && <AICore state={orbState} />}
        </Suspense>

        <CameraRig mouse={mouse} />
      </Canvas>

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)",
          zIndex: 1,
        }}
      />

      {/* Bottom dark fade — anchors UI */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "28%",
          pointerEvents: "none",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 100%)",
          zIndex: 1,
        }}
      />
    </div>
  );
}