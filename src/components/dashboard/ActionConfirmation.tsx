"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, AlertTriangle, Loader2,
  Target, Wallet, Bell, Star, BarChart3, FileText, User,
} from "lucide-react";

interface ActionPreview {
  actionType: string;
  description: string;
  impact: string;
  reversible: boolean;
  params: Record<string, unknown>;
}

interface ActionConfirmationProps {
  preview: ActionPreview;
  onConfirm: () => void;
  onReject: () => void;
  loading?: boolean;
}

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  create_goal: Target,
  edit_goal: Target,
  delete_goal: Target,
  create_budget: Wallet,
  edit_budget: Wallet,
  create_alert: Bell,
  add_watchlist: Star,
  remove_watchlist: Star,
  upload_document: FileText,
  generate_report: FileText,
  create_virtual_trade: BarChart3,
  update_profile: User,
};

const ACTION_COLORS: Record<string, string> = {
  create_goal: "text-blue-400",
  edit_goal: "text-blue-400",
  delete_goal: "text-red-400",
  create_budget: "text-green-400",
  edit_budget: "text-green-400",
  create_alert: "text-yellow-400",
  add_watchlist: "text-purple-400",
  remove_watchlist: "text-purple-400",
  upload_document: "text-indigo-400",
  generate_report: "text-cyan-400",
  create_virtual_trade: "text-emerald-400",
  update_profile: "text-orange-400",
};

export default function ActionConfirmation({
  preview,
  onConfirm,
  onReject,
  loading = false,
}: ActionConfirmationProps) {
  const Icon = ACTION_ICONS[preview.actionType] || AlertTriangle;
  const iconColor = ACTION_COLORS[preview.actionType] || "text-white/60";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="rounded-2xl border border-white/10 bg-[#0a0a0f] p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Confirm Action</h3>
            <p className="text-xs text-white/40">{preview.actionType.replace(/_/g, " ")}</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-white/5 p-3">
          <p className="text-sm text-white/80">{preview.description}</p>
          <p className="mt-1 text-xs text-white/40">{preview.impact}</p>
        </div>

        {!preview.reversible && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-red-400">This action cannot be undone</span>
          </div>
        )}

        {preview.reversible && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-400">This action can be undone</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Confirm
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
