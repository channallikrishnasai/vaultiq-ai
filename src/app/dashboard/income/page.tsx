"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Plus, Trash2, Calendar, FileText,
  DollarSign, BarChart3, Info, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from "recharts";
import { toast } from "sonner";

interface Income {
  id: string;
  amount: number;
  category: string;
  notes?: string;
  date: string;
}

const CAT_COLORS: Record<string, string> = {
  Salary: "#10b981",
  Bonus: "#fb923c",
  Freelance: "#60a5fa",
  Investments: "#D4AF37",
  Others: "#71717a",
};

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Salary");
  const [notes, setNotes] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Mock initial incomes as fallback or user-based state
  const fetchIncomes = useCallback(async () => {
    setLoading(true);
    // Since there's no custom /api/income endpoint in schema.prisma, we will mock the database fetch or save to local storage for persistent state
    try {
      const saved = localStorage.getItem("vaultiq_mock_incomes");
      if (saved) {
        setIncomes(JSON.parse(saved));
      } else {
        const initial = [
          { id: "1", amount: 15450.00, category: "Salary", notes: "Monthly payout", date: new Date().toISOString() }
        ];
        localStorage.setItem("vaultiq_mock_incomes", JSON.stringify(initial));
        setIncomes(initial);
      }
    } catch {
      toast.error("Failed to load income details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    const newIncome: Income = {
      id: Math.random().toString(36).substr(2, 9),
      amount: parsedAmount,
      category,
      notes,
      date: new Date(date).toISOString(),
    };

    const updated = [newIncome, ...incomes];
    localStorage.setItem("vaultiq_mock_incomes", JSON.stringify(updated));
    setIncomes(updated);
    toast.success("Income logged successfully!");
    setAmount("");
    setNotes("");
  };

  const handleDeleteIncome = (id: string) => {
    const updated = incomes.filter((i) => i.id !== id);
    localStorage.setItem("vaultiq_mock_incomes", JSON.stringify(updated));
    setIncomes(updated);
    toast.success("Income entry deleted");
  };

  // Group by category for charts
  const getCategoryData = () => {
    const map: Record<string, number> = {};
    incomes.forEach((e) => {
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
  const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="text-[#10b981] h-5 w-5" /> Income & Inflows Log
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitor incoming cash flows, salary deposits, dividends, and interest payouts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Form & Add (5 Cols) */}
        <div className="col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#10b981] mb-3">Log Inflow</h3>
            <form onSubmit={handleAddIncome} className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Inflow Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                >
                  {["Salary", "Bonus", "Freelance", "Investments", "Others"].map((cat) => (
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Notes / Description</label>
                <input
                  type="text"
                  placeholder="E.g. Paycheck June"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1"
              >
                <Plus size={12} /> LOG INFLOW
              </motion.button>
            </form>
          </div>

          {/* Allocation card */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Categorized Breakdown</span>
              <BarChart3 size={12} className="text-zinc-500" />
            </h3>
            {chartData.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No data yet.</p>
            ) : (
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={8} tickLine={false} />
                    <YAxis stroke="#52525b" fontSize={8} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 9 }} />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      {chartData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History List (7 Cols) */}
        <div className="col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Inflow Ledger</h3>
            <span className="text-xs font-extrabold text-zinc-200 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/50">
              Total: ₹{totalIncome.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>

          {incomes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-lg">
              <Info className="text-zinc-600 mb-2" size={24} />
              <p className="text-xs text-zinc-500">No incomes recorded yet.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
              {incomes.map((e) => (
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
                      <TrendingUp size={12} style={{ color: CAT_COLORS[e.category] || "#71717a" }} />
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
                      onClick={() => handleDeleteIncome(e.id)}
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
