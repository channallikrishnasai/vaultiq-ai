"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Pencil,
  Trash2,
  Plus,
  Calendar,
  TrendingUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GoalModal } from "./GoalModal";
import { GoalType } from "@/generated/prisma/enums";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  type: GoalType;
  deadline: string | null;
  createdAt: string;
}

interface GoalListProps {
  goals: Goal[];
}

const TYPE_CONFIG: Record<GoalType, { label: string; colorClass: string; bgClass: string; barClass: string }> = {
  [GoalType.SAVINGS]: {
    label: "Savings",
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10",
    barClass: "bg-emerald-500",
  },
  [GoalType.EMERGENCY]: {
    label: "Emergency",
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10",
    barClass: "bg-amber-500",
  },
  [GoalType.INVESTMENT]: {
    label: "Investment",
    colorClass: "text-teal-400",
    bgClass: "bg-teal-500/10",
    barClass: "bg-teal-500",
  },
};

export function GoalList({ goals = [] }: GoalListProps) {
    const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Delete failed");
      toast.success("Goal deleted");
      router.refresh();
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const formatAmount = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "No deadline";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            <Target className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Goals</h3>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              {goals.length}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 rounded-lg bg-emerald-600 text-xs text-white hover:bg-emerald-500"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] py-14 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <Target className="h-7 w-7 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-300">No goals yet</p>
          <p className="mt-1 max-w-[200px] text-xs text-zinc-600">
            Create a goal to start tracking your progress
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 gap-1.5 rounded-lg border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Add Goal
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {goals.map((goal, index) => {
              const config = TYPE_CONFIG[goal.type];
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isComplete = progress >= 100;
              const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, scale: 0.96 }}
                  transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
                  className="group relative rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition hover:border-white/[0.08] hover:bg-white/[0.04] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-sm font-semibold text-white">
                          {goal.name}
                        </h4>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.bgClass} ${config.colorClass}`}
                        >
                          {config.label}
                        </span>
                        {isComplete && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex shrink-0 items-center gap-0.5 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Complete
                          </motion.span>
                        )}
                      </div>

                      <div className="mt-3">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-zinc-500">
                            {formatAmount(goal.currentAmount)}{" "}
                            <span className="text-zinc-700">/ {formatAmount(goal.targetAmount)}</span>
                          </span>
                          <span
                            className={`font-semibold ${isComplete ? "text-emerald-400" : "text-zinc-300"}`}
                          >
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{
                              duration: 0.8,
                              ease: "easeOut",
                              delay: index * 0.08,
                            }}
                            className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : config.barClass}`}
                          />
                        </div>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(goal.deadline)}
                        </span>
                        {!isComplete && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {formatAmount(remaining)} to go
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 sm:gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(goal)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.05] hover:text-emerald-400"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(goal.id)}
                        disabled={deletingId === goal.id}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.05] hover:text-red-400 disabled:opacity-50"
                      >
                        {deletingId === goal.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <GoalModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={() => router.refresh()}
        goal={editingGoal}
      />
    </div>
  );
}