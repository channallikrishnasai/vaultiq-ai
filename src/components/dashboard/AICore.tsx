"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbState } from "@/contexts/OrbContext";
import type { ThinkingStage } from "@/lib/thinking-stages";

// ─── State config ─────────────────────────────────────────────────────────────

interface OrbConfig {
  rotSpeed: number;
  pulseSpeed: number;
  lineColor: number;
  nodeColor: number;
  ringColor: number;
  glowColor: number;
  particleColor: number;
  lightIntensity: number;
  ringSpeedMul: number;
  particleSpeedMul: number;
  nodePulseMul: number;
}

const GOLD = 0xe8b830;
const GOLD_BRIGHT = 0xf5c842;
const GOLD_LIGHT = 0xffd666;
const GOLD_NODE = 0xffdf5c;

const CONFIGS: Record<OrbState, OrbConfig> = {
  idle:        { rotSpeed: 0.003, pulseSpeed: 0.6, lineColor: GOLD, nodeColor: GOLD_NODE, ringColor: GOLD, glowColor: GOLD, particleColor: GOLD_NODE, lightIntensity: 3.0, ringSpeedMul: 1, particleSpeedMul: 1, nodePulseMul: 1 },
  thinking:    { rotSpeed: 0.012, pulseSpeed: 2.5, lineColor: GOLD_BRIGHT, nodeColor: GOLD_LIGHT, ringColor: GOLD_BRIGHT, glowColor: GOLD_BRIGHT, particleColor: GOLD_LIGHT, lightIntensity: 5.0, ringSpeedMul: 3.5, particleSpeedMul: 4, nodePulseMul: 2.5 },
  speaking:    { rotSpeed: 0.008, pulseSpeed: 1.8, lineColor: GOLD_LIGHT, nodeColor: GOLD_NODE, ringColor: GOLD_LIGHT, glowColor: GOLD_LIGHT, particleColor: GOLD_NODE, lightIntensity: 4.5, ringSpeedMul: 2.5, particleSpeedMul: 3, nodePulseMul: 2 },
  listening:   { rotSpeed: 0.004, pulseSpeed: 0.9, lineColor: 0x7aaccf, nodeColor: 0x99c4e2, ringColor: 0x6a9cc2, glowColor: 0x5a8cb5, particleColor: 0x99c4e2, lightIntensity: 2.8, ringSpeedMul: 1.2, particleSpeedMul: 1.5, nodePulseMul: 1.2 },
  processing:  { rotSpeed: 0.015, pulseSpeed: 3.0, lineColor: 0x9570d0, nodeColor: 0xb490ea, ringColor: 0x8560c2, glowColor: 0x7550b5, particleColor: 0xb490ea, lightIntensity: 4.5, ringSpeedMul: 4, particleSpeedMul: 5, nodePulseMul: 3 },
  celebrating: { rotSpeed: 0.013, pulseSpeed: 1.8, lineColor: 0x50d88a, nodeColor: 0x70f0aa, ringColor: 0x40c87a, glowColor: 0x30b86a, particleColor: 0x70f0aa, lightIntensity: 4.5, ringSpeedMul: 3, particleSpeedMul: 4, nodePulseMul: 2 },
  sleeping:    { rotSpeed: 0.001, pulseSpeed: 0.2, lineColor: 0x2a3a4a, nodeColor: 0x3a4a5a, ringColor: 0x253545, glowColor: 0x1a2a3a, particleColor: 0x3a4a5a, lightIntensity: 1.0, ringSpeedMul: 0.5, particleSpeedMul: 0.5, nodePulseMul: 0.5 },
  error:       { rotSpeed: 0.003, pulseSpeed: 3.0, lineColor: 0xb84040, nodeColor: 0xd86060, ringColor: 0xa83535, glowColor: 0x982a2a, particleColor: 0xd86060, lightIntensity: 3.5, ringSpeedMul: 2, particleSpeedMul: 3, nodePulseMul: 2 },
};

const GLOBE_RADIUS = 0.4;

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Wireframe curves — react to state ────────────────────────────────────────

function RandomCurves({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);

  const curves = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 22 }, () => ({
      rx: (rand() - 0.5) * Math.PI * 2,
      ry: (rand() - 0.5) * Math.PI * 2,
      rz: (rand() - 0.5) * Math.PI * 2,
      rOff: 0.2 + rand() * 0.25,
      tube: 0.001 + rand() * 0.0015,
      opacity: 0.35 + rand() * 0.45,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const speed = isActive ? 0.012 : 0.003;
    groupRef.current.rotation.y += speed;
    groupRef.current.rotation.x += speed * 0.3;
  });

  return (
    <group ref={groupRef}>
      {curves.map((c, i) => (
        <mesh key={i} rotation={[c.rx, c.ry, c.rz]}>
          <torusGeometry args={[GLOBE_RADIUS * c.rOff, c.tube, 8, 80]} />
          <meshBasicMaterial color={cfg.lineColor} transparent opacity={c.opacity} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Random arc segments ──────────────────────────────────────────────────────

function RandomArcs({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);

  const arcs = useMemo(() => {
    const rand = seededRandom(137);
    return Array.from({ length: 25 }, () => ({
      rx: (rand() - 0.5) * Math.PI * 2,
      ry: (rand() - 0.5) * Math.PI * 2,
      rz: (rand() - 0.5) * Math.PI * 2,
      tube: 0.0008 + rand() * 0.0015,
      opacity: 0.25 + rand() * 0.4,
      arc: 0.3 + rand() * 0.7,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    groupRef.current.rotation.y += isActive ? 0.012 : 0.003;
    groupRef.current.rotation.x += isActive ? 0.004 : 0.001;
  });

  return (
    <group ref={groupRef}>
      {arcs.map((a, i) => (
        <mesh key={i} rotation={[a.rx, a.ry, a.rz]}>
          <torusGeometry args={[GLOBE_RADIUS, a.tube, 8, 80, Math.PI * a.arc]} />
          <meshBasicMaterial color={cfg.lineColor} transparent opacity={a.opacity} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Scattered nodes — pulse faster when active ───────────────────────────────

function ScatteredNodes({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const refs = useRef<THREE.Mesh[]>([]);

  const nodes = useMemo(() => {
    const rand = seededRandom(256);
    return Array.from({ length: 30 }, () => {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = GLOBE_RADIUS * (0.85 + rand() * 0.15);
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ] as [number, number, number];
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const pulseMul = isActive ? 3.5 : 1;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 1.8 * pulseMul + i * 0.4) * 0.4;
      const s = (isActive ? 1.0 : 0.7) + Math.sin(t * 1.2 * pulseMul + i * 0.6) * 0.3;
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group>
      {nodes.map((v, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }} position={v}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshBasicMaterial color={cfg.nodeColor} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Saturn rings — spin faster when active ───────────────────────────────────

function SaturnRings({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const r4 = useRef<THREE.Mesh>(null);
  const r5 = useRef<THREE.Mesh>(null);
  const r6 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mul = cfg.ringSpeedMul;
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const rings = [
      { ref: r1, speed: 0.006 * mul, base: isActive ? 0.95 : 0.8 },
      { ref: r2, speed: -0.004 * mul, base: isActive ? 0.8 : 0.65 },
      { ref: r3, speed: 0.003 * mul, base: isActive ? 0.65 : 0.5 },
      { ref: r4, speed: -0.0025 * mul, base: isActive ? 0.5 : 0.38 },
      { ref: r5, speed: 0.002 * mul, base: isActive ? 0.4 : 0.28 },
      { ref: r6, speed: -0.0015 * mul, base: isActive ? 0.3 : 0.18 },
    ];
    rings.forEach((ring, i) => {
      if (ring.ref.current) {
        ring.ref.current.rotation.z += ring.speed;
        const mat = ring.ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = ring.base * (0.85 + Math.sin(t * 1.0 + i * 0.7) * 0.15);
      }
    });
  });

  return (
    <>
      <mesh ref={r1} rotation={[1.35, 0.2, 0.4]}>
        <torusGeometry args={[0.48, 0.008, 10, 120]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.8} />
      </mesh>
      <mesh ref={r2} rotation={[0.5, 1.2, -0.6]}>
        <torusGeometry args={[0.56, 0.007, 10, 110]} />
        <meshBasicMaterial color={cfg.lineColor} transparent opacity={0.65} />
      </mesh>
      <mesh ref={r3} rotation={[0.9, -0.4, 1.1]}>
        <torusGeometry args={[0.64, 0.006, 10, 110]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.5} />
      </mesh>
      <mesh ref={r4} rotation={[-0.3, 0.8, -1.2]}>
        <torusGeometry args={[0.72, 0.005, 8, 100]} />
        <meshBasicMaterial color={cfg.nodeColor} transparent opacity={0.4} />
      </mesh>
      <mesh ref={r5} rotation={[1.1, -0.7, 0.3]}>
        <torusGeometry args={[0.8, 0.004, 8, 100]} />
        <meshBasicMaterial color={cfg.lineColor} transparent opacity={0.3} />
      </mesh>
      <mesh ref={r6} rotation={[-0.6, 1.0, 0.9]}>
        <torusGeometry args={[0.88, 0.004, 8, 100]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.2} />
      </mesh>
    </>
  );
}

// ─── Particles — orbit faster when active ─────────────────────────────────────

const PARTICLE_COUNT = 35;
const PARTICLE_DATA = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const rand = seededRandom(i * 100 + 7);
  return {
    angle: rand() * Math.PI * 2,
    radius: 0.44 + rand() * 0.18,
    baseSpeed: 0.012 + rand() * 0.018,
    y: (rand() - 0.5) * 0.7,
    size: 0.005 + rand() * 0.005,
  };
});

function Particles({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const refs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mul = cfg.particleSpeedMul;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const p = PARTICLE_DATA[i];
      const a = p.angle + t * p.baseSpeed * mul;
      mesh.position.x = Math.cos(a) * p.radius;
      mesh.position.z = Math.sin(a) * p.radius;
      mesh.position.y = p.y + Math.sin(t * 0.4 * mul + i) * 0.06;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 1.8 * mul + i * 0.7) * 0.35;
    });
  });

  return (
    <>
      {PARTICLE_DATA.map((p, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial color={cfg.particleColor} transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}

// ─── Energy pulse ring — appears during thinking/speaking ─────────────────────

function EnergyPulse({ state }: { state: OrbState }) {
  const ref = useRef<THREE.Mesh>(null);
  const isActive = state === "thinking" || state === "speaking" || state === "processing";

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    if (isActive) {
      const pulse = Math.sin(t * 3) * 0.5 + 0.5;
      ref.current.scale.setScalar(1 + pulse * 0.15);
      mat.opacity = 0.15 + pulse * 0.2;
    } else {
      ref.current.scale.setScalar(1);
      mat.opacity = 0;
    }
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.55, 0.02, 8, 100]} />
      <meshBasicMaterial color={0xffd666} transparent opacity={0} />
    </mesh>
  );
}

// ─── Main Wireframe Globe ─────────────────────────────────────────────────────

export default function AICore({ state, thinkingStage = "idle" }: { state: OrbState; thinkingStage?: ThinkingStage }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const innerLightRef = useRef<THREE.PointLight>(null);

  const cfg = CONFIGS[state];
  const isActive = state === "thinking" || state === "speaking" || state === "processing";
  const isConverge = thinkingStage === "converge";
  const isSwallow = thinkingStage === "swallow";
  const isFlash = thinkingStage === "flash";
  const isReveal = thinkingStage === "reveal";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      // Dramatic rotation speed based on stage
      let rotSpeed = cfg.rotSpeed;
      if (isConverge) rotSpeed = 0.025;
      if (isSwallow) rotSpeed = 0.04;
      if (isFlash) rotSpeed = 0.015;
      groupRef.current.rotation.y += rotSpeed;
      groupRef.current.position.y = Math.sin(t * 0.25) * 0.015;

      // Dramatic scale based on stage
      let targetScale = 3.0;
      if (isConverge) targetScale = 4.5 + Math.sin(t * 3) * 0.3;
      if (isSwallow) targetScale = 6.0 + Math.sin(t * 5) * 0.5;
      if (isFlash) targetScale = 3.5;
      if (isReveal) targetScale = 3.0;

      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.05;
      groupRef.current.scale.setScalar(newScale);
    }

    if (lightRef.current) {
      let intensity = cfg.lightIntensity;
      if (isConverge) intensity = 6.0;
      if (isSwallow) intensity = 8.0;
      if (isFlash) intensity = 12.0;
      lightRef.current.intensity = intensity + Math.sin(t * cfg.pulseSpeed * 0.5) * 1.5;
    }

    if (innerLightRef.current) {
      let intensity = 0.5;
      if (isConverge) intensity = 4.0;
      if (isSwallow) intensity = 6.0;
      if (isFlash) intensity = 10.0;
      innerLightRef.current.intensity = intensity + Math.sin(t * 4) * 2;
    }
  });

  return (
    <group ref={groupRef} scale={3.0}>
      {/* Outer warm light */}
      <pointLight ref={lightRef} color={cfg.glowColor} intensity={cfg.lightIntensity} distance={22} decay={2} />
      {/* Inner pulsing light — bright when active */}
      <pointLight ref={innerLightRef} color={cfg.nodeColor} intensity={0.5} distance={8} decay={2} />
      <ambientLight intensity={isActive ? 0.12 : 0.08} />

      {/* Wireframe curves */}
      <RandomCurves cfg={cfg} state={state} />

      {/* Arc segments */}
      <RandomArcs cfg={cfg} state={state} />

      {/* Bright nodes */}
      <ScatteredNodes cfg={cfg} state={state} />

      {/* Saturn rings */}
      <SaturnRings cfg={cfg} state={state} />

      {/* Particles */}
      <Particles cfg={cfg} state={state} />

      {/* Energy pulse — visible when AI is active */}
      <EnergyPulse state={state} />
    </group>
  );
}
