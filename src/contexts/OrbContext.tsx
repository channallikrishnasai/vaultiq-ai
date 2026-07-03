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
}

const OrbContext = createContext<OrbContextValue>({
  orbState: "idle",
  setOrbState: () => {},
  uiReady: false,
  setUiReady: () => {},
});

export function OrbProvider({ children }: { children: ReactNode }) {
  const [orbState, setOrbStateRaw] = useState<OrbState>(globalOrb.getState());
  const [uiReady, setUiReady] = useState(false);

  // Sync with global orb state
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
    <OrbContext.Provider value={{ orbState, setOrbState, uiReady, setUiReady }}>
      {children}
    </OrbContext.Provider>
  );
}

export function useOrb() {
  return useContext(OrbContext);
}
