"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Plus, Trash2, Calendar, Check, AlertCircle, Info, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  paid: boolean;
}

interface BillsClientProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export function BillsClient({ user }: BillsClientProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("Subscription");
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bills");
      const json = await res.json();
      if (json.success) {
        setBills(json.data || []);
      }
    } catch {
      toast.error("Failed to load bills organizer");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: parsedAmount,
          dueDate: new Date(dueDate),
          category,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Bill registered successfully!");
        setName("");
        setAmount("");
        fetchBills();
      } else {
        toast.error(json.message || "Failed to log bill");
      }
    } catch {
      toast.error("Network error logging bill");
    }
  };

  const handleDeleteBill = async (id: string) => {
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Bill removed");
        fetchBills();
      } else {
        toast.error("Failed to remove bill");
      }
    } catch {
      toast.error("Error removing bill");
    }
  };

  const handleTogglePaid = async (id: string) => {
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "PATCH" });
      const json = await res.json();
      if (json.success) {
        toast.success("Payment status updated!");
        fetchBills();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Error updating bill status");
    }
  };

  const unpaidTotal = bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="h-full w-full bg-[#040407]/45 text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="text-rose-400 h-5 w-5" /> Bills & Subscriptions Organizer
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Log active obligations, mark payment status, and verify auto-deductions from Demat balance
          </p>
        </div>
        <button
          onClick={fetchBills}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        {/* Left Column: Form (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-3">Register Outflow obligation</h3>
            <form onSubmit={handleAddBill} className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Obligation Name</label>
                <input
                  type="text"
                  placeholder="E.g. Broadband, Netflix..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Due Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
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
                    {["Subscription", "Utilities", "Rent", "Credit Card", "Insurance", "Others"].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1"
              >
                <Plus size={12} /> REGISTER BILL
              </motion.button>
            </form>
          </div>

          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <AlertCircle size={12} className="text-rose-400" /> Auto-Deductions Integrated
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              When a bill is marked as **Paid**, the amount is automatically deducted from your Demat balance and logged as a cash flow outflow expense entry instantly.
            </p>
          </div>
        </div>

        {/* Right Column: Timeline Obligation Cards (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-850 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Timeline Obligations</h3>
            <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Unpaid: ₹{unpaidTotal.toLocaleString("en-IN")}
            </span>
          </div>

          {bills.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-lg">
              <Info className="text-zinc-600 mb-2" size={24} />
              <p className="text-xs text-zinc-500">No active obligations logged.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px] scrollbar-thin">
              {bills.map((b) => {
                const isOverdue = !b.paid && new Date(b.dueDate).getTime() < Date.now();

                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-lg border flex items-center justify-between gap-4 transition ${
                      b.paid
                        ? "border-emerald-500/20 bg-emerald-500/5 opacity-70"
                        : isOverdue
                        ? "border-rose-500/40 bg-rose-500/10"
                        : "border-zinc-800/40 bg-zinc-900/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${b.paid ? "line-through text-zinc-500" : "text-white"}`}>
                          {b.name}
                        </span>
                        <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 capitalize">
                          {b.category}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 flex items-center gap-0.5 mt-1">
                        <Calendar size={8} /> Due: {new Date(b.dueDate).toLocaleDateString()}
                        {isOverdue && <span className="text-rose-400 font-bold ml-1">• OVERDUE</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-zinc-200 block">
                          ₹{b.amount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTogglePaid(b.id)}
                          className={`p-1 rounded-lg border transition ${
                            b.paid
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                              : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500"
                          }`}
                          title={b.paid ? "Mark unpaid" : "Mark paid (triggers auto-deduct)"}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(b.id)}
                          className="text-zinc-650 hover:text-rose-400 p-1 transition"
                          title="Delete bill"
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
