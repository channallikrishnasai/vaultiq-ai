"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbState } from "@/contexts/OrbContext";
import type { ThinkingStage } from "@/lib/thinking-stages";

interface OrbConfig {
  rotSpeed: number;
  pulseSpeed: number;
  lineColor: number;
  nodeColor: number;
  ringColor: number;
  glowColor: number;
  lightIntensity: number;
  ringSpeedMul: number;
  particleSpeedMul: number;
}

const GOLD = 0xe8b830;
const GOLD_BRIGHT = 0xf5c842;
const GOLD_LIGHT = 0xffd666;
const GOLD_SOFT = 0xd4a020;
const GOLD_DIM = 0x8a6a10;

const CONFIGS: Record<OrbState, OrbConfig> = {
  idle:        { rotSpeed: 0.002, pulseSpeed: 0.5, lineColor: GOLD, nodeColor: GOLD_LIGHT, ringColor: GOLD_SOFT, glowColor: GOLD, lightIntensity: 2.5, ringSpeedMul: 1, particleSpeedMul: 1 },
  thinking:    { rotSpeed: 0.008, pulseSpeed: 2.0, lineColor: GOLD_BRIGHT, nodeColor: GOLD_LIGHT, ringColor: GOLD_BRIGHT, glowColor: GOLD_BRIGHT, lightIntensity: 4.5, ringSpeedMul: 3, particleSpeedMul: 3.5 },
  speaking:    { rotSpeed: 0.006, pulseSpeed: 1.5, lineColor: GOLD_LIGHT, nodeColor: GOLD, ringColor: GOLD_LIGHT, glowColor: GOLD_LIGHT, lightIntensity: 4.0, ringSpeedMul: 2.2, particleSpeedMul: 2.5 },
  listening:   { rotSpeed: 0.003, pulseSpeed: 0.7, lineColor: 0x7aaccf, nodeColor: 0x99c4e2, ringColor: 0x6a9cc2, glowColor: 0x5a8cb5, lightIntensity: 2.5, ringSpeedMul: 1.2, particleSpeedMul: 1.3 },
  processing:  { rotSpeed: 0.01, pulseSpeed: 2.5, lineColor: 0x9570d0, nodeColor: 0xb490ea, ringColor: 0x8560c2, glowColor: 0x7550b5, lightIntensity: 4.0, ringSpeedMul: 3.5, particleSpeedMul: 4 },
  celebrating: { rotSpeed: 0.009, pulseSpeed: 1.5, lineColor: 0x50d88a, nodeColor: 0x70f0aa, ringColor: 0x40c87a, glowColor: 0x30b86a, lightIntensity: 4.0, ringSpeedMul: 2.8, particleSpeedMul: 3.5 },
  sleeping:    { rotSpeed: 0.0008, pulseSpeed: 0.15, lineColor: 0x2a3a4a, nodeColor: 0x3a4a5a, ringColor: 0x253545, glowColor: 0x1a2a3a, lightIntensity: 0.8, ringSpeedMul: 0.4, particleSpeedMul: 0.4 },
  error:       { rotSpeed: 0.003, pulseSpeed: 2.5, lineColor: 0xb84040, nodeColor: 0xd86060, ringColor: 0xa83535, glowColor: 0x982a2a, lightIntensity: 3.0, ringSpeedMul: 1.8, particleSpeedMul: 2.5 },
};

const R = 0.4;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ─── Wireframe sphere — clean, fewer lines, shimmer ───────────────────────────

function WireframeSphere({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const curves = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 14 }, () => ({
      rx: (rand() - 0.5) * Math.PI * 2,
      ry: (rand() - 0.5) * Math.PI * 2,
      rz: (rand() - 0.5) * Math.PI * 2,
      rOff: 0.25 + rand() * 0.2,
      tube: 0.0008 + rand() * 0.001,
      baseOpacity: 0.2 + rand() * 0.35,
      shimmerSpeed: 0.3 + rand() * 0.8,
      shimmerPhase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    groupRef.current.rotation.y += isActive ? 0.006 : 0.0015;
    groupRef.current.rotation.x += isActive ? 0.002 : 0.0005;

    matsRef.current.forEach((mat, i) => {
      if (!mat) return;
      const c = curves[i];
      const shimmer = Math.sin(t * c.shimmerSpeed + c.shimmerPhase) * 0.5 + 0.5;
      mat.opacity = c.baseOpacity * (0.5 + shimmer * 0.5);
    });
  });

  return (
    <group ref={groupRef}>
      {curves.map((c, i) => (
        <mesh key={i} rotation={[c.rx, c.ry, c.rz]}>
          <torusGeometry args={[R * c.rOff, c.tube, 6, 80]} />
          <meshBasicMaterial ref={(el) => { if (el) matsRef.current[i] = el; }} color={cfg.lineColor} transparent opacity={c.baseOpacity} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Arc segments — elegant, shimmer ──────────────────────────────────────────

function Arcs({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const arcs = useMemo(() => {
    const rand = seededRandom(137);
    return Array.from({ length: 16 }, () => ({
      rx: (rand() - 0.5) * Math.PI * 2,
      ry: (rand() - 0.5) * Math.PI * 2,
      rz: (rand() - 0.5) * Math.PI * 2,
      tube: 0.0006 + rand() * 0.001,
      baseOpacity: 0.15 + rand() * 0.3,
      arc: 0.4 + rand() * 0.6,
      shimmerSpeed: 0.3 + rand() * 0.7,
      shimmerPhase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    groupRef.current.rotation.y += isActive ? 0.006 : 0.0015;
    groupRef.current.rotation.x += isActive ? 0.002 : 0.0005;

    matsRef.current.forEach((mat, i) => {
      if (!mat) return;
      const a = arcs[i];
      const shimmer = Math.sin(t * a.shimmerSpeed + a.shimmerPhase) * 0.5 + 0.5;
      mat.opacity = a.baseOpacity * (0.4 + shimmer * 0.6);
    });
  });

  return (
    <group ref={groupRef}>
      {arcs.map((a, i) => (
        <mesh key={i} rotation={[a.rx, a.ry, a.rz]}>
          <torusGeometry args={[R, a.tube, 6, 80, Math.PI * a.arc]} />
          <meshBasicMaterial ref={(el) => { if (el) matsRef.current[i] = el; }} color={cfg.lineColor} transparent opacity={a.baseOpacity} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Nodes — 24 breathing points ──────────────────────────────────────────────

function Nodes({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const nodes = useMemo(() => {
    const rand = seededRandom(256);
    return Array.from({ length: 24 }, () => {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = R * (0.88 + rand() * 0.12);
      return {
        pos: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] as [number, number, number],
        phase: rand() * Math.PI * 2,
        speed: 0.6 + rand() * 0.8,
        baseSize: 0.004 + rand() * 0.003,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const mul = isActive ? 2.5 : 1;

    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const n = nodes[i];
      const mat = matsRef.current[i];
      const breathe = Math.sin(t * n.speed * mul + n.phase);
      if (mat) mat.opacity = 0.3 + (breathe * 0.5 + 0.5) * 0.45;
      const s = 0.6 + (breathe * 0.5 + 0.5) * 0.5;
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group>
      {nodes.map((n, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }} position={n.pos}>
          <sphereGeometry args={[n.baseSize, 6, 6]} />
          <meshBasicMaterial ref={(el) => { if (el) matsRef.current[i] = el; }} color={cfg.nodeColor} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Energy rings — 6 clean Saturn rings + 2 energy bands ─────────────────────

function EnergyRings({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const bandRefs = useRef<THREE.Mesh[]>([]);

  const rings = useMemo(() => [
    { radius: 0.52, tube: 0.006, tilt: [1.3, 0.2, 0.4] as [number, number, number], speed: 0.005, baseOp: 0.7 },
    { radius: 0.60, tube: 0.005, tilt: [0.5, 1.1, -0.5] as [number, number, number], speed: -0.0035, baseOp: 0.55 },
    { radius: 0.68, tube: 0.005, tilt: [0.85, -0.35, 1.0] as [number, number, number], speed: 0.0025, baseOp: 0.42 },
    { radius: 0.76, tube: 0.004, tilt: [-0.3, 0.75, -1.1] as [number, number, number], speed: -0.002, baseOp: 0.32 },
    { radius: 0.84, tube: 0.003, tilt: [1.0, -0.65, 0.25] as [number, number, number], speed: 0.0015, baseOp: 0.22 },
    { radius: 0.92, tube: 0.003, tilt: [-0.55, 0.9, 0.85] as [number, number, number], speed: -0.001, baseOp: 0.15 },
  ], []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mul = cfg.ringSpeedMul;

    ringRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const ring = rings[i];
      mesh.rotation.z += ring.speed * mul;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const shimmer = Math.sin(t * (0.4 + i * 0.15) + i * 1.1) * 0.5 + 0.5;
      mat.opacity = ring.baseOp * (0.65 + shimmer * 0.35);
    });

    // Energy bands orbit along rings
    bandRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const angle = t * (0.6 - i * 0.15) * mul;
      const ring = rings[i * 2];
      if (!ring) return;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const [tx, ty, tz] = ring.tilt;
      const x = cosA * ring.radius;
      const z = sinA * ring.radius;
      const tiltedX = x * Math.cos(tz);
      const tiltedZ = x * Math.sin(tz) * Math.cos(tx) + z * Math.cos(tx);
      const tiltedY = x * Math.sin(tz) * Math.sin(tx) + z * Math.sin(tx);
      mesh.position.set(tiltedX, tiltedY, tiltedZ);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 2.5 + i * 2) * 0.25;
    });
  });

  return (
    <>
      {rings.map((ring, i) => (
        <mesh key={i} ref={(el) => { if (el) ringRefs.current[i] = el; }} rotation={ring.tilt}>
          <torusGeometry args={[ring.radius, ring.tube, 8, 120]} />
          <meshBasicMaterial color={i % 2 === 0 ? cfg.ringColor : cfg.lineColor} transparent opacity={ring.baseOp} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={`band-${i}`} ref={(el) => { if (el) bandRefs.current[i] = el; }}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color={GOLD_BRIGHT} transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}

// ─── Particles — 30 in 2 orbits, flicker ─────────────────────────────────────

const P_COUNT = 30;
const P_DATA = Array.from({ length: P_COUNT }, (_, i) => {
  const rand = seededRandom(i * 100 + 7);
  const orbit = i < 12 ? 0 : 1;
  return {
    angle: rand() * Math.PI * 2,
    radius: orbit === 0 ? 0.44 + rand() * 0.05 : 0.58 + rand() * 0.08,
    speed: (0.008 + rand() * 0.012) * (orbit === 0 ? 1.4 : 0.7),
    y: (rand() - 0.5) * 0.4,
    size: 0.003 + rand() * 0.003,
    yAmp: 0.02 + rand() * 0.04,
    yFreq: 0.25 + rand() * 0.4,
    flickerSpeed: 0.8 + rand() * 1.5,
    flickerPhase: rand() * Math.PI * 2,
  };
});

function Particles({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mul = cfg.particleSpeedMul;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const p = P_DATA[i];
      const a = p.angle + t * p.speed * mul;
      mesh.position.x = Math.cos(a) * p.radius;
      mesh.position.z = Math.sin(a) * p.radius;
      mesh.position.y = p.y + Math.sin(t * p.yFreq * mul + i) * p.yAmp;
      const mat = matsRef.current[i];
      if (mat) {
        const flicker = Math.sin(t * p.flickerSpeed * mul + p.flickerPhase);
        mat.opacity = 0.25 + (flicker * 0.5 + 0.5) * 0.4;
      }
    });
  });

  return (
    <>
      {P_DATA.map((p, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }}>
          <sphereGeometry args={[p.size, 5, 5]} />
          <meshBasicMaterial ref={(el) => { if (el) matsRef.current[i] = el; }} color={cfg.nodeColor} transparent opacity={0.3} />
        </mesh>
      ))}
    </>
  );
}

// ─── Inner core — soft breathing glow ─────────────────────────────────────────

function InnerCore({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current || !matRef.current) return;
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const breathe = Math.sin(t * (isActive ? 1.2 : 0.4)) * 0.5 + 0.5;
    ref.current.scale.setScalar(0.18 + breathe * (isActive ? 0.06 : 0.03));
    matRef.current.opacity = 0.06 + breathe * (isActive ? 0.08 : 0.04);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial ref={matRef} color={cfg.glowColor} transparent opacity={0.06} />
    </mesh>
  );
}

// ─── Pulse rings — appear when active ─────────────────────────────────────────

function PulseRings({ state }: { state: OrbState }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const isActive = state === "thinking" || state === "speaking" || state === "processing";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (r1.current) {
      const mat = r1.current.material as THREE.MeshBasicMaterial;
      if (isActive) {
        const p = Math.sin(t * 2.5) * 0.5 + 0.5;
        r1.current.scale.setScalar(1 + p * 0.12);
        mat.opacity = 0.08 + p * 0.12;
        r1.current.rotation.z = t * 0.25;
      } else {
        mat.opacity = 0;
      }
    }
    if (r2.current) {
      const mat = r2.current.material as THREE.MeshBasicMaterial;
      if (isActive) {
        const p = Math.sin(t * 2 + 1.2) * 0.5 + 0.5;
        r2.current.scale.setScalar(1 + p * 0.1);
        mat.opacity = 0.05 + p * 0.08;
        r2.current.rotation.z = -t * 0.18;
      } else {
        mat.opacity = 0;
      }
    }
  });

  return (
    <>
      <mesh ref={r1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.56, 0.015, 8, 100]} />
        <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0} />
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 3, 0.4, 0]}>
        <torusGeometry args={[0.65, 0.01, 8, 100]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} />
      </mesh>
    </>
  );
}

// ─── Main AICore ──────────────────────────────────────────────────────────────

export default function AICore({ state, thinkingStage = "idle" }: { state: OrbState; thinkingStage?: ThinkingStage }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const innerLightRef = useRef<THREE.PointLight>(null);
  const rotAccum = useRef(0);

  const cfg = CONFIGS[state];
  const isJitter = thinkingStage === "jitter";
  const isConverge = thinkingStage === "converge";
  const isSwallow = thinkingStage === "swallow";
  const isFlash = thinkingStage === "flash";
  const isReveal = thinkingStage === "reveal";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      let rs = cfg.rotSpeed;
      if (isJitter) rs = 0.01;
      if (isConverge) rs = 0.03;
      if (isSwallow) rs = 0.05;
      if (isFlash) rs = 0.015;
      if (isReveal) rs = 0.008;
      rotAccum.current += (rs - rotAccum.current) * 0.08;
      groupRef.current.rotation.y += rotAccum.current;
      groupRef.current.position.y = Math.sin(t * 0.2) * 0.012;

      let ts = 3.0;
      if (isJitter) ts = 3.2 + Math.sin(t * 2) * 0.15;
      if (isConverge) ts = 3.8 + Math.sin(t * 3) * 0.2;
      if (isSwallow) ts = 5.0 + Math.sin(t * 4) * 0.3;
      if (isFlash) ts = 3.5;
      if (isReveal) ts = 3.0;
      const cs = groupRef.current.scale.x;
      groupRef.current.scale.setScalar(cs + (ts - cs) * 0.04);
    }

    if (lightRef.current) {
      let intensity = cfg.lightIntensity;
      if (isJitter) intensity = 3.5;
      if (isConverge) intensity = 5.5;
      if (isSwallow) intensity = 7.0;
      if (isFlash) intensity = 10.0;
      const breathe = Math.sin(t * cfg.pulseSpeed * 0.4) * 0.5 + 0.5;
      lightRef.current.intensity = intensity + breathe * 1.2;
    }

    if (innerLightRef.current) {
      let intensity = 0.4;
      if (isJitter) intensity = 1.5;
      if (isConverge) intensity = 3.0;
      if (isSwallow) intensity = 5.0;
      if (isFlash) intensity = 8.0;
      innerLightRef.current.intensity = intensity + Math.sin(t * 3) * 1.5;
    }
  });

  return (
    <group ref={groupRef} scale={3.0}>
      <pointLight ref={lightRef} color={cfg.glowColor} intensity={cfg.lightIntensity} distance={20} decay={2} />
      <pointLight ref={innerLightRef} color={cfg.nodeColor} intensity={0.4} distance={6} decay={2} />
      <ambientLight intensity={0.06} />

      <InnerCore cfg={cfg} state={state} />
      <WireframeSphere cfg={cfg} state={state} />
      <Arcs cfg={cfg} state={state} />
      <Nodes cfg={cfg} state={state} />
      <EnergyRings cfg={cfg} state={state} />
      <Particles cfg={cfg} state={state} />
      <PulseRings state={state} />
    </group>
  );
}
