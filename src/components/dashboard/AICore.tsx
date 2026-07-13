"use client";

// TODO: THREE.Clock.getElapsedTime() is deprecated upstream in @react-three/fiber.
// Replace with manual delta-based timing: useFrame((state, delta) => { elapsed += delta; })
// Tracked in Phase 6.7 — requires R3F API change across 11 call sites in this file.

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbState } from "@/contexts/OrbContext";
import type { ThinkingStage } from "@/lib/thinking-stages";

// ─── Config ──────────────────────────────────────────────────────────────────

interface OrbConfig {
  rotSpeed: number;
  pulseSpeed: number;
  lineColor: number;
  glowColor: number;
  lightIntensity: number;
  ringSpeedMul: number;
  particleSpeedMul: number;
}

const GOLD = 0xe8b830;
const GOLD_BRIGHT = 0xf5c842;
const GOLD_LIGHT = 0xffd666;
const GOLD_SOFT = 0xd4a020;
const GOLD_HOT = 0xffcc44;

const CONFIGS: Record<OrbState, OrbConfig> = {
  idle:        { rotSpeed: 0.0012, pulseSpeed: 0.35, lineColor: GOLD, glowColor: GOLD, lightIntensity: 3.0, ringSpeedMul: 1, particleSpeedMul: 1 },
  thinking:    { rotSpeed: 0.008, pulseSpeed: 2.0, lineColor: GOLD_BRIGHT, glowColor: GOLD_BRIGHT, lightIntensity: 6.0, ringSpeedMul: 3.5, particleSpeedMul: 4 },
  speaking:    { rotSpeed: 0.006, pulseSpeed: 1.4, lineColor: GOLD_LIGHT, glowColor: GOLD_LIGHT, lightIntensity: 5.0, ringSpeedMul: 2.2, particleSpeedMul: 2.8 },
  listening:   { rotSpeed: 0.0025, pulseSpeed: 0.6, lineColor: 0x7aaccf, glowColor: 0x5a8cb5, lightIntensity: 2.5, ringSpeedMul: 1.2, particleSpeedMul: 1.3 },
  processing:  { rotSpeed: 0.009, pulseSpeed: 2.4, lineColor: 0x9570d0, glowColor: 0x7550b5, lightIntensity: 5.5, ringSpeedMul: 3.8, particleSpeedMul: 4.5 },
  celebrating: { rotSpeed: 0.008, pulseSpeed: 1.4, lineColor: 0x50d88a, glowColor: 0x30b86a, lightIntensity: 5.0, ringSpeedMul: 3, particleSpeedMul: 3.8 },
  sleeping:    { rotSpeed: 0.0004, pulseSpeed: 0.1, lineColor: 0x2a3a4a, glowColor: 0x1a2a3a, lightIntensity: 0.6, ringSpeedMul: 0.3, particleSpeedMul: 0.3 },
  error:       { rotSpeed: 0.003, pulseSpeed: 2.4, lineColor: 0xb84040, glowColor: 0x982a2a, lightIntensity: 3.5, ringSpeedMul: 2, particleSpeedMul: 2.8 },
};

const R = 0.44;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ─── Glowing gold energy core — the heart ────────────────────────────────────

function EnergyCore({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current || !matRef.current) return;
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const breathe = Math.sin(t * (isActive ? 1.6 : 0.35)) * 0.5 + 0.5;
    const s = 0.22 + breathe * (isActive ? 0.07 : 0.03);
    ref.current.scale.setScalar(s);
    matRef.current.opacity = 0.35 + breathe * (isActive ? 0.45 : 0.2);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R * 0.9, 16, 16]} />
      <meshBasicMaterial ref={matRef} color={GOLD_HOT} transparent opacity={0.35} />
    </mesh>
  );
}

// ─── Inner fire — warm breathing mass around core ────────────────────────────

function InnerFire({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current || !matRef.current) return;
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const breathe = Math.sin(t * (isActive ? 1.2 : 0.28)) * 0.5 + 0.5;
    ref.current.scale.setScalar(0.35 + breathe * (isActive ? 0.06 : 0.025));
    matRef.current.opacity = 0.12 + breathe * (isActive ? 0.15 : 0.06);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R * 0.85, 14, 14]} />
      <meshBasicMaterial ref={matRef} color={GOLD_LIGHT} transparent opacity={0.12} />
    </mesh>
  );
}

// ─── Outer glow shell — volumetric halo ──────────────────────────────────────

function GlowShell({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current || !matRef.current) return;
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const breathe = Math.sin(t * (isActive ? 0.9 : 0.22)) * 0.5 + 0.5;
    ref.current.scale.setScalar(0.75 + breathe * (isActive ? 0.06 : 0.03));
    matRef.current.opacity = 0.025 + breathe * (isActive ? 0.035 : 0.012);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[R * 1.2, 20, 20]} />
      <meshBasicMaterial ref={matRef} color={cfg.glowColor} transparent opacity={0.025} side={THREE.BackSide} />
    </mesh>
  );
}

// ─── Inner gravity rings — rotating wireframe structure inside orb ────────────

function InnerGravity({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const rings = useMemo(() => {
    const rand = seededRandom(88);
    return Array.from({ length: 5 }, () => ({
      radius: 0.12 + rand() * 0.2,
      tube: 0.0003 + rand() * 0.0004,
      tilt: [(rand() - 0.5) * Math.PI, (rand() - 0.5) * Math.PI, (rand() - 0.5) * Math.PI] as [number, number, number],
      speed: 0.008 + rand() * 0.012,
      baseOpacity: 0.15 + rand() * 0.2,
      shimmerPhase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const mul = isActive ? 3 : 1;

    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003 * mul;
      groupRef.current.rotation.x += 0.001 * mul;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= 0.005 * mul;
      innerRef.current.rotation.z += 0.002 * mul;
    }

    matsRef.current.forEach((mat, i) => {
      if (!mat) return;
      const r = rings[i];
      const shimmer = Math.sin(t * 0.8 + r.shimmerPhase) * 0.5 + 0.5;
      mat.opacity = r.baseOpacity * (0.4 + shimmer * 0.6);
    });
  });

  return (
    <>
      <group ref={groupRef}>
        {rings.slice(0, 3).map((r, i) => (
          <mesh key={i} rotation={r.tilt}>
            <torusGeometry args={[r.radius, r.tube, 5, 80]} />
            <meshBasicMaterial
              ref={(el) => { if (el) matsRef.current[i] = el; }}
              color={GOLD_LIGHT}
              transparent
              opacity={r.baseOpacity}
            />
          </mesh>
        ))}
      </group>
      <group ref={innerRef}>
        {rings.slice(3).map((r, i) => (
          <mesh key={`inner-${i}`} rotation={r.tilt}>
            <torusGeometry args={[r.radius, r.tube, 5, 80]} />
            <meshBasicMaterial
              ref={(el) => { if (el) matsRef.current[i + 3] = el; }}
              color={GOLD}
              transparent
              opacity={r.baseOpacity}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

// ─── Wireframe — thin organic curves ─────────────────────────────────────────

function Wireframe({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const curves = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 8 }, () => ({
      rx: (rand() - 0.5) * Math.PI * 2,
      ry: (rand() - 0.5) * Math.PI * 2,
      rz: (rand() - 0.5) * Math.PI * 2,
      rOff: 0.28 + rand() * 0.18,
      tube: 0.0003 + rand() * 0.0004,
      baseOpacity: 0.1 + rand() * 0.15,
      shimmerSpeed: 0.2 + rand() * 0.4,
      shimmerPhase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    groupRef.current.rotation.y += isActive ? 0.005 : 0.0008;
    groupRef.current.rotation.x += isActive ? 0.0018 : 0.0003;

    matsRef.current.forEach((mat, i) => {
      if (!mat) return;
      const c = curves[i];
      const shimmer = Math.sin(t * c.shimmerSpeed + c.shimmerPhase) * 0.5 + 0.5;
      mat.opacity = c.baseOpacity * (0.35 + shimmer * 0.65);
    });
  });

  return (
    <group ref={groupRef}>
      {curves.map((c, i) => (
        <mesh key={i} rotation={[c.rx, c.ry, c.rz]}>
          <torusGeometry args={[R * c.rOff, c.tube, 5, 100]} />
          <meshBasicMaterial
            ref={(el) => { if (el) matsRef.current[i] = el; }}
            color={cfg.lineColor}
            transparent
            opacity={c.baseOpacity}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Arcs — organic arc segments ─────────────────────────────────────────────

function Arcs({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const arcs = useMemo(() => {
    const rand = seededRandom(137);
    return Array.from({ length: 8 }, () => ({
      rx: (rand() - 0.5) * Math.PI * 2,
      ry: (rand() - 0.5) * Math.PI * 2,
      rz: (rand() - 0.5) * Math.PI * 2,
      tube: 0.00025 + rand() * 0.0005,
      baseOpacity: 0.06 + rand() * 0.12,
      arc: 0.25 + rand() * 0.5,
      shimmerSpeed: 0.15 + rand() * 0.35,
      shimmerPhase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    groupRef.current.rotation.y += isActive ? 0.005 : 0.0008;
    groupRef.current.rotation.x += isActive ? 0.0018 : 0.0003;

    matsRef.current.forEach((mat, i) => {
      if (!mat) return;
      const a = arcs[i];
      const shimmer = Math.sin(t * a.shimmerSpeed + a.shimmerPhase) * 0.5 + 0.5;
      mat.opacity = a.baseOpacity * (0.3 + shimmer * 0.7);
    });
  });

  return (
    <group ref={groupRef}>
      {arcs.map((a, i) => (
        <mesh key={i} rotation={[a.rx, a.ry, a.rz]}>
          <torusGeometry args={[R, a.tube, 5, 100, Math.PI * a.arc]} />
          <meshBasicMaterial
            ref={(el) => { if (el) matsRef.current[i] = el; }}
            color={cfg.lineColor}
            transparent
            opacity={a.baseOpacity}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Nodes — breathing energy vertices ───────────────────────────────────────

function Nodes({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const nodes = useMemo(() => {
    const rand = seededRandom(256);
    return Array.from({ length: 20 }, () => {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = R * (0.85 + rand() * 0.15);
      return {
        pos: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] as [number, number, number],
        phase: rand() * Math.PI * 2,
        speed: 0.4 + rand() * 0.55,
        baseSize: 0.002 + rand() * 0.002,
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
      if (mat) mat.opacity = 0.2 + (breathe * 0.5 + 0.5) * 0.5;
      const s = 0.45 + (breathe * 0.5 + 0.5) * 0.55;
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group>
      {nodes.map((n, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }} position={n.pos}>
          <sphereGeometry args={[n.baseSize, 5, 5]} />
          <meshBasicMaterial
            ref={(el) => { if (el) matsRef.current[i] = el; }}
            color={GOLD_LIGHT}
            transparent
            opacity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Energy rings — 4 Saturn orbit rings ─────────────────────────────────────

function EnergyRings({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const ringRefs = useRef<THREE.Mesh[]>([]);

  const rings = useMemo(() => [
    { radius: 0.54, tube: 0.004, tilt: [1.3, 0.2, 0.4] as [number, number, number], speed: 0.0035, baseOp: 0.5 },
    { radius: 0.66, tube: 0.0035, tilt: [0.5, 1.1, -0.5] as [number, number, number], speed: -0.0025, baseOp: 0.38 },
    { radius: 0.8, tube: 0.003, tilt: [0.85, -0.35, 1.0] as [number, number, number], speed: 0.0018, baseOp: 0.26 },
    { radius: 0.95, tube: 0.0025, tilt: [-0.3, 0.75, -1.1] as [number, number, number], speed: -0.0012, baseOp: 0.16 },
  ], []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const mul = cfg.ringSpeedMul;

    ringRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const ring = rings[i];
      mesh.rotation.z += ring.speed * mul;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const shimmer = Math.sin(t * (0.3 + i * 0.1) + i * 1.5) * 0.5 + 0.5;
      mat.opacity = ring.baseOp * (0.45 + shimmer * 0.55);
    });
  });

  return (
    <>
      {rings.map((ring, i) => (
        <mesh key={i} ref={(el) => { if (el) ringRefs.current[i] = el; }} rotation={ring.tilt}>
          <torusGeometry args={[ring.radius, ring.tube, 6, 140]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? cfg.lineColor : cfg.glowColor}
            transparent
            opacity={ring.baseOp}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Orb particles — 24 in 3 orbits ──────────────────────────────────────────

const P_COUNT = 24;
const P_DATA = Array.from({ length: P_COUNT }, (_, i) => {
  const rand = seededRandom(i * 100 + 7);
  const orbit = i < 8 ? 0 : i < 16 ? 1 : 2;
  return {
    angle: rand() * Math.PI * 2,
    radius: orbit === 0 ? 0.48 + rand() * 0.04 : orbit === 1 ? 0.62 + rand() * 0.06 : 0.8 + rand() * 0.08,
    speed: (0.006 + rand() * 0.008) * (orbit === 0 ? 1.4 : orbit === 1 ? 0.8 : 0.45),
    y: (rand() - 0.5) * 0.4,
    size: 0.002 + rand() * 0.002,
    yAmp: 0.012 + rand() * 0.025,
    yFreq: 0.18 + rand() * 0.3,
    flickerSpeed: 0.6 + rand() * 1.0,
    flickerPhase: rand() * Math.PI * 2,
  };
});

function OrbParticles({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
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
        mat.opacity = 0.15 + (flicker * 0.5 + 0.5) * 0.4;
      }
    });
  });

  return (
    <>
      {P_DATA.map((p, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }}>
          <sphereGeometry args={[p.size, 4, 4]} />
          <meshBasicMaterial
            ref={(el) => { if (el) matsRef.current[i] = el; }}
            color={GOLD_LIGHT}
            transparent
            opacity={0.2}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Pulse rings — energy ripples when active ────────────────────────────────

function PulseRings({ state }: { state: OrbState }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const isActive = state === "thinking" || state === "speaking" || state === "processing";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (r1.current) {
      const mat = r1.current.material as THREE.MeshBasicMaterial;
      if (isActive) {
        const p = Math.sin(t * 2.2) * 0.5 + 0.5;
        r1.current.scale.setScalar(1 + p * 0.08);
        mat.opacity = 0.05 + p * 0.08;
        r1.current.rotation.z = t * 0.18;
      } else {
        mat.opacity *= 0.94;
      }
    }
    if (r2.current) {
      const mat = r2.current.material as THREE.MeshBasicMaterial;
      if (isActive) {
        const p = Math.sin(t * 1.8 + 1.2) * 0.5 + 0.5;
        r2.current.scale.setScalar(1 + p * 0.06);
        mat.opacity = 0.03 + p * 0.05;
        r2.current.rotation.z = -t * 0.14;
      } else {
        mat.opacity *= 0.94;
      }
    }
    if (r3.current) {
      const mat = r3.current.material as THREE.MeshBasicMaterial;
      if (isActive) {
        const p = Math.sin(t * 1.5 + 2.5) * 0.5 + 0.5;
        r3.current.scale.setScalar(1 + p * 0.05);
        mat.opacity = 0.02 + p * 0.035;
        r3.current.rotation.z = t * 0.1;
      } else {
        mat.opacity *= 0.94;
      }
    }
  });

  return (
    <>
      <mesh ref={r1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.56, 0.01, 6, 120]} />
        <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0} />
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 3, 0.4, 0]}>
        <torusGeometry args={[0.66, 0.007, 6, 120]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} />
      </mesh>
      <mesh ref={r3} rotation={[0.8, -0.3, 0.6]}>
        <torusGeometry args={[0.76, 0.005, 6, 120]} />
        <meshBasicMaterial color={GOLD_SOFT} transparent opacity={0} />
      </mesh>
    </>
  );
}

// ─── Main AICore ──────────────────────────────────────────────────────────────

export default function AICore({ state, thinkingStage = "idle" }: { state: OrbState; thinkingStage?: ThinkingStage }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const innerLightRef = useRef<THREE.PointLight>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const rotAccum = useRef(0);

  const cfg = CONFIGS[state];
  const isJitter = thinkingStage === "jitter";
  const isConverge = thinkingStage === "converge";
  const isSwallow = thinkingStage === "swallow";
  const isFlash = thinkingStage === "flash";
  const isReveal = thinkingStage === "reveal";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // ── Rotation ──
    if (groupRef.current) {
      let rs = cfg.rotSpeed;
      if (isJitter) rs = 0.01;
      if (isConverge) rs = 0.03;
      if (isSwallow) rs = 0.05;
      if (isFlash) rs = 0.015;
      if (isReveal) rs = 0.008;
      rotAccum.current += (rs - rotAccum.current) * 0.06;
      groupRef.current.rotation.y += rotAccum.current;
      groupRef.current.position.y = Math.sin(t * 0.15) * 0.008;

      let ts = 3.0;
      if (isJitter) ts = 3.15 + Math.sin(t * 2) * 0.1;
      if (isConverge) ts = 3.8 + Math.sin(t * 3) * 0.15;
      if (isSwallow) ts = 5.0 + Math.sin(t * 4) * 0.2;
      if (isFlash) ts = 3.5;
      if (isReveal) ts = 3.0;
      const cs = groupRef.current.scale.x;
      groupRef.current.scale.setScalar(cs + (ts - cs) * 0.03);
    }

    // ── Main light ──
    if (lightRef.current) {
      let intensity = cfg.lightIntensity;
      if (isJitter) intensity = 4;
      if (isConverge) intensity = 6;
      if (isSwallow) intensity = 7.5;
      if (isFlash) intensity = 11;
      const breathe = Math.sin(t * cfg.pulseSpeed * 0.3) * 0.5 + 0.5;
      lightRef.current.intensity = intensity + breathe * 1.5;
    }

    // ── Inner light ──
    if (innerLightRef.current) {
      let intensity = 0.4;
      if (isJitter) intensity = 2;
      if (isConverge) intensity = 3.5;
      if (isSwallow) intensity = 5.5;
      if (isFlash) intensity = 9;
      innerLightRef.current.intensity = intensity + Math.sin(t * 2.5) * 1.5;
    }

    // ── Core light — bright eye ──
    if (coreLightRef.current) {
      const breathe = Math.sin(t * 1.8) * 0.5 + 0.5;
      coreLightRef.current.intensity = 1.5 + breathe * 2;
    }
  });

  return (
    <group ref={groupRef} scale={3.0}>
      {/* Lighting */}
      <pointLight ref={lightRef} color={cfg.glowColor} intensity={cfg.lightIntensity} distance={26} decay={2} />
      <pointLight ref={innerLightRef} color={GOLD_LIGHT} intensity={0.4} distance={9} decay={2} />
      <pointLight ref={coreLightRef} color={GOLD_HOT} intensity={1.5} distance={5} decay={2} />
      <ambientLight intensity={0.03} color={0x8a6a10} />

      {/* Layers */}
      <GlowShell cfg={cfg} state={state} />
      <InnerFire cfg={cfg} state={state} />
      <EnergyCore cfg={cfg} state={state} />
      <InnerGravity cfg={cfg} state={state} />
      <Wireframe cfg={cfg} state={state} />
      <Arcs cfg={cfg} state={state} />
      <Nodes cfg={cfg} state={state} />
      <EnergyRings cfg={cfg} state={state} />
      <OrbParticles cfg={cfg} state={state} />
      <PulseRings state={state} />
    </group>
  );
}
