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

// ─── Wireframe curves — shimmer + react to state ──────────────────────────────

function RandomCurves({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const curves = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: 22 }, () => ({
      rx: (rand() - 0.5) * Math.PI * 2,
      ry: (rand() - 0.5) * Math.PI * 2,
      rz: (rand() - 0.5) * Math.PI * 2,
      rOff: 0.2 + rand() * 0.25,
      tube: 0.001 + rand() * 0.0015,
      baseOpacity: 0.35 + rand() * 0.45,
      shimmerSpeed: 0.5 + rand() * 1.5,
      shimmerPhase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const speed = isActive ? 0.012 : 0.003;
    groupRef.current.rotation.y += speed;
    groupRef.current.rotation.x += speed * 0.3;

    // Shimmer each line independently
    matsRef.current.forEach((mat, i) => {
      if (!mat) return;
      const c = curves[i];
      const shimmer = Math.sin(t * c.shimmerSpeed + c.shimmerPhase) * 0.5 + 0.5;
      mat.opacity = c.baseOpacity * (0.6 + shimmer * 0.4);
    });
  });

  return (
    <group ref={groupRef}>
      {curves.map((c, i) => (
        <mesh key={i} rotation={[c.rx, c.ry, c.rz]}>
          <torusGeometry args={[GLOBE_RADIUS * c.rOff, c.tube, 8, 80]} />
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

// ─── Random arc segments — shimmer ────────────────────────────────────────────

function RandomArcs({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const arcs = useMemo(() => {
    const rand = seededRandom(137);
    return Array.from({ length: 25 }, () => ({
      rx: (rand() - 0.5) * Math.PI * 2,
      ry: (rand() - 0.5) * Math.PI * 2,
      rz: (rand() - 0.5) * Math.PI * 2,
      tube: 0.0008 + rand() * 0.0015,
      baseOpacity: 0.25 + rand() * 0.4,
      arc: 0.3 + rand() * 0.7,
      shimmerSpeed: 0.4 + rand() * 1.2,
      shimmerPhase: rand() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    groupRef.current.rotation.y += isActive ? 0.012 : 0.003;
    groupRef.current.rotation.x += isActive ? 0.004 : 0.001;

    matsRef.current.forEach((mat, i) => {
      if (!mat) return;
      const a = arcs[i];
      const shimmer = Math.sin(t * a.shimmerSpeed + a.shimmerPhase) * 0.5 + 0.5;
      mat.opacity = a.baseOpacity * (0.5 + shimmer * 0.5);
    });
  });

  return (
    <group ref={groupRef}>
      {arcs.map((a, i) => (
        <mesh key={i} rotation={[a.rx, a.ry, a.rz]}>
          <torusGeometry args={[GLOBE_RADIUS, a.tube, 8, 80, Math.PI * a.arc]} />
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

// ─── Scattered nodes — breathe + pulse ────────────────────────────────────────

function ScatteredNodes({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const matsRef = useRef<THREE.MeshBasicMaterial[]>([]);

  const nodes = useMemo(() => {
    const rand = seededRandom(256);
    return Array.from({ length: 30 }, () => {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = GLOBE_RADIUS * (0.85 + rand() * 0.15);
      return {
        pos: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ] as [number, number, number],
        pulsePhase: rand() * Math.PI * 2,
        pulseSpeed: 0.8 + rand() * 1.2,
        baseSize: 0.005 + rand() * 0.004,
      };
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const isActive = state === "thinking" || state === "speaking" || state === "processing";
    const pulseMul = isActive ? 3.5 : 1;

    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const n = nodes[i];
      const mat = matsRef.current[i];

      // Breathing opacity
      const breathe = Math.sin(t * n.pulseSpeed * pulseMul + n.pulsePhase);
      if (mat) mat.opacity = 0.4 + (breathe * 0.5 + 0.5) * 0.5;

      // Size pulse
      const s = (isActive ? 0.8 : 0.5) + (breathe * 0.5 + 0.5) * 0.5;
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group>
      {nodes.map((n, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }} position={n.pos}>
          <sphereGeometry args={[n.baseSize, 6, 6]} />
          <meshBasicMaterial
            ref={(el) => { if (el) matsRef.current[i] = el; }}
            color={cfg.nodeColor}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Saturn rings — energy rings with glow bands ─────────────────────────────

function SaturnRings({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const r4 = useRef<THREE.Mesh>(null);
  const r5 = useRef<THREE.Mesh>(null);
  const r6 = useRef<THREE.Mesh>(null);
  const r7 = useRef<THREE.Mesh>(null);
  const r8 = useRef<THREE.Mesh>(null);

  // Energy bands that orbit along the rings
  const bandRef1 = useRef<THREE.Mesh>(null);
  const bandRef2 = useRef<THREE.Mesh>(null);
  const bandRef3 = useRef<THREE.Mesh>(null);

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
      { ref: r7, speed: 0.001 * mul, base: isActive ? 0.25 : 0.14 },
      { ref: r8, speed: -0.0008 * mul, base: isActive ? 0.2 : 0.1 },
    ];
    rings.forEach((ring, i) => {
      if (ring.ref.current) {
        ring.ref.current.rotation.z += ring.speed;
        const mat = ring.ref.current.material as THREE.MeshBasicMaterial;
        // Shimmer each ring
        const shimmer = Math.sin(t * (0.5 + i * 0.2) + i * 1.3) * 0.5 + 0.5;
        mat.opacity = ring.base * (0.7 + shimmer * 0.3);
      }
    });

    // Energy bands orbit along the rings — small bright blobs
    const bands = [
      { ref: bandRef1, radius: 0.52, speed: 0.8, tilt: [1.35, 0.2, 0.4] as [number, number, number] },
      { ref: bandRef2, radius: 0.64, speed: -0.6, tilt: [0.9, -0.4, 1.1] as [number, number, number] },
      { ref: bandRef3, radius: 0.8, speed: 0.4, tilt: [1.1, -0.7, 0.3] as [number, number, number] },
    ];
    bands.forEach((band) => {
      if (band.ref.current) {
        const angle = t * band.speed * mul;
        // Position the band orbiting along the ring
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        // Apply tilt rotation manually
        const [tx, ty, tz] = band.tilt;
        const x = cosA * band.radius;
        const z = sinA * band.radius;
        const y = 0;
        // Simple tilt
        const tiltedX = x * Math.cos(tz) - y * Math.sin(tz);
        const tiltedY = x * Math.sin(tz) * Math.cos(tx) + y * Math.cos(tz) * Math.cos(tx) + z * Math.sin(tx);
        const tiltedZ = -x * Math.sin(tz) * Math.sin(tx) + y * Math.cos(tz) * Math.sin(tx) + z * Math.cos(tx);
        band.ref.current.position.set(tiltedX, tiltedY, tiltedZ);
        const mat = band.ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.5 + Math.sin(t * 3 + band.speed) * 0.3;
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
      <mesh ref={r7} rotation={[0.4, -0.3, 0.7]}>
        <torusGeometry args={[0.96, 0.003, 8, 100]} />
        <meshBasicMaterial color={cfg.lineColor} transparent opacity={0.15} />
      </mesh>
      <mesh ref={r8} rotation={[-0.8, 0.5, -0.4]}>
        <torusGeometry args={[1.04, 0.003, 8, 100]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.1} />
      </mesh>

      {/* Energy bands — bright orbiting blobs on the rings */}
      <mesh ref={bandRef1}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color={GOLD_BRIGHT} transparent opacity={0.6} />
      </mesh>
      <mesh ref={bandRef2}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0.5} />
      </mesh>
      <mesh ref={bandRef3}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshBasicMaterial color={GOLD_NODE} transparent opacity={0.4} />
      </mesh>
    </>
  );
}

// ─── Particles — multi-orbit with trails ──────────────────────────────────────

const PARTICLE_COUNT = 50;
const PARTICLE_DATA = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const rand = seededRandom(i * 100 + 7);
  const orbit = Math.floor(rand() * 3);
  return {
    angle: rand() * Math.PI * 2,
    radius: orbit === 0 ? 0.42 + rand() * 0.06 : orbit === 1 ? 0.55 + rand() * 0.1 : 0.72 + rand() * 0.12,
    baseSpeed: (0.008 + rand() * 0.015) * (orbit === 0 ? 1.5 : orbit === 1 ? 1 : 0.6),
    y: (rand() - 0.5) * 0.5,
    size: 0.003 + rand() * 0.005,
    yOffsetAmp: 0.02 + rand() * 0.06,
    yOffsetFreq: 0.3 + rand() * 0.6,
    flickerSpeed: 1 + rand() * 2,
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
      const p = PARTICLE_DATA[i];
      const a = p.angle + t * p.baseSpeed * mul;
      mesh.position.x = Math.cos(a) * p.radius;
      mesh.position.z = Math.sin(a) * p.radius;
      mesh.position.y = p.y + Math.sin(t * p.yOffsetFreq * mul + i) * p.yOffsetAmp;

      const mat = matsRef.current[i];
      if (mat) {
        // Flicker — each particle twinkle independently
        const flicker = Math.sin(t * p.flickerSpeed * mul + p.flickerPhase);
        mat.opacity = 0.3 + (flicker * 0.5 + 0.5) * 0.5;
      }
    });
  });

  return (
    <>
      {PARTICLE_DATA.map((p, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial
            ref={(el) => { if (el) matsRef.current[i] = el; }}
            color={cfg.particleColor}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Inner core — breathing glow sphere ───────────────────────────────────────

function InnerCore({ cfg, state }: { cfg: OrbConfig; state: OrbState }) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current || !matRef.current) return;
    const isActive = state === "thinking" || state === "speaking" || state === "processing";

    // Breathing scale
    const breathe = Math.sin(t * (isActive ? 1.5 : 0.6)) * 0.5 + 0.5;
    const s = 0.15 + breathe * (isActive ? 0.08 : 0.04);
    ref.current.scale.setScalar(s);

    // Pulsing opacity
    matRef.current.opacity = 0.08 + breathe * (isActive ? 0.12 : 0.06);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial ref={matRef} color={cfg.glowColor} transparent opacity={0.1} />
    </mesh>
  );
}

// ─── Energy pulse ring — appears during thinking/speaking ─────────────────────

function EnergyPulse({ state }: { state: OrbState }) {
  const ref = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);
  const isActive = state === "thinking" || state === "speaking" || state === "processing";

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    if (isActive) {
      const pulse = Math.sin(t * 3) * 0.5 + 0.5;
      ref.current.scale.setScalar(1 + pulse * 0.15);
      mat.opacity = 0.12 + pulse * 0.18;
      ref.current.rotation.z = t * 0.3;
    } else {
      ref.current.scale.setScalar(1);
      mat.opacity = 0;
    }

    if (ref2.current) {
      const mat2 = ref2.current.material as THREE.MeshBasicMaterial;
      if (isActive) {
        const pulse2 = Math.sin(t * 2.5 + 1) * 0.5 + 0.5;
        ref2.current.scale.setScalar(1 + pulse2 * 0.12);
        mat2.opacity = 0.08 + pulse2 * 0.12;
        ref2.current.rotation.z = -t * 0.2;
      } else {
        ref2.current.scale.setScalar(1);
        mat2.opacity = 0;
      }
    }
  });

  return (
    <>
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.018, 8, 100]} />
        <meshBasicMaterial color={0xffd666} transparent opacity={0} />
      </mesh>
      <mesh ref={ref2} rotation={[Math.PI / 3, 0.5, 0]}>
        <torusGeometry args={[0.62, 0.012, 8, 100]} />
        <meshBasicMaterial color={GOLD_LIGHT} transparent opacity={0} />
      </mesh>
    </>
  );
}

// ─── Main Wireframe Globe ─────────────────────────────────────────────────────

export default function AICore({ state, thinkingStage = "idle" }: { state: OrbState; thinkingStage?: ThinkingStage }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const innerLightRef = useRef<THREE.PointLight>(null);
  const rotationAccum = useRef(0);

  const cfg = CONFIGS[state];
  const isActive = state === "thinking" || state === "speaking" || state === "processing";
  const isJitter = thinkingStage === "jitter";
  const isConverge = thinkingStage === "converge";
  const isSwallow = thinkingStage === "swallow";
  const isFlash = thinkingStage === "flash";
  const isReveal = thinkingStage === "reveal";

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      let rotSpeed = cfg.rotSpeed;
      if (isJitter) rotSpeed = 0.012;
      if (isConverge) rotSpeed = 0.035;
      if (isSwallow) rotSpeed = 0.06;
      if (isFlash) rotSpeed = 0.02;
      if (isReveal) rotSpeed = 0.01;

      rotationAccum.current += (rotSpeed - rotationAccum.current) * 0.1;
      groupRef.current.rotation.y += rotationAccum.current;

      // Organic float — gentle wobble
      groupRef.current.position.y = Math.sin(t * 0.25) * 0.015;
      groupRef.current.position.x = Math.sin(t * 0.18) * 0.005;

      let targetScale = 3.0;
      if (isJitter) targetScale = 3.3 + Math.sin(t * 2) * 0.2;
      if (isConverge) targetScale = 4.0 + Math.sin(t * 3) * 0.3;
      if (isSwallow) targetScale = 5.5 + Math.sin(t * 5) * 0.5;
      if (isFlash) targetScale = 3.8;
      if (isReveal) targetScale = 3.0;

      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.05;
      groupRef.current.scale.setScalar(newScale);
    }

    if (lightRef.current) {
      let intensity = cfg.lightIntensity;
      if (isJitter) intensity = 3.5;
      if (isConverge) intensity = 6.0;
      if (isSwallow) intensity = 8.0;
      if (isFlash) intensity = 12.0;
      // Breathing light
      const breathe = Math.sin(t * cfg.pulseSpeed * 0.5) * 0.5 + 0.5;
      lightRef.current.intensity = intensity + breathe * 1.5;
    }

    if (innerLightRef.current) {
      let intensity = 0.5;
      if (isJitter) intensity = 2.0;
      if (isConverge) intensity = 4.0;
      if (isSwallow) intensity = 6.0;
      if (isFlash) intensity = 10.0;
      innerLightRef.current.intensity = intensity + Math.sin(t * 4) * 2;
    }
  });

  return (
    <group ref={groupRef} scale={3.0}>
      <pointLight ref={lightRef} color={cfg.glowColor} intensity={cfg.lightIntensity} distance={22} decay={2} />
      <pointLight ref={innerLightRef} color={cfg.nodeColor} intensity={0.5} distance={8} decay={2} />
      <ambientLight intensity={isActive ? 0.12 : 0.08} />

      {/* Inner breathing core */}
      <InnerCore cfg={cfg} state={state} />

      {/* Wireframe curves — shimmer */}
      <RandomCurves cfg={cfg} state={state} />

      {/* Arc segments — shimmer */}
      <RandomArcs cfg={cfg} state={state} />

      {/* Bright nodes — breathe */}
      <ScatteredNodes cfg={cfg} state={state} />

      {/* Saturn rings + energy bands */}
      <SaturnRings cfg={cfg} state={state} />

      {/* Multi-orbit particles — flicker */}
      <Particles cfg={cfg} state={state} />

      {/* Energy pulse rings */}
      <EnergyPulse state={state} />
    </group>
  );
}
