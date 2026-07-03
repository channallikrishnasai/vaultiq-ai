"use client";

import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { OrbProvider } from "@/contexts/OrbContext";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

// Dynamically import AIChat to avoid hydration issues
const AIChat = dynamic(() => import("./AIChat"), {
  ssr: false,
});

function GlobalAIChatInner() {
  const { data: session } = useSession();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load states from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedMin = localStorage.getItem("ai-chat-minimized");
      if (savedMin) setIsMinimized(JSON.parse(savedMin));
      const savedClosed = localStorage.getItem("ai-chat-closed");
      if (savedClosed) setIsClosed(JSON.parse(savedClosed));
    } catch {}
  }, []);

  // Save states to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("ai-chat-minimized", JSON.stringify(isMinimized));
    }
  }, [isMinimized, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("ai-chat-closed", JSON.stringify(isClosed));
    }
  }, [isClosed, mounted]);

  if (!session?.user?.id || !mounted) {
    return null;
  }

  // If closed completely, show a tiny floating spark orb so the user can always restore the assistant.
  if (isClosed) {
    return (
      <motion.button
        onClick={() => setIsClosed(false)}
        whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(212,175,55,0.4)" }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #F5D060, #C8922A)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
        }}
        title="Open VaultIQ AI Assistant"
      >
        <Sparkles size={20} color="#000" />
      </motion.button>
    );
  }

  return (
    <div>
      <AIChat
        userId={session.user.id}
        isGlobal
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
        isClosed={isClosed}
        setIsClosed={setIsClosed}
      />
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
