"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useOrb } from "@/contexts/OrbContext";

interface DashboardHeaderProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  visible?: boolean;
}

export default function DashboardHeader({ user, visible = true }: DashboardHeaderProps) {
  const { orbState } = useOrb();

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -16 }}
      transition={{ duration: 0.7, delay: 0.4 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 28px",
        background: "rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <motion.div
          animate={{
            boxShadow:
              orbState === "idle"
                ? "0 0 12px rgba(212,175,55,0.35)"
                : "0 0 20px rgba(212,175,55,0.7)",
          }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F5D060, #C8922A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "#000" }}>V</span>
        </motion.div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: "rgba(255,255,255,0.88)",
          }}
        >
          VaultIQ
          <span style={{ color: "rgba(212,175,55,0.8)" }}> AI</span>
        </span>
      </div>

      {/* Status pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 14px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <motion.div
          animate={{
            background:
              orbState === "thinking"
                ? ["#D4AF37", "#F5D060"]
                : orbState === "speaking"
                ? ["#34d399", "#6ee7b7"]
                : ["rgba(52,211,153,0.6)", "rgba(52,211,153,1)"],
          }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          style={{ width: 6, height: 6, borderRadius: "50%" }}
        />
        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.06em",
          }}
        >
          {orbState === "thinking"
            ? "Analyzing"
            : orbState === "speaking"
            ? "Responding"
            : "System online"}
        </span>
      </div>

      {/* User */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}>
            {user.name ?? "User"}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>
            {user.email}
          </p>
        </div>
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={32}
            height={32}
            style={{
              borderRadius: "50%",
              border: "1.5px solid rgba(212,175,55,0.3)",
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #D4AF37, #8B6914)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              color: "#000",
              border: "1.5px solid rgba(212,175,55,0.3)",
            }}
          >
            {(user.name ?? "U")[0].toUpperCase()}
          </div>
        )}
      </div>
    </motion.header>
  );
}