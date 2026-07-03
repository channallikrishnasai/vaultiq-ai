"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import { OrbState } from "@/contexts/OrbContext";

// ─── Particle data ────────────────────────────────────────────────────────────

// ─── Particle data ────────────────────────────────────────────────────────────

const PARTICLE_COUNT = 600;
const PARTICLE_DATA = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const theta = (i / PARTICLE_COUNT) * Math.PI * 2;
  const phi = Math.acos(1 - 2 * (i / PARTICLE_COUNT));
  const r = 0.45 + ((i * 7919) % 100) / 150;
  return {
    x: Math.sin(phi) * Math.cos(theta) * r,
    y: Math.cos(phi) * r,
    z: Math.sin(phi) * Math.sin(theta) * r,
  };
});

const SATELLITE_COUNT = 40;
const SATELLITE_DATA = Array.from({ length: SATELLITE_COUNT }, (_, i) => ({
  angle: (i / SATELLITE_COUNT) * Math.PI * 2,
  radius: 1.15 + (i % 7) * 0.18,
  speed: 0.08 + (i % 6) * 0.025,
  size: 0.01 + (i % 4) * 0.004,
  yOffset: Math.sin((i / SATELLITE_COUNT) * Math.PI * 2) * 0.55,
}));

// ─── Per-state configuration ──────────────────────────────────────────────────

interface StateConfig {
  pulseSpeed: number;
  energyIntensity: number;
  rotSpeed: number;
  particleSpeedMult: number;
  particleSize: number;
  lightColor: number;
  lightIntensity: number;
  lightPulseAmp: number;
  outerPulseAmp: number;
  coreOpacity: number;
  coreScaleAmp: number;
  ringMult: number;
  breatheAmp: number;
  breatheSpeed: number;
  shellColor: number;
  shellEmissive: number;
  specularColor: number;
  innerEmissive: number;
  plasmaColor: number;
  coreColor: number;
  rimColor: number;
  rimIntensity: number;
}

const STATE_CONFIG: Record<OrbState, StateConfig> = {
  idle: {
    pulseSpeed: 0.6,
    energyIntensity: 0.35,
    rotSpeed: 0.0025,
    particleSpeedMult: 1,
    particleSize: 0.016,
    lightColor: 0xd4af37,
    lightIntensity: 2.8,
    lightPulseAmp: 0.4,
    outerPulseAmp: 0.004,
    coreOpacity: 0.7,
    coreScaleAmp: 0.04,
    ringMult: 1,
    breatheAmp: 0.008,
    breatheSpeed: 0.3,
    shellColor: 0x050508,
    shellEmissive: 0x120a00,
    specularColor: 0xd4af37,
    innerEmissive: 0xb8922a,
    plasmaColor: 0xc9982a,
    coreColor: 0xe8c84a,
    rimColor: 0x1a3366,
    rimIntensity: 0.8,
  },
  thinking: {
    pulseSpeed: 2.0,
    energyIntensity: 0.55,
    rotSpeed: 0.006,
    particleSpeedMult: 1.5,
    particleSize: 0.02,
    lightColor: 0xd4af37,
    lightIntensity: 3.5,
    lightPulseAmp: 1.0,
    outerPulseAmp: 0.008,
    coreOpacity: 0.85,
    coreScaleAmp: 0.1,
    ringMult: 2.0,
    breatheAmp: 0.014,
    breatheSpeed: 1.2,
    shellColor: 0x080502,
    shellEmissive: 0x1a0e00,
    specularColor: 0xe8c040,
    innerEmissive: 0xc8a030,
    plasmaColor: 0xd4a828,
    coreColor: 0xf0d060,
    rimColor: 0x1a3366,
    rimIntensity: 1.0,
  },
  speaking: {
    pulseSpeed: 3.0,
    energyIntensity: 0.6,
    rotSpeed: 0.009,
    particleSpeedMult: 1.8,
    particleSize: 0.022,
    lightColor: 0xd4af37,
    lightIntensity: 3.8,
    lightPulseAmp: 1.4,
    outerPulseAmp: 0.01,
    coreOpacity: 0.9,
    coreScaleAmp: 0.14,
    ringMult: 2.5,
    breatheAmp: 0.018,
    breatheSpeed: 1.8,
    shellColor: 0x060402,
    shellEmissive: 0x1e0e00,
    specularColor: 0xe8c840,
    innerEmissive: 0xd0a830,
    plasmaColor: 0xdcb030,
    coreColor: 0xf5d868,
    rimColor: 0x2244aa,
    rimIntensity: 1.2,
  },
  listening: {
    pulseSpeed: 1.5,
    energyIntensity: 0.45,
    rotSpeed: 0.004,
    particleSpeedMult: 1.2,
    particleSize: 0.018,
    lightColor: 0x6688bb,
    lightIntensity: 3.0,
    lightPulseAmp: 0.6,
    outerPulseAmp: 0.006,
    coreOpacity: 0.75,
    coreScaleAmp: 0.08,
    ringMult: 1.4,
    breatheAmp: 0.012,
    breatheSpeed: 0.7,
    shellColor: 0x030612,
    shellEmissive: 0x001030,
    specularColor: 0x4466aa,
    innerEmissive: 0x3355aa,
    plasmaColor: 0x3366aa,
    coreColor: 0x5588cc,
    rimColor: 0x0044aa,
    rimIntensity: 1.0,
  },
  processing: {
    pulseSpeed: 4.0,
    energyIntensity: 0.6,
    rotSpeed: 0.012,
    particleSpeedMult: 2.2,
    particleSize: 0.024,
    lightColor: 0x7744cc,
    lightIntensity: 3.5,
    lightPulseAmp: 1.4,
    outerPulseAmp: 0.012,
    coreOpacity: 0.85,
    coreScaleAmp: 0.16,
    ringMult: 3.0,
    breatheAmp: 0.02,
    breatheSpeed: 2.5,
    shellColor: 0x040010,
    shellEmissive: 0x100028,
    specularColor: 0x8855cc,
    innerEmissive: 0x5522aa,
    plasmaColor: 0x7733cc,
    coreColor: 0x9966dd,
    rimColor: 0x4422aa,
    rimIntensity: 1.4,
  },
  celebrating: {
    pulseSpeed: 2.5,
    energyIntensity: 0.6,
    rotSpeed: 0.014,
    particleSpeedMult: 2.5,
    particleSize: 0.026,
    lightColor: 0x33cc77,
    lightIntensity: 4.0,
    lightPulseAmp: 1.6,
    outerPulseAmp: 0.016,
    coreOpacity: 0.9,
    coreScaleAmp: 0.18,
    ringMult: 3.2,
    breatheAmp: 0.022,
    breatheSpeed: 3.0,
    shellColor: 0x001208,
    shellEmissive: 0x002818,
    specularColor: 0x33cc77,
    innerEmissive: 0x22aa55,
    plasmaColor: 0x22bb66,
    coreColor: 0x66ddaa,
    rimColor: 0x00aa44,
    rimIntensity: 1.6,
  },
  sleeping: {
    pulseSpeed: 0.2,
    energyIntensity: 0.08,
    rotSpeed: 0.001,
    particleSpeedMult: 0.15,
    particleSize: 0.008,
    lightColor: 0x223344,
    lightIntensity: 0.8,
    lightPulseAmp: 0.1,
    outerPulseAmp: 0.002,
    coreOpacity: 0.25,
    coreScaleAmp: 0.02,
    ringMult: 0.15,
    breatheAmp: 0.004,
    breatheSpeed: 0.15,
    shellColor: 0x020204,
    shellEmissive: 0x020408,
    specularColor: 0x223344,
    innerEmissive: 0x0a1122,
    plasmaColor: 0x112233,
    coreColor: 0x223344,
    rimColor: 0x081122,
    rimIntensity: 0.2,
  },
  error: {
    pulseSpeed: 5.0,
    energyIntensity: 0.5,
    rotSpeed: 0.004,
    particleSpeedMult: 0.4,
    particleSize: 0.014,
    lightColor: 0xcc3333,
    lightIntensity: 2.5,
    lightPulseAmp: 2.0,
    outerPulseAmp: 0.015,
    coreOpacity: 0.6,
    coreScaleAmp: 0.1,
    ringMult: 0.6,
    breatheAmp: 0.015,
    breatheSpeed: 4.0,
    shellColor: 0x0a0101,
    shellEmissive: 0x220000,
    specularColor: 0xcc3333,
    innerEmissive: 0xaa0000,
    plasmaColor: 0xbb2222,
    coreColor: 0xdd4444,
    rimColor: 0x660000,
    rimIntensity: 1.2,
  },
};

// ─── Satellite particles ─────────────────────────────────────────────────────

function SatelliteParticles({ state }: { state: OrbState }) {
  const meshRefs = useRef<THREE.Mesh[]>([]);
  const cfg = STATE_CONFIG[state];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    SATELLITE_DATA.forEach((s, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      const angle = s.angle + t * s.speed * cfg.particleSpeedMult;
      mesh.position.x = Math.cos(angle) * s.radius;
      mesh.position.z = Math.sin(angle) * s.radius;
      mesh.position.y = s.yOffset + Math.sin(t * 0.3 + i) * 0.04;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.2 + Math.sin(t * 1.5 + i * 0.8) * 0.15;
      mat.color.setHex(cfg.plasmaColor);
    });
  });

  return (
    <group>
      {SATELLITE_DATA.map((s, i) => (
        <mesh key={i} ref={(el) => { if (el) meshRefs.current[i] = el; }}>
          <sphereGeometry args={[s.size, 5, 5]} />
          <meshBasicMaterial color={0xd4af37} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Orbiting particle cloud ──────────────────────────────────────────────────

function OrbParticles({ state }: { state: OrbState }) {
  const meshRef = useRef<THREE.Points>(null);
  const cfg = STATE_CONFIG[state];

  const positionArray = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    PARTICLE_DATA.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    return arr;
  }, []);

  const velocities = useMemo(
    () =>
      PARTICLE_DATA.map((_, i) => ({
        x: (((i * 1234) % 1000) / 1000 - 0.5) * 0.0015,
        y: (((i * 5678) % 1000) / 1000 - 0.5) * 0.0015,
        z: (((i * 9012) % 1000) / 1000 - 0.5) * 0.0015,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const arr = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] += velocities[i].x * cfg.particleSpeedMult;
      arr[i * 3 + 1] += velocities[i].y * cfg.particleSpeedMult;
      arr[i * 3 + 2] += velocities[i].z * cfg.particleSpeedMult;
      const d = Math.sqrt(arr[i * 3] ** 2 + arr[i * 3 + 1] ** 2 + arr[i * 3 + 2] ** 2);
      if (d > 1.55 || d < 0.35) {
        velocities[i].x *= -1;
        velocities[i].y *= -1;
        velocities[i].z *= -1;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.4 + Math.sin(t * 0.5) * 0.1;
    mat.size = cfg.particleSize;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
      </bufferGeometry>
      <pointsMaterial color={0xd4af37} size={0.016} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ─── Single subtle energy pulse ──────────────────────────────────────────────

function EnergyPulse({ state }: { state: OrbState }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const cfg = STATE_CONFIG[state];

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = (t * 0.5) % 3.0;
    const scale = 0.8 + pulse * 0.4;
    ringRef.current.scale.setScalar(scale);
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = Math.max(0, (1 - pulse / 3.0) * 0.15 * cfg.energyIntensity);
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.1, 0.006, 8, 160]} />
      <meshBasicMaterial color={cfg.plasmaColor} transparent opacity={0.12} />
    </mesh>
  );
}

// ─── Golden geodesic wireframe sphere ────────────────────────────────────────

function GeodesicSphere() {
  const wireRef = useRef<THREE.Mesh>(null);
  const wire2Ref = useRef<THREE.Mesh>(null);
  const wire3Ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Slow rotation on all three wireframes
    if (wireRef.current) {
      wireRef.current.rotation.y += 0.003;
      wireRef.current.rotation.x += 0.001;
      const mat = wireRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(t * 0.6) * 0.1;
    }
    if (wire2Ref.current) {
      wire2Ref.current.rotation.y -= 0.002;
      wire2Ref.current.rotation.z += 0.0015;
      const mat = wire2Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 0.8 + 1) * 0.1;
    }
    if (wire3Ref.current) {
      wire3Ref.current.rotation.x += 0.002;
      wire3Ref.current.rotation.y += 0.001;
      const mat = wire3Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 0.5 + 2) * 0.08;
    }

    // Inner glow pulse
    if (glowRef.current) {
      const s = 1 + Math.sin(t * 0.4) * 0.04;
      glowRef.current.scale.setScalar(s);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(t * 0.6) * 0.12;
    }
  });

  return (
    <group>
      {/* Inner warm glow sphere */}
      <Sphere ref={glowRef} args={[0.48, 24, 24]}>
        <meshBasicMaterial color={0xd4af37} transparent opacity={0.35} side={THREE.BackSide} />
      </Sphere>

      {/* Primary icosahedron wireframe — golden lines */}
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[0.52, 3]} />
        <meshBasicMaterial color={0xd4af37} wireframe transparent opacity={0.55} />
      </mesh>

      {/* Secondary octahedron wireframe — brighter accent */}
      <mesh ref={wire2Ref}>
        <octahedronGeometry args={[0.44, 1]} />
        <meshBasicMaterial color={0xf5d060} wireframe transparent opacity={0.4} />
      </mesh>

      {/* Tertiary dodecahedron wireframe — subtle depth */}
      <mesh ref={wire3Ref}>
        <dodecahedronGeometry args={[0.38, 0]} />
        <meshBasicMaterial color={0xb8860b} wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// ─── Main AI Core Orb ─────────────────────────────────────────────────────────

export default function AICore({ state }: { state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const plasmaRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const topLightRef = useRef<THREE.PointLight>(null);

  const ringRefs = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cfg = STATE_CONFIG[state];

    // Group rotation + float
    if (groupRef.current) {
      groupRef.current.rotation.y += cfg.rotSpeed;
      const breathe = Math.sin(t * cfg.breatheSpeed) * cfg.breatheAmp;
      groupRef.current.position.y = breathe;
    }

    // Outer glass shell
    if (outerRef.current) {
      const scale = 1 + Math.sin(t * cfg.pulseSpeed * 0.4) * cfg.outerPulseAmp;
      outerRef.current.scale.setScalar(scale);
      const mat = outerRef.current.material as THREE.MeshPhongMaterial;
      mat.color.setHex(cfg.shellColor);
      mat.emissive.setHex(cfg.shellEmissive);
      mat.specular.setHex(cfg.specularColor);
    }

    // Inner plasma energy
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = cfg.energyIntensity * (0.6 + Math.sin(t * cfg.pulseSpeed * 0.7) * 0.15);
      mat.emissive.setHex(cfg.innerEmissive);
      innerRef.current.rotation.y -= cfg.rotSpeed * 1.2;
      innerRef.current.rotation.x += cfg.rotSpeed * 0.5;
    }

    // Plasma layer
    if (plasmaRef.current) {
      const mat = plasmaRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.45 + Math.sin(t * cfg.pulseSpeed * 0.8) * 0.1;
      mat.color.setHex(cfg.plasmaColor);
      plasmaRef.current.rotation.y += cfg.rotSpeed * 1.5;
      plasmaRef.current.rotation.z -= cfg.rotSpeed * 0.5;
    }

    // Core pulse
    if (coreRef.current) {
      const s = 1 + Math.sin(t * cfg.pulseSpeed * 1.2) * cfg.coreScaleAmp;
      coreRef.current.scale.setScalar(s);
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = cfg.coreOpacity;
      mat.color.setHex(cfg.coreColor);
    }

    // Glow sphere
    if (glowRef.current) {
      const s = 1 + Math.sin(t * cfg.pulseSpeed * 0.25) * 0.03;
      glowRef.current.scale.setScalar(s);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.06 + Math.sin(t * cfg.pulseSpeed * 0.4) * 0.025;
      mat.color.setHex(cfg.plasmaColor);
    }

    // Lights
    if (lightRef.current) {
      lightRef.current.intensity = cfg.lightIntensity + Math.sin(t * cfg.pulseSpeed * 0.6) * cfg.lightPulseAmp;
      lightRef.current.color.setHex(cfg.lightColor);
    }
    if (rimLightRef.current) {
      rimLightRef.current.intensity = cfg.rimIntensity + Math.sin(t * 0.3) * 0.3;
      rimLightRef.current.color.setHex(cfg.rimColor);
    }
    if (topLightRef.current) {
      topLightRef.current.intensity = cfg.lightIntensity * 0.35 + Math.sin(t * cfg.pulseSpeed * 0.5) * 0.35;
      topLightRef.current.color.setHex(cfg.lightColor);
    }

    // Rings — thin, subtle
    const ringSpeeds = [
      0.003, 0.0025, 0.002, 0.0018, 0.0015, 0.0028, 0.0012,
      0.0022, 0.0026, 0.0019, 0.0016, 0.0024,
    ];
    ringRefs.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.z += ringSpeeds[i % ringSpeeds.length] * cfg.ringMult;
        const mat = ring.material as THREE.MeshBasicMaterial;
        if (mat) {
          const baseOpacity = ringConfigs[i]?.opacity ?? 0.15;
          mat.opacity = baseOpacity * (0.85 + Math.sin(t * 0.3 + i * 0.4) * 0.15);
        }
      }
    });
  });

  const cfg = STATE_CONFIG[state];

  // 12 thin rings — subtle, hairline, matching reference
  const ringConfigs = [
    { radius: 1.0, thick: 0.004, rot: [Math.PI / 2, 0, 0] as const, opacity: 0.3, color: "plasmaColor" as const },
    { radius: 1.1, thick: 0.0035, rot: [0.3, 0.5, Math.PI / 4] as const, opacity: 0.28, color: "coreColor" as const },
    { radius: 1.2, thick: 0.003, rot: [Math.PI / 3, Math.PI / 6, 0.2] as const, opacity: 0.25, color: "lightColor" as const },
    { radius: 1.32, thick: 0.003, rot: [0.8, -0.3, Math.PI / 5] as const, opacity: 0.22, color: "plasmaColor" as const },
    { radius: 1.44, thick: 0.0025, rot: [Math.PI / 4, Math.PI / 3, -0.2] as const, opacity: 0.18, color: "coreColor" as const },
    { radius: 1.56, thick: 0.0025, rot: [0.6, 0.8, Math.PI / 3] as const, opacity: 0.15, color: "plasmaColor" as const },
    { radius: 1.68, thick: 0.002, rot: [Math.PI / 5, -0.4, 0.6] as const, opacity: 0.12, color: "lightColor" as const },
    { radius: 1.80, thick: 0.002, rot: [0.4, Math.PI / 4, -0.3] as const, opacity: 0.1, color: "coreColor" as const },
    { radius: 1.92, thick: 0.002, rot: [Math.PI / 6, 0.7, Math.PI / 7] as const, opacity: 0.08, color: "plasmaColor" as const },
    { radius: 2.04, thick: 0.0015, rot: [0.5, -0.6, Math.PI / 8] as const, opacity: 0.06, color: "lightColor" as const },
    { radius: 2.16, thick: 0.0015, rot: [Math.PI / 8, 0.3, -0.5] as const, opacity: 0.05, color: "coreColor" as const },
    { radius: 2.28, thick: 0.0015, rot: [0.2, Math.PI / 5, 0.4] as const, opacity: 0.04, color: "plasmaColor" as const },
  ];

  const getRingColor = (key: string): number => {
    switch (key) {
      case "plasmaColor": return cfg.plasmaColor;
      case "coreColor": return cfg.coreColor;
      case "lightColor": return cfg.lightColor;
      default: return cfg.plasmaColor;
    }
  };

  return (
    <group ref={groupRef} scale={3.5}>
      {/* Lighting — soft, warm, cinematic */}
      <pointLight ref={lightRef} color={cfg.lightColor} intensity={cfg.lightIntensity} distance={24} decay={2} />
      <pointLight
        ref={rimLightRef}
        color={cfg.rimColor}
        position={[-3.5, 2, -3]}
        intensity={cfg.rimIntensity}
        distance={20}
        decay={2}
      />
      <pointLight
        ref={topLightRef}
        color={cfg.lightColor}
        position={[0, 3.5, 0]}
        intensity={cfg.lightIntensity * 0.35}
        distance={18}
        decay={2}
      />
      <ambientLight intensity={0.04} />

      {/* Outer glow — single soft sphere */}
      <Sphere ref={glowRef} args={[1.08, 32, 32]}>
        <meshBasicMaterial color={cfg.plasmaColor} transparent opacity={0.07} side={THREE.BackSide} />
      </Sphere>

      {/* Geodesic wireframe sphere — the "planet" center */}
      <GeodesicSphere />

      {/* Outer glass shell */}
      <Sphere ref={outerRef} args={[0.72, 64, 64]}>
        <meshPhongMaterial
          color={cfg.shellColor}
          emissive={cfg.shellEmissive}
          specular={cfg.specularColor}
          shininess={140}
          transparent
          opacity={0.78}
          side={THREE.FrontSide}
        />
      </Sphere>

      {/* Inner glow shell */}
      <Sphere args={[0.68, 32, 32]}>
        <meshPhongMaterial
          color={cfg.shellColor}
          emissive={cfg.innerEmissive}
          emissiveIntensity={0.25}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Inner plasma */}
      <Sphere ref={innerRef} args={[0.44, 32, 32]}>
        <meshPhongMaterial
          color={cfg.shellColor}
          emissive={cfg.innerEmissive}
          emissiveIntensity={cfg.energyIntensity * 0.35}
          transparent
          opacity={0.72}
        />
      </Sphere>

      {/* Plasma layer */}
      <Sphere ref={plasmaRef} args={[0.34, 24, 24]}>
        <meshBasicMaterial color={cfg.plasmaColor} transparent opacity={0.5} />
      </Sphere>

      {/* Core pulse */}
      <Sphere ref={coreRef} args={[0.2, 16, 16]}>
        <meshBasicMaterial color={cfg.coreColor} transparent opacity={cfg.coreOpacity} />
      </Sphere>

      {/* 12 thin orbital rings */}
      {ringConfigs.map((rc, i) => (
        <mesh
          key={i}
          ref={(el) => { if (el) ringRefs.current[i] = el; }}
          rotation={rc.rot}
        >
          <torusGeometry args={[rc.radius, rc.thick, 6, 160]} />
          <meshBasicMaterial
            color={getRingColor(rc.color)}
            transparent
            opacity={rc.opacity}
          />
        </mesh>
      ))}

      {/* Single subtle energy pulse */}
      <EnergyPulse state={state} />

      {/* Satellite particles */}
      <SatelliteParticles state={state} />

      {/* Orbiting particle cloud */}
      <OrbParticles state={state} />
    </group>
  );
}
