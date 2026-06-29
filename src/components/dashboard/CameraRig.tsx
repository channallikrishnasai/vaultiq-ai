"use client";

import { useFrame } from "@react-three/fiber";
import { MutableRefObject } from "react";

interface CameraRigProps {
  mouse: MutableRefObject<{ x: number; y: number }>;
}

export default function CameraRig({ mouse }: CameraRigProps) {
  useFrame(({ camera }) => {
    const tx = mouse.current.x * 0.22;
    const ty = mouse.current.y * 0.14;

    camera.position.x += (tx - camera.position.x) * 0.042;
    camera.position.y += (ty - camera.position.y) * 0.042;
    camera.lookAt(0, 0, 0);
  });

  return null;
}