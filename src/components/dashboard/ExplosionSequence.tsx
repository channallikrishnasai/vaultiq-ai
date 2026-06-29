"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 200;

const EXPLOSION_DATA = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const theta = (i / PARTICLE_COUNT) * Math.PI * 2;
  const phi = Math.acos(1 - 2 * (i / PARTICLE_COUNT));
  const speed = 3 + ((i * 3571) % 100) / 20;
  return {
    vx: Math.sin(phi) * Math.cos(theta) * speed,
    vy: Math.cos(phi) * speed,
    vz: Math.sin(phi) * Math.sin(theta) * speed,
    tx: Math.sin(phi) * Math.cos(theta) * (0.5 + ((i * 7919) % 100) / 200),
    ty: Math.cos(phi) * (0.5 + ((i * 7919) % 100) / 200),
    tz: Math.sin(phi) * Math.sin(theta) * (0.5 + ((i * 7919) % 100) / 200),
  };
});

export default function ExplosionSequence({ onDone }: { onDone: () => void }) {
  const meshRef = useRef<THREE.Points>(null);
  const startTime = useRef<number | null>(null);
  // Guard must be set BEFORE calling onDone to prevent double-fire
  const done = useRef(false);

  const positionArray = useMemo(
    () => new Float32Array(PARTICLE_COUNT * 3),
    []
  );

  useFrame(({ clock }) => {
    // Early exit — never run again after done
    if (done.current || !meshRef.current) return;

    if (!startTime.current) startTime.current = clock.getElapsedTime();
    const et = clock.getElapsedTime() - startTime.current;
    const DURATION = 1.4;

    const arr = meshRef.current.geometry.attributes.position.array as Float32Array;

    EXPLOSION_DATA.forEach((p, i) => {
      if (et < 0.2) {
        // Initial burst outward
        const t = et / 0.2;
        arr[i * 3] = p.vx * t * 0.12;
        arr[i * 3 + 1] = p.vy * t * 0.12;
        arr[i * 3 + 2] = p.vz * t * 0.12;
      } else {
        // Implode toward final orb position (cubic easeInOut)
        const rawT = Math.min(1, (et - 0.2) / (DURATION - 0.2));
        const eased =
          rawT < 0.5
            ? 4 * rawT * rawT * rawT
            : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        const startX = p.vx * 0.12;
        const startY = p.vy * 0.12;
        const startZ = p.vz * 0.12;

        arr[i * 3] = startX + (p.tx - startX) * eased;
        arr[i * 3 + 1] = startY + (p.ty - startY) * eased;
        arr[i * 3 + 2] = startZ + (p.tz - startZ) * eased;
      }
    });

    meshRef.current.geometry.attributes.position.needsUpdate = true;

    const mat = meshRef.current.material as THREE.PointsMaterial;
    if (et < 0.2) {
      mat.opacity = et / 0.2;
      mat.size = 0.055;
    } else {
      const fadeProgress = (et - 0.2) / (DURATION - 0.2);
      mat.size = 0.055 - fadeProgress * 0.035;
      mat.opacity = 1;
    }

    if (et > DURATION) {
      // Set done FIRST — prevents any subsequent frame from re-entering
      done.current = true;
      onDone();
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={0xf5d060}
        size={0.055}
        transparent
        opacity={0}
        sizeAttenuation
      />
    </points>
  );
}
