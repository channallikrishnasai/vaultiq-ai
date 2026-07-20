"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronRight, ChevronDown } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, Tooltip,
} from "recharts";
import { DashboardData } from "@/types/dashboard";

// ── Dynamic data derived from user profile ─────────────────────────────────────

const NOTIFS = [
  { title: "Welcome",         desc: "Set up your financial profile to get started.",      time: "Now", dot: "#D4AF37", bg: "rgba(212,175,55,0.08)"  },
];

const TABS = ["Portfolio","Spending","Cash Flow","Goals","Investments","Reports","AI Insights"];

const PORT  = [{m:"Jan",v:400},{m:"Feb",v:440},{m:"Mar",v:420},{m:"Apr",v:510},{m:"May",v:480},{m:"Jun",v:560},{m:"Jul",v:610},{m:"Aug",v:630},{m:"Sep",v:600},{m:"Oct",v:680},{m:"Nov",v:720},{m:"Dec",v:800}];
const SPEND = [{m:"J",v:600},{m:"F",v:800},{m:"M",v:750},{m:"A",v:900},{m:"M",v:850},{m:"J",v:960},{m:"J",v:880},{m:"A",v:940},{m:"S",v:870},{m:"O",v:1000}];
const CASH  = [{m:"Jan",i:15,o:8},{m:"Feb",i:16,o:8.5},{m:"Mar",i:15.5,o:7.9},{m:"Apr",i:18,o:10}];
const PIE   = [{name:"Equity",v:55,c:"#10b981"},{name:"Debt",v:25,c:"#60a5fa"},{name:"Gold",v:10,c:"#D4AF37"},{name:"Cash",v:10,c:"#34d399"}];
const HEAT  = [{r:"Anim",d:[2,4,3,1,5,2]},{r:"Reacto",d:[1,2,4,3,2,1]},{r:"Rashly",d:[3,1,2,4,1,3]},{r:"April",d:[4,3,1,2,3,4]},{r:"May",d:[2,4,3,5,2,1]}];
const INC   = [{m:"Income",v:7200,f:"#10b981"},{m:"Income2",v:6800,f:"#10b981"},{m:"Expense",v:3900,f:"#ef4444"},{m:"Variance",v:3200,f:"#60a5fa"}];

const TT = { contentStyle: { display: "none" }, cursor: false as any };

function Label({ text }: { text: string }) {
  return <p className="text-[8px] font-bold text-zinc-300 mb-1.5">{text}</p>;
}

export default function AnalyticsWorkspace({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState("Portfolio");

  const PORT = data.portfolio.totalValue > 0
    ? [{ m: "Now", v: data.portfolio.totalValue }]
    : [{ m: "", v: 0 }];
  const SPEND = data.expenses.categories.length > 0
    ? data.expenses.categories.slice(0, 10).map((c) => ({ m: c.name.slice(0, 1), v: c.amount }))
    : [{ m: "", v: 0 }];
  const CASH = data.monthlyIncome > 0
    ? [{ m: "Now", i: data.monthlyIncome, o: data.monthlyExpenses }]
    : [{ m: "", i: 0, o: 0 }];
  const PIE = data.portfolio.allocation.length > 0
    ? data.portfolio.allocation.map((a) => ({ name: a.name, v: a.percent, c: a.color === "bg-teal-500" ? "#10b981" : a.color === "bg-emerald-500" ? "#34d399" : "#60a5fa" }))
    : [{ name: "No Data", v: 100, c: "#3f3f46" }];
  const HEAT = [{ r: "Income", d: [data.monthlyIncome > 0 ? 4 : 0, data.savingsRate > 20 ? 4 : data.savingsRate > 0 ? 2 : 0, data.healthScore.score > 70 ? 4 : data.healthScore.score > 0 ? 2 : 0, 0, 0, 0] }];
  const INC = data.monthlyIncome > 0
    ? [
        { m: "Income", v: data.monthlyIncome, f: "#10b981" },
        { m: "Expense", v: data.monthlyExpenses, f: "#ef4444" },
        { m: "Savings", v: data.monthlyIncome - data.monthlyExpenses, f: "#60a5fa" },
      ]
    : [{ m: "Income", v: 0, f: "#10b981" }];

  const chart = () => {
    switch (tab) {
      case "Portfolio":
        return <>
          <Label text="Portfolio" />
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PORT}>
                <XAxis dataKey="m" stroke="#3f3f46" fontSize={6} tickLine={false} axisLine={false} />
                <Tooltip {...TT} />
                <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Portfolio Allocation donut below */}
          <Label text="Portfall Allocation" />
          <div className="flex items-center gap-2">
            <div style={{ width: 60, height: 60, position: "relative", flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={PIE} dataKey="v" innerRadius={16} outerRadius={28} paddingAngle={2}>
                    {PIE.map((e,i)=><Cell key={i} fill={e.c}/>)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 flex-1">
              {PIE.map((e,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full" style={{background:e.c}}/>
                    <span className="text-[6.5px] text-zinc-400">{e.name}</span>
                  </div>
                  <span className="text-[6.5px] font-semibold text-zinc-200">{e.v}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Monthly Spending */}
          <Label text="Monthly Spending" />
          <div className="h-[70px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPEND}>
                <XAxis dataKey="m" stroke="#3f3f46" fontSize={5} tickLine={false} axisLine={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="v" radius={[2,2,0,0]}>
                  {SPEND.map((_,i)=><Cell key={i} fill={["#60a5fa","#a78bfa","#f43f5e","#10b981","#D4AF37","#34d399","#fb923c","#e879f9","#38bdf8","#facc15"][i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Performance Heatmap */}
          <Label text="Performance Heatmap" />
          <div className="space-y-0.5">
            {HEAT.map((row,ri)=>(
              <div key={ri} className="flex items-center gap-1">
                <span className="text-[5.5px] text-zinc-600 w-6 shrink-0 text-right">{row.r}</span>
                <div className="flex gap-0.5 flex-1">
                  {row.d.map((v,vi)=>(
                    <div key={vi} className="flex-1 h-3 rounded-sm" style={{
                      background: v < 2 ? "rgba(239,68,68,0.55)"
                        : v < 3 ? "rgba(234,179,8,0.45)"
                        : v < 4 ? "rgba(34,197,94,0.40)"
                        : "rgba(34,197,94,0.72)",
                    }}/>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex gap-0.5 pl-7 mt-0.5">
              {[1,2,3,4,5].map(n=>(
                <span key={n} className="flex-1 text-center text-[5px] text-zinc-700">{n}</span>
              ))}
            </div>
          </div>
          {/* Income vs Expenses */}
          <Label text="Income vs. Expenses" />
          <div className="h-[70px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INC}>
                <XAxis dataKey="m" stroke="#3f3f46" fontSize={5} tickLine={false} axisLine={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="v" radius={[2,2,0,0]}>
                  {INC.map((e,i)=><Cell key={i} fill={e.f}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>;

      case "Cash Flow":
        return <>
          <Label text="Inflow vs. Outflow" />
          <div className="h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CASH}>
                <XAxis dataKey="m" stroke="#3f3f46" fontSize={6} tickLine={false} axisLine={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="i" fill="#10b981" radius={[2,2,0,0]}/>
                <Bar dataKey="o" fill="#ef4444" radius={[2,2,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>;

      case "Spending":
        return <>
          <Label text="Monthly Spending" />
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SPEND}>
                <XAxis dataKey="m" stroke="#3f3f46" fontSize={6} tickLine={false} axisLine={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="v" radius={[2,2,0,0]}>
                  {SPEND.map((_,i)=><Cell key={i} fill={["#60a5fa","#a78bfa","#f43f5e","#10b981","#D4AF37","#34d399","#fb923c","#e879f9","#38bdf8","#facc15"][i]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>;

      default:
        return <>
          <Label text="Income vs. Expenses" />
          <div className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INC}>
                <XAxis dataKey="m" stroke="#3f3f46" fontSize={6} tickLine={false} axisLine={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="v" radius={[2,2,0,0]}>
                  {INC.map((e,i)=><Cell key={i} fill={e.f}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>;
    }
  };

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{ background: "rgba(6,4,1,0.93)", borderLeft: "1px solid rgba(212,175,55,0.12)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)" }}
    >
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5 scrollbar-none">

        {/* ── Smart Notification ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div style={{width:3,height:12,borderRadius:2,background:"#D4AF37",boxShadow:"0 0 6px #D4AF3788"}}/>
              <Bell size={11} className="text-zinc-300" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-100">Smart notification</span>
            </div>
            <motion.div
              animate={{ opacity: [0.4,1,0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full"
              style={{ background: "#D4AF37", boxShadow: "0 0 6px #D4AF3788" }}
            />
          </div>

          <div className="space-y-1.5">
            {NOTIFS.map((n, i) => (
              <motion.div
                key={i}
                initial={{ opacity:0, x:10 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-2.5 rounded-xl px-2.5 py-2"
                style={{ background: n.bg, border: `1px solid ${n.dot}33`, boxShadow: `0 2px 8px rgba(0,0,0,0.4)` }}
              >
                <span className="mt-[6px] h-2 w-2 rounded-full shrink-0 flex-none" style={{ background: n.dot, boxShadow: `0 0 5px ${n.dot}99` }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-bold text-zinc-100 truncate">{n.title}</span>
                    <span className="text-[7px] text-zinc-600 shrink-0 ml-1">{n.time}</span>
                  </div>
                  <p className="text-[7.5px] text-zinc-500 leading-tight truncate mt-0.5">{n.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Analytics Workspace ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div style={{width:3,height:12,borderRadius:2,background:"#D4AF37",boxShadow:"0 0 6px #D4AF3788"}}/>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-100">Analytics workspace</span>
            </div>
            <X size={9} className="text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors" />
          </div>

          {/* Tab strip */}
          <div className="flex gap-0.5 overflow-x-auto pb-1.5 scrollbar-none mb-2.5">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="shrink-0 rounded-md px-1.5 py-1 text-[6.5px] font-bold uppercase tracking-wider border transition-all"
                style={
                  tab === t
                    ? { background:"rgba(212,175,55,0.12)", borderColor:"rgba(212,175,55,0.4)", color:"#D4AF37", boxShadow:"0 0 8px rgba(212,175,55,0.15)", borderBottom:"2px solid #D4AF37" }
                    : { background:"rgba(255,255,255,0.02)", borderColor:"rgba(255,255,255,0.06)", color:"#52525b" }
                }
              >
                {t}
              </button>
            ))}
          </div>

          {/* Charts */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              transition={{ duration: 0.15 }}
              className="space-y-2"
            >
              {chart()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Personalised AI ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5 cursor-pointer">
            <div className="flex items-center gap-2">
              <div style={{width:3,height:12,borderRadius:2,background:"#a78bfa",boxShadow:"0 0 6px #a78bfa88"}}/>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-100">Personalised AI</span>
            </div>
            <ChevronDown size={9} className="text-zinc-600" />
          </div>

          <div className="space-y-1.5">
            {(data.portfolio.totalValue > 0
              ? [
                  { t:"Portfolio Status",    b:`Total value: ₹${data.portfolio.totalValue.toLocaleString("en-IN")}. ${data.portfolio.changePercent >= 0 ? "Up" : "Down"} ${Math.abs(data.portfolio.changePercent)}% this period.` },
                  { t:"Savings Rate", b:`Current rate: ${data.savingsRate}%. ${data.savingsRate >= 20 ? "Above recommended 20% target." : "Below recommended 20% target."}` },
                  { t:"Goals Progress",      b:`${data.goalsTotal} goal(s) tracked. ${data.goals.length > 0 ? data.goals[0].name + " at " + data.goals[0].percent + "%" : "No goals set yet."}`   },
                ]
              : [
                  { t:"Getting Started",    b:"Complete onboarding to populate your financial dashboard." },
                  { t:"Add Investments", b:"Create a portfolio and add trades to track your investments." },
                  { t:"Set Goals",      b:"Define savings goals to monitor your financial progress."   },
                ]
            ).map((item,i) => (
              <div
                key={i}
                className="rounded-lg p-2"
                style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-[7.5px] font-bold uppercase tracking-wide text-zinc-300 mb-0.5">{item.t}</p>
                <p className="text-[7px] leading-relaxed text-zinc-500">{item.b}</p>
              </div>
            ))}

            <motion.button
              whileHover={{ scale:1.01 }}
              whileTap={{ scale:0.99 }}
              className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[7.5px] font-bold uppercase tracking-wider transition-colors"
              style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.22)", color:"#D4AF37" }}
            >
              Actionable insights <ChevronRight size={8}/>
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  );
}
