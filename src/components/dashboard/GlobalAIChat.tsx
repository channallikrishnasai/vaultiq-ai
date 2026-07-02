"use client";

import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { OrbProvider } from "@/contexts/OrbContext";

// Dynamically import AIChat to avoid hydration issues
const AIChat = dynamic(() => import("./AIChat"), {
  ssr: false,
});

function GlobalAIChatInner() {
  const { data: session } = useSession();
  const [isMinimized, setIsMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load minimize state from localStorage
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ai-chat-minimized");
    if (saved) {
      setIsMinimized(JSON.parse(saved));
    }
  }, []);

  // Save minimize state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("ai-chat-minimized", JSON.stringify(isMinimized));
    }
  }, [isMinimized, mounted]);

  if (!session?.user?.id || !mounted) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        width: isMinimized ? "auto" : "min(480px, 60vw)",
        zIndex: 9999,
        background: "rgba(4,4,8,0.95)",
        border: "1px solid rgba(212,175,55,0.18)",
        borderRadius: 18,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        boxShadow: "0 0 60px rgba(0,0,0,0.85), 0 0 30px rgba(212,175,55,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      <AIChat userId={session.user.id} isGlobal isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
    </div>
  );
}

export default function GlobalAIChat() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <OrbProvider>
      <GlobalAIChatInner />
    </OrbProvider>
  );
}
