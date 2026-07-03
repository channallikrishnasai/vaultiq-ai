"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, Fingerprint, ArrowRight } from "lucide-react";
import Link from "next/link";

const TRUST_ITEMS = [
  { icon: Shield, text: "Bank-grade encryption", detail: "256-bit AES encryption for all data" },
  { icon: Lock, text: "Zero-knowledge architecture", detail: "We never see your financial data" },
  { icon: Eye, text: "Privacy-first design", detail: "Your data stays on your device" },
  { icon: Fingerprint, text: "Biometric authentication", detail: "Only you can access your account" },
];

// Animated grid pattern
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated grid lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(212,175,55,0.03)" strokeWidth="1"/>
          </pattern>
          <radialGradient id="gridFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
          <mask id="gridMask">
            <rect width="100%" height="100%" fill="url(#gridFade)"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" mask="url(#gridMask)" />
      </svg>

      {/* Floating particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(212,175,55,${Math.random() * 0.3 + 0.1})`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glowing orbs */}
      <motion.div
        className="absolute"
        style={{
          width: 400,
          height: 400,
          left: "20%",
          top: "30%",
          background: "radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute"
        style={{
          width: 300,
          height: 300,
          right: "15%",
          bottom: "20%",
          background: "radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

// Cursor following sign-in button
function CursorSignIn({ visible }: { visible: boolean }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={buttonRef}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: position.x + 20,
            top: position.y + 20,
          }}
        >
          <Link href="/sign-in">
            <motion.div
              whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(212,175,55,0.5)" }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-5 py-3 rounded-full cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #C8922A)",
                boxShadow: "0 4px 20px rgba(212,175,55,0.4)",
              }}
            >
              <span className="text-black font-semibold text-sm">Sign In</span>
              <ArrowRight size={16} className="text-black" />
            </motion.div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function DataSafePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    // Show button after 2 seconds
    const timer = setTimeout(() => setShowButton(true), 2000);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <GridPattern />
      <CursorSignIn visible={showButton} />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Shield icon with glow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
              border: "2px solid rgba(212,175,55,0.3)",
              boxShadow: "0 0 60px rgba(212,175,55,0.2)",
            }}
          >
            <Shield size={40} className="text-amber-400" />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: "1px solid rgba(212,175,55,0.4)" }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Main text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F5D060, #D4AF37)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Your Data is Safe
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto">
            We keep your financial data protected with military-grade security.
            Your privacy is our priority.
          </p>
        </motion.div>

        {/* Trust items grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12"
        >
          {TRUST_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              whileHover={{ y: -4, borderColor: "rgba(212,175,55,0.4)" }}
              className="p-5 rounded-xl"
              style={{
                background: "rgba(212,175,55,0.03)",
                border: "1px solid rgba(212,175,55,0.1)",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.2)",
                  }}
                >
                  <item.icon size={18} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm mb-1">{item.text}</h3>
                  <p className="text-zinc-500 text-xs">{item.detail}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Sign in button (center) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <Link href="/sign-in">
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(212,175,55,0.4)" }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-8 py-4 rounded-full cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #D4AF37, #C8922A)",
                boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
              }}
            >
              <span className="text-black font-semibold">Sign In to Continue</span>
              <ArrowRight size={18} className="text-black" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mt-8 text-zinc-600 text-xs"
        >
          Or move your cursor anywhere and click the floating button
        </motion.p>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
          <path d="M0 0 L50 0 L50 5 L5 5 L5 50 L0 50 Z" fill="rgba(212,175,55,0.5)" />
        </svg>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
          <path d="M100 0 L50 0 L50 5 L95 5 L95 50 L100 50 Z" fill="rgba(212,175,55,0.5)" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
          <path d="M0 100 L50 100 L50 95 L5 95 L5 50 L0 50 Z" fill="rgba(212,175,55,0.5)" />
        </svg>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
          <path d="M100 100 L50 100 L50 95 L95 95 L95 50 L100 50 Z" fill="rgba(212,175,55,0.5)" />
        </svg>
      </div>
    </div>
  );
}
