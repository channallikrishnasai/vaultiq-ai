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
  RefreshCw,
  Zap,
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
  const heights = [4, 8, 14, 14, 8, 4];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 16 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          style={{
            width: 2,
            height: h,
            borderRadius: 2,
            background: "rgba(212,175,55,0.65)",
          }}
          animate={active ? { scaleY: [0.25, 1, 0.25] } : { scaleY: 0.25 }}
          transition={{
            duration: 0.75,
            repeat: active ? Infinity : 0,
            delay: i * 0.08,
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
}

export default function AIChat({ userId, isGlobal = false, isMinimized = false, setIsMinimized }: AIChatProps) {
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

  // Track interval so it can be cleared on unmount or new message
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount — prevents memory leak mid-stream
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current !== null) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const sendMessage = useCallback(
    async (msg: string) => {
      if (!msg.trim() || thinking) return;

      // Clear any in-flight stream before starting a new one
      if (streamIntervalRef.current !== null) {
        clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }

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
        const data = await res.json();
        const content =
          data?.data?.message ||
          data?.message ||
          data?.content ||
          "Response unavailable.";

        if (setOrbState) setOrbState("speaking");
        let i = 0;
        setMessages((p) => [...p, { role: "assistant", content: "", streamed: false }]);

        streamIntervalRef.current = setInterval(() => {
          i += 5;
          setMessages((p) =>
            p.map((m, idx) =>
              idx === p.length - 1 ? { ...m, content: content.slice(0, i) } : m
            )
          );
          if (i >= content.length) {
            if (streamIntervalRef.current !== null) {
              clearInterval(streamIntervalRef.current);
              streamIntervalRef.current = null;
            }
            setMessages((p) =>
              p.map((m, idx) =>
                idx === p.length - 1 ? { ...m, content, streamed: true } : m
              )
            );
            if (setOrbState) setOrbState("idle");
            setThinking(false);
          }
        }, 12);
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
        // Brief error state then back to idle
        setTimeout(() => setOrbState && setOrbState("idle"), 2000);
        setThinking(false);
      }
    },
    [thinking, setOrbState]
  );

  // For global chat on the right sidebar
  if (isGlobal) {
    // If minimized, completely disappear
    if (isCurrentlyMinimized) {
      return null;
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

          {/* Minimize/Close button */}
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
            <ChevronUp size={18} />
          </button>
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
        width: "min(620px, 85vw)",
        zIndex: 20,
        background: "rgba(5,3,1,0.96)",
        border: "1px solid rgba(212,175,55,0.28)",
        borderRadius: 20,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 0 80px rgba(0,0,0,0.9), 0 0 40px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
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
                : ["rgba(34,197,94,0.7)", "rgba(34,197,94,1)", "rgba(34,197,94,0.7)"],
          }}
          transition={{ duration: orbState === "idle" ? 1.5 : 0.8, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: "50%", boxShadow: orbState === "idle" ? "0 0 10px rgba(34,197,94,0.6)" : "none" }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
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

      {/* Suggested Chips */}
      <div
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          padding: "0 20px 12px",
          scrollbarWidth: "none",
        }}
      >
        {[
          { label: "Analyze spending", icon: TrendingUp },
          { label: "Rebalance portfolio", icon: RefreshCw },
          { label: "Tax harvesting", icon: Zap },
        ].map(({ label, icon: Icon }, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02, background: "rgba(212,175,55,0.08)", borderColor: "rgba(212,175,55,0.3)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => sendMessage(label)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
              padding: "6px 12px",
              borderRadius: 14,
              fontSize: 10,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Icon size={12} style={{ color: "rgba(212,175,55,0.8)" }} />
            {label}
          </motion.button>
        ))}
      </div>

      {/* Input row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Avatar Icon */}
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(16,185,129,0.3)",
            boxShadow: "0 0 10px rgba(16,185,129,0.2)",
            flexShrink: 0
          }}
        >
          <Zap size={16} color="#fff" />
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask VaultIQ anything…"
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

        {/* Mic (future) */}
        <button
          disabled
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "not-allowed",
            flexShrink: 0,
          }}
        >
          <Mic size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
        </button>

        {/* Send */}
        <motion.button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || thinking}
          whileHover={{ y: -1, boxShadow: "0 0 18px rgba(212,175,55,0.45)" }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
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
