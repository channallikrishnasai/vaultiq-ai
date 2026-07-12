"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingDown, TrendingUp, Plus, Trash2, Calendar,
  Info, RefreshCw, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Edit2, Check
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from "recharts";
import { toast } from "sonner";
import { useDashboardMutations } from "@/hooks/useDashboardMutations";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
  type: "income" | "expense";
}

const EXPENSE_CATEGORIES = ["Food", "Rent", "Utilities", "Entertainment", "Transport", "Others"];
const INCOME_CATEGORIES = ["Salary", "Bonus", "Freelance", "Investments", "Others"];

const CAT_COLORS: Record<string, string> = {
  Food: "#f43f5e",
  Rent: "#3b82f6",
  Utilities: "#fb923c",
  Entertainment: "#a78bfa",
  Transport: "#2dd4bf",
  Salary: "#10b981",
  Bonus: "#34d399",
  Freelance: "#60a5fa",
  Investments: "#fbbf24",
  Others: "#71717a",
};

interface CashFlowClientProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function CashFlowClient({ user }: CashFlowClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { addExpense, editExpense, deleteExpense, addIncome, editIncome, deleteIncome } = useDashboardMutations();

  // Form fields
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Food");
  const [notes, setNotes] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, incRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/incomes"),
      ]);
      
      const expJson = await expRes.json();
      const incJson = await incRes.json();

      const normalizedExpenses = (expJson.data || []).map((e: any) => ({
        ...e,
        type: "expense",
      }));
      const normalizedIncomes = (incJson.data || []).map((i: any) => ({
        ...i,
        type: "income",
      }));

      const all = [...normalizedExpenses, ...normalizedIncomes].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(all);
    } catch {
      toast.error("Failed to load transaction data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync category select with transaction type switch
  useEffect(() => {
    if (type === "expense") {
      setCategory("Food");
    } else {
      setCategory("Salary");
    }
  }, [type]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    try {
      if (type === "expense") {
        await addExpense({ amount: parsedAmount, category, notes, date: new Date(date).toISOString() });
      } else {
        await addIncome({ amount: parsedAmount, category, notes, date: new Date(date).toISOString() });
      }
      toast.success(`${type === "expense" ? "Expense" : "Income"} logged successfully!`);
      setAmount("");
      setNotes("");
      fetchData();
    } catch {
      toast.error("Network error logging transaction");
    }
  };

  const handleDelete = async (id: string, itemType: "income" | "expense") => {
    try {
      if (itemType === "expense") {
        await deleteExpense(id);
      } else {
        await deleteIncome(id);
      }
      toast.success("Transaction deleted");
      fetchData();
    } catch {
      toast.error("Error deleting transaction");
    }
  };

  const startEdit = (t: Transaction) => {
    setEditingId(t.id);
    setEditAmount(t.amount.toString());
    setEditCategory(t.category);
    setEditNotes(t.notes || "");
  };

  const saveEdit = async (t: Transaction) => {
    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    try {
      if (t.type === "expense") {
        await editExpense(t.id, { amount: parsedAmount, category: editCategory, notes: editNotes });
      } else {
        await editIncome(t.id, { amount: parsedAmount, category: editCategory, notes: editNotes });
      }
      toast.success("Transaction updated");
      setEditingId(null);
      fetchData();
    } catch {
      toast.error("Error updating transaction");
    }
  };

  // Compute stats
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  // Chart data
  const chartData = [
    {
      name: "Cash Flow Summary",
      Income: totalIncome,
      Expense: totalExpenses,
    },
  ];

  return (
    <div className="h-full w-full bg-[#040407]/45 text-zinc-100 flex flex-col p-6 overflow-y-auto scrollbar-none backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wallet className="text-[#D4AF37] h-5 w-5" /> Cash Flow Intelligence
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Log both inflows and outflows, manage transaction records, and analyze net wealth dynamics
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Inflows</span>
            <h2 className="text-lg font-black text-emerald-400 mt-1">₹{totalIncome.toLocaleString("en-IN")}</h2>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <ArrowUpRight className="text-emerald-400" size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Outflows</span>
            <h2 className="text-lg font-black text-rose-400 mt-1">₹{totalExpenses.toLocaleString("en-IN")}</h2>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <ArrowDownRight className="text-rose-400" size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Net Cash Flow</span>
            <h2 className={`text-lg font-black mt-1 ${netSavings >= 0 ? "text-cyan-400" : "text-amber-500"}`}>
              ₹{netSavings.toLocaleString("en-IN")}
            </h2>
          </div>
          <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <DollarSign className="text-cyan-400" size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Left Column: Forms and Charts */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* Unified Logger Form */}
          <div className="p-5 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setType("expense")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  type === "expense"
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Log Outflow (Expense)
              </button>
              <button
                onClick={() => setType("income")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  type === "income"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Log Inflow (Income)
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-${
                    type === "expense" ? "rose-400" : "emerald-400"
                  }`}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="E.g. Freelance project, utility bill..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className={`w-full py-2 rounded-lg text-xs font-bold tracking-wider flex items-center justify-center gap-1.5 text-white ${
                  type === "expense" ? "bg-rose-500 hover:bg-rose-600" : "bg-emerald-500 hover:bg-emerald-600"
                }`}
              >
                <Plus size={13} /> {type === "expense" ? "LOG OUTFLOW" : "LOG INFLOW"}
              </motion.button>
            </form>
          </div>

          {/* Flow Balance Chart */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Flow Comparison
            </h3>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#52525b" fontSize={8} tickLine={false} />
                  <YAxis stroke="#52525b" fontSize={8} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 9 }} />
                  <Legend wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Unified Transaction Ledger */}
        <div className="col-span-12 lg:col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col min-h-[400px]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
            Unified Transaction Ledger
          </h3>

          {transactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-lg">
              <Info className="text-zinc-600 mb-2" size={24} />
              <p className="text-xs text-zinc-500">No records documented yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px] scrollbar-thin">
              {transactions.map((t) => {
                const isEditing = editingId === t.id;

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/40 bg-zinc-900/40 hover:bg-zinc-800/10 transition"
                  >
                    <div className="flex items-center gap-3 flex-1 mr-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0`}
                        style={{
                          background: `${CAT_COLORS[t.category] || "#71717a"}12`,
                          borderColor: `${CAT_COLORS[t.category] || "#71717a"}25`,
                        }}
                      >
                        {t.type === "income" ? (
                          <TrendingUp size={14} className="text-emerald-400" />
                        ) : (
                          <TrendingDown size={14} className="text-rose-400" />
                        )}
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 flex-1 max-w-[280px]">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-xs rounded px-2 py-0.5 w-24 text-white focus:outline-none"
                            />
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-[10px] rounded px-1.5 py-0.5 text-white focus:outline-none"
                            >
                              {(t.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            placeholder="Description"
                            className="bg-zinc-950 border border-zinc-800 text-[10px] rounded px-2 py-0.5 w-full text-zinc-300 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{t.category}</span>
                            <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                              <Calendar size={8} /> {new Date(t.date).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{t.notes || "No description"}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {!isEditing && (
                        <span className={`text-xs font-extrabold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                          {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        {isEditing ? (
                          <button
                            onClick={() => saveEdit(t)}
                            className="text-emerald-400 hover:text-emerald-300 p-1 transition"
                            title="Save changes"
                          >
                            <Check size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => startEdit(t)}
                            className="text-zinc-500 hover:text-white p-1 transition"
                            title="Edit entry"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(t.id, t.type)}
                          className="text-zinc-600 hover:text-rose-400 p-1 transition"
                          title="Delete entry"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
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
