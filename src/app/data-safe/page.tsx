"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, Fingerprint, ArrowRight, AlertTriangle, Zap, Brain, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TRUST_ITEMS = [
  { icon: Shield, text: "Bank-grade encryption", detail: "256-bit AES encryption for all data" },
  { icon: Lock, text: "Zero-knowledge architecture", detail: "We never see your financial data" },
  { icon: Eye, text: "Privacy-first design", detail: "Your data stays on your device" },
  { icon: Fingerprint, text: "Biometric authentication", detail: "Only you can access your account" },
];

const QUOTES = [
  "Your financial freedom starts with trust.",
  "Security isn't a feature — it's our foundation.",
  "We protect what matters most: your future.",
  "Built by people who care about your privacy.",
];

function HexPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexagons" width="56" height="100" patternUnits="userSpaceOnUse" patternTransform="scale(0.5)">
            <path d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100" fill="none" stroke="rgba(212,175,55,0.08)" strokeWidth="1"/>
            <path d="M28 0L28 66M0 16L56 50M56 16L0 50" fill="none" stroke="rgba(212,175,55,0.04)" strokeWidth="1"/>
          </pattern>
          <radialGradient id="hexFade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
          <mask id="hexMask">
            <rect width="100%" height="100%" fill="url(#hexFade)"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexagons)" mask="url(#hexMask)" />
      </svg>

      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 1 + (i % 3),
            height: 1 + (i % 3),
            left: `${(i * 37) % 100}%`,
            top: `${(i * 53) % 100}%`,
            background: `rgba(212,175,55,${0.1 + (i % 4) * 0.08})`,
          }}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: (i % 5) * 0.6, ease: "easeInOut" }}
        />
      ))}

      <motion.div
        className="absolute"
        style={{
          width: 500, height: 500,
          left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 60%)",
          borderRadius: "50%",
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function CursorSignIn() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!entered) setEntered(true);
    };
    const onLeave = () => setEntered(false);
    const onEnter = () => setEntered(true);

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [entered]);

  return (
    <motion.div
      className="fixed z-50 pointer-events-auto"
      animate={{
        x: pos.x + 24,
        y: pos.y + 24,
        opacity: entered ? 1 : 0,
        scale: entered ? 1 : 0.5,
      }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
    >
      <Link href="/sign-in">
        <motion.div
          whileHover={{ scale: 1.12, boxShadow: "0 0 50px rgba(212,175,55,0.6)" }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 rounded-full cursor-pointer select-none"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #C8922A)",
            boxShadow: "0 4px 25px rgba(212,175,55,0.45)",
          }}
        >
          <Lock size={14} className="text-black" />
          <span className="text-black font-semibold text-sm">Sign In</span>
          <ArrowRight size={16} className="text-black" />
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function DataSafePage() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const isUnauthorized = from?.startsWith("/dashboard");
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <HexPattern />
      <CursorSignIn />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))",
              border: "2px solid rgba(212,175,55,0.4)",
              boxShadow: "0 0 40px rgba(212,175,55,0.3)",
            }}
          >
            <Shield size={32} className="text-amber-400" />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(212,175,55,0.5)" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl md:text-4xl font-bold mb-3 text-center"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #F5D060, #D4AF37)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {isUnauthorized ? "Access Restricted" : "Your Data is Safe With Us"}
        </motion.h1>

        {isUnauthorized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mb-6 px-5 py-3 rounded-xl flex items-center gap-3"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span className="text-red-300 text-sm font-medium">
              You are not authorized to access the Dashboard. Please sign in first.
            </span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="h-8 mb-8 flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-zinc-500 text-sm italic text-center"
            >
              &ldquo;{QUOTES[quoteIndex]}&rdquo;
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10"
        >
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
              whileHover={{ y: -3, borderColor: "rgba(212,175,55,0.4)" }}
              className="p-4 rounded-xl text-center"
              style={{ background: "rgba(212,175,55,0.02)", border: "1px solid rgba(212,175,55,0.08)" }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}
              >
                <item.icon size={18} className="text-amber-400" />
              </div>
              <h3 className="text-white font-medium text-xs mb-1">{item.text}</h3>
              <p className="text-zinc-600 text-[10px]">{item.detail}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex gap-8 mb-10"
        >
          {[
            { icon: Brain, label: "AI-Powered Insights", value: "24/7" },
            { icon: Zap, label: "Real-time Alerts", value: "<1s" },
            { icon: BarChart3, label: "Smart Analytics", value: "Auto" },
          ].map((stat, i) => (
            <div key={i} className="text-center flex flex-col items-center gap-1">
              <stat.icon size={14} style={{ color: "#D4AF37" }} />
              <p className="text-xl font-bold" style={{ color: "#D4AF37" }}>{stat.value}</p>
              <p className="text-zinc-600 text-[10px]">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-center"
        >
          <p className="text-zinc-700 text-[11px]">
            Move your cursor — the sign-in button follows you
          </p>
        </motion.div>
      </div>

      <div className="absolute top-8 left-8 w-12 h-12 pointer-events-none">
        <svg viewBox="0 0 48 48" className="w-full h-full opacity-30">
          <path d="M0 16 L0 0 L16 0" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="2"/>
        </svg>
      </div>
      <div className="absolute top-8 right-8 w-12 h-12 pointer-events-none">
        <svg viewBox="0 0 48 48" className="w-full h-full opacity-30">
          <path d="M48 16 L48 0 L32 0" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="2"/>
        </svg>
      </div>
      <div className="absolute bottom-8 left-8 w-12 h-12 pointer-events-none">
        <svg viewBox="0 0 48 48" className="w-full h-full opacity-30">
          <path d="M0 32 L0 48 L16 48" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="2"/>
        </svg>
      </div>
      <div className="absolute bottom-8 right-8 w-12 h-12 pointer-events-none">
        <svg viewBox="0 0 48 48" className="w-full h-full opacity-30">
          <path d="M48 32 L48 48 L32 48" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
}
