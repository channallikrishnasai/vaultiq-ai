"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import { OrbState } from "@/contexts/OrbContext";

// ─── Static particle data (deterministic, no Math.random at render time) ─────

const PARTICLE_DATA = Array.from({ length: 300 }, (_, i) => {
  const theta = (i / 300) * Math.PI * 2;
  const phi = Math.acos(1 - 2 * (i / 300));
  const r = 0.5 + ((i * 7919) % 100) / 200;
  return {
    x: Math.sin(phi) * Math.cos(theta) * r,
    y: Math.cos(phi) * r,
    z: Math.sin(phi) * Math.sin(theta) * r,
  };
});

const SATELLITE_DATA = Array.from({ length: 8 }, (_, i) => ({
  angle: (i / 8) * Math.PI * 2,
  radius: 1.4 + (i % 3) * 0.15,
  speed: 0.3 + (i % 4) * 0.08,
  size: 0.018 + (i % 3) * 0.008,
  yOffset: Math.sin((i / 8) * Math.PI * 2) * 0.3,
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
    pulseSpeed: 0.8,
    energyIntensity: 0.35,
    rotSpeed: 0.004,
    particleSpeedMult: 1,
    particleSize: 0.016,
    lightColor: 0xd4af37,
    lightIntensity: 2.5,
    lightPulseAmp: 0.5,
    outerPulseAmp: 0.008,
    coreOpacity: 0.75,
    coreScaleAmp: 0.08,
    ringMult: 1,
    breatheAmp: 0.015,
    breatheSpeed: 0.5,
    shellColor: 0x07070c,
    shellEmissive: 0x120800,
    specularColor: 0xd4af37,
    innerEmissive: 0xd4af37,
    plasmaColor: 0xe8a820,
    coreColor: 0xfae070,
    rimColor: 0x2255aa,
    rimIntensity: 0.8,
  },
  thinking: {
    pulseSpeed: 3.5,
    energyIntensity: 0.85,
    rotSpeed: 0.009,
    particleSpeedMult: 1.8,
    particleSize: 0.022,
    lightColor: 0xd4af37,
    lightIntensity: 3.2,
    lightPulseAmp: 1.5,
    outerPulseAmp: 0.012,
    coreOpacity: 0.9,
    coreScaleAmp: 0.18,
    ringMult: 2.8,
    breatheAmp: 0.025,
    breatheSpeed: 2.0,
    shellColor: 0x0a0602,
    shellEmissive: 0x1a0c00,
    specularColor: 0xf5d060,
    innerEmissive: 0xd4af37,
    plasmaColor: 0xf0b820,
    coreColor: 0xffe090,
    rimColor: 0x2255aa,
    rimIntensity: 1.2,
  },
  speaking: {
    pulseSpeed: 5.0,
    energyIntensity: 1.0,
    rotSpeed: 0.012,
    particleSpeedMult: 2.2,
    particleSize: 0.024,
    lightColor: 0xd4af37,
    lightIntensity: 4.0,
    lightPulseAmp: 2.0,
    outerPulseAmp: 0.018,
    coreOpacity: 1.0,
    coreScaleAmp: 0.22,
    ringMult: 3.5,
    breatheAmp: 0.03,
    breatheSpeed: 3.0,
    shellColor: 0x080602,
    shellEmissive: 0x200e00,
    specularColor: 0xffd060,
    innerEmissive: 0xe8c030,
    plasmaColor: 0xffc820,
    coreColor: 0xfff0a0,
    rimColor: 0x4488cc,
    rimIntensity: 1.6,
  },
  listening: {
    pulseSpeed: 2.2,
    energyIntensity: 0.6,
    rotSpeed: 0.006,
    particleSpeedMult: 1.4,
    particleSize: 0.018,
    lightColor: 0x4488ff,
    lightIntensity: 3.0,
    lightPulseAmp: 0.8,
    outerPulseAmp: 0.01,
    coreOpacity: 0.85,
    coreScaleAmp: 0.12,
    ringMult: 1.8,
    breatheAmp: 0.018,
    breatheSpeed: 1.2,
    shellColor: 0x030820,
    shellEmissive: 0x001133,
    specularColor: 0x4488ff,
    innerEmissive: 0x0044aa,
    plasmaColor: 0x2266cc,
    coreColor: 0x66aaff,
    rimColor: 0x0066ff,
    rimIntensity: 1.4,
  },
  processing: {
    pulseSpeed: 6.0,
    energyIntensity: 0.95,
    rotSpeed: 0.016,
    particleSpeedMult: 3.0,
    particleSize: 0.026,
    lightColor: 0x8844ff,
    lightIntensity: 3.8,
    lightPulseAmp: 2.2,
    outerPulseAmp: 0.022,
    coreOpacity: 0.95,
    coreScaleAmp: 0.25,
    ringMult: 4.5,
    breatheAmp: 0.035,
    breatheSpeed: 4.0,
    shellColor: 0x060018,
    shellEmissive: 0x110022,
    specularColor: 0xaa66ff,
    innerEmissive: 0x6622cc,
    plasmaColor: 0x9944ee,
    coreColor: 0xcc88ff,
    rimColor: 0x6644aa,
    rimIntensity: 2.0,
  },
  celebrating: {
    pulseSpeed: 4.0,
    energyIntensity: 1.0,
    rotSpeed: 0.018,
    particleSpeedMult: 4.0,
    particleSize: 0.028,
    lightColor: 0x44ff88,
    lightIntensity: 4.5,
    lightPulseAmp: 2.5,
    outerPulseAmp: 0.03,
    coreOpacity: 1.0,
    coreScaleAmp: 0.3,
    ringMult: 5.0,
    breatheAmp: 0.04,
    breatheSpeed: 5.0,
    shellColor: 0x001808,
    shellEmissive: 0x002210,
    specularColor: 0x44ff88,
    innerEmissive: 0x22cc66,
    plasmaColor: 0x33ee77,
    coreColor: 0xaaffcc,
    rimColor: 0x00cc44,
    rimIntensity: 2.4,
  },
  sleeping: {
    pulseSpeed: 0.3,
    energyIntensity: 0.08,
    rotSpeed: 0.001,
    particleSpeedMult: 0.2,
    particleSize: 0.008,
    lightColor: 0x334466,
    lightIntensity: 0.6,
    lightPulseAmp: 0.1,
    outerPulseAmp: 0.003,
    coreOpacity: 0.3,
    coreScaleAmp: 0.03,
    ringMult: 0.2,
    breatheAmp: 0.005,
    breatheSpeed: 0.2,
    shellColor: 0x020204,
    shellEmissive: 0x020408,
    specularColor: 0x334466,
    innerEmissive: 0x112233,
    plasmaColor: 0x223344,
    coreColor: 0x445566,
    rimColor: 0x112244,
    rimIntensity: 0.2,
  },
  error: {
    pulseSpeed: 8.0,
    energyIntensity: 0.7,
    rotSpeed: 0.005,
    particleSpeedMult: 0.5,
    particleSize: 0.014,
    lightColor: 0xff2222,
    lightIntensity: 3.0,
    lightPulseAmp: 3.0,
    outerPulseAmp: 0.025,
    coreOpacity: 0.8,
    coreScaleAmp: 0.15,
    ringMult: 0.8,
    breatheAmp: 0.02,
    breatheSpeed: 7.0,
    shellColor: 0x120202,
    shellEmissive: 0x220000,
    specularColor: 0xff4444,
    innerEmissive: 0xcc0000,
    plasmaColor: 0xee2222,
    coreColor: 0xff6666,
    rimColor: 0x880000,
    rimIntensity: 1.8,
  },
};

// ─── Satellite particles orbiting the orb ────────────────────────────────────

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
      mesh.position.y = s.yOffset + Math.sin(t * 0.5 + i) * 0.05;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * 2 + i) * 0.2;
      mat.color.setHex(cfg.plasmaColor);
    });
  });

  return (
    <group>
      {SATELLITE_DATA.map((s, i) => (
        <mesh key={i} ref={(el) => { if (el) meshRefs.current[i] = el; }}>
          <sphereGeometry args={[s.size, 6, 6]} />
          <meshBasicMaterial color={0xd4af37} transparent opacity={0.5} />
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
    const arr = new Float32Array(PARTICLE_DATA.length * 3);
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
        x: (((i * 1234) % 1000) / 1000 - 0.5) * 0.003,
        y: (((i * 5678) % 1000) / 1000 - 0.5) * 0.003,
        z: (((i * 9012) % 1000) / 1000 - 0.5) * 0.003,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const arr = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < PARTICLE_DATA.length; i++) {
      arr[i * 3] += velocities[i].x * cfg.particleSpeedMult;
      arr[i * 3 + 1] += velocities[i].y * cfg.particleSpeedMult;
      arr[i * 3 + 2] += velocities[i].z * cfg.particleSpeedMult;
      const d = Math.sqrt(arr[i * 3] ** 2 + arr[i * 3 + 1] ** 2 + arr[i * 3 + 2] ** 2);
      if (d > 1.35 || d < 0.48) {
        velocities[i].x *= -1;
        velocities[i].y *= -1;
        velocities[i].z *= -1;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.45 + Math.sin(t * 0.7) * 0.2;
    mat.size = cfg.particleSize;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
      </bufferGeometry>
      <pointsMaterial color={0xf5d060} size={0.016} transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

// ─── Main Glass Orb ───────────────────────────────────────────────────────────

export default function AICore({ state }: { state: OrbState }) {
  const groupRef = useRef<THREE.Group>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const plasmaRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cfg = STATE_CONFIG[state];

    // Group breathe
    if (groupRef.current) {
      groupRef.current.rotation.y += cfg.rotSpeed;
      const breathe = Math.sin(t * cfg.breatheSpeed) * cfg.breatheAmp;
      groupRef.current.position.y = breathe;
    }

    // Outer shell pulse
    if (outerRef.current) {
      const scale = 1 + Math.sin(t * cfg.pulseSpeed * 0.5) * cfg.outerPulseAmp;
      outerRef.current.scale.setScalar(scale);
      const mat = outerRef.current.material as THREE.MeshPhongMaterial;
      mat.color.setHex(cfg.shellColor);
      mat.emissive.setHex(cfg.shellEmissive);
      mat.specular.setHex(cfg.specularColor);
    }

    // Inner plasma energy
    if (innerRef.current) {
      const mat = innerRef.current.material as THREE.MeshPhongMaterial;
      mat.emissiveIntensity = cfg.energyIntensity * (0.8 + Math.sin(t * cfg.pulseSpeed) * 0.2);
      mat.emissive.setHex(cfg.innerEmissive);
      innerRef.current.rotation.y -= cfg.rotSpeed * 1.5;
      innerRef.current.rotation.x += cfg.rotSpeed * 0.7;
    }

    // Plasma layer
    if (plasmaRef.current) {
      const mat = plasmaRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55 + Math.sin(t * cfg.pulseSpeed * 1.2) * 0.15;
      mat.color.setHex(cfg.plasmaColor);
      plasmaRef.current.rotation.y += cfg.rotSpeed * 2;
      plasmaRef.current.rotation.z -= cfg.rotSpeed * 0.8;
    }

    // Core pulse
    if (coreRef.current) {
      const s = 1 + Math.sin(t * cfg.pulseSpeed * 1.8) * cfg.coreScaleAmp;
      coreRef.current.scale.setScalar(s);
      const mat = coreRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = cfg.coreOpacity;
      mat.color.setHex(cfg.coreColor);
    }

    // Primary light
    if (lightRef.current) {
      lightRef.current.intensity =
        cfg.lightIntensity + Math.sin(t * cfg.pulseSpeed) * cfg.lightPulseAmp;
      lightRef.current.color.setHex(cfg.lightColor);
    }

    // Rim light
    if (rimLightRef.current) {
      rimLightRef.current.intensity = cfg.rimIntensity + Math.sin(t * 0.4) * 0.3;
      rimLightRef.current.color.setHex(cfg.rimColor);
    }

    // Rings
    if (ring1Ref.current) ring1Ref.current.rotation.z += 0.003 * cfg.ringMult;
    if (ring2Ref.current) ring2Ref.current.rotation.x += 0.002 * cfg.ringMult;
    if (ring3Ref.current) ring3Ref.current.rotation.y += 0.0015 * cfg.ringMult;
  });

  const cfg = STATE_CONFIG[state];

  return (
    <group ref={groupRef}>
      {/* Lights */}
      <pointLight ref={lightRef} color={cfg.lightColor} intensity={cfg.lightIntensity} distance={10} decay={2} />
      <pointLight
        ref={rimLightRef}
        color={cfg.rimColor}
        position={[-3, 1, -2]}
        intensity={cfg.rimIntensity}
        distance={12}
        decay={2}
      />
      <ambientLight intensity={0.06} />

      {/* Outer glass shell */}
      <Sphere ref={outerRef} args={[0.72, 64, 64]}>
        <meshPhongMaterial
          color={cfg.shellColor}
          emissive={cfg.shellEmissive}
          specular={cfg.specularColor}
          shininess={140}
          transparent
          opacity={0.82}
          side={THREE.FrontSide}
        />
      </Sphere>

      {/* Fresnel / inner glow shell */}
      <Sphere args={[0.68, 32, 32]}>
        <meshPhongMaterial
          color={cfg.shellColor}
          emissive={cfg.innerEmissive}
          emissiveIntensity={0.25}
          transparent
          opacity={0.35}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Inner plasma */}
      <Sphere ref={innerRef} args={[0.44, 32, 32]}>
        <meshPhongMaterial
          color={cfg.shellColor}
          emissive={cfg.innerEmissive}
          emissiveIntensity={cfg.energyIntensity * 0.4}
          transparent
          opacity={0.78}
        />
      </Sphere>

      {/* Plasma layer */}
      <Sphere ref={plasmaRef} args={[0.34, 24, 24]}>
        <meshBasicMaterial color={cfg.plasmaColor} transparent opacity={0.6} />
      </Sphere>

      {/* Core pulse */}
      <Sphere ref={coreRef} args={[0.18, 16, 16]}>
        <meshBasicMaterial color={cfg.coreColor} transparent opacity={cfg.coreOpacity} />
      </Sphere>

      {/* Orbital rings */}
      <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.92, 0.005, 6, 96]} />
        <meshBasicMaterial color={cfg.plasmaColor} transparent opacity={0.28} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[1.08, 0.003, 6, 96]} />
        <meshBasicMaterial color={cfg.coreColor} transparent opacity={0.2} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[1.24, 0.0025, 6, 96]} />
        <meshBasicMaterial color={cfg.lightColor} transparent opacity={0.15} />
      </mesh>

      {/* Satellite particles */}
      <SatelliteParticles state={state} />

      {/* Orbiting particle cloud */}
      <OrbParticles state={state} />
    </group>
  );
}
