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

const CONFIGS: Record<OrbState, OrbConfig> = {
  idle:       { rotSpeed: 0.003, pulseSpeed: 0.6, lineColor: 0xd4af37, nodeColor: 0xf5d060, ringColor: 0xd4af37, glowColor: 0xd4af37, particleColor: 0xf5d060, lightIntensity: 2.8 },
  thinking:   { rotSpeed: 0.007, pulseSpeed: 1.5, lineColor: 0xf5d060, nodeColor: 0xffd700, ringColor: 0xf5d060, glowColor: 0xf5d060, particleColor: 0xffd700, lightIntensity: 3.5 },
  speaking:   { rotSpeed: 0.01,  pulseSpeed: 2.2, lineColor: 0xffd700, nodeColor: 0xffe44d, ringColor: 0xffd700, glowColor: 0xffd700, particleColor: 0xffe44d, lightIntensity: 4.0 },
  listening:  { rotSpeed: 0.004, pulseSpeed: 0.9, lineColor: 0x6699cc, nodeColor: 0x88aadd, ringColor: 0x5588bb, glowColor: 0x4477aa, particleColor: 0x88aadd, lightIntensity: 2.5 },
  processing: { rotSpeed: 0.012, pulseSpeed: 2.5, lineColor: 0x8855cc, nodeColor: 0xaa77ee, ringColor: 0x7744bb, glowColor: 0x6633aa, particleColor: 0xaa77ee, lightIntensity: 3.2 },
  celebrating:{ rotSpeed: 0.013, pulseSpeed: 1.8, lineColor: 0x44cc77, nodeColor: 0x66eebb, ringColor: 0x33bb66, glowColor: 0x22aa55, particleColor: 0x66eebb, lightIntensity: 3.5 },
  sleeping:   { rotSpeed: 0.001, pulseSpeed: 0.2, lineColor: 0x223344, nodeColor: 0x334455, ringColor: 0x1a2a3a, glowColor: 0x112233, particleColor: 0x334455, lightIntensity: 0.8 },
  error:      { rotSpeed: 0.003, pulseSpeed: 3.0, lineColor: 0xaa3333, nodeColor: 0xdd4444, ringColor: 0x993333, glowColor: 0x882222, particleColor: 0xdd4444, lightIntensity: 2.8 },
};

// ─── Globe radius ─────────────────────────────────────────────────────────────

const GLOBE_RADIUS = 0.38;

// ─── Latitude lines (horizontal rings at different heights) ────────────────────

function LatitudeLines({ cfg }: { cfg: OrbConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const result: { radius: number; y: number }[] = [];
    const latCount = 9;
    for (let i = 1; i < latCount; i++) {
      const lat = (i / latCount) * Math.PI - Math.PI / 2;
      const r = Math.cos(lat) * GLOBE_RADIUS;
      const y = Math.sin(lat) * GLOBE_RADIUS;
      result.push({ radius: r, y });
    }
    return result;
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <mesh key={i} position={[0, line.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[line.radius, 0.003, 8, 80]} />
          <meshBasicMaterial
            color={cfg.lineColor}
            transparent
            opacity={0.35 + (i % 3) * 0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Longitude lines (vertical meridian arcs) ─────────────────────────────────

function LongitudeLines({ cfg }: { cfg: OrbConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  const lines = useMemo(() => {
    const count = 12;
    return Array.from({ length: count }, (_, i) => ({
      rotY: (i / count) * Math.PI,
    }));
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {lines.map((line, i) => (
        <mesh key={i} rotation={[0, line.rotY, 0]}>
          <torusGeometry args={[GLOBE_RADIUS, 0.003, 8, 80]} />
          <meshBasicMaterial
            color={cfg.lineColor}
            transparent
            opacity={0.3 + (i % 3) * 0.06}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Equator + tropic highlight lines (brighter) ──────────────────────────────

function HighlightLines({ cfg }: { cfg: OrbConfig }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
      groupRef.current.rotation.x += 0.001;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Equator */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[GLOBE_RADIUS, 0.005, 12, 100]} />
        <meshBasicMaterial color={cfg.nodeColor} transparent opacity={0.7} />
      </mesh>
      {/* Tropic of Cancer */}
      <mesh position={[0, GLOBE_RADIUS * 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[GLOBE_RADIUS * 0.92, 0.004, 10, 90]} />
        <meshBasicMaterial color={cfg.lineColor} transparent opacity={0.45} />
      </mesh>
      {/* Tropic of Capricorn */}
      <mesh position={[0, -GLOBE_RADIUS * 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[GLOBE_RADIUS * 0.92, 0.004, 10, 90]} />
        <meshBasicMaterial color={cfg.lineColor} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

// ─── Bright light nodes at intersections ──────────────────────────────────────

function GlobeNodes({ cfg }: { cfg: OrbConfig }) {
  const refs = useRef<THREE.Mesh[]>([]);

  const nodes = useMemo(() => {
    const result: [number, number, number][] = [];
    // Place nodes at lat/lon intersections
    const lats = [-0.6, -0.3, 0, 0.3, 0.6];
    const lons = 12;
    lats.forEach((lat) => {
      const r = Math.cos(lat) * GLOBE_RADIUS;
      const y = Math.sin(lat) * GLOBE_RADIUS;
      for (let i = 0; i < lons; i++) {
        const angle = (i / lons) * Math.PI * 2;
        result.push([Math.cos(angle) * r, y, Math.sin(angle) * r]);
      }
    });
    return result;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 2.0 + i * 0.3) * 0.3;
      const s = 0.8 + Math.sin(t * 1.5 + i * 0.5) * 0.2;
      mesh.scale.setScalar(s);
    });
  });

  return (
    <group>
      {nodes.map((v, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }} position={v}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshBasicMaterial color={cfg.nodeColor} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── 6 glowing orbit rings ────────────────────────────────────────────────────

function OrbitRings({ cfg }: { cfg: OrbConfig }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const r4 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const rings = [
      { ref: r1, speed: 0.007, base: 0.6 },
      { ref: r2, speed: -0.005, base: 0.45 },
      { ref: r3, speed: 0.004, base: 0.3 },
      { ref: r4, speed: -0.003, base: 0.18 },
    ];
    rings.forEach((ring, i) => {
      if (ring.ref.current) {
        ring.ref.current.rotation.z += ring.speed;
        const mat = ring.ref.current.material as THREE.MeshBasicMaterial;
        mat.opacity = ring.base * (0.85 + Math.sin(t * 1.2 + i * 0.8) * 0.15);
      }
    });
  });

  return (
    <>
      <mesh ref={r1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.012, 10, 100]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.65} />
      </mesh>
      <mesh ref={r2} rotation={[0.5, 0.6, Math.PI / 3]}>
        <torusGeometry args={[0.5, 0.01, 10, 100]} />
        <meshBasicMaterial color={cfg.lineColor} transparent opacity={0.5} />
      </mesh>
      <mesh ref={r3} rotation={[Math.PI / 3, -0.3, 0.4]}>
        <torusGeometry args={[0.58, 0.009, 8, 100]} />
        <meshBasicMaterial color={cfg.ringColor} transparent opacity={0.35} />
      </mesh>
      <mesh ref={r4} rotation={[0.3, -0.5, Math.PI / 5]}>
        <torusGeometry args={[0.66, 0.007, 8, 100]} />
        <meshBasicMaterial color={cfg.nodeColor} transparent opacity={0.22} />
      </mesh>
    </>
  );
}

// ─── Orbiting particles ───────────────────────────────────────────────────────

const PARTICLE_COUNT = 30;
const PARTICLE_DATA = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  angle: (i / PARTICLE_COUNT) * Math.PI * 2,
  radius: 0.4 + (i % 5) * 0.06,
  speed: 0.025 + (i % 4) * 0.01,
  y: (((i * 7919) % 100) / 100 - 0.5) * 0.5,
  size: 0.008 + (i % 3) * 0.003,
}));

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
      mesh.position.y = p.y + Math.sin(t * 0.5 + i) * 0.04;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.sin(t * 2.0 + i * 0.7) * 0.3;
    });
  });

  return (
    <>
      {PARTICLE_DATA.map((p, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el; }}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshBasicMaterial color={cfg.particleColor} transparent opacity={0.6} />
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
      lightRef.current.intensity = cfg.lightIntensity + Math.sin(t * cfg.pulseSpeed * 0.5) * 0.8;
    }
  });

  return (
    <group ref={groupRef} scale={2.7}>
      {/* Warm light */}
      <pointLight ref={lightRef} color={cfg.glowColor} intensity={cfg.lightIntensity} distance={18} decay={2} />
      <ambientLight intensity={0.06} />

      {/* Latitude lines — horizontal rings */}
      <LatitudeLines cfg={cfg} />

      {/* Longitude lines — vertical meridians */}
      <LongitudeLines cfg={cfg} />

      {/* Highlight lines — equator + tropics (brighter) */}
      <HighlightLines cfg={cfg} />

      {/* Bright nodes at intersections */}
      <GlobeNodes cfg={cfg} />

      {/* 6 glowing orbit rings */}
      <OrbitRings cfg={cfg} />

      {/* Orbiting particles */}
      <Particles cfg={cfg} />
    </group>
  );
}
