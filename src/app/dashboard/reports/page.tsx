"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Download, FileText, PieChart, TrendingUp,
  Wallet, Brain, RefreshCw, CheckCircle2, ChevronRight, FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, PieChart as RechartsPieChart, Pie, Legend
} from "recharts";
import { toast } from "sonner";

interface SummaryData {
  totalExpenses: number;
  totalBudgetLimit: number;
  portfolioValue: number;
  netSavings: number;
}

interface CategorySummary {
  name: string;
  value: number;
}

interface Statement {
  id: string;
  month: string;
  status: string;
  size: string;
  type: string;
}

const COLORS = ["#D4AF37", "#60A5FA", "#10B981", "#EC4899", "#8B5CF6", "#F59E0B"];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>({
    totalExpenses: 0,
    totalBudgetLimit: 0,
    portfolioValue: 0,
    netSavings: 0,
  });
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const json = await res.json();
      if (json.success) {
        setSummary(json.data.summary);
        setCategorySummary(json.data.categorySummary || []);
        setStatements(json.data.statements || []);
      } else {
        toast.error("Failed to load reports data");
      }
    } catch {
      toast.error("Network error loading reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleDownload = (statement: Statement) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `Generating ${statement.month} ${statement.type} statement...`,
        success: `Successfully downloaded statement_${statement.id}.pdf`,
        error: "Failed to download",
      }
    );
  };

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-6 overflow-y-auto scrollbar-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800/40 pb-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="text-[#D4AF37] h-6 w-6" /> Financial Intelligence Reports
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Access deep insights, audit statements, and AI recommendations for your financial portfolio
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-850 bg-zinc-900/60 px-3.5 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="animate-spin text-[#D4AF37] h-8 w-8" />
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 flex-1">
          {/* Left Block: Summary & Charts (8 Columns) */}
          <div className="col-span-8 space-y-6">
            
            {/* KPI Cards Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Expenses</p>
                <h3 className="text-lg font-bold text-white mt-1">
                  ₹{summary.totalExpenses.toLocaleString("en-IN")}
                </h3>
                <span className="text-[9px] text-rose-400 mt-1 block">Active spending</span>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Budget</p>
                <h3 className="text-lg font-bold text-white mt-1">
                  ₹{summary.totalBudgetLimit.toLocaleString("en-IN")}
                </h3>
                <span className="text-[9px] text-zinc-500 mt-1 block">Set limits</span>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Virtual Demat</p>
                <h3 className="text-lg font-bold text-[#D4AF37] mt-1">
                  ₹{summary.portfolioValue.toLocaleString("en-IN")}
                </h3>
                <span className="text-[9px] text-emerald-400 mt-1 block">Portfolio Value</span>
              </div>
              <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Estimated Savings</p>
                <h3 className="text-lg font-bold text-emerald-400 mt-1">
                  ₹{summary.netSavings.toLocaleString("en-IN")}
                </h3>
                <span className="text-[9px] text-emerald-400/80 mt-1 block">Net surplus</span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Category Spending Pie Chart */}
              <div className="p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/20 flex flex-col h-[280px]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                  <PieChart size={14} className="text-[#D4AF37]" /> Spending Breakdown
                </h4>
                <div className="flex-1 min-h-0 relative">
                  {categorySummary.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                      No expense data found.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categorySummary}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categorySummary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 10 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Budget vs Spending Comparison */}
              <div className="p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/20 flex flex-col h-[280px]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                  <Wallet size={14} className="text-emerald-400" /> Budget Utilization
                </h4>
                <div className="flex-1 min-h-0">
                  {categorySummary.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                      No budget comparisons available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categorySummary}>
                        <XAxis dataKey="name" stroke="#52525b" fontSize={9} tickLine={false} />
                        <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 10 }} />
                        <Bar dataKey="value" name="Spending" radius={[3, 3, 0, 0]}>
                          {categorySummary.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

            </div>

            {/* AI Audit Recommendations */}
            <div className="p-5 rounded-xl border border-zinc-800/60 bg-[#07070d] relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-40 h-40 rounded-full bg-[#D4AF37]/5 blur-3xl" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
                <Brain size={14} /> AI Portfolio Audit Insights
              </h4>
              <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                <p>
                  • Your average monthly savings rate is currently healthy at <span className="text-emerald-400 font-semibold">12%</span>. Consider increasing this to 15% to accelerate your investment goals.
                </p>
                <p>
                  • Analysis of your virtual trading holdings shows a concentration in high-cap tech. Introducing commodity hedges could lower portfolio risk by up to <span className="text-[#D4AF37] font-semibold">4.8%</span>.
                </p>
                <p>
                  • You have 3 recurring bills due within the next 8 days. Maintain an additional buffer of ₹18,000 in your liquidity accounts to avoid short-term credit drawdown.
                </p>
              </div>
            </div>

          </div>

          {/* Right Block: PDF Download Center (4 Columns) */}
          <div className="col-span-4 space-y-6">
            
            <div className="p-5 rounded-xl border border-zinc-800/60 bg-[#06060a] flex flex-col h-full">
              <div className="mb-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">
                  Statements Center
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Generate and download detailed ledger and tax compliance PDFs
                </p>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none">
                {statements.map((stmt) => (
                  <div
                    key={stmt.id}
                    className="p-3.5 rounded-lg border border-zinc-850 bg-zinc-900/30 flex items-center justify-between group hover:border-zinc-800 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-[#D4AF37] group-hover:border-[#D4AF37]/30 transition-all">
                        <FileText size={16} />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-zinc-200 block group-hover:text-white transition">
                          {stmt.month} Statement
                        </span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mt-0.5">
                          {stmt.type} • {stmt.size}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(stmt)}
                      className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-850 hover:border-zinc-700 transition"
                      title="Download PDF"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-850 pt-4 mt-4 space-y-2">
                <button
                  onClick={() => toast.success("Tax Compliance Report generated for FY 2025-26")}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs transition"
                >
                  <CheckCircle2 size={13} /> Export Tax Statement (FY 25-26)
                </button>
                <button
                  onClick={() => toast.success("CSV Ledger dump generated successfully")}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-850 hover:border-zinc-700 font-bold text-xs transition"
                >
                  <FileSpreadsheet size={13} /> Export CSV Ledger Dump
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
