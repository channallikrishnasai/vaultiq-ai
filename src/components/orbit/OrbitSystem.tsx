"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { useOrbitStore, ORBIT_CARDS, RING_RADII, RING_SPEEDS } from "@/store/useOrbitStore";
import type { OrbitCardId, OrbitRing as OrbitRingType } from "@/store/useOrbitStore";
import type { DashboardData } from "@/types/dashboard";
import OrbitCard from "./OrbitCard";
import OrbitRing from "./OrbitRing";
import CardExpanded from "./CardExpanded";

// ─── Geometry ──────────────────────────────────────────────────────────────────

/**
 * Returns (x, y) offset in pixels from the centre for a card at a given
 * orbit angle (degrees), radius (px), and vertical tilt (perspective fake).
 *
 * The rings are drawn as circles in 2-D but we fake a mild 3-D tilt
 * (like looking at a solar system from slightly above) by scaling y.
 */
const Y_TILT = 0.42; // < 1 flattens the y-axis → perspective illusion

function cardPosition(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const x = Math.cos(rad) * radius;
  const y = Math.sin(rad) * radius * Y_TILT;
  return { x, y };
}

/**
 * Normalise angle so depth is 1 at front (sin = 1) and 0 at back (sin = -1).
 * front = bottom of the ellipse in our tilted view.
 */
function depthFromAngle(angleDeg: number): number {
  const rad = (angleDeg * Math.PI) / 180;
  return (Math.sin(rad) + 1) / 2; // 0 → back, 1 → front
}

// ─── Ring index helper ────────────────────────────────────────────────────────

const RING_ORDER: OrbitRingType[] = ["inner", "middle", "outer"];

// ─── OrbitSystem ──────────────────────────────────────────────────────────────

interface OrbitSystemProps {
  data: DashboardData;
  /** Centre point — defaults to viewport centre */
  centreX?: number;
  centreY?: number;
}

export default function OrbitSystem({ data }: OrbitSystemProps) {
  // ── Store ──────────────────────────────────────────────────────────────────
  const { activeCard, selectCard, rotate, paused, animating, badges } =
    useOrbitStore();

  // ── Local rotation state (high-frequency, separate from store) ────────────
  // We maintain per-ring angle offsets here so we don't cause 60fps re-renders
  // across the whole app tree. Only OrbitSystem re-renders on each tick.
  const rafRef = useRef<number>(0);
  // Simpler angle calculation — avoid store globalDelta complexity.
  // We track ring angles purely locally here:
  const ringAnglesRef = useRef<Record<OrbitRingType, number>>({
    inner: 0,
    middle: 120,
    outer: 240,
  });
  const [renderAngles, setRenderAngles] = useState<Record<OrbitRingType, number>>({
    inner: 0,
    middle: 120,
    outer: 240,
  });

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    let lastTime = 0;

    const tick = (now: number) => {
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
      lastTime = now;

      if (!paused && dt > 0) {
        ringAnglesRef.current.inner += RING_SPEEDS.inner * dt;
        ringAnglesRef.current.middle -= RING_SPEEDS.middle * dt;
        ringAnglesRef.current.outer += RING_SPEEDS.outer * dt;
        setRenderAngles({ ...ringAnglesRef.current });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused]);

  // ── Drag handling ──────────────────────────────────────────────────────────
  const dragStartX = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (animating || activeCard) return;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    isDragging.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [animating, activeCard]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartX.current === null) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current!;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDragging.current = true;
    if (!isDragging.current) return;

    // Horizontal drag → rotation
    const delta = dx * 0.25;
    ringAnglesRef.current.inner += delta;
    ringAnglesRef.current.middle -= delta;
    ringAnglesRef.current.outer += delta;
    rotate(delta);
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    setRenderAngles({ ...ringAnglesRef.current });
  }, [rotate]);

  const onPointerUp = useCallback(() => {
    dragStartX.current = null;
    isDragging.current = false;
  }, []);

  // ── Scroll / wheel handling ────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (animating || activeCard) return;
    e.preventDefault();
    const delta = e.deltaY * 0.08;
    ringAnglesRef.current.inner += delta;
    ringAnglesRef.current.middle -= delta;
    ringAnglesRef.current.outer += delta;
    rotate(delta);
    setRenderAngles({ ...ringAnglesRef.current });
  }, [animating, activeCard, rotate]);

  // ── Keyboard handling ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (animating || activeCard) return;
      let delta = 0;
      if (e.key === "ArrowLeft") delta = -8;
      if (e.key === "ArrowRight") delta = 8;
      if (delta === 0) return;
      e.preventDefault();
      ringAnglesRef.current.inner += delta;
      ringAnglesRef.current.middle -= delta;
      ringAnglesRef.current.outer += delta;
      rotate(delta);
      setRenderAngles({ ...ringAnglesRef.current });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [animating, activeCard, rotate]);

  // ── Card click ─────────────────────────────────────────────────────────────
  const handleCardClick = useCallback(
    (id: OrbitCardId) => {
      if (animating) return;
      selectCard(id);
    },
    [animating, selectCard],
  );

  // ── Expand size ───────────────────────────────────────────────────────────
  // The outer ring extends to 490px radius. Our container must be at least
  // 2 * (490 + 60) px square so cards don't clip.
  const containerSize = (RING_RADII.outer + 80) * 2;

  // ── Find the expanded card definition ─────────────────────────────────────
  const expandedCardDef = activeCard
    ? ORBIT_CARDS.find((c) => c.id === activeCard) ?? null
    : null;

  return (
    <>
      {/* ── Orbit stage ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: containerSize,
          height: containerSize,
          transform: "translate(-50%, -50%)",
          cursor: activeCard ? "default" : isDragging.current ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        {/* ── Orbit rings ───────────────────────────────────────────────── */}
        {RING_ORDER.map((ring, i) => (
          <OrbitRing
            key={ring}
            ring={ring}
            radius={RING_RADII[ring]}
            index={i}
            dimmed={!!activeCard}
          />
        ))}

        {/* ── Cards ─────────────────────────────────────────────────────── */}
        {ORBIT_CARDS.map((cardDef) => {
          const ringAngle = renderAngles[cardDef.ring] ?? 0;
          const baseAngle = (360 / cardDef.ringSize) * cardDef.indexInRing;
          const totalAngle = baseAngle + ringAngle;
          const radius = RING_RADII[cardDef.ring];
          const { x, y } = cardPosition(totalAngle, radius);
          const depth = depthFromAngle(totalAngle);
          const badge = badges[cardDef.id];

          return (
            <OrbitCard
              key={cardDef.id}
              id={cardDef.id}
              label={cardDef.label}
              icon={cardDef.icon}
              accentColor={cardDef.accentColor}
              x={x}
              y={y}
              depth={depth}
              badge={badge}
              onClick={handleCardClick}
              dimmed={!!activeCard && activeCard !== cardDef.id}
            />
          );
        })}
      </div>

      {/* ── Expanded panel ────────────────────────────────────────────── */}
      {expandedCardDef && (
        <CardExpanded card={expandedCardDef} data={data} />
      )}

      {/* ── Keyboard hint ─────────────────────────────────────────────── */}
      {!activeCard && (
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            pointerEvents: "none",
            zIndex: 20,
          }}
        >
          <KeyHint label="←  →" />
          <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>or</span>
          <KeyHint label="scroll" />
          <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>or</span>
          <KeyHint label="drag" />
          <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10 }}>to rotate</span>
        </div>
      )}
    </>
  );
}

// ── Small keyboard hint pill ───────────────────────────────────────────────────

function KeyHint({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "3px 8px",
        borderRadius: 6,
        border: "1px solid rgba(212,175,55,0.18)",
        background: "rgba(0,0,0,0.5)",
        fontSize: 10,
        fontFamily: "ui-monospace, monospace",
        color: "rgba(212,175,55,0.5)",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </div>
  );
}