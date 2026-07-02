"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Shield, Zap } from "lucide-react";
import {
  LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, Tooltip,
} from "recharts";

// ── Chart data ────────────────────────────────────────────────────────────────
const SPARK  = [{v:30},{v:55},{v:40},{v:70},{v:60},{v:85},{v:75},{v:100}];
const SPARK2 = [{v:20},{v:38},{v:30},{v:52},{v:45},{v:65},{v:58},{v:80}];
const CASH_D = [{m:"",i:80,o:40},{m:"",i:90,o:55},{m:"",i:70,o:35},{m:"",i:100,o:60}];
const PIE3   = [{v:60,c:"#10b981"},{v:20,c:"#D4AF37"},{v:20,c:"#60a5fa"}];
const GOALS_D= [{v:25},{v:40},{v:55},{v:50},{v:70},{v:65},{v:82}];
const PIE_EF = [{v:85,c:"#60a5fa"},{v:15,c:"rgba(255,255,255,0.06)"}];
const INV_D  = [{v:40},{v:55},{v:48},{v:72},{v:65},{v:90},{v:85},{v:110}];

const TT = { contentStyle: { display: "none" }, cursor: false as any };

// ── Shared card style ─────────────────────────────────────────────────────────
const C = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: "absolute",
  background: "rgba(7,5,2,0.93)",
  border: "1px solid rgba(212,175,55,0.28)",
  borderRadius: 14,
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  boxShadow: "0 10px 40px rgba(0,0,0,0.85), 0 0 20px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
  overflow: "hidden",
  padding: "12px 14px",
  color: "#fff",
  zIndex: 5,
  ...extra,
});

function CardHeader({ label, accent = "#D4AF37", isMinimized, onToggle }: {
  label: string;
  accent?: string;
  isMinimized: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5">
        <div style={{ width: 3, height: 10, borderRadius: 2, background: accent, boxShadow: `0 0 6px ${accent}88` }} />
        <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>
          {label}
        </span>
      </div>
      <button
        onClick={onToggle}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {isMinimized ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
    </div>
  );
}

interface Props {
  netWorth?: number;
  monthlyIncome?: number;
  savingsRate?: number;
  healthScore?: number;
  goals?: { name: string; percent: number }[];
}

export default function DashboardFloatingCards({
  netWorth = 1280450.78,
  monthlyIncome = 7890.12,
  savingsRate = 48.9,
  healthScore = 94,
  goals = [],
}: Props) {
  const [minimized, setMinimized] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem("kpi-minimized-state");
    if (saved) setMinimized(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("kpi-minimized-state", JSON.stringify(minimized));
  }, [minimized]);

  const toggleMinimize = (key: string) => {
    setMinimized(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const goalList = goals.length
    ? goals.slice(0, 3)
    : [
        { name: "Home purchase", percent: 32 },
        { name: "Retirement",    percent: 90 },
        { name: "Vacation",      percent: 55 },
      ];

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      {/* ══ PORTFOLIO PERFORMANCE — top center ══ */}
      <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
        style={C({ width: 204, top: "3%", left: "50%", transform: "translateX(-50%)" })}>
        <CardHeader label="Portfolio Performance" isMinimized={minimized["portfolio"]} onToggle={() => toggleMinimize("portfolio")} />
        {!minimized["portfolio"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:4}}>Overall return</p>
            <div className="flex items-center gap-2.5 mb-2">
              <span style={{fontSize:20,fontWeight:800,color:"#D4AF37",lineHeight:1}}>+15.45%</span>
              <span style={{fontSize:9,color:"#10b981",fontWeight:700,background:"rgba(16,185,129,0.12)",padding:"2px 6px",borderRadius:4}}>+14.55%</span>
            </div>
            <div style={{height:44}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SPARK}>
                  <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={2} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-1.5">
              <span style={{fontSize:7.5,color:"rgba(255,255,255,0.35)"}}>Debt volume</span>
              <span style={{fontSize:7.5,color:"#ef4444",fontWeight:700}}>-76.82%</span>
              <span style={{fontSize:7.5,color:"rgba(255,255,255,0.35)"}}>Best invest</span>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ NET WORTH — left upper ══ */}
      <motion.div initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:0.25}}
        style={C({ width: 172, top: "12%", left: "21%" })}>
        <CardHeader label="Net Worth" isMinimized={minimized["netWorth"]} onToggle={() => toggleMinimize("netWorth")} />
        {!minimized["netWorth"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:5}}>Total assets</p>
            <p style={{fontSize:17,fontWeight:800,color:"#D4AF37",lineHeight:1,marginBottom:7,textShadow:"0 0 20px rgba(212,175,55,0.45)"}}>
              {fmt(netWorth)}
            </p>
            <div style={{height:40}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SPARK}>
                  <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.8} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span style={{fontSize:8,color:"#10b981",fontWeight:700}}>+$13,250.00</span>
              <span style={{fontSize:7,color:"rgba(255,255,255,0.25)"}}>2016 · 2020 · 2023</span>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ TAX PLANNER (upper) — left mid-upper ══ */}
      <motion.div initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:0.3}}
        style={C({ width: 178, top: "31%", left: "21%", borderColor:"rgba(96,165,250,0.28)" })}>
        <CardHeader label="Tax Planner" accent="#60a5fa" isMinimized={minimized["taxPlanner"]} onToggle={() => toggleMinimize("taxPlanner")}/>
        {!minimized["taxPlanner"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:7}}>Projected tax liability</p>
            <div className="space-y-1.5">
              {[
                {k:"Amounts",  v:"$1,500.00", c:"#f4f4f5"},
                {k:"Due date", v:"08.06.2023",c:"rgba(255,255,255,0.5)"},
                {k:"Dep. cont",v:"08.06.2023",c:"rgba(255,255,255,0.5)"},
                {k:"Tax tax",  v:"03.05.2023",c:"rgba(255,255,255,0.5)"},
                {k:"Deadlines",v:"08.06.2022",c:"rgba(255,255,255,0.5)"},
              ].map((r,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{background:"#60a5fa",boxShadow:"0 0 4px #60a5fa88"}}/>
                    <span style={{fontSize:8,color:"rgba(255,255,255,0.5)"}}>{r.k}</span>
                  </div>
                  <span style={{fontSize:8,color:r.c,fontWeight:r.c==="#f4f4f5"?700:400}}>{r.v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ══ FRAUD SHIELD + AI TWIN — left mid ══ */}
      <motion.div initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:0.35}}
        style={C({ width: 178, top: "52%", left: "21%", borderColor:"rgba(251,146,60,0.28)" })}>
        <div className="flex items-center gap-2 justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div style={{width:3,height:10,borderRadius:2,background:"#fb923c",boxShadow:"0 0 6px #fb923c88"}}/>
            <p style={{fontSize:8.5,fontWeight:700,color:"#fb923c",letterSpacing:"0.1em",textTransform:"uppercase"}}>Fraud Shield</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield size={10} style={{color:"#fb923c"}}/>
            <button
              onClick={() => toggleMinimize("fraudShield")}
              className="p-0.5 hover:bg-white/10 rounded transition-colors"
              style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {minimized["fraudShield"] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>
        {!minimized["fraudShield"] && (
          <>
            <div className="flex gap-3">
              {/* AI Twin Avatar */}
              <div style={{
                width: 52, height: 68, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(160deg,#1a3a5a,#0d2040)",
                border: "1px solid rgba(96,165,250,0.35)",
                display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4
              }}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(96,165,250,0.2)",border:"1.5px solid rgba(96,165,250,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <Zap size={13} style={{color:"#60a5fa"}}/>
                </div>
                <span style={{fontSize:6.5,color:"rgba(96,165,250,0.7)",fontWeight:600}}>AI TWIN</span>
              </div>
              <div className="space-y-1">
                {["Unique option","Persona / Perspective","The/locality metrics","Active monitoring"].map((t,i)=>(
                  <p key={i} style={{fontSize:7.5,color:"rgba(255,255,255,0.45)"}}>{t}</p>
                ))}
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ TAX PLANNER (lower) — left lower ══ */}
      <motion.div initial={{opacity:0,x:-18}} animate={{opacity:1,x:0}} transition={{delay:0.4}}
        style={C({ width: 178, top: "70%", left: "21%", borderColor:"rgba(96,165,250,0.22)" })}>
        <CardHeader label="Tax Planner" accent="#60a5fa" isMinimized={minimized["taxPlannerLower"]} onToggle={() => toggleMinimize("taxPlannerLower")}/>
        {!minimized["taxPlannerLower"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:7}}>Projected tax liability</p>
            <div className="space-y-2">
              {[
                {k:"Amounts",    v:"$226,000"},
                {k:"Deductions", v:"-$6,000"},
                {k:"Due dates",  v:"See date"},
                {k:"Payment",    v:"Q4 2023"},
              ].map((r,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <span style={{fontSize:8,color:"rgba(255,255,255,0.45)"}}>{r.k}</span>
                  <span style={{fontSize:8,color:"#f4f4f5",fontWeight:600}}>{r.v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ══ MONTHLY INCOME — right upper ══ */}
      <motion.div initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{delay:0.25}}
        style={C({ width: 178, top: "12%", right: "23%", borderColor:"rgba(16,185,129,0.28)" })}>
        <CardHeader label="Monthly Income" accent="#10b981" isMinimized={minimized["monthlyIncome"]} onToggle={() => toggleMinimize("monthlyIncome")}/>
        {!minimized["monthlyIncome"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:5}}>Primary/secondary sources</p>
            <p style={{fontSize:17,fontWeight:800,color:"#f4f4f5",lineHeight:1,marginBottom:3}}>{fmt(monthlyIncome)}</p>
            <span style={{fontSize:9,color:"#10b981",fontWeight:700,display:"block",marginBottom:7,background:"rgba(16,185,129,0.1)",borderRadius:4,padding:"2px 6px",width:"fit-content"}}>↑ Growth</span>
            <div style={{height:40}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SPARK2}>
                  <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.8} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ CASH FLOW — right mid-upper ══ */}
      <motion.div initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{delay:0.3}}
        style={C({ width: 178, top: "31%", right: "23%", borderColor:"rgba(96,165,250,0.28)" })}>
        <CardHeader label="Cash Flow" accent="#60a5fa" isMinimized={minimized["cashFlow"]} onToggle={() => toggleMinimize("cashFlow")}/>
        {!minimized["cashFlow"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:7}}>Inflow vs. outflow · Liquidity ratio</p>
            <div style={{height:56}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CASH_D}>
                  <Bar dataKey="i" fill="#10b981" radius={[3,3,0,0]}/>
                  <Bar dataKey="o" fill="#ef4444" radius={[3,3,0,0]}/>
                  <Tooltip {...TT}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{background:"#10b981"}}/>
                <span style={{fontSize:7.5,color:"#10b981",fontWeight:600}}>Inflow</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{background:"#ef4444"}}/>
                <span style={{fontSize:7.5,color:"#ef4444",fontWeight:600}}>Outflow</span>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ SAVINGS RATE — right mid ══ */}
      <motion.div initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{delay:0.35}}
        style={C({ width: 178, top: "52%", right: "23%", borderColor:"rgba(212,175,55,0.28)" })}>
        <CardHeader label="Savings Rate" accent="#D4AF37" isMinimized={minimized["savingsRate"]} onToggle={() => toggleMinimize("savingsRate")}/>
        {!minimized["savingsRate"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:7}}>Percentage saved · Benchmark comparison</p>
            <div style={{height:44}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={GOALS_D}>
                  <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.8} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <span style={{fontSize:7.5,color:"rgba(255,255,255,0.4)"}}>Savings</span>
              <span style={{fontSize:7.5,color:"rgba(255,255,255,0.4)"}}>Progress</span>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ EMERGENCY FUND — right lower ══ */}
      <motion.div initial={{opacity:0,x:18}} animate={{opacity:1,x:0}} transition={{delay:0.4}}
        style={C({ width: 178, top: "68%", right: "23%", borderColor:"rgba(96,165,250,0.28)" })}>
        <CardHeader label="Emergency Fund" accent="#60a5fa" isMinimized={minimized["emergencyFund"]} onToggle={() => toggleMinimize("emergencyFund")}/>
        {!minimized["emergencyFund"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:9}}>Current balance vs. goal</p>
            <div className="flex items-center gap-4">
              <div style={{position:"relative",width:56,height:56,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PIE_EF} dataKey="v" innerRadius={16} outerRadius={26} startAngle={90} endAngle={-270}>
                      {PIE_EF.map((e,i)=><Cell key={i} fill={e.c}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8.5,fontWeight:800,color:"#60a5fa"}}>85%</span>
              </div>
              <div>
                <p style={{fontSize:9,fontWeight:700,color:"#f4f4f5",marginBottom:2}}>$25,000</p>
                <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)"}}>Month</p>
                <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)"}}>coverage</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ GOALS PROGRESS — bottom left ══ */}
      <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:0.45}}
        style={C({ width: 178, bottom: "7%", left: "21%", borderColor:"rgba(167,139,250,0.22)" })}>
        <CardHeader label="Goals Progress" accent="#a78bfa" isMinimized={minimized["goalsProgress"]} onToggle={() => toggleMinimize("goalsProgress")}/>
        {!minimized["goalsProgress"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:7}}>Visualisation of progress</p>
            <div className="flex items-center gap-3">
              <div style={{flex:1}}>
                {goalList.map((g,i)=>(
                  <div key={i} className="flex items-center gap-2 mb-1.5">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{background:["#D4AF37","#10b981","#60a5fa"][i],boxShadow:`0 0 4px ${["#D4AF37","#10b981","#60a5fa"][i]}88`}}/>
                    <span style={{fontSize:8,color:"rgba(255,255,255,0.5)"}}>{g.name}</span>
                  </div>
                ))}
              </div>
              <div style={{position:"relative",width:48,height:48,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{v:90},{v:10}]} dataKey="v" innerRadius={14} outerRadius={22} startAngle={90} endAngle={-270}>
                      <Cell fill="#10b981"/>
                      <Cell fill="rgba(255,255,255,0.05)"/>
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#10b981"}}>90%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ FINANCIAL HEALTH SCORE — bottom center ══ */}
      <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
        style={C({ width: 178, bottom: "7%", left: "50%", transform: "translateX(-50%)", borderColor:"rgba(16,185,129,0.28)" })}>
        <CardHeader label="Financial Health Score" accent="#10b981" isMinimized={minimized["healthScore"]} onToggle={() => toggleMinimize("healthScore")}/>
        {!minimized["healthScore"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:7}}>Calculated by AI · Real-time</p>
            <div className="flex items-center gap-4">
              <div style={{flex:1}}>
                <p style={{fontSize:8,color:"rgba(255,255,255,0.5)",marginBottom:2}}>• Key factors</p>
                <p style={{fontSize:8,color:"rgba(255,255,255,0.5)",marginBottom:2}}>• Improvement suggestions</p>
                <p style={{fontSize:8,color:"rgba(255,255,255,0.5)"}}>• Colour score</p>
              </div>
              <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{v:healthScore},{v:100-healthScore}]} dataKey="v" innerRadius={15} outerRadius={24} startAngle={90} endAngle={-270}>
                      <Cell fill="#10b981"/>
                      <Cell fill="rgba(255,255,255,0.05)"/>
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8.5,fontWeight:800,color:"#10b981"}}>{healthScore}</span>
              </div>
            </div>
            <p style={{fontSize:15,fontWeight:800,color:"#10b981",marginTop:6,textShadow:"0 0 12px rgba(16,185,129,0.5)"}}>{healthScore}/100</p>
          </>
        )}
      </motion.div>

      {/* ══ INVESTMENT RETURNS — bottom right ══ */}
      <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:0.55}}
        style={C({ width: 178, bottom: "7%", right: "23%", borderColor:"rgba(167,139,250,0.22)" })}>
        <CardHeader label="Investment Returns" accent="#a78bfa" isMinimized={minimized["investmentReturns"]} onToggle={() => toggleMinimize("investmentReturns")}/>
        {!minimized["investmentReturns"] && (
          <>
            <p style={{fontSize:7.5,color:"rgba(255,255,255,0.4)",marginBottom:7}}>YTD performance across assets</p>
            <div style={{height:50}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={INV_D}>
                  <Line type="monotone" dataKey="v" stroke="#a78bfa" strokeWidth={1.8} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 mt-2">
              {[
                {n:"Equities",    v:"+18.2%", c:"#10b981"},
                {n:"Real Estate", v:"+9.4%",  c:"#D4AF37"},
                {n:"Bonds",       v:"+3.1%",  c:"#60a5fa"},
              ].map((r,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{background:r.c}}/>
                    <span style={{fontSize:7.5,color:"rgba(255,255,255,0.5)"}}>{r.n}</span>
                  </div>
                  <span style={{fontSize:8,color:r.c,fontWeight:700}}>{r.v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
