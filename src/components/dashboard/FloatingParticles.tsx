"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 40;

const DUST = Array.from({ length: COUNT }, (_, i) => {
  const seed = i * 1234;
  const dist = ((seed * 17) % 1000) / 1000;
  const radius = dist < 0.35
    ? dist * 5.5
    : 2.8 + dist * 3.5;
  const angle = ((seed * 31) % 1000) / 1000 * Math.PI * 2;
  const yOff = (((seed * 47) % 1000) / 1000 - 0.5) * 8;
  return {
    x: Math.cos(angle) * radius,
    y: yOff,
    z: Math.sin(angle) * radius - 2.5,
    vy: (((seed * 13) % 1000) / 1000) * 0.0008 + 0.0002,
    vx: Math.sin(angle) * 0.00015,
    phase: (i * 0.618) % (Math.PI * 2),
    brightness: 0.25 + ((seed * 23) % 1000) / 1000 * 0.4,
  };
});

export default function FloatingParticles() {
  const meshRef = useRef<THREE.Points>(null);

  const positionArray = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    DUST.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const arr = meshRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += DUST[i].vy;
      arr[i * 3] += Math.sin(t * 0.08 + DUST[i].phase) * 0.0003 + DUST[i].vx;
      arr[i * 3 + 2] += Math.cos(t * 0.06 + DUST[i].phase) * 0.0002;

      if (arr[i * 3 + 1] > 6) {
        arr[i * 3 + 1] = -5;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.1 + Math.sin(t * 0.08) * 0.03;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={0xd4a020}
        size={0.008}
        transparent
        opacity={0.1}
        sizeAttenuation
      />
    </points>
  );
}
