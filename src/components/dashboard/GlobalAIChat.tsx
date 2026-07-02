"use client";

import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { OrbProvider } from "@/contexts/OrbContext";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

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
        // No positioning here - AIChat handles it
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
