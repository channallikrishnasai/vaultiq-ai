"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const TT = { contentStyle: { display: "none" }, cursor: false as any };

// ── Shared card style ─────────────────────────────────────────────────────────
const C = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: "absolute",
  background: "rgba(6,6,10,0.90)",
  border: "1px solid rgba(212,175,55,0.15)",
  borderRadius: 14,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)",
  overflow: "hidden",
  padding: "10px 12px",
  color: "#fff",
  zIndex: 5,
  ...extra,
});

function CardHeader({ label, accent = "#D4AF37", isMinimized, onToggle }: { label: string; accent?: string; isMinimized: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between mb-1">
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent }}>{label}</span>
      <button 
        onClick={onToggle}
        className="p-0.5 hover:bg-white/10 rounded transition-colors"
        style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

  // Load minimized state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("kpi-minimized-state");
    if (saved) {
      setMinimized(JSON.parse(saved));
    }
  }, []);

  // Save minimized state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("kpi-minimized-state", JSON.stringify(minimized));
  }, [minimized]);

  const toggleMinimize = (key: string) => {
    setMinimized(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
      <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
        style={C({ width:190, top:"3%", left:"50%", transform:"translateX(-50%)", height: minimized["portfolio"] ? "auto" : undefined })}>
        <CardHeader label="Portfolio Performance" isMinimized={minimized["portfolio"]} onToggle={() => toggleMinimize("portfolio")} />
        {!minimized["portfolio"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:3}}>Overall return</p>
            <div className="flex items-center gap-2 mb-1.5">
              <span style={{fontSize:18,fontWeight:800,color:"#D4AF37",lineHeight:1}}>+15.45%</span>
              <span style={{fontSize:8,color:"#10b981",fontWeight:600}}>+14.55%</span>
            </div>
            <div style={{height:40}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SPARK}>
                  <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-1">
              <span style={{fontSize:7,color:"rgba(255,255,255,0.35)"}}>Debt volume</span>
              <span style={{fontSize:7,color:"#ef4444",fontWeight:600}}>-76.82%</span>
              <span style={{fontSize:7,color:"rgba(255,255,255,0.35)"}}>Best invest</span>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ NET WORTH — left upper ══ */}
      <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.25}}
        style={C({ width:158, top:"12%", left:"21%", height: minimized["netWorth"] ? "auto" : undefined })}>
        <CardHeader label="Net Worth" isMinimized={minimized["netWorth"]} onToggle={() => toggleMinimize("netWorth")} />
        {!minimized["netWorth"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:4}}>Total assets</p>
            <p style={{fontSize:15,fontWeight:800,color:"#D4AF37",lineHeight:1,marginBottom:6}}>
              {fmt(netWorth)}
            </p>
            <div style={{height:36}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SPARK}>
                  <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{fontSize:7,color:"#10b981",fontWeight:600}}>+13,250.00</span>
              <span style={{fontSize:6.5,color:"rgba(255,255,255,0.25)"}}>2016 2020 2023</span>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ TAX PLANNER (upper) — left mid-upper ══ */}
      <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.3}}
        style={C({ width:166, top:"31%", left:"21%", borderColor:"rgba(96,165,250,0.2)", height: minimized["taxPlanner"] ? "auto" : undefined })}>
        <CardHeader label="Tax Planner" accent="#60a5fa" isMinimized={minimized["taxPlanner"]} onToggle={() => toggleMinimize("taxPlanner")}/>
        {!minimized["taxPlanner"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Projected tax liability</p>
            <div className="space-y-1">
              {[
                {k:"Amounts",  v:"$1,500.00", c:"#f4f4f5"},
                {k:"Due date", v:"08.06.2023",c:"rgba(255,255,255,0.5)"},
                {k:"Dep. cont",v:"08.06.2023",c:"rgba(255,255,255,0.5)"},
                {k:"Tax tax",  v:"03.05.2023",c:"rgba(255,255,255,0.5)"},
                {k:"Deadlines",v:"08.06.2022",c:"rgba(255,255,255,0.5)"},
              ].map((r,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{background:"#60a5fa"}}/>
                    <span style={{fontSize:7,color:"rgba(255,255,255,0.45)"}}>{r.k}</span>
                  </div>
                  <span style={{fontSize:7,color:r.c,fontWeight:r.c==="#f4f4f5"?700:400}}>{r.v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ══ FRAUD SHIELD + AI TWIN — left mid ══ */}
      <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.35}}
        style={C({ width:166, top:"52%", left:"21%", borderColor:"rgba(251,146,60,0.2)", height: minimized["fraudShield"] ? "auto" : undefined })}>
        <div className="flex items-center gap-2 justify-between">
          <div style={{flex:1}}>
            <p style={{fontSize:8,fontWeight:700,color:"#fb923c",letterSpacing:"0.1em",textTransform:"uppercase"}}>Fraud Shield</p>
          </div>
          <button 
            onClick={() => toggleMinimize("fraudShield")}
            className="p-0.5 hover:bg-white/10 rounded transition-colors"
            style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {minimized["fraudShield"] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        {!minimized["fraudShield"] && (
          <>
            <div style={{marginBottom:6}}>
              <div className="space-y-0.5">
                {["AI Twin","Unique option","Persona/ Perspective","The/locality metrics"].map((t,i)=>(
                  <p key={i} style={{fontSize:7,color:"rgba(255,255,255,0.4)"}}>{t}</p>
                ))}
              </div>
            </div>
            <div style={{width:44,height:64,borderRadius:8,background:"linear-gradient(160deg,#1a3a4a,#0d2535)",border:"1px solid rgba(96,165,250,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(96,165,250,0.18)",border:"1px solid rgba(96,165,250,0.4)"}}/>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ TAX PLANNER (lower) — left lower ══ */}
      <motion.div initial={{opacity:0,x:-16}} animate={{opacity:1,x:0}} transition={{delay:0.4}}
        style={C({ width:166, top:"70%", left:"21%", borderColor:"rgba(96,165,250,0.2)", height: minimized["taxPlannerLower"] ? "auto" : undefined })}>
        <CardHeader label="Tax Planner" accent="#60a5fa" isMinimized={minimized["taxPlannerLower"]} onToggle={() => toggleMinimize("taxPlannerLower")}/>
        {!minimized["taxPlannerLower"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Projected tax liability</p>
            <div className="space-y-1.5">
              {[
                {k:"Amounts",    v:"226,000"},
                {k:"Deductions", v:"-$6,000"},
                {k:"Due dates",  v:"Sue date"},
                {k:"Payment",    v:"5$S 2023"},
              ].map((r,i)=>(
                <div key={i} className="flex items-center justify-between">
                  <span style={{fontSize:7,color:"rgba(255,255,255,0.45)"}}>{r.k}</span>
                  <span style={{fontSize:7,color:"#f4f4f5",fontWeight:600}}>{r.v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ══ MONTHLY INCOME — right upper ══ */}
      <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.25}}
        style={C({ width:166, top:"12%", right:"23%", borderColor:"rgba(16,185,129,0.2)", height: minimized["monthlyIncome"] ? "auto" : undefined })}>
        <CardHeader label="Monthly Income" accent="#10b981" isMinimized={minimized["monthlyIncome"]} onToggle={() => toggleMinimize("monthlyIncome")}/>
        {!minimized["monthlyIncome"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:4}}>Primary/secondary sources</p>
            <p style={{fontSize:15,fontWeight:800,color:"#f4f4f5",lineHeight:1,marginBottom:2}}>{fmt(monthlyIncome)}</p>
            <span style={{fontSize:8,color:"#10b981",fontWeight:600,display:"block",marginBottom:6}}>↑ Growth</span>
            <div style={{height:36}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SPARK2}>
                  <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={1.5} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ CASH FLOW — right mid-upper ══ */}
      <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.3}}
        style={C({ width:166, top:"31%", right:"23%", borderColor:"rgba(96,165,250,0.2)", height: minimized["cashFlow"] ? "auto" : undefined })}>
        <CardHeader label="Cash Flow" accent="#60a5fa" isMinimized={minimized["cashFlow"]} onToggle={() => toggleMinimize("cashFlow")}/>
        {!minimized["cashFlow"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Inflow vs. outflow · Liquidity ratio</p>
            <div style={{height:52}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CASH_D}>
                  <Bar dataKey="i" fill="#10b981" radius={[2,2,0,0]}/>
                  <Bar dataKey="o" fill="#ef4444" radius={[2,2,0,0]}/>
                  <Tooltip {...TT}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span style={{fontSize:7,color:"#10b981",fontWeight:600}}>Inflow</span>
              <span style={{fontSize:7,color:"#ef4444",fontWeight:600}}>Outflow</span>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ SAVINGS RATE — right mid ══ */}
      <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.35}}
        style={C({ width:166, top:"52%", right:"23%", borderColor:"rgba(212,175,55,0.2)", height: minimized["savingsRate"] ? "auto" : undefined })}>
        <CardHeader label="Savings Rate" accent="#D4AF37" isMinimized={minimized["savingsRate"]} onToggle={() => toggleMinimize("savingsRate")}/>
        {!minimized["savingsRate"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Percentage saved · Benchmark comparison</p>
            <div style={{height:40}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={GOALS_D}>
                  <Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={1.5} dot={false}/>
                  <Tooltip {...TT}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span style={{fontSize:7,color:"rgba(255,255,255,0.35)"}}>Savings</span>
              <span style={{fontSize:7,color:"rgba(255,255,255,0.35)"}}>Progress</span>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ EMERGENCY FUND — right lower ══ */}
      <motion.div initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} transition={{delay:0.4}}
        style={C({ width:166, top:"68%", right:"23%", borderColor:"rgba(96,165,250,0.2)", height: minimized["emergencyFund"] ? "auto" : undefined })}>
        <CardHeader label="Emergency Fund" accent="#60a5fa" isMinimized={minimized["emergencyFund"]} onToggle={() => toggleMinimize("emergencyFund")}/>
        {!minimized["emergencyFund"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:8}}>Current balance vs. goal</p>
            <div className="flex items-center gap-3">
              <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PIE_EF} dataKey="v" innerRadius={15} outerRadius={24} startAngle={90} endAngle={-270}>
                      {PIE_EF.map((e,i)=><Cell key={i} fill={e.c}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"#60a5fa"}}>85%</span>
              </div>
              <div>
                <p style={{fontSize:7,color:"rgba(255,255,255,0.45)"}}>Month</p>
                <p style={{fontSize:7,color:"rgba(255,255,255,0.45)"}}>coverage</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ GOALS PROGRESS — bottom left ══ */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.45}}
        style={C({ width:166, bottom:"7%", left:"21%", height: minimized["goalsProgress"] ? "auto" : undefined })}>
        <CardHeader label="Goals Progress" accent="#a78bfa" isMinimized={minimized["goalsProgress"]} onToggle={() => toggleMinimize("goalsProgress")}/>
        {!minimized["goalsProgress"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Visualisation of progress</p>
            <div className="flex items-center gap-2">
              <div style={{flex:1}}>
                {goalList.map((g,i)=>(
                  <div key={i} className="flex items-center gap-1.5 mb-1">
                    <span className="h-1 w-1 rounded-full shrink-0" style={{background:["#D4AF37","#10b981","#60a5fa"][i]}}/>
                    <span style={{fontSize:7,color:"rgba(255,255,255,0.45)"}}>{g.name}</span>
                  </div>
                ))}
              </div>
              <div style={{position:"relative",width:44,height:44,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{v:90},{v:10}]} dataKey="v" innerRadius={13} outerRadius={20} startAngle={90} endAngle={-270}>
                      <Cell fill="#10b981"/>
                      <Cell fill="rgba(255,255,255,0.05)"/>
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"#10b981"}}>90%</span>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ══ FINANCIAL HEALTH SCORE — bottom center ══ */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
        style={C({ width:166, bottom:"7%", left:"50%", transform:"translateX(-50%)", borderColor:"rgba(16,185,129,0.2)", height: minimized["healthScore"] ? "auto" : undefined })}>
        <CardHeader label="Financial Health Score" accent="#10b981" isMinimized={minimized["healthScore"]} onToggle={() => toggleMinimize("healthScore")}/>
        {!minimized["healthScore"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Calculated by AI</p>
            <div className="flex items-center gap-3">
              <div style={{flex:1}}>
                <p style={{fontSize:7,color:"rgba(255,255,255,0.45)"}}>• Key factors</p>
                <p style={{fontSize:7,color:"rgba(255,255,255,0.45)"}}>• Improvement suggestions</p>
                <p style={{fontSize:7,color:"rgba(255,255,255,0.45)"}}>• Colour score</p>
              </div>
              <div style={{position:"relative",width:44,height:44,flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{v:healthScore},{v:100-healthScore}]} dataKey="v" innerRadius={13} outerRadius={20} startAngle={90} endAngle={-270}>
                      <Cell fill="#10b981"/>
                      <Cell fill="rgba(255,255,255,0.05)"/>
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:"#10b981"}}>{healthScore}</span>
              </div>
            </div>
            <p style={{fontSize:13,fontWeight:800,color:"#10b981",marginTop:4}}>{healthScore}/100</p>
          </>
        )}
      </motion.div>

      {/* ══ LEARN HUB — bottom right ══ */}
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.55}}
        style={C({ width:166, bottom:"7%", right:"23%", borderColor:"rgba(167,139,250,0.18)", height: minimized["investmentReturns"] ? "auto" : undefined })}>
        <CardHeader label="Learn Hub" accent="#a78bfa" isMinimized={minimized["investmentReturns"]} onToggle={() => toggleMinimize("investmentReturns")}/>
        {!minimized["investmentReturns"] && (
          <>
            <p style={{fontSize:7,color:"rgba(255,255,255,0.4)",marginBottom:6}}>Premium courses & video tutorials</p>
            {/* Video Thumbnail mockup */}
            <div style={{
              position: "relative",
              height: 52,
              borderRadius: 8,
              background: "linear-gradient(135deg, #1e1b4b, #311042)",
              border: "1px solid rgba(167,139,250,0.3)",
              overflow: "hidden",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}>
              {/* Play symbol */}
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "rgba(167,139,250,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 8px #a78bfa",
                zIndex: 2
              }}>
                <span style={{ fontSize: 9, color: "#fff", marginLeft: 2 }}>▶</span>
              </div>
              <span style={{ position: "absolute", bottom: 4, left: 6, fontSize: 6.5, color: "rgba(255,255,255,0.7)", zIndex: 2 }}>
                Intro to Tax Optimization
              </span>
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
            </div>

            {/* Modules/Courses list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
              {[
                { n: "Asset Allocation Basics", p: "80%" },
                { n: "Advanced Mutual Funds", p: "20%" },
                { n: "Understanding Regimes", p: "0%" }
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 6.5, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 105 }}>
                    • {c.n}
                  </span>
                  <span style={{ fontSize: 6.5, color: c.p === "0%" ? "rgba(255,255,255,0.25)" : "#a78bfa", fontWeight: 700 }}>
                    {c.p}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}
