"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 180;

const DUST = Array.from({ length: COUNT }, (_, i) => {
  const seed = i * 1234;
  return {
    x: (((seed * 17) % 1000) / 1000 - 0.5) * 12,
    y: (((seed * 31) % 1000) / 1000 - 0.5) * 8,
    z: (((seed * 47) % 1000) / 1000 - 0.5) * 6 - 3,
    vy: (((seed * 13) % 1000) / 1000) * 0.004 + 0.001,
    phase: (i * 0.618) % (Math.PI * 2),
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
    const arr = meshRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] += DUST[i].vy;
      arr[i * 3] += Math.sin(t * 0.2 + DUST[i].phase) * 0.001;

      // Wrap around when drifting too far up
      if (arr[i * 3 + 1] > 5) {
        arr[i * 3 + 1] = -4;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.12 + Math.sin(t * 0.15) * 0.04;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={0xD4AF37}
        size={0.008}
        transparent
        opacity={0.14}
        sizeAttenuation
      />
    </points>
  );
}