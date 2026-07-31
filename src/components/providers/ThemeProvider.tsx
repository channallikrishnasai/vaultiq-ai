"use client";
import { useEffect } from "react";

// Simple light/dark theme toggle without injecting a <script> tag.
// It reads the stored theme from localStorage or falls back to the
// system preference, then applies the appropriate class on the <html>
// element.
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored ?? (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  return <>{children}</>;
}