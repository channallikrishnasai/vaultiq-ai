// src/store/useOrbitStore.ts
import { create } from "zustand";

// ─── Card & ring types ────────────────────────────────────────────────────────

export type OrbitCardId =
  | "health"
  | "portfolio"
  | "networth"
  | "goals"
  | "expenses"
  | "savings"
  | "fraud"
  | "twin"
  | "actions"
  | "level";

export type OrbitRing = "inner" | "middle" | "outer";

export interface OrbitCardDef {
  id: OrbitCardId;
  label: string;
  ring: OrbitRing;
  indexInRing: number;
  ringSize: number;
  accentColor: string;
  icon: string;
}

// ─── Ring geometry — single source of truth ───────────────────────────────────

export const RING_RADII: Record<OrbitRing, number> = {
  inner:  220,
  middle: 360,
  outer:  490,
};

export const RING_SPEEDS: Record<OrbitRing, number> = {
  inner:  0.8,   // degrees per second — fastest
  middle: 0.5,
  outer:  0.32,  // slowest
};

// ─── Card definitions — the ONLY place cards are declared ─────────────────────
// To add a new module: add one object here. Nothing else changes.

export const ORBIT_CARDS: OrbitCardDef[] = [
  // Inner ring
  { id: "health",    label: "Health",       ring: "inner",  indexInRing: 0, ringSize: 3, accentColor: "#34d399", icon: "Heart"    },
  { id: "portfolio", label: "Portfolio",    ring: "inner",  indexInRing: 1, ringSize: 3, accentColor: "#D4AF37", icon: "Compass"  },
  { id: "networth",  label: "Net Worth",    ring: "inner",  indexInRing: 2, ringSize: 3, accentColor: "#60a5fa", icon: "Wallet"   },

  // Middle ring
  { id: "goals",     label: "Goals",        ring: "middle", indexInRing: 0, ringSize: 3, accentColor: "#a78bfa", icon: "Target"   },
  { id: "expenses",  label: "Expenses",     ring: "middle", indexInRing: 1, ringSize: 3, accentColor: "#f87171", icon: "Receipt"  },
  { id: "savings",   label: "Savings",      ring: "middle", indexInRing: 2, ringSize: 3, accentColor: "#2dd4bf", icon: "PiggyBank"},

  // Outer ring
  { id: "fraud",     label: "Fraud Shield", ring: "outer",  indexInRing: 0, ringSize: 4, accentColor: "#fb923c", icon: "Shield"   },
  { id: "twin",      label: "AI Twin",      ring: "outer",  indexInRing: 1, ringSize: 4, accentColor: "#e879f9", icon: "Bot"      },
  { id: "actions",   label: "Actions",      ring: "outer",  indexInRing: 2, ringSize: 4, accentColor: "#38bdf8", icon: "Zap"      },
  { id: "level",     label: "Level",        ring: "outer",  indexInRing: 3, ringSize: 4, accentColor: "#facc15", icon: "Star"     },
];

// ─── Store state ──────────────────────────────────────────────────────────────

interface OrbitState {
  /** Currently expanded card. null = orbit is free-spinning */
  activeCard: OrbitCardId | null;

  /**
   * Global rotation offset in degrees.
   * Updated imperatively at 60 FPS — do not subscribe to this in render.
   * Read it via useOrbitStore.getState().rotationDeg inside animation loops.
   */
  rotationDeg: number;

  /** Orbit auto-rotation is paused while a card is expanded */
  paused: boolean;

  /**
   * True while a card is mid-flight (entering or leaving expanded state).
   * Use this to prevent interaction during transitions.
   */
  animating: boolean;

  /**
   * Notification badge counts per card.
   * Future: AI can set these to draw attention to specific cards.
   */
  badges: Partial<Record<OrbitCardId, number>>;
}

// ─── Store actions ────────────────────────────────────────────────────────────

interface OrbitActions {
  /** User or AI selects a card — triggers expand animation */
  selectCard: (id: OrbitCardId) => void;

  /** Dismiss the active card — returns it to orbit */
  dismissCard: () => void;

  /**
   * Rotate the orbit by delta degrees.
   * Called from scroll handler, drag, touch, and keyboard.
   * No-op while paused.
   */
  rotate: (delta: number) => void;

  /**
   * AI-triggered card activation.
   * Identical behaviour to selectCard but semantically distinct
   * so future analytics / voice UI can distinguish the source.
   */
  activateByAI: (id: OrbitCardId) => void;

  /** Lock/unlock interaction during flight animations */
  setAnimating: (animating: boolean) => void;

  /** Set a notification badge count on a card (0 clears it) */
  setBadge: (id: OrbitCardId, count: number) => void;
}

// ─── Zustand store ────────────────────────────────────────────────────────────

type OrbitStore = OrbitState & OrbitActions;

export const useOrbitStore = create<OrbitStore>((set, get) => ({
  // Initial state
  activeCard: null,
  rotationDeg: 0,
  paused: false,
  animating: false,
  badges: {},

  // Actions
  selectCard: (id) => {
    if (get().animating) return; // block during flight
    set({ activeCard: id, paused: true, animating: true });
  },

  dismissCard: () => {
    if (get().animating) return;
    set({ animating: true });
    // animating → false is set by CardExpanded after exit animation completes
  },

  rotate: (delta) => {
    if (get().paused) return;
    // Direct mutation via setState — no re-render triggered in animation loops
    // because components that need rotation read via getState(), not subscribe
    set((s) => ({ rotationDeg: s.rotationDeg + delta }));
  },

  activateByAI: (id) => {
    if (get().animating) return;
    set({ activeCard: id, paused: true, animating: true });
  },

  setAnimating: (animating) => {
    if (!animating) {
      // When animation ends: if dismissing, also clear activeCard
      const { activeCard } = get();
      if (activeCard === null) {
        // We were dismissing — fully reset
        set({ animating: false, paused: false });
      } else {
        // We were entering — card is now expanded
        set({ animating: false });
      }
    } else {
      set({ animating: true });
    }
  },

  setBadge: (id, count) => {
    set((s) => ({
      badges: count === 0
        ? (() => {
            const next = { ...s.badges };
            delete next[id];
            return next;
          })()
        : { ...s.badges, [id]: count },
    }));
  },
}));