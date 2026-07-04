"use client";

import { useEffect, useRef } from "react";

// ─── Dashboard-wide floating gold particles ──────────────────────────────────
// Pure DOM/CSS — no Three.js dependency, covers entire viewport

const PARTICLE_COUNT = 40;

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  flickerSpeed: number;
  flickerPhase: number;
  el: HTMLDivElement | null;
}

export default function DashboardParticles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rand = seededRandom(7777);

    // Create particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const el = document.createElement("div");
      const size = 1 + rand() * 2.5;
      const opacity = 0.08 + rand() * 0.18;

      Object.assign(el.style, {
        position: "fixed",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(212,175,55,${opacity}) 0%, rgba(212,175,55,0) 70%)`,
        pointerEvents: "none",
        zIndex: "5",
        willChange: "transform",
      });

      container.appendChild(el);

      particlesRef.current.push({
        x: rand() * window.innerWidth,
        y: rand() * window.innerHeight,
        size,
        speedX: (rand() - 0.5) * 0.15,
        speedY: -0.08 - rand() * 0.12,
        opacity,
        flickerSpeed: 0.3 + rand() * 0.6,
        flickerPhase: rand() * Math.PI * 2,
        el,
      });
    }

    let time = 0;
    const animate = () => {
      time += 0.016;
      const w = window.innerWidth;
      const h = window.innerHeight;

      particlesRef.current.forEach((p) => {
        if (!p.el) return;

        p.x += p.speedX + Math.sin(time * 0.3 + p.flickerPhase) * 0.08;
        p.y += p.speedY;

        // Wrap around
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const flicker = Math.sin(time * p.flickerSpeed + p.flickerPhase) * 0.5 + 0.5;
        const currentOpacity = p.opacity * (0.4 + flicker * 0.6);

        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        p.el.style.opacity = String(currentOpacity);
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      particlesRef.current.forEach((p) => p.el?.remove());
      particlesRef.current = [];
    };
  }, []);

  return <div ref={containerRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 5 }} />;
}
