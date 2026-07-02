"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingDown, Plus, Trash2, Calendar, FileText,
  DollarSign, PieChart, Info, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, PieChart as ReChartsPieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from "recharts";
import { toast } from "sonner";

interface Expense {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
}

const CAT_COLORS: Record<string, string> = {
  Food: "#f43f5e",
  Rent: "#3b82f6",
  Utilities: "#fb923c",
  Entertainment: "#a78bfa",
  Transport: "#2dd4bf",
  Others: "#71717a",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form fields
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Food");
  const [notes, setNotes] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/expenses");
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data || []);
      }
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          category,
          notes,
          date: new Date(date),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Expense logged successfully!");
        setAmount("");
        setNotes("");
        fetchExpenses();
      } else {
        toast.error(json.message || "Failed to log expense");
      }
    } catch {
      toast.error("Network error logging expense");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Expense deleted");
        fetchExpenses();
      } else {
        toast.error("Failed to delete expense");
      }
    } catch {
      toast.error("Error deleting expense");
    }
  };

  // Group by category for charts
  const getCategoryData = () => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category;
      map[cat] = (map[cat] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: CAT_COLORS[name] || "#a1a1aa",
    }));
  };

  const chartData = getCategoryData();
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingDown className="text-rose-400 h-5 w-5" /> Expense Intelligence Tracker
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Log your day-to-day outlays and review categorized leak points
          </p>
        </div>
        <button
          onClick={fetchExpenses}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Form & Add (5 Cols) */}
        <div className="col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-3">Log Outflow</h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Outflow Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                >
                  {["Food", "Rent", "Utilities", "Entertainment", "Transport", "Others"].map((cat) => (
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="E.g. Dinner with friends"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1"
              >
                <Plus size={12} /> LOG EXPENSE
              </motion.button>
            </form>
          </div>

          {/* Allocation card */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Categorized Breakdown</span>
              <PieChart size={12} className="text-zinc-500" />
            </h3>
            {chartData.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No data yet.</p>
            ) : (
              <div className="flex items-center gap-3">
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ReChartsPieChart>
                      <Pie data={chartData} dataKey="value" innerRadius={20} outerRadius={32} paddingAngle={2}>
                        {chartData.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Pie>
                    </ReChartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1 flex-1">
                  {chartData.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: e.color }} />
                        <span className="text-zinc-400">{e.name}</span>
                      </div>
                      <span className="font-semibold text-zinc-200">₹{e.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History List (7 Cols) */}
        <div className="col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Outflow Ledger</h3>
            <span className="text-xs font-extrabold text-zinc-200 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/50">
              Total: ₹{totalExpenses.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>

          {expenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-lg">
              <Info className="text-zinc-600 mb-2" size={24} />
              <p className="text-xs text-zinc-500">No expenses recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
              {expenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/40 bg-zinc-900/40 hover:bg-zinc-800/10 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg border"
                      style={{
                        background: `${CAT_COLORS[e.category] || "#71717a"}12`,
                        borderColor: `${CAT_COLORS[e.category] || "#71717a"}25`,
                      }}
                    >
                      <TrendingDown size={12} style={{ color: CAT_COLORS[e.category] || "#71717a" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">{e.category}</span>
                        <span className="text-[9px] text-zinc-500 flex items-center gap-0.5">
                          <Calendar size={8} /> {new Date(e.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{e.notes || "No notes added"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-white">₹{e.amount.toFixed(2)}</span>
                    <button
                      onClick={() => handleDeleteExpense(e.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1 transition"
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
