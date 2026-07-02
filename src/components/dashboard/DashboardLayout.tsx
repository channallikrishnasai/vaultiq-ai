"use client";

import React from "react";
import { DashboardData, AIProfile } from "@/types/dashboard";

/**
 * DashboardLayout – premium glass‑morphic container that holds the entire dashboard UI.
 * It provides a dark gradient background, a central 3‑D orbit scene, and slots for
 * the various floating panels (HUD, news, AI chat, Learn Section, etc.).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-[#151515]">
      {/* Full‑screen background with subtle radial noise (defined in globals.css) */}
      <div className="absolute inset-0 pointer-events-none" />

      {/* Main content area – uses flex layout to centre the orbit scene */}
      <div className="relative z-10 flex min-h-screen w-screen overflow-hidden">
        {children}
      </div>
    </div>
  );
}
