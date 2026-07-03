"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PiggyBank, Plus, Trash2, PieChart, Info, RefreshCw, AlertTriangle, Edit2, Check, X
} from "lucide-react";
import { toast } from "sonner";

interface Budget {
  id: string;
  category: string;
  limit: number;
  month: number;
  year: number;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
}

interface BudgetsClientProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function BudgetsClient({ user }: BudgetsClientProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [category, setCategory] = useState<string>("Food");
  const [limit, setLimit] = useState<string>("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<string>("");
  const [editLimit, setEditLimit] = useState<string>("");
  const [editMonth, setEditMonth] = useState<number>(new Date().getMonth() + 1);
  const [editYear, setEditYear] = useState<number>(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const budgetRes = await fetch("/api/budgets");
      const budgetJson = await budgetRes.json();
      const expenseRes = await fetch("/api/expenses");
      const expenseJson = await expenseRes.json();

      if (budgetJson.success) setBudgets(budgetJson.data || []);
      if (expenseJson.success) setExpenses(expenseJson.data || []);
    } catch {
      toast.error("Failed to load budget details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for changes to expenses in localStorage (cross‑window)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'vaultiq_mock_expenses') {
        fetchData();
      }
    };
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
    };
  }, [fetchData]);

  // Listen for custom 'expensesUpdated' events triggered within the same tab
  useEffect(() => {
    const customHandler = () => {
      fetchData();
    };
    window.addEventListener('expensesUpdated', customHandler);
    return () => {
      window.removeEventListener('expensesUpdated', customHandler);
    };
  }, [fetchData]);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      toast.error("Please enter a valid positive limit");
      return;
    }

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          limit: parsedLimit,
          month,
          year,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Budget limit set successfully!");
        setLimit("");
        fetchData();
      } else {
        toast.error(json.message || "Failed to set budget");
      }
    } catch {
      toast.error("Network error setting budget");
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Budget deleted");
        fetchData();
      } else {
        toast.error("Failed to delete budget");
      }
    } catch {
      toast.error("Error deleting budget");
    }
  };

  const startEdit = (b: Budget) => {
    setEditingId(b.id);
    setEditCategory(b.category);
    setEditLimit(b.limit.toString());
    setEditMonth(b.month);
    setEditYear(b.year);
  };

  const saveEdit = async (b: Budget) => {
    const parsedLimit = parseFloat(editLimit);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      toast.error("Please enter a valid limit");
      return;
    }

    try {
      const res = await fetch(`/api/budgets/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: editCategory,
          limit: parsedLimit,
          month: editMonth,
          year: editYear,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Budget updated successfully!");
        setEditingId(null);
        fetchData();
      } else {
        toast.error(json.message || "Failed to update budget");
      }
    } catch {
      toast.error("Error saving budget edits");
    }
  };

  // Get total spent per category
  const getCategorySpent = (catName: string) => {
    return expenses
      .filter((e) => e.category.toLowerCase() === catName.toLowerCase())
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getCategorySpent(b.category), 0);

  return (
    <div className="h-full w-full bg-[#040407]/45 text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <PiggyBank className="text-amber-400 h-5 w-5" /> Budget & Envelope Planner
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure monthly category limits, setup warnings, and edit thresholds inline
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Left Column: Form (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-3">Set Category Budget</h3>
            <form onSubmit={handleAddBudget} className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Select Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {["Food", "Rent", "Utilities", "Entertainment", "Transport", "Others"].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Monthly Limit (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Month</label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        {new Date(2020, m - 1).toLocaleString("en-US", { month: "short" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1"
              >
                <Plus size={12} /> SET BUDGET
              </motion.button>
            </form>
          </div>

          {/* Goal Tips */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={12} className="text-amber-400" /> Threshold Warnings
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              VaultIQ updates progress loops dynamically. When any budget limit reaches 85% of utilization, warnings are highlighted.
            </p>
          </div>
        </div>

        {/* Right Column: Goal Cards Grid (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-850 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Budget Envelopes</h3>
            <span className="text-[10px] font-mono text-zinc-500">
              Total Budgeted: ₹{totalBudgeted.toLocaleString()} | Spent: ₹{totalSpent.toLocaleString()}
            </span>
          </div>

          {budgets.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-lg">
              <Info className="text-zinc-600 mb-2" size={24} />
              <p className="text-xs text-zinc-500">No active budgets set for this timeline.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px] scrollbar-thin">
              {budgets.map((b) => {
                const spent = getCategorySpent(b.category);
                const isEditing = editingId === b.id;
                const percent = Math.min(100, b.limit > 0 ? (spent / b.limit) * 100 : 0);

                const getBarColor = (pct: number) => {
                  if (pct >= 90) return "bg-rose-500";
                  if (pct >= 75) return "bg-amber-500";
                  return "bg-emerald-500";
                };

                return (
                  <div key={b.id} className="p-3.5 rounded-lg border border-zinc-800/40 bg-zinc-900/20 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-[10px] rounded px-1.5 py-0.5 text-white focus:outline-none"
                            >
                              {["Food", "Rent", "Utilities", "Entertainment", "Transport", "Others"].map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                            <select
                              value={editMonth}
                              onChange={(e) => setEditMonth(parseInt(e.target.value))}
                              className="bg-zinc-950 border border-zinc-800 text-[10px] rounded px-1.5 py-0.5 text-white focus:outline-none"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>
                                  {new Date(2020, m - 1).toLocaleString("en-US", { month: "short" })}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={editYear}
                              onChange={(e) => setEditYear(parseInt(e.target.value) || 2026)}
                              className="bg-zinc-950 border border-zinc-800 text-[10px] rounded px-1.5 py-0.5 w-16 text-white focus:outline-none"
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{b.category}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">
                                {new Date(b.year, b.month - 1).toLocaleString("en-US", { month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-500 mt-1 block">
                              Spent: ₹{spent.toLocaleString()} / Limit: ₹{b.limit.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-zinc-500">Limit:</span>
                              <input
                                type="number"
                                value={editLimit}
                                onChange={(e) => setEditLimit(e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 text-xs rounded px-1.5 py-0.5 w-24 text-white text-right focus:outline-none"
                              />
                            </div>
                          ) : (
                            <span className={`text-[10px] font-bold ${percent >= 90 ? "text-rose-400" : percent >= 75 ? "text-amber-400" : "text-emerald-400"}`}>
                              {percent.toFixed(0)}% Utilized
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(b)}
                                className="text-emerald-400 hover:text-emerald-300 p-1 transition"
                                title="Save changes"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-zinc-500 hover:text-zinc-300 p-1 transition"
                                title="Cancel edit"
                              >
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(b)}
                              className="text-zinc-500 hover:text-white p-1 transition"
                              title="Edit budget limit"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteBudget(b.id)}
                            className="text-zinc-650 hover:text-rose-400 p-1 transition"
                            title="Delete budget"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getBarColor(percent)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
