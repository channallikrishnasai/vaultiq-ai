"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Type, Coins, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GoalType } from "@/generated/prisma/enums";
import { useDashboardMutations } from "@/hooks/useDashboardMutations";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  type: GoalType;
  deadline: string | null;
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal?: Goal | null;
}

const GOAL_TYPE_CONFIG: Record<GoalType, { label: string; colorClass: string; ringClass: string; bgClass: string }> = {
  [GoalType.SAVINGS]: {
    label: "Savings",
    colorClass: "text-emerald-400",
    ringClass: "ring-emerald-500/20",
    bgClass: "bg-emerald-500/10",
  },
  [GoalType.EMERGENCY]: {
    label: "Emergency",
    colorClass: "text-amber-400",
    ringClass: "ring-amber-500/20",
    bgClass: "bg-amber-500/10",
  },
  [GoalType.INVESTMENT]: {
    label: "Investment",
    colorClass: "text-teal-400",
    ringClass: "ring-teal-500/20",
    bgClass: "bg-teal-500/10",
  },
};

export function GoalModal({ isOpen, onClose, onSuccess, goal }: GoalModalProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [type, setType] = useState<GoalType>(GoalType.SAVINGS);
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addGoal, editGoal } = useDashboardMutations();

  const isEditing = !!goal;

  const resetForm = useCallback(() => {
    setName("");
    setTargetAmount("");
    setCurrentAmount("0");
    setType(GoalType.SAVINGS);
    setDeadline("");
    setErrors({});
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setType(goal.type);
      setDeadline(goal.deadline
  ? new Date(goal.deadline).toISOString().split("T")[0]
  : "");
      setErrors({});
    } else {
      resetForm();
    }
  }, [isOpen, goal, resetForm]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Goal name is required";
    if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      newErrors.targetAmount = "Target must be greater than 0";
    }
    const current = parseFloat(currentAmount || "0");
    if (current < 0) newErrors.currentAmount = "Cannot be negative";
    const target = parseFloat(targetAmount || "0");
    if (target > 0 && current > target) {
      newErrors.currentAmount = "Cannot exceed target";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || "0"),
        type,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      };

      if (isEditing) {
        await editGoal(goal.id, payload);
      } else {
        await addGoal(payload);
      }

      const tConfig = GOAL_TYPE_CONFIG[type];
      toast.success(isEditing ? "Goal updated" : "Goal created", {
        description: `${name} — ${tConfig.label} — ₹${parseFloat(targetAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress =
    targetAmount && parseFloat(targetAmount) > 0
      ? Math.min((parseFloat(currentAmount || "0") / parseFloat(targetAmount)) * 100, 100)
      : 0;

  const activeConfig = GOAL_TYPE_CONFIG[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-7"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeConfig.bgClass} ${activeConfig.colorClass} ring-1 ${activeConfig.ringClass}`}>
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {isEditing ? "Edit Goal" : "Add Goal"}
                    </h2>
                    <p className="text-xs text-zinc-500">Set a financial target</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <Type className="h-3 w-3 text-emerald-400" /> Goal Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((p) => ({ ...p, name: "" }));
                    }}
                    placeholder="e.g., New Car Fund"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-emerald-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-emerald-500/10"
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-400"
                    >
                      {errors.name}
                    </motion.p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <Coins className="h-3 w-3 text-emerald-400" /> Target
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={targetAmount}
                        onChange={(e) => {
                          setTargetAmount(e.target.value);
                          if (errors.targetAmount) setErrors((p) => ({ ...p, targetAmount: "" }));
                        }}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-7 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-emerald-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-emerald-500/10"
                      />
                    </div>
                    {errors.targetAmount && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-400"
                      >
                        {errors.targetAmount}
                      </motion.p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                      <TrendingUp className="h-3 w-3 text-emerald-400" /> Current
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={currentAmount}
                        onChange={(e) => {
                          setCurrentAmount(e.target.value);
                          if (errors.currentAmount) setErrors((p) => ({ ...p, currentAmount: "" }));
                        }}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-7 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-emerald-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-emerald-500/10"
                      />
                    </div>
                    {errors.currentAmount && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-400"
                      >
                        {errors.currentAmount}
                      </motion.p>
                    )}
                  </div>
                </div>

                {targetAmount && parseFloat(targetAmount) > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Progress Preview</span>
                      <span className={`font-semibold ${activeConfig.colorClass}`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={progress >= 100 ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-teal-500"}
                      />
                    </div>
                  </motion.div>
                )}

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <Target className="h-3 w-3 text-emerald-400" /> Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(GOAL_TYPE_CONFIG) as GoalType[]).map((g) => {
                      const cfg = GOAL_TYPE_CONFIG[g];
                      const isSelected = type === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setType(g)}
                          className={
                            isSelected
                              ? `rounded-xl border border-emerald-500/40 ${cfg.bgClass} ${cfg.colorClass} px-2 py-2.5 text-xs font-medium transition`
                              : "rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-2.5 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.05]"
                          }
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <Calendar className="h-3 w-3 text-emerald-400" /> Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-emerald-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-emerald-500/10"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </span>
                    ) : isEditing ? (
                      "Update Goal"
                    ) : (
                      "Create Goal"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}