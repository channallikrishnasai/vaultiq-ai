"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  TrendingUp,
  PiggyBank,
  Receipt,
  GraduationCap,
  ShieldCheck,
  Landmark,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
} from "lucide-react";
import { useOrb } from "@/contexts/OrbContext";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  streamed?: boolean;
}

const PROMPTS = [
  { icon: Landmark, label: "Prepay home loan?" },
  { icon: TrendingUp, label: "Portfolio check" },
  { icon: PiggyBank, label: "Goal planner" },
  { icon: Receipt, label: "Reduce taxes" },
  { icon: GraduationCap, label: "Education planning" },
  { icon: ShieldCheck, label: "Health score" },
];

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  const heights = [4, 8, 14, 14, 8, 4, 10, 16, 16, 10, 6, 12];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          style={{
            width: 2,
            height: h,
            borderRadius: 2,
            background: active
              ? "linear-gradient(to top, rgba(212,175,55,0.3), rgba(212,175,55,0.8))"
              : "rgba(212,175,55,0.3)",
          }}
          animate={active ? { scaleY: [0.2, 1, 0.2] } : { scaleY: 0.2 }}
          transition={{
            duration: 0.65,
            repeat: active ? Infinity : 0,
            delay: i * 0.06,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {text
        .split("\n")
        .filter(Boolean)
        .map((line, i) => {
          if (line.startsWith("### "))
            return (
              <p
                key={i}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(251,191,36,0.88)",
                  marginTop: 6,
                }}
              >
                {renderInline(line.slice(4))}
              </p>
            );
          if (/^[-*]\s/.test(line))
            return (
              <p key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", paddingLeft: 10 }}>
                <span style={{ color: "rgba(212,175,55,0.45)", marginRight: 5 }}>·</span>
                {renderInline(line.slice(2))}
              </p>
            );
          return (
            <p key={i} style={{ fontSize: 12, lineHeight: 1.7, color: "rgba(255,255,255,0.42)" }}>
              {renderInline(line)}
            </p>
          );
        })}
    </div>
  );
}

// ─── Main AIChat ──────────────────────────────────────────────────────────────

interface AIChatProps {
  userId: string;
  isGlobal?: boolean;
  isMinimized?: boolean;
  setIsMinimized?: (value: boolean) => void;
  isClosed?: boolean;
  setIsClosed?: (value: boolean) => void;
}

export default function AIChat({
  userId,
  isGlobal = false,
  isMinimized = false,
  setIsMinimized,
  isClosed = false,
  setIsClosed,
}: AIChatProps) {
  const orbContext = useOrb && typeof useOrb === 'function' ? useOrb() : null;
  const { orbState, setOrbState, uiReady } = orbContext || { orbState: "idle", setOrbState: () => {}, uiReady: true };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [localMinimized, setLocalMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); // For dragging
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle minimize state
  const handleMinimize = (value: boolean) => {
    if (isGlobal && setIsMinimized) {
      setIsMinimized(value);
    } else {
      setLocalMinimized(value);
    }
  };

  const isCurrentlyMinimized = isGlobal ? isMinimized : localMinimized;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const sendMessage = useCallback(
    async (msg: string) => {
      if (!msg.trim() || thinking) return;

      setInput("");
      setMessages((p) => [...p, { role: "user", content: msg }]);
      if (setOrbState) setOrbState("thinking");
      setThinking(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg, sessionId: crypto.randomUUID() }),
        });
        if (!res.ok) throw new Error("API error");

        if (setOrbState) setOrbState("speaking");
        setMessages((p) => [...p, { role: "assistant", content: "", streamed: false }]);

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    accumulatedContent += parsed.content;
                    setMessages((p) =>
                      p.map((m, idx) =>
                        idx === p.length - 1 ? { ...m, content: accumulatedContent } : m
                      )
                    );
                  }
                } catch {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        }

        setMessages((p) =>
          p.map((m, idx) =>
            idx === p.length - 1 ? { ...m, content: accumulatedContent, streamed: true } : m
          )
        );
        if (setOrbState) setOrbState("idle");
        setThinking(false);
      } catch {
        setMessages((p) => [
          ...p,
          {
            role: "assistant",
            content: "Connection issue — please try again.",
            streamed: true,
          },
        ]);
        if (setOrbState) setOrbState("error");
        setTimeout(() => setOrbState && setOrbState("idle"), 2000);
        setThinking(false);
      }
    },
    [thinking, setOrbState]
  );

  // For global chat on the right sidebar
  if (isGlobal) {
    // If minimized, render a beautiful floating bubble
    if (isCurrentlyMinimized) {
      return (
        <motion.button
          onClick={() => handleMinimize(false)}
          whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(212,175,55,0.4)" }}
          whileTap={{ scale: 0.9 }}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(4,4,8,0.95)",
            border: "1px solid rgba(212,175,55,0.25)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 9999,
          }}
          title="Open VaultIQ AI Assistant"
        >
          <MessageSquare size={20} style={{ color: "#D4AF37" }} />
        </motion.button>
      );
    }

    // Full chat panel on the right side when expanded
    return (
      <motion.div
        drag
        dragElastic={0.2}
        dragMomentum={true}
        onDragEnd={(event, info) => {
          // Keep the panel within reasonable bounds
          const newX = Math.min(info.offset.x, 300); // Don't drag too far right
          const newY = Math.max(info.offset.y, -100); // Don't drag too far up
          setPosition({ x: newX, y: newY });
        }}
        initial={{ x: 0, y: 0, opacity: 0 }}
        animate={{ x: position.x, y: position.y, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 380,
          zIndex: 9999,
          background: "rgba(4,4,8,0.95)",
          border: "1px solid rgba(212,175,55,0.18)",
          borderLeft: "1px solid rgba(212,175,55,0.18)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow: "-2px 0 60px rgba(0,0,0,0.85), inset 1px 0 0 rgba(255,255,255,0.04)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          cursor: "grab",
        }}
      >
        {/* Header with minimize button - drag handle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            cursor: "grab",
            userSelect: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.cursor = "grab")}
          onMouseLeave={(e) => (e.currentTarget.style.cursor = "grab")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.div
              animate={{
                background:
                  orbState === "thinking"
                    ? ["#D4AF37", "#F5D060", "#D4AF37"]
                    : orbState === "speaking"
                    ? ["#34d399", "#6ee7b7", "#34d399"]
                    : orbState === "listening"
                    ? ["#60a5fa", "#93c5fd", "#60a5fa"]
                    : orbState === "processing"
                    ? ["#a855f7", "#c084fc", "#a855f7"]
                    : orbState === "celebrating"
                    ? ["#22c55e", "#4ade80", "#22c55e"]
                    : orbState === "error"
                    ? ["#ef4444", "#f87171", "#ef4444"]
                    : orbState === "sleeping"
                    ? ["rgba(100,116,139,0.4)", "rgba(100,116,139,0.6)", "rgba(100,116,139,0.4)"]
                    : ["rgba(212,175,55,0.4)", "rgba(212,175,55,0.7)", "rgba(212,175,55,0.4)"],
              }}
              transition={{ duration: orbState === "idle" ? 3 : 0.8, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: "50%" }}
            />
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.2)",
              }}
            >
              {orbState === "thinking"
                ? "Analyzing…"
                : orbState === "speaking"
                ? "Responding"
                : orbState === "listening"
                ? "Listening"
                : orbState === "processing"
                ? "Processing…"
                : orbState === "celebrating"
                ? "Celebrating"
                : orbState === "sleeping"
                ? "Standby"
                : orbState === "error"
                ? "Connection error"
                : "VaultIQ AI"}
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Minimize */}
            <button
              onClick={() => handleMinimize(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="hover:text-white transition-colors"
              title="Minimize chat"
            >
              <ChevronDown size={16} />
            </button>
            {/* Close */}
            {setIsClosed && (
              <button
                onClick={() => setIsClosed(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                className="hover:text-rose-400 transition-colors"
                title="Close assistant"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Messages container */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 16px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                  Your financial intelligence is online. Ask me anything about your portfolio,
                  goals, or financial health.
                </p>
              </motion.div>
            )}

            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  marginTop: i > 0 ? 10 : 0,
                }}
              >
                {m.role === "user" ? (
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 12,
                      color: "rgba(236,253,245,0.88)",
                      padding: "7px 12px",
                      borderRadius: 10,
                      background: "rgba(52,211,153,0.08)",
                      border: "1px solid rgba(52,211,153,0.16)",
                      maxWidth: "85%",
                    }}
                  >
                    {m.content}
                  </span>
                ) : (
                  <div style={{ maxWidth: "85%" }}>
                    <p
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(212,175,55,0.45)",
                        marginBottom: 4,
                      }}
                    >
                      VaultIQ AI
                    </p>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        borderRadius: 10,
                        background: "rgba(212,175,55,0.04)",
                        border: "1px solid rgba(212,175,55,0.1)",
                      }}
                    >
                      <MarkdownContent text={m.content} />
                      {!m.streamed && (
                        <motion.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                          style={{
                            display: "inline-block",
                            width: 2,
                            height: 12,
                            background: "rgba(212,175,55,0.8)",
                            marginLeft: 2,
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}

            {thinking && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  marginTop: 10,
                }}
              >
                <Waveform active />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  Analyzing your profile…
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick prompts */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {PROMPTS.slice(0, 3).map(({ icon: Icon, label }) => (
            <motion.button
              key={label}
              onClick={() => sendMessage(label)}
              whileHover={{ borderColor: "rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.07)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                padding: "5px 10px",
                borderRadius: 7,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <Icon size={10} style={{ color: "rgba(212,175,55,0.6)" }} />
              {label}
            </motion.button>
          ))}
        </div>

        {/* Input row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask VaultIQ…"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 8,
              padding: "8px 10px",
              fontSize: 12,
              color: "rgba(255,255,255,0.88)",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "rgba(212,175,55,0.32)";
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)";
            }}
          />

          {/* Send */}
          <motion.button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || thinking}
            whileHover={{ y: -1, boxShadow: "0 0 18px rgba(212,175,55,0.45)" }}
            whileTap={{ scale: 0.94 }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "linear-gradient(135deg, #F5D060, #C8922A)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: !input.trim() || thinking ? "not-allowed" : "pointer",
              opacity: !input.trim() || thinking ? 0.32 : 1,
              flexShrink: 0,
            }}
          >
            <Send size={13} color="#000" />
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Original dashboard mode (absolute positioning)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: uiReady ? 1 : 0, y: uiReady ? 0 : 20 }}
      transition={{ duration: 0.7, delay: 0.7 }}
      style={{
        position: "absolute",
        bottom: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(480px, 60vw)",
        zIndex: 20,
        background: "rgba(7,5,2,0.93)",
        border: "1px solid rgba(212,175,55,0.28)",
        borderRadius: 14,
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.85), 0 0 20px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}
    >
      {/* Orb state indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px 0",
        }}
      >
        <motion.div
          animate={{
            background:
              orbState === "thinking"
                ? ["#D4AF37", "#F5D060", "#D4AF37"]
                : orbState === "speaking"
                ? ["#34d399", "#6ee7b7", "#34d399"]
                : orbState === "listening"
                ? ["#60a5fa", "#93c5fd", "#60a5fa"]
                : orbState === "processing"
                ? ["#a855f7", "#c084fc", "#a855f7"]
                : orbState === "celebrating"
                ? ["#22c55e", "#4ade80", "#22c55e"]
                : orbState === "error"
                ? ["#ef4444", "#f87171", "#ef4444"]
                : orbState === "sleeping"
                ? ["rgba(100,116,139,0.4)", "rgba(100,116,139,0.6)", "rgba(100,116,139,0.4)"]
                : ["rgba(212,175,55,0.4)", "rgba(212,175,55,0.7)", "rgba(212,175,55,0.4)"],
          }}
          transition={{ duration: orbState === "idle" ? 3 : 0.8, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: "50%" }}
        />
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.2)",
          }}
        >
          {orbState === "thinking"
            ? "Analyzing…"
            : orbState === "speaking"
            ? "Responding"
            : orbState === "listening"
            ? "Listening"
            : orbState === "processing"
            ? "Processing…"
            : orbState === "celebrating"
            ? "Celebrating"
            : orbState === "sleeping"
            ? "Standby"
            : orbState === "error"
            ? "Connection error"
            : "VaultIQ AI · Online"}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: 160,
          overflowY: "auto",
          padding: "10px 16px 8px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.08) transparent",
        }}
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                Your financial intelligence is online. Ask me anything about your portfolio,
                goals, or financial health.
              </p>
            </motion.div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                marginTop: i > 0 ? 10 : 0,
              }}
            >
              {m.role === "user" ? (
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 12,
                    color: "rgba(236,253,245,0.88)",
                    padding: "7px 12px",
                    borderRadius: 10,
                    background: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.16)",
                  }}
                >
                  {m.content}
                </span>
              ) : (
                <div style={{ maxWidth: "88%" }}>
                  <p
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "rgba(212,175,55,0.45)",
                      marginBottom: 4,
                    }}
                  >
                    VaultIQ AI
                  </p>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "rgba(212,175,55,0.04)",
                      border: "1px solid rgba(212,175,55,0.1)",
                    }}
                  >
                    <MarkdownContent text={m.content} />
                    {!m.streamed && (
                      <motion.span
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                        style={{
                          display: "inline-block",
                          width: 2,
                          height: 12,
                          background: "rgba(212,175,55,0.8)",
                          marginLeft: 2,
                          verticalAlign: "middle",
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {thinking && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                marginTop: 10,
              }}
            >
              <Waveform active />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                Analyzing your profile…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick prompts */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 16px 8px" }}>
        {PROMPTS.slice(0, 4).map(({ icon: Icon, label }) => (
          <motion.button
            key={label}
            onClick={() => sendMessage(label)}
            whileHover={{ borderColor: "rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.07)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10.5,
              padding: "5px 10px",
              borderRadius: 7,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Icon size={10} style={{ color: "rgba(212,175,55,0.6)" }} />
            {label}
          </motion.button>
        ))}
      </div>

      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask your AI Financial Advisor anything..."
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 10,
            padding: "8px 12px",
            fontSize: 12,
            color: "rgba(255,255,255,0.88)",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(212,175,55,0.32)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.09)";
          }}
        />

        {/* Voice button */}
        <motion.button
          disabled
          whileHover={{ scale: 1.05 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))",
            border: "1px solid rgba(212,175,55,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "not-allowed",
            flexShrink: 0,
          }}
        >
          <Mic size={14} style={{ color: "rgba(212,175,55,0.5)" }} />
        </motion.button>

        {/* Send */}
        <motion.button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || thinking}
          whileHover={{ y: -1, boxShadow: "0 0 20px rgba(212,175,55,0.5)" }}
          whileTap={{ scale: 0.92 }}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F5D060, #C8922A)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: !input.trim() || thinking ? "not-allowed" : "pointer",
            opacity: !input.trim() || thinking ? 0.32 : 1,
            flexShrink: 0,
            boxShadow: "0 2px 12px rgba(212,175,55,0.3)",
          }}
        >
          <Send size={14} color="#000" />
        </motion.button>
      </div>
    </motion.div>
  );
}
