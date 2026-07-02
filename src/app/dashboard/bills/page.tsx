"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
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

export default function BillsPage() {
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
      const saved = localStorage.getItem("vaultiq_mock_bills");
      if (saved) {
        setBills(JSON.parse(saved));
      } else {
        const initial = [
          { id: "1", name: "YouTube Premium", amount: 189, dueDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split("T")[0], category: "Subscription", paid: false },
          { id: "2", name: "Electricity Bill", amount: 2450, dueDate: new Date(Date.now() + 10*24*60*60*1000).toISOString().split("T")[0], category: "Utilities", paid: false },
          { id: "3", name: "AWS Cloud Host", amount: 1540, dueDate: new Date(Date.now() - 2*24*60*60*1000).toISOString().split("T")[0], category: "Others", paid: true },
        ];
        localStorage.setItem("vaultiq_mock_bills", JSON.stringify(initial));
        setBills(initial);
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

  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid positive amount");
      return;
    }

    const newBill: Bill = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      amount: parsedAmount,
      dueDate,
      category,
      paid: false,
    };

    const updated = [newBill, ...bills];
    localStorage.setItem("vaultiq_mock_bills", JSON.stringify(updated));
    setBills(updated);
    toast.success("Bill registered successfully!");
    setName("");
    setAmount("");
  };

  const handleDeleteBill = (id: string) => {
    const updated = bills.filter((b) => b.id !== id);
    localStorage.setItem("vaultiq_mock_bills", JSON.stringify(updated));
    setBills(updated);
    toast.success("Bill removed");
  };

  const handleTogglePaid = (id: string) => {
    const updated = bills.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b));
    localStorage.setItem("vaultiq_mock_bills", JSON.stringify(updated));
    setBills(updated);
    toast.success("Payment status updated!");
  };

  const unpaidTotal = bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="text-[#60a5fa] h-5 w-5" /> Bills & Subscription Organizer
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Keep track of recurring cloud servers, entertainment subscriptions, and utilities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Form (5 Cols) */}
        <div className="col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#60a5fa] mb-3">Add Bill Reminder</h3>
            <form onSubmit={handleAddBill} className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Bill Name / Service</label>
                <input
                  type="text"
                  placeholder="E.g. Netflix, Electricity"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#60a5fa]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="Subscription">Subscription</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Rent">Rent</option>
                    <option value="Others">Others</option>
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
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-[#60a5fa] hover:bg-blue-600 text-white font-bold py-2 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1"
              >
                <Plus size={12} /> ADD BILL REMINDER
              </motion.button>
            </form>
          </div>

          {/* Organizer Info */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
              <AlertCircle size={12} className="text-[#60a5fa]" /> Auto Reminders
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              VaultIQ AI monitors due dates and sends warnings to prevent late charges and service interruptions.
            </p>
          </div>
        </div>

        {/* Right Column: Ledger List (7 Cols) */}
        <div className="col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800/40 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Bills Ledger</h3>
            <span className="text-[10px] font-semibold text-zinc-400">
              Unpaid Total: ₹{unpaidTotal.toLocaleString()}
            </span>
          </div>

          {bills.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-lg">
              <Info className="text-zinc-600 mb-2" size={24} />
              <p className="text-xs text-zinc-500">No scheduled bill reminders.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
              {bills.map((b) => {
                const isOverdue = new Date(b.dueDate) < new Date() && !b.paid;
                return (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition ${b.paid ? "bg-zinc-900/10 border-zinc-850 opacity-60" : isOverdue ? "bg-rose-500/5 border-rose-500/20" : "bg-zinc-900/20 border-zinc-800/30"}`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleTogglePaid(b.id)}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg border transition ${b.paid ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" : "border-zinc-700 hover:border-zinc-500 text-transparent"}`}
                      >
                        <Check size={10} className="stroke-[3]" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${b.paid ? "line-through text-zinc-500" : "text-white"}`}>
                            {b.name}
                          </span>
                          {isOverdue && (
                            <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 rounded font-bold uppercase">
                              Overdue
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-zinc-500 block mt-0.5">
                          Due: {b.dueDate} · {b.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-white">₹{b.amount.toLocaleString()}</span>
                      <button
                        onClick={() => handleDeleteBill(b.id)}
                        className="text-zinc-650 hover:text-rose-400 p-1 transition"
                      >
                        <Trash2 size={12} />
                      </button>
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
