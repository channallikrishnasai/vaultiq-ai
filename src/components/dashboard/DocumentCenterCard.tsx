"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, CheckCircle2, Clock, Sparkles, ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface DocStats {
  total: number;
  processed: number;
  pending: number;
  latestInsight: string | null;
}

export default function DocumentCenterCard() {
  const router = useRouter();
  const [stats, setStats] = useState<DocStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/documents/stats")
      .then((r) => r.json())
      .then((data) => { if (data.success) setStats(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.012, transition: { duration: 0.2 } }}
      onClick={() => router.push("/dashboard/documents")}
      className="cursor-pointer rounded-2xl p-4"
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(0,0,0,0.78) 100%)",
        border: "1px solid rgba(212,175,55,0.22)",
        backdropFilter: "blur(14px)",
        boxShadow: "0 0 32px rgba(212,175,55,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.2)" }}
          >
            <FileText size={14} style={{ color: "#D4AF37" }} />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-200">Financial Documents</h3>
            <p className="text-[9px] text-zinc-500">AI Document Intelligence</p>
          </div>
        </div>
        <ArrowUpRight size={14} className="text-zinc-500" />
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-4 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.04)", width: "60%" }} />
          <div className="h-3 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.03)", width: "80%" }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: "Uploaded", value: stats?.total ?? 0, icon: FileText, color: "#D4AF37" },
              { label: "Processed", value: stats?.processed ?? 0, icon: CheckCircle2, color: "#10b981" },
              { label: "Pending", value: stats?.pending ?? 0, icon: Clock, color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className="text-center p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                <s.icon size={10} style={{ color: s.color }} className="mx-auto mb-1" />
                <p className="text-sm font-bold text-zinc-100">{s.value}</p>
                <p className="text-[8px] text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>

          {stats?.latestInsight && (
            <div
              className="flex items-start gap-2 p-2 rounded-lg"
              style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}
            >
              <Sparkles size={10} className="text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-[9px] text-zinc-400 leading-relaxed line-clamp-2">{stats.latestInsight}</p>
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); router.push("/dashboard/documents"); }}
            className="w-full mt-3 py-1.5 rounded-lg text-[10px] font-medium transition-all hover:bg-[rgba(212,175,55,0.18)]"
            style={{
              background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.2)",
              color: "#D4AF37",
            }}
          >
            Quick Upload
          </button>
        </>
      )}
    </motion.div>
  );
}
