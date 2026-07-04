"use client";

// Global orb state singleton — shared between dashboard 3D globe and AI chat
type OrbState = "idle" | "thinking" | "speaking" | "listening" | "processing" | "celebrating" | "sleeping" | "error";

type Listener = (state: OrbState) => void;

let currentState: OrbState = "idle";
const listeners = new Set<Listener>();

export const globalOrb = {
  getState: () => currentState,

  setState(state: OrbState) {
    currentState = state;
    listeners.forEach((fn) => fn(state));
  },

  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};
