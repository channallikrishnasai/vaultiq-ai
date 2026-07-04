"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 80;

const DUST = Array.from({ length: COUNT }, (_, i) => {
  const seed = i * 1234;
  const dist = ((seed * 17) % 1000) / 1000;
  const radius = dist < 0.4
    ? dist * 5
    : 2.5 + dist * 4;
  const angle = ((seed * 31) % 1000) / 1000 * Math.PI * 2;
  const yOff = (((seed * 47) % 1000) / 1000 - 0.5) * 7;
  return {
    x: Math.cos(angle) * radius,
    y: yOff,
    z: Math.sin(angle) * radius - 2,
    vy: (((seed * 13) % 1000) / 1000) * 0.0012 + 0.0003,
    vx: Math.sin(angle) * 0.0002,
    phase: (i * 0.618) % (Math.PI * 2),
    brightness: 0.3 + ((seed * 23) % 1000) / 1000 * 0.5,
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
      arr[i * 3] += Math.sin(t * 0.1 + DUST[i].phase) * 0.0004 + DUST[i].vx;
      arr[i * 3 + 2] += Math.cos(t * 0.08 + DUST[i].phase) * 0.0003;

      if (arr[i * 3 + 1] > 5) {
        arr[i * 3 + 1] = -4;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.12 + Math.sin(t * 0.1) * 0.04;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={0xd4a020}
        size={0.01}
        transparent
        opacity={0.12}
        sizeAttenuation
      />
    </points>
  );
}
