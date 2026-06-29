"use client";

import { createContext, useContext, useRef, useEffect, ReactNode, MutableRefObject } from "react";

interface SceneContextValue {
  mouse: MutableRefObject<{ x: number; y: number }>;
}

const SceneContext = createContext<SceneContextValue>({
  mouse: { current: { x: 0, y: 0 } },
});

export function SceneProvider({ children }: { children: ReactNode }) {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handle, { passive: true });
    return () => window.removeEventListener("mousemove", handle);
  }, []);

  return (
    <SceneContext.Provider value={{ mouse }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  return useContext(SceneContext);
}