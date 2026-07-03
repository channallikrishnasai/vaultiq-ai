"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbState } from "@/contexts/OrbContext";

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
}

// Rich bright gold — NOT yellow. Think molten gold, not lemon.
const GOLD = 0xe8b830;
const GOLD_BRIGHT = 0xf5c842;
const GOLD_LIGHT = 0xffd666;
const GOLD_NODE = 0xffdf5c;

const CONFIGS: Record<OrbState, OrbConfig> = {
  idle:       { rotSpeed: 0.003, pulseSpeed: 0.6, lineColor: GOLD, nodeColor: GOLD_NODE, ringColor: GOLD, glowColor: GOLD, particleColor: GOLD_NODE, lightIntensity: 3.0 },
  thinking:   { rotSpeed: 0.007, pulseSpeed: 1.5, lineColor: GOLD_BRIGHT, nodeColor: GOLD_LIGHT, ringColor: GOLD_BRIGHT, glowColor: GOLD_BRIGHT, particleColor: GOLD_LIGHT, lightIntensity: 3.8 },
  speaking:   { rotSpeed: 0.01,  pulseSpeed: 2.2, lineColor: GOLD_LIGHT, nodeColor: GOLD_NODE, ringColor: GOLD_LIGHT, glowColor: GOLD_LIGHT, particleColor: GOLD_NODE, lightIntensity: 4.2 },
  listening:  { rotSpeed: 0.004, pulseSpeed: 0.9, lineColor: 0x7aaccf, nodeColor: 0x99c4e2, ringColor: 0x6a9cc2, glowColor: 0x5a8cb5, particleColor: 0x99c4e2, lightIntensity: 2.8 },
  processing: { rotSpeed: 0.012, pulseSpeed: 2.5, lineColor: 0x9570d0, nodeColor: 0xb490ea, ringColor: 0x8560c2, glowColor: 0x7550b5, particleColor: 0xb490ea, lightIntensity: 3.5 },
  celebrating:{ rotSpeed: 0.013, pulseSpeed: 1.8, lineColor: 0x50d88a, nodeColor: 0x70f0aa, ringColor: 0x40c87a, glowColor: 0x30b86a, particleColor: 0x70f0aa, lightIntensity: 4.0 },
  sleeping:   { rotSpeed: 0.001, pulseSpeed: 0.2, lineColor: 0x2a3a4a, nodeColor: 0x3a4a5a, ringColor: 0x253545, glowColor: 0x1a2a3a, particleColor: 0x3a4a5a, lightIntensity: 1.0 },
  error:      { rotSpeed: 0.003, pulseSpeed: 3.0, lineColor: 0xb84040, nodeColor: 0xd86060, ringColor: 0xa83535, glowColor: 0x982a2a, particleColor: 0xd86060, lightIntensity: 3.2 },
};

// ─── Globe radius ─────────────────────────────────────────────────────────────

const GLOBE_RADIUS = 0.4;

// ─── Seeded random ────────────────────────────────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Random wireframe curves — hair-thin, organic ─────────────────────────────

function RandomCurves({ cfg }: { cfg: OrbConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  const curves = useMemo(() => {
    const rand = seededRandom(42);
    const count = 22;
    return Array.from({ length: count }, () => {
      const rx = (rand() - 0.5) * Math.PI * 2;
      const ry = (rand() - 0.5) * Math.PI * 2;
      const rz = (rand() - 0.5) * Math.PI * 2;
      const rOff = 0.2 + rand() * 0.25;
      const tube = 0.001 + rand() * 0.0015; // hair-thin
      const opacity = 0.35 + rand() * 0.45;
      return { rx, ry, rz, rOff, tube, opacity };
    });
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x += 0.001;
    }
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

// ─── Random arc segments — partial thin curves ────────────────────────────────

function RandomArcs({ cfg }: { cfg: OrbConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  const arcs = useMemo(() => {
    const rand = seededRandom(137);
    const count = 25;
    return Array.from({ length: count }, () => {
      const rx = (rand() - 0.5) * Math.PI * 2;
      const ry = (rand() - 0.5) * Math.PI * 2;
      const rz = (rand() - 0.5) * Math.PI * 2;
      const tube = 0.0008 + rand() * 0.0015; // hair-thin
      const opacity = 0.25 + rand() * 0.4;
      const arc = 0.3 + rand() * 0.7;
      return { rx, ry, rz, tube, opacity, arc };
    });
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x += 0.001;
    }
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

// ─── Scattered bright nodes ───────────────────────────────────────────────────

function ScatteredNodes({ cfg }: { cfg: OrbConfig }) {
  const refs = useRef<THREE.Mesh[]>([]);

  const nodes = useMemo(() => {
    const rand = seededRandom(256);
    const count = 30;
    return Array.from({ length: count }, () => {
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
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 1.8 + i * 0.4) * 0.35;
      const s = 0.7 + Math.sin(t * 1.2 + i * 0.6) * 0.3;
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

// ─── Saturn rings — thick, bright, dramatic angles ────────────────────────────

function SaturnRings({ cfg }: { cfg: OrbConfig }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const r4 = useRef<THREE.Mesh>(null);
  const r5 = useRef<THREE.Mesh>(null);
  const r6 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const rings = [
      { ref: r1, speed: 0.006, base: 0.8 },
      { ref: r2, speed: -0.004, base: 0.65 },
      { ref: r3, speed: 0.003, base: 0.5 },
      { ref: r4, speed: -0.0025, base: 0.38 },
      { ref: r5, speed: 0.002, base: 0.28 },
      { ref: r6, speed: -0.0015, base: 0.18 },
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
      {/* Innermost — tight, bright */}
      <mesh ref={r1} rotation={[1.35, 0.2, 0.4]}>
        <torusGeometry args={[0.48, 0.008, 10, 120]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.8} />
      </mesh>
      {/* Second ring */}
      <mesh ref={r2} rotation={[0.5, 1.2, -0.6]}>
        <torusGeometry args={[0.56, 0.007, 10, 110]} />
        <meshBasicMaterial color={cfg.lineColor} transparent opacity={0.65} />
      </mesh>
      {/* Third ring */}
      <mesh ref={r3} rotation={[0.9, -0.4, 1.1]}>
        <torusGeometry args={[0.64, 0.006, 10, 110]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.5} />
      </mesh>
      {/* Fourth ring */}
      <mesh ref={r4} rotation={[-0.3, 0.8, -1.2]}>
        <torusGeometry args={[0.72, 0.005, 8, 100]} />
        <meshBasicMaterial color={cfg.nodeColor} transparent opacity={0.4} />
      </mesh>
      {/* Fifth ring */}
      <mesh ref={r5} rotation={[1.1, -0.7, 0.3]}>
        <torusGeometry args={[0.8, 0.004, 8, 100]} />
        <meshBasicMaterial color={cfg.lineColor} transparent opacity={0.3} />
      </mesh>
      {/* Outermost — wide, faint */}
      <mesh ref={r6} rotation={[-0.6, 1.0, 0.9]}>
        <torusGeometry args={[0.88, 0.004, 8, 100]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.2} />
      </mesh>
    </>
  );
}

// ─── Orbiting particles ───────────────────────────────────────────────────────

const PARTICLE_COUNT = 30;
const PARTICLE_DATA = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const rand = seededRandom(i * 100 + 7);
  return {
    angle: rand() * Math.PI * 2,
    radius: 0.44 + rand() * 0.18,
    speed: 0.012 + rand() * 0.018,
    y: (rand() - 0.5) * 0.7,
    size: 0.005 + rand() * 0.005,
  };
});

function Particles({ cfg }: { cfg: OrbConfig }) {
  const refs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const p = PARTICLE_DATA[i];
      const a = p.angle + t * p.speed;
      mesh.position.x = Math.cos(a) * p.radius;
      mesh.position.z = Math.sin(a) * p.radius;
      mesh.position.y = p.y + Math.sin(t * 0.4 + i) * 0.05;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 1.8 + i * 0.7) * 0.3;
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

// ─── Main Wireframe Globe ─────────────────────────────────────────────────────

export default function AICore({ state }: { state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const cfg = CONFIGS[state];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (groupRef.current) {
      groupRef.current.rotation.y += cfg.rotSpeed;
      groupRef.current.position.y = Math.sin(t * 0.25) * 0.015;
    }

    if (lightRef.current) {
      lightRef.current.intensity = cfg.lightIntensity + Math.sin(t * cfg.pulseSpeed * 0.5) * 1.0;
    }
  });

  return (
    <group ref={groupRef} scale={3.0}>
      {/* Warm gold light */}
      <pointLight ref={lightRef} color={cfg.glowColor} intensity={cfg.lightIntensity} distance={22} decay={2} />
      <ambientLight intensity={0.08} />

      {/* Hair-thin random wireframe curves */}
      <RandomCurves cfg={cfg} />

      {/* Hair-thin random arc segments */}
      <RandomArcs cfg={cfg} />

      {/* Scattered bright nodes */}
      <ScatteredNodes cfg={cfg} />

      {/* Saturn rings — thick, bright, dramatic */}
      <SaturnRings cfg={cfg} />

      {/* Particles */}
      <Particles cfg={cfg} />
    </group>
  );
}
