"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Tag, FileText, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDashboardMutations } from "@/hooks/useDashboardMutations";

interface Expense {
  id: string;
  amount: number;
  category: string;
  notes: string | null;
  date: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense?: Expense | null;
}

import { EXPENSE_CATEGORIES, getCategoryEmoji } from "@/lib/expense-categories";

export function ExpenseModal({ isOpen, onClose, onSuccess, expense }: ExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { addExpense, editExpense } = useDashboardMutations();

  const isEditing = !!expense;

  const resetForm = useCallback(() => {
    setAmount("");
    setCategory("");
    setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    setErrors({});
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setNotes(expense.notes || "");
      setDate(new Date(expense.date).toISOString().split("T")[0]);
      setErrors({});
    } else {
      resetForm();
    }
  }, [isOpen, expense, resetForm]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!category) newErrors.category = "Category is required";
    if (!date) newErrors.date = "Date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(amount),
        category,
        notes: notes.trim() || undefined,
        date: new Date(date).toISOString(),
      };

      if (isEditing) {
        await editExpense(expense.id, payload);
      } else {
        await addExpense(payload);
      }

      toast.success(isEditing ? "Expense updated" : "Expense added", {
        description: `${getCategoryEmoji(category)} ${category} — ₹${parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {isEditing ? "Edit Expense" : "Add Expense"}
                    </h2>
                    <p className="text-xs text-zinc-500">Track your spending</p>
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
                    <Wallet className="h-3 w-3 text-teal-400" /> Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (errors.amount) setErrors((p) => ({ ...p, amount: "" }));
                      }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-7 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-teal-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-teal-500/10"
                    />
                  </div>
                  {errors.amount && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-400"
                    >
                      {errors.amount}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <Tag className="h-3 w-3 text-teal-400" /> Category
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {EXPENSE_CATEGORIES.map((cat) => {
                      const isSelected = category === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            if (errors.category) setErrors((p) => ({ ...p, category: "" }));
                          }}
                          className={
                            isSelected
                              ? "rounded-lg border border-teal-500/40 bg-teal-500/10 px-2.5 py-2 text-xs font-medium text-teal-300 transition"
                              : "rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-xs font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-300"
                          }
                        >
                          <span className="mr-1">{getCategoryEmoji(cat)}</span>
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                  {errors.category && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-400"
                    >
                      {errors.category}
                    </motion.p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <FileText className="h-3 w-3 text-teal-400" /> Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Optional notes..."
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-teal-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    <Calendar className="h-3 w-3 text-teal-400" /> Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      if (errors.date) setErrors((p) => ({ ...p, date: "" }));
                    }}
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-teal-500/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-teal-500/10"
                  />
                  {errors.date && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-400"
                    >
                      {errors.date}
                    </motion.p>
                  )}
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
                    className="flex-1 rounded-xl bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </span>
                    ) : isEditing ? (
                      "Update Expense"
                    ) : (
                      "Add Expense"
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