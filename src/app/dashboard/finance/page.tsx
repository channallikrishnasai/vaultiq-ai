"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, Plus, TrendingUp, TrendingDown, Calendar, Info, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

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
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("Salary");
  const [incomeNotes, setIncomeNotes] = useState("");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split("T")[0]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

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

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(incomeAmount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter valid amount");
    const newItem: Income = {
      id: Math.random().toString(36).substr(2, 9),
      amount: amt,
      category: incomeCategory,
      notes: incomeNotes,
      date: new Date(incomeDate).toISOString(),
    };
    const updated = [newItem, ...incomes];
    localStorage.setItem("vaultiq_mock_incomes", JSON.stringify(updated));
    setIncomes(updated);
    toast.success("Income logged");
    setIncomeAmount("");
    setIncomeNotes("");
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expenseAmount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter valid amount");
    const newItem: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      amount: amt,
      category: expenseCategory,
      notes: expenseNotes,
      date: new Date(expenseDate).toISOString(),
    };
    const updated = [newItem, ...expenses];
    localStorage.setItem("vaultiq_mock_expenses", JSON.stringify(updated));
    setExpenses(updated);
    toast.success("Expense logged");
    setExpenseAmount("");
    setExpenseNotes("");
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

  const getIncomeChartData = () => {
    const map: Record<string, number> = {};
    incomes.forEach(i => (map[i.category] = (map[i.category] || 0) + i.amount));
    return Object.entries(map).map(([name, value]) => ({ name, value, color: INCOME_COLORS[name] || "#a1a1aa" }));
  };

  const getExpenseChartData = () => {
    const map: Record<string, number> = {};
    expenses.forEach(e => (map[e.category] = (map[e.category] || 0) + e.amount));
    return Object.entries(map).map(([name, value]) => ({ name, value, color: EXPENSE_COLORS[name] || "#a1a1aa" }));
  };

  const incomeChart = getIncomeChartData();
  const expenseChart = getExpenseChartData();
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="text-amber-400 h-5 w-5" /> Finance Overview
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">Combined Income & Expense tracker</p>
        </div>
        <button onClick={() => { fetchIncomes(); fetchExpenses(); }} className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition">
          <RefreshCw size={12} className={incomeLoading && expenseLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <div className="flex gap-4 mb-4">
        <form onSubmit={handleAddIncome} className="flex-1 space-y-2">
          <h2 className="text-sm font-semibold text-[#10b981]">Add Income</h2>
          <input type="number" placeholder="Amount" step="any" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
          <select value={incomeCategory} onChange={e => setIncomeCategory(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white">
            {Object.keys(INCOME_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="date" value={incomeDate} onChange={e => setIncomeDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
          <input type="text" placeholder="Notes" value={incomeNotes} onChange={e => setIncomeNotes(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1">
            <Plus size={12} /> Log Income
          </motion.button>
        </form>
        <form onSubmit={handleAddExpense} className="flex-1 space-y-2">
          <h2 className="text-sm font-semibold text-rose-400">Add Expense</h2>
          <input type="number" placeholder="Amount" step="any" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none" />
          <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white">
            {Object.keys(EXPENSE_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
          <input type="text" placeholder="Notes" value={expenseNotes} onChange={e => setExpenseNotes(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white" />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1">
            <Plus size={12} /> Log Expense
          </motion.button>
        </form>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
          <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center justify-between">
            Income Breakdown <BarChart3 size={12} className="text-[#10b981]" />
          </h3>
          {incomeChart.length === 0 ? <p className="text-xs text-zinc-500 text-center py-6">No income data.</p> : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={incomeChart}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 9 }} />
                <Bar dataKey="value" radius={[2,2,0,0]}>
                  {incomeChart.map((entry,i)=> <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
          <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center justify-between">
            Expense Breakdown <TrendingDown size={12} className="text-rose-400" />
          </h3>
          {expenseChart.length === 0 ? <p className="text-xs text-zinc-500 text-center py-6">No expense data.</p> : (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={expenseChart}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 9 }} />
                <Bar dataKey="value" radius={[2,2,0,0]}>
                  {expenseChart.map((entry,i)=> <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase text-zinc-400">Income Ledger</h3>
            <span className="text-xs font-extrabold text-[#10b981] bg-zinc-800/60 px-2 py-0.5 rounded">Total: ₹{totalIncome.toLocaleString("en-IN", {maximumFractionDigits:2})}</span>
          </div>
          {incomes.length===0 ? (
            <div className="flex-1 flex items-center justify-center py-6"><Info size={24} className="text-zinc-600" /><p className="text-xs text-zinc-5">No incomes recorded.</p></div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {incomes.map(i => (
                <div key={i.id} className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: `${INCOME_COLORS[i.category]||"#71717a"}12`, borderColor: `${INCOME_COLORS[i.category]||"#71717a"}25`}}>
                      <TrendingUp size={12} style={{ color: INCOME_COLORS[i.category]||"#71717a" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5"><span className="text-xs font-bold text-white">{i.category}</span><span className="text-[9px] text-zinc-500 flex items-center"><Calendar size={8} /> {new Date(i.date).toLocaleDateString()}</span></div>
                      <p className="text-[10px] text-zinc-400">{i.notes || "No notes"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">₹{i.amount.toFixed(2)}</span>
                    <button onClick={() => handleDeleteIncome(i.id)} className="text-zinc-600 hover:text-rose-400 p-1"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase text-zinc-400">Expense Ledger</h3>
            <span className="text-xs font-extrabold text-rose-400 bg-zinc-800/60 px-2 py-0.5 rounded">Total: ₹{totalExpense.toLocaleString("en-IN", {maximumFractionDigits:2})}</span>
          </div>
          {expenses.length===0 ? (
            <div className="flex-1 flex items-center justify-center py-6"><Info size={24} className="text-zinc-600" /><p className="text-xs text-zinc-5">No expenses recorded.</p></div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded bg-zinc-900/40 border border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: `${EXPENSE_COLORS[e.category]||"#71717a"}12`, borderColor: `${EXPENSE_COLORS[e.category]||"#71717a"}25`}}>
                      <TrendingDown size={12} style={{ color: EXPENSE_COLORS[e.category]||"#71717a" }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5"><span className="text-xs font-bold text-white">{e.category}</span><span className="text-[9px] text-zinc-500 flex items-center"><Calendar size={8} /> {new Date(e.date).toLocaleDateString()}</span></div>
                      <p className="text-[10px] text-zinc-400">{e.notes || "No notes"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white">₹{e.amount.toFixed(2)}</span>
                    <button onClick={() => handleDeleteExpense(e.id)} className="text-zinc-600 hover:text-rose-400 p-1"><Trash2 size={12} /></button>
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
