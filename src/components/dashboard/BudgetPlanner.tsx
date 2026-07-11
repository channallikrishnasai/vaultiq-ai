"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface BudgetItem {
  id: string;
  category: string;
  allocated: number;
  spent: number;
}

export default function BudgetPlanner() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgetsAndExpenses = async () => {
      try {
        const [budgetRes, expenseRes] = await Promise.all([
          fetch('/api/budgets'),
          fetch('/api/expenses')
        ]);
        const budgetJson = await budgetRes.json();
        const expenseJson = await expenseRes.json();

        if (budgetJson.success) {
          const rawBudgets = budgetJson.data || [];
          const rawExpenses = expenseJson.success ? (expenseJson.data || []) : [];

          // Map raw budget schemas (category, limit) to UI structure (allocated, spent)
          const mapped: BudgetItem[] = rawBudgets.map((b: { id: string; category: string; limit: number }) => {
            const spent = rawExpenses
              .filter((e: { category: string; amount: number }) => e.category?.toLowerCase() === b.category?.toLowerCase())
              .reduce((sum: number, e: { amount: number }) => sum + (e.amount || 0), 0);

            return {
              id: b.id,
              category: b.category || 'Other',
              allocated: b.limit || 0,
              spent: spent
            };
          });

          setBudgets(mapped);
        } else {
          toast.error('Failed to load budgets');
        }
      } catch {
        toast.error('Failed to load budgets');
      } finally {
        setLoading(false);
      }
    };
    void fetchBudgetsAndExpenses();
  }, []);

  return (
    <main className="w-full max-w-6xl mx-auto p-6 bg-zinc-950/40 rounded-2xl border border-zinc-850/80 backdrop-blur-md mt-6">
      <h2 className="text-xl font-bold text-zinc-50 mb-6 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-500"></span> Budget Status
      </h2>
      {loading ? (
        <div className="text-zinc-500 py-6 text-center animate-pulse">Loading budgets…</div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {budgets.map((b) => {
            const allocatedVal = b.allocated ?? 0;
            const spentVal = b.spent ?? 0;
            const percent = allocatedVal > 0 ? (spentVal / allocatedVal) * 100 : 0;
            return (
              <div key={b.id} className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700/80 transition-all duration-300">
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">{b.category}</h3>
                <div className="flex justify-between text-xs text-zinc-400 mb-3">
                  <span>Allocated: ₹{allocatedVal.toLocaleString("en-IN")}</span>
                  <span className={spentVal > allocatedVal ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>
                    Spent: ₹{spentVal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${spentVal > allocatedVal ? 'bg-linear-to-r from-red-600 to-rose-500' : 'bg-linear-to-r from-violet-600 to-indigo-500'}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </main>
  );
}
