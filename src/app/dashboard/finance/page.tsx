"use client";

import { motion } from "framer-motion";
import { BarChart3, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";

// Placeholder finance data
interface FinanceMetric {
  id: string;
  label: string;
  value: number;
  color: string;
}

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FinanceMetric[]>([]);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, replace with API call
      const mock = [
        { id: "1", label: "Net Worth", value: 1250000, color: "#D4AF37" },
        { id: "2", label: "Invested", value: 800000, color: "#10b981" },
        { id: "3", label: "Cash", value: 200000, color: "#3b82f6" },
        { id: "4", label: "Liabilities", value: -250000, color: "#ef4444" },
      ];
      setMetrics(mock);
    } catch {
      toast.error("Failed to load finance metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="text-amber-400 h-5 w-5" /> Finance Overview
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Consolidated view of your financial health
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 flex-1">
        {metrics.map((m) => (
          <motion.div
            key={m.id}
            className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md"
            whileHover={{ scale: 1.02 }}
          >
            <h3 className="text-sm font-medium text-zinc-300 mb-2">
              {m.label}
            </h3>
            <p className="text-2xl font-bold" style={{ color: m.color }}>
              ₹{m.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
