"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Trash2, Plus, X, TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";

interface AlertItem {
  id: string;
  symbol: string;
  companyName: string | null;
  type: string;
  threshold: number;
  status: string;
  triggeredAt: string | null;
  message: string | null;
  createdAt: string;
  currentPrice: number | null;
  changePercent: number | null;
}

interface AlertFormData {
  symbol: string;
  type: string;
  threshold: number;
}

const ALERT_TYPES = [
  { value: "PRICE_ABOVE", label: "Price Above", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { value: "PRICE_BELOW", label: "Price Below", icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
  { value: "PERCENT_CHANGE", label: "Daily Move %", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "NEW_52W_HIGH", label: "New 52W High", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { value: "NEW_52W_LOW", label: "New 52W Low", icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
];

export default function ActiveAlertsWidget() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>({ symbol: "", type: "PRICE_ABOVE", threshold: 0 });
  const [submitting, setSubmitting] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const createAlert = async () => {
    if (!formData.symbol || (!formData.threshold && !["NEW_52W_HIGH", "NEW_52W_LOW"].includes(formData.type))) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await fetchAlerts();
        setShowForm(false);
        setFormData({ symbol: "", type: "PRICE_ABOVE", threshold: 0 });
        toast.success("Alert created", { description: `Monitoring ${formData.symbol}` });
      } else {
        toast.error("Failed to create alert");
      }
    } catch (error) {
      console.error("Failed to create alert:", error);
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAlert = async (id: string, symbol: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchAlerts();
        toast.success(`Alert removed for ${symbol}`);
      }
    } catch (error) {
      console.error("Failed to delete alert:", error);
    }
  };

  const getAlertConfig = (type: string) => {
    return ALERT_TYPES.find((t) => t.value === type) ?? ALERT_TYPES[0];
  };

  const activeAlerts = alerts.filter((a) => a.status === "ACTIVE");
  const triggeredAlerts = alerts.filter((a) => a.status === "TRIGGERED");

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500" />
            Price Alerts
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-400">{activeAlerts.length} active</span>
            {triggeredAlerts.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-medium rounded-full">
                {triggeredAlerts.length} triggered
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          {showForm ? (
            <X className="w-4 h-4 text-blue-400" />
          ) : (
            <Plus className="w-4 h-4 text-blue-400" />
          )}
        </button>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/30 rounded-xl p-4 space-y-3">
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="Stock symbol (e.g., RELIANCE)"
                className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
              />

              <div className="grid grid-cols-2 gap-2">
                {ALERT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.type === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? `${type.bg} border-white/10 ${type.color}`
                          : "bg-zinc-800/30 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <div className="text-[10px] font-medium">{type.label}</div>
                    </button>
                  );
                })}
              </div>

              {!["NEW_52W_HIGH", "NEW_52W_LOW"].includes(formData.type) && (
                <input
                  type="number"
                  value={formData.threshold || ""}
                  onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) || 0 })}
                  placeholder={formData.type === "PERCENT_CHANGE" ? "Percentage (e.g., 5)" : "Price (e.g., 3000)"}
                  className="w-full px-3 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 transition-colors text-sm"
                />
              )}

              <button
                onClick={createAlert}
                disabled={submitting || !formData.symbol}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium rounded-lg transition-all text-sm"
              >
                {submitting ? "Creating..." : "Create Alert"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerts list */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10"
          >
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <BellOff className="w-7 h-7 text-blue-500" />
            </div>
            <h4 className="text-white font-medium mb-1">No Alerts Set</h4>
            <p className="text-zinc-400 text-sm max-w-[220px] mx-auto">
              Create alerts to track price movements and get notified.
            </p>
          </motion.div>
        ) : (
          alerts.map((alert, index) => {
            const config = getAlertConfig(alert.type);
            const Icon = config.icon;
            const isTriggered = alert.status === "TRIGGERED";

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative p-3 rounded-xl transition-all ${
                  isTriggered
                    ? "bg-red-500/10 border border-red-500/20"
                    : "bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/20 hover:border-zinc-700/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Alert type icon */}
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>

                  {/* Alert info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{alert.symbol}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                        {config.label.replace("Price ", "")}
                      </span>
                    </div>
                    {alert.message ? (
                      <span className="text-red-400 text-xs">{alert.message}</span>
                    ) : (
                      <span className="text-zinc-500 text-xs">
                        {alert.type === "PERCENT_CHANGE"
                          ? `Move > ${alert.threshold}%`
                          : `₹${alert.threshold.toLocaleString("en-IN")}`}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  {alert.currentPrice && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-white text-sm font-medium">
                        ₹{alert.currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      {alert.changePercent !== null && (
                        <div
                          className={`text-xs ${alert.changePercent >= 0 ? "text-emerald-500" : "text-red-500"}`}
                        >
                          {alert.changePercent >= 0 ? "+" : ""}
                          {alert.changePercent.toFixed(2)}%
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => deleteAlert(alert.id, alert.symbol)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-zinc-500 hover:text-red-400" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
