"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Pencil,
  Trash2,
  Plus,
  Calendar,
  Tag,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExpenseModal } from "./ExpenseModal";

interface Expense {
  id: string;
  amount: number;
  category: string;
  notes: string | null;
  date: string;
  createdAt: string;
}

interface ExpenseListProps {
  expenses: Expense[];
}

const CATEGORY_CONFIG: Record<string, { emoji: string }> = {
  "Food & Dining": { emoji: "🍽️" },
  Transportation: { emoji: "🚗" },
  Shopping: { emoji: "🛍️" },
  Entertainment: { emoji: "🎬" },
  "Bills & Utilities": { emoji: "💡" },
  Healthcare: { emoji: "🏥" },
  Education: { emoji: "📚" },
  Travel: { emoji: "✈️" },
  Investments: { emoji: "📈" },
  Other: { emoji: "📦" },
};

export function ExpenseList({ expenses = [] }: ExpenseListProps) {
    const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || "Delete failed");
      toast.success("Expense deleted");
      router.refresh();
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatAmount = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20">
            <Wallet className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Expenses</h3>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-500">
              {expenses.length}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 rounded-lg bg-teal-600 text-xs text-white hover:bg-teal-500"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {expenses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] py-14 text-center"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
            <Wallet className="h-7 w-7 text-zinc-600" />
          </div>
          <p className="text-sm font-medium text-zinc-300">No expenses yet</p>
          <p className="mt-1 max-w-[200px] text-xs text-zinc-600">
            Add your first expense to start tracking spending
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 gap-1.5 rounded-lg border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Add Expense
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {expenses.map((expense, index) => {
              const cfg = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG["Other"];
              return (
                <motion.div
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, scale: 0.96 }}
                  transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
                  className="group relative flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition hover:border-white/[0.08] hover:bg-white/[0.04] sm:gap-4 sm:p-3.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-lg ring-1 ring-white/[0.06] sm:h-11 sm:w-11">
                    {cfg.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {expense.category}
                      </p>
                      {expense.notes && (
                        <span
                          className="shrink-0 text-zinc-600"
                          title={expense.notes}
                        >
                          <FileText className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(expense.date)}
                      </span>
                      {expense.notes && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span className="max-w-[120px] truncate">{expense.notes}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-teal-400">
                      {formatAmount(expense.amount)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 sm:gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(expense)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.05] hover:text-teal-400"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(expense.id)}
                      disabled={deletingId === expense.id}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.05] hover:text-red-400 disabled:opacity-50"
                    >
                      {deletingId === expense.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <ExpenseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={() => router.refresh()}
        expense={editingExpense}
      />
    </div>
  );
}