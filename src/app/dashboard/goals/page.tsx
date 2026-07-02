"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Target, Plus, Trash2, Calendar, Award, Info, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  type: string;
  deadline?: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState<string>("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  const [type, setType] = useState<string>("SAVINGS");
  const [deadline, setDeadline] = useState<string>(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/goals");
      const json = await res.json();
      if (json.success) {
        setGoals(json.data || []);
      }
    } catch {
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

    if (isNaN(target) || target <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetAmount: target,
          currentAmount: current,
          type,
          deadline: new Date(deadline),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Goal set successfully!");
        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        fetchGoals();
      } else {
        toast.error(json.message || "Failed to set goal");
      }
    } catch {
      toast.error("Network error saving goal");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Goal deleted");
        fetchGoals();
      } else {
        toast.error("Failed to delete goal");
      }
    } catch {
      toast.error("Error deleting goal");
    }
  };

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="text-[#a78bfa] h-5 w-5" /> Goal & Savings Planner
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure long-term savings goals, track milestones, and view target timelines
          </p>
        </div>
        <button
          onClick={fetchGoals}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* Left Column: Form (5 Cols) */}
        <div className="col-span-5 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#a78bfa] mb-3">Set Financial Goal</h3>
            <form onSubmit={handleAddGoal} className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="E.g. Emergency Fund or Tesla Model Y"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#a78bfa]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold block mb-1">Starting Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Goal Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="SAVINGS">Savings Envelope</option>
                  <option value="EMERGENCY">Emergency Fund</option>
                  <option value="INVESTMENT">Investment Target</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 font-bold block mb-1">Target Date / Deadline</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-[#a78bfa] hover:bg-violet-600 text-white font-bold py-2 rounded-lg text-xs tracking-wider flex items-center justify-center gap-1"
              >
                <Plus size={12} /> INITIATE GOAL
              </motion.button>
            </form>
          </div>

          {/* Goal Tips */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Award size={12} className="text-[#a78bfa]" /> Milestone Celebration
            </h3>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              When a goal reaches 100%, VaultIQ AI launches celebratory SVG rings on your home dashboard as badges of honor.
            </p>
          </div>
        </div>

        {/* Right Column: Goal Cards Grid (7 Cols) */}
        <div className="col-span-7 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col overflow-hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Goal Timeline</h3>

          {goals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 border border-dashed border-zinc-800 rounded-lg">
              <Info className="text-zinc-600 mb-2" size={24} />
              <p className="text-xs text-zinc-500">No active goals yet. Map a timeline to start tracking.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1">
              {goals.map((g) => {
                const percent = Math.min(100, g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0);
                const colorClass =
                  g.type === "SAVINGS" ? "bg-emerald-500 text-emerald-400 border-emerald-500/20" :
                  g.type === "EMERGENCY" ? "bg-blue-500 text-blue-400 border-blue-500/20" :
                  "bg-violet-500 text-violet-400 border-violet-500/20";

                return (
                  <div key={g.id} className="p-3 rounded-lg border border-zinc-800/40 bg-zinc-900/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{g.name}</span>
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full border bg-opacity-10 capitalize ${colorClass.split(" ")[1]} ${colorClass.split(" ")[2]}`}>
                            {g.type.toLowerCase()}
                          </span>
                        </div>
                        {g.deadline && (
                          <span className="text-[9px] text-zinc-500 flex items-center gap-0.5 mt-1">
                            <Calendar size={8} /> Target: {new Date(g.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-xs font-semibold text-zinc-200 block">
                            ₹{g.currentAmount.toLocaleString()} / ₹{g.targetAmount.toLocaleString()}
                          </span>
                          <span className={`text-[9px] font-bold ${percent >= 100 ? "text-emerald-400" : "text-[#D4AF37]"}`}>
                            {percent.toFixed(0)}% Achieved
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="text-zinc-650 hover:text-rose-400 p-1 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass.split(" ")[0]}`}
                        style={{ width: `${percent}%` }}
                      />
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
