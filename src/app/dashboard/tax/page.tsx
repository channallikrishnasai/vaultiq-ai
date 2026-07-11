"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Receipt, RefreshCw, BarChart2, ShieldAlert, Award, Info
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, Tooltip } from "recharts";

export default function TaxPage() {
  const [income, setIncome] = useState<string>("1200000");
  const [deductions, setDeductions] = useState<string>("150000");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const calcOldRegime = (inc: number, ded: number) => {
    const taxable = Math.max(0, inc - ded);
    let tax = 0;
    // standard slab old
    if (taxable <= 250000) tax = 0;
    else if (taxable <= 500000) tax = (taxable - 250000) * 0.05;
    else if (taxable <= 1000000) tax = 12500 + (taxable - 500000) * 0.20;
    else tax = 112500 + (taxable - 1000000) * 0.30;
    return tax;
  };

  const calcNewRegime = (inc: number) => {
    // New slab
    let tax = 0;
    if (inc <= 300000) tax = 0;
    else if (inc <= 600000) tax = (inc - 300000) * 0.05;
    else if (inc <= 900000) tax = 15000 + (inc - 600000) * 0.10;
    else if (inc <= 1200000) tax = 45000 + (inc - 900000) * 0.15;
    else if (inc <= 1500000) tax = 90000 + (inc - 1200000) * 0.20;
    else tax = 150000 + (inc - 1500000) * 0.30;
    return tax;
  };

  if (!mounted) {
    return (
      <div className="h-full w-full bg-[#040407] text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-500 text-xs">Loading Tax intelligence Planner...</div>
      </div>
    );
  }

  const incVal = parseFloat(income) || 0;
  const dedVal = parseFloat(deductions) || 0;

  const oldTax = calcOldRegime(incVal, dedVal);
  const newTax = calcNewRegime(incVal);
  const difference = Math.abs(oldTax - newTax);
  const betterRegime = oldTax < newTax ? "Old Regime" : "New Regime";

  const chartData = [
    { name: "Old Regime", Tax: oldTax, color: "#ef4444" },
    { name: "New Regime", Tax: newTax, color: "#10b981" },
  ];

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Receipt className="text-[#60a5fa] h-5 w-5" /> Tax Intelligence Planner
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Compare Old vs. New tax regime slabs and access AI-driven tax saving suggestions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Form & Inputs (5 Cols) */}
        <div className="col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#60a5fa] mb-3">Tax Calculator</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Annual gross income (₹)</label>
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#60a5fa]"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Total Deductions (80C, 80D etc.) (₹)</label>
                <input
                  type="number"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#60a5fa]"
                />
              </div>
            </div>
          </div>

          {/* Platform suitability suggestion */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Award size={12} className="text-emerald-400" /> Platform Suitability
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Based on your trading volume and bracket, using Zerodha or Groww for mutual funds and direct equity will save you up to ₹12,000 yearly in brokerages.
            </p>
          </div>
        </div>

        {/* Right Column: Comparison & Suggestions (7 Cols) */}
        <div className="col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Comparison</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">Old Regime Tax</span>
              <h2 className="text-lg font-bold text-rose-400 mt-1">₹{oldTax.toLocaleString("en-IN")}</h2>
            </div>
            <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40">
              <span className="text-[9px] uppercase font-bold text-zinc-500 block">New Regime Tax</span>
              <h2 className="text-lg font-bold text-emerald-400 mt-1">₹{newTax.toLocaleString("en-IN")}</h2>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 mb-4 text-xs">
            🎉 <strong>{betterRegime}</strong> is better for you. You save <strong>₹{difference.toLocaleString("en-IN")}</strong>.
          </div>

          {/* Chart comparison */}
          <div className="h-[120px] w-full min-w-0 relative mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#52525b" fontSize={8} tickLine={false} />
                <YAxis stroke="#52525b" fontSize={8} tickLine={false} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 9 }} />
                <Bar dataKey="Tax" radius={[2, 2, 0, 0]}>
                  {chartData.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

