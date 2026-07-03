"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, RefreshCw, Plus, TrendingUp, TrendingDown, Calendar, Info, Trash2, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface Income {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
}

const INCOME_COLORS: Record<string, string> = {
  Salary: "#10b981",
  Bonus: "#fb923c",
  Freelance: "#60a5fa",
  Investments: "#D4AF37",
  Others: "#71717a",
};

const EXPENSE_COLORS: Record<string, string> = {
  Food: "#f43f5e",
  Rent: "#3b82f6",
  Utilities: "#fb923c",
  Entertainment: "#a78bfa",
  Transport: "#2dd4bf",
  Others: "#71717a",
};

export default function FinancePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeLoading, setIncomeLoading] = useState(true);
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(true);

  // Single transaction type state (income or expense) and logging inputs
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Salary");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Collapsible state for the single transaction log card
  const [isLogOpen, setIsLogOpen] = useState(false);

  const fetchIncomes = useCallback(async () => {
    setIncomeLoading(true);
    try {
      const saved = localStorage.getItem("vaultiq_mock_incomes");
      if (saved) setIncomes(JSON.parse(saved));
    } catch {
      toast.error("Failed to load incomes");
    } finally {
      setIncomeLoading(false);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setExpenseLoading(true);
    try {
      const saved = localStorage.getItem("vaultiq_mock_expenses");
      if (saved) setExpenses(JSON.parse(saved));
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setExpenseLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
    fetchExpenses();
  }, [fetchIncomes, fetchExpenses]);

  // Adjust default category based on selected transaction type
  useEffect(() => {
    if (txType === "income") {
      setCategory("Salary");
    } else {
      setCategory("Food");
    }
  }, [txType]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter valid amount");

    if (txType === "income") {
      const newItem: Income = {
        id: Math.random().toString(36).substr(2, 9),
        amount: amt,
        category: category,
        notes: notes,
        date: new Date(date).toISOString(),
      };
      const updated = [newItem, ...incomes];
      localStorage.setItem("vaultiq_mock_incomes", JSON.stringify(updated));
      setIncomes(updated);
      toast.success("Income logged successfully");
    } else {
      const newItem: Expense = {
        id: Math.random().toString(36).substr(2, 9),
        amount: amt,
        category: category,
        notes: notes,
        date: new Date(date).toISOString(),
      };
      const updated = [newItem, ...expenses];
      localStorage.setItem("vaultiq_mock_expenses", JSON.stringify(updated));
      setExpenses(updated);
      toast.success("Expense logged successfully");
    }

    setAmount("");
    setNotes("");
    setIsLogOpen(false); // Collapse form
  };

  const handleDeleteIncome = (id: string) => {
    const updated = incomes.filter(i => i.id !== id);
    localStorage.setItem("vaultiq_mock_incomes", JSON.stringify(updated));
    setIncomes(updated);
    toast.success("Income deleted");
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    localStorage.setItem("vaultiq_mock_expenses", JSON.stringify(updated));
    setExpenses(updated);
    toast.success("Expense deleted");
  };

  // Combine Income and Expense into a unified comparison chart grouped by date
  const getCombinedChartData = () => {
    const dateMap: Record<string, { dateLabel: string; income: number; expense: number; rawDate: number }> = {};
    
    incomes.forEach(i => {
      const d = new Date(i.date);
      const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!dateMap[label]) {
        dateMap[label] = { dateLabel: label, income: 0, expense: 0, rawDate: d.getTime() };
      }
      dateMap[label].income += i.amount;
    });

    expenses.forEach(e => {
      const d = new Date(e.date);
      const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (!dateMap[label]) {
        dateMap[label] = { dateLabel: label, income: 0, expense: 0, rawDate: d.getTime() };
      }
      dateMap[label].expense += e.amount;
    });

    return Object.values(dateMap)
      .sort((a, b) => a.rawDate - b.rawDate)
      .slice(-7); // Keep the last 7 active transaction days
  };

  const combinedChartData = getCombinedChartData();
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const netAmount = totalIncome - totalExpense;

  // Unified ledger list (Chronological account of what has been added vs removed)
  const unifiedLedger = [
    ...incomes.map(i => ({ ...i, type: "income" as const })),
    ...expenses.map(e => ({ ...e, type: "expense" as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="text-amber-400 h-5 w-5" /> Finance Hub
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Manage and compare cash flow</p>
        </div>
        <button onClick={() => { fetchIncomes(); fetchExpenses(); }} className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition">
          <RefreshCw size={12} className={incomeLoading && expenseLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Net Amount Banner / Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="p-3.5 rounded-xl border border-zinc-800/60 bg-zinc-900/20 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Income (+)</span>
          <span className="text-lg font-black text-[#10b981] mt-1">₹{totalIncome.toLocaleString("en-IN", {maximumFractionDigits:2})}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-zinc-800/60 bg-zinc-900/20 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total Expense (-)</span>
          <span className="text-lg font-black text-rose-400 mt-1">₹{totalExpense.toLocaleString("en-IN", {maximumFractionDigits:2})}</span>
        </div>
        <div className="p-3.5 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 flex flex-col justify-between shadow-lg shadow-[#d4af37]/2 font-semibold">
          <span className="text-[10px] uppercase font-bold text-[#d4af37] tracking-wider">Net Balance</span>
          <span className={`text-lg font-black mt-1 ${netAmount >= 0 ? "text-[#d4af37]" : "text-rose-500"}`}>
            ₹{netAmount.toLocaleString("en-IN", {maximumFractionDigits:2})}
          </span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Side: Combined Action / Single Form Dropdown & Combined Graph */}
        <div className="md:col-span-6 space-y-4">
          
          {/* Combined Form Card (Single Dropdown) */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
            <button
              onClick={() => setIsLogOpen(!isLogOpen)}
              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-zinc-800/30 transition-colors"
            >
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <DollarSign size={14} /> Log Transaction (Income / Expense)
              </span>
              {isLogOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
            </button>
            
            <AnimatePresence initial={false}>
              {isLogOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-zinc-800/50 p-4 bg-zinc-950/20"
                >
                  <form onSubmit={handleAddTransaction} className="space-y-3">
                    
                    {/* Toggle Selector for Income vs Expense */}
                    <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setTxType("income")}
                        className={`py-1.5 text-xs font-bold rounded-md transition-all ${txType === "income" ? "bg-[#10b981] text-white" : "text-zinc-400 hover:text-white"}`}
                      >
                        Income
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxType("expense")}
                        className={`py-1.5 text-xs font-bold rounded-md transition-all ${txType === "expense" ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"}`}
                      >
                        Expense
                      </button>
                    </div>

                    <input
                      type="number"
                      placeholder="Amount"
                      step="any"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />

                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {txType === "income"
                        ? Object.keys(INCOME_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)
                        : Object.keys(EXPENSE_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)
                      }
                    </select>

                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                    />

                    <input
                      type="text"
                      placeholder="Notes (optional)"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    />

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      className={`w-full text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors ${txType === "income" ? "bg-[#10b981] hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"}`}
                    >
                      <Plus size={12} /> Log {txType === "income" ? "Income" : "Expense"}
                    </motion.button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Combined Comparison Graph */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center justify-between">
              Cash Flow Trend (Income vs Expense) <BarChart3 size={14} className="text-amber-400" />
            </h3>
            {combinedChartData.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-10">No cash flow transactions logged.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={combinedChartData}>
                  <XAxis dataKey="dateLabel" stroke="#52525b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 9 }} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[3, 3, 0, 0]} />
</BarChart>
                
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Side: Account of what was added and removed (Unified Ledger) */}
        <div className="md:col-span-6 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden h-fit max-h-[500px]">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800/30 pb-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Account Ledger</h3>
              <p className="text-[9px] text-zinc-500 mt-0.5">Chronological record of transactions</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/5 border border-[#10b981]/20 px-2 py-0.5 rounded">+{totalIncome.toFixed(0)}</span>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-400/5 border border-rose-400/20 px-2 py-0.5 rounded">-{totalExpense.toFixed(0)}</span>
            </div>
          </div>

          {unifiedLedger.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-600">
              <Info size={28} className="mb-2" />
              <p className="text-xs">No transactions recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {unifiedLedger.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 rounded bg-zinc-950/40 border border-zinc-900 hover:border-zinc-800 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg border"
                      style={{
                        background: tx.type === "income" ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
                        borderColor: tx.type === "income" ? "rgba(16,185,129,0.2)" : "rgba(244,63,94,0.2)",
                      }}
                    >
                      {tx.type === "income" ? (
                        <TrendingUp size={14} className="text-[#10b981]" />
                      ) : (
                        <TrendingDown size={14} className="text-rose-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-100">{tx.category}</span>
                        <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                          <Calendar size={8} /> {new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-1">{tx.notes || "No notes"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-extrabold ${tx.type === "income" ? "text-[#10b981]" : "text-rose-400"}`}>
                      {tx.type === "income" ? "+" : "-"}₹{tx.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => tx.type === "income" ? handleDeleteIncome(tx.id) : handleDeleteExpense(tx.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1 rounded-md hover:bg-zinc-800/50 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
