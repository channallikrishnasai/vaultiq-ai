"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// All states defined in the VaultIQ AI spec
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
  const [orbState, setOrbStateRaw] = useState<OrbState>("idle");
  const [uiReady, setUiReady] = useState(false);

  const setOrbState = useCallback((state: OrbState) => {
    setOrbStateRaw(state);
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
