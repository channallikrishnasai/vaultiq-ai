"use client";

import { useEffect, useRef } from "react";

// ─── Dashboard-wide rotating light rays from orb center ──────────────────────
// CSS-based — radial lines emanating from the orb, rotating slowly

const RAY_COUNT = 12;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export default function LightRays() {
  const containerRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rand = seededRandom(5555);

    // Create ray elements
    for (let i = 0; i < RAY_COUNT; i++) {
      const el = document.createElement("div");
      const angle = (i / RAY_COUNT) * 360;
      const length = 30 + rand() * 40; // vh
      const width = 0.8 + rand() * 1.5; // px
      const opacity = 0.02 + rand() * 0.04;

      Object.assign(el.style, {
        position: "fixed",
        left: "50%",
        top: "46%",
        width: `${width}px`,
        height: `${length}vh`,
        transformOrigin: "top center",
        transform: `translateX(-50%) rotate(${angle}deg)`,
        background: `linear-gradient(to bottom, rgba(212,175,55,${opacity * 2}) 0%, rgba(212,175,55,${opacity}) 30%, rgba(212,175,55,0) 100%)`,
        pointerEvents: "none",
        zIndex: "2",
        willChange: "transform",
        filter: "blur(1px)",
      });

      container.appendChild(el);
      raysRef.current.push(el);
    }

    let time = 0;
    const animate = () => {
      time += 0.016;
      const baseRotation = time * 2; // degrees per second

      raysRef.current.forEach((el, i) => {
        const angle = (i / RAY_COUNT) * 360 + baseRotation;
        const breathe = Math.sin(time * 0.4 + i * 0.5) * 0.5 + 0.5;
        const opacity = 0.6 + breathe * 0.4;
        el.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        el.style.opacity = String(opacity);
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      raysRef.current.forEach((el) => el.remove());
      raysRef.current = [];
    };
  }, []);

  return <div ref={containerRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 2 }} />;
}
