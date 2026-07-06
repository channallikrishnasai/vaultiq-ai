"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Trash2, Shield, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import DeleteAccountDialog from "@/components/dashboard/DeleteAccountDialog";

interface SettingsClientProps {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <>
      <main className="min-h-screen bg-zinc-950 p-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-3xl font-bold text-white">Settings</h1>

          {/* Profile Section */}
          <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-6 text-xl font-semibold text-white">Profile</h2>
            <div className="flex items-center gap-6">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  width={80}
                  height={80}
                  style={{
                    borderRadius: "50%",
                    border: "2px solid rgba(212,175,55,0.4)",
                    boxShadow: "0 0 24px rgba(212,175,55,0.2)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #F5D060, #C8922A)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#000",
                    border: "2px solid rgba(212,175,55,0.4)",
                    boxShadow: "0 0 24px rgba(212,175,55,0.2)",
                    flexShrink: 0,
                  }}
                >
                  {(user.name ?? "U")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-white">{user.name ?? "User"}</p>
                <p className="text-sm text-zinc-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-6 text-xl font-semibold text-white">Account</h2>

            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <LogOut size={18} className="text-zinc-500" />
                Log Out
              </button>

              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-red-500/10"
                style={{ color: "#ef4444" }}
              >
                <Trash2 size={18} />
                Delete Account
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div
            className="mt-6 rounded-2xl p-6"
            style={{
              border: "1px solid rgba(239,68,68,0.15)",
              background: "rgba(239,68,68,0.03)",
            }}
          >
            <div className="flex items-start gap-3">
              <Shield size={20} className="mt-0.5 shrink-0" style={{ color: "#ef4444" }} />
              <div>
                <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Deleting your account is permanent. All your financial data, chat history,
                  budgets, goals, and settings will be lost forever.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DeleteAccountDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
    </>
  );
}
