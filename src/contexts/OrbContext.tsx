"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { globalOrb } from "@/lib/global-orb";
import type { ThinkingStage } from "@/lib/thinking-stages";

export type OrbState =
  | "idle"
  | "thinking"
  | "speaking"
  | "listening"
  | "processing"
  | "celebrating"
  | "sleeping"
  | "error";

interface OrbContextValue {
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;
  uiReady: boolean;
  setUiReady: (ready: boolean) => void;
  thinkingStage: ThinkingStage;
  setThinkingStage: (stage: ThinkingStage) => void;
}

const OrbContext = createContext<OrbContextValue>({
  orbState: "idle",
  setOrbState: () => {},
  uiReady: false,
  setUiReady: () => {},
  thinkingStage: "idle",
  setThinkingStage: () => {},
});

export function OrbProvider({ children }: { children: ReactNode }) {
  const [orbState, setOrbStateRaw] = useState<OrbState>(globalOrb.getState());
  const [uiReady, setUiReady] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<ThinkingStage>("idle");

  useEffect(() => {
    return globalOrb.subscribe((state) => {
      setOrbStateRaw(state);
    });
  }, []);

  const setOrbState = useCallback((state: OrbState) => {
    setOrbStateRaw(state);
    globalOrb.setState(state);
  }, []);

  return (
    <OrbContext.Provider value={{ orbState, setOrbState, uiReady, setUiReady, thinkingStage, setThinkingStage }}>
      {children}
    </OrbContext.Provider>
  );
}

export function useOrb() {
  return useContext(OrbContext);
}
