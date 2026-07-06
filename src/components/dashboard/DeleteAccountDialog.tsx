"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        await signOut({ redirect: false });
        router.push("/");
      } else {
        const data = await res.json();
        setError(data?.error?.message ?? "Failed to delete account");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              maxWidth: 420,
              background: "rgba(20,20,25,0.98)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 16,
              padding: 0,
              zIndex: 101,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "24px 24px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(239,68,68,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertTriangle size={20} style={{ color: "#ef4444" }} />
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                    Delete Account
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    borderRadius: 8,
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                </button>
              </div>

              <div
                style={{
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.12)",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 16,
                }}
              >
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                  This action is <span style={{ color: "#ef4444", fontWeight: 600 }}>permanent and irreversible</span>.
                  Your account and <span style={{ color: "#ef4444", fontWeight: 600 }}>all data</span> will be
                  permanently deleted, including:
                </p>
                <ul
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                    marginTop: 10,
                    paddingLeft: 18,
                    lineHeight: 1.8,
                  }}
                >
                  <li>Financial profiles &amp; transaction history</li>
                  <li>Budgets, goals, and investment portfolios</li>
                  <li>Chat history with AI advisors</li>
                  <li>Learning progress &amp; achievements</li>
                  <li>All preferences &amp; settings</li>
                </ul>
              </div>

              {error && (
                <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</p>
              )}
            </div>

            <div
              style={{
                padding: "12px 24px 20px",
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: loading ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "rgba(239,68,68,0.25)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                  }
                }}
              >
                <Trash2 size={14} />
                {loading ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
