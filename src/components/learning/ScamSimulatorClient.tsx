"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, ShieldAlert, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { toast } from "sonner";

interface ScamSimulatorClientProps {
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface ScenarioNode {
  message: string;
  options: {
    text: string;
    consequence: "hack" | "correct" | "safe" | "risk";
    feedback: string;
    nextNodeId?: string; // Links to next dialogue node
  }[];
}

interface BranchingScenario {
  id: number;
  title: string;
  sender: string;
  channel: "SMS" | "WhatsApp" | "Email" | "Instagram";
  type: string;
  startNodeId: string;
  nodes: Record<string, ScenarioNode>;
}

const BRANCHING_SCENARIOS: BranchingScenario[] = [
  {
    id: 1,
    title: "Instant Job Offer Path",
    sender: "Recruiter_HR_98",
    channel: "WhatsApp",
    type: "Task Scam / Job Fraud",
    startNodeId: "start",
    nodes: {
      start: {
        message: "Hello! I am a recruiter from Amazon India. We offer simple part-time online jobs. Work 1 hour a day from home and earn ₹5000 daily. Press 1 to get details immediately.",
        options: [
          {
            text: "Reply '1' to get details.",
            consequence: "risk",
            feedback: "You replied '1'. Attacker immediately sends a follow-up link.",
            nextNodeId: "step_2_replied",
          },
          {
            text: "Report and block the sender immediately.",
            consequence: "correct",
            feedback: "🎉 CORRECT! Legitimate recruiters do not offer daily part-time salaries of ₹5,000 over WhatsApp. Blocked immediately. +25 XP!",
          },
        ],
      },
      step_2_replied: {
        message: "Great! Please join our Telegram channel at https://t.me/amazon-tasks-india to receive your first video-liking task. You will be paid ₹150 instantly upon completion.",
        options: [
          {
            text: "Click the link and join the Telegram group.",
            consequence: "risk",
            feedback: "You joined the group. Attacker pays you ₹150 for liking a video, then demands ₹10,000 deposit to access 'Vip Level 2' payouts.",
            nextNodeId: "step_3_group",
          },
          {
            text: "Realize the scam, block the number, and exit.",
            consequence: "correct",
            feedback: "🎉 CORRECT! You successfully avoided the advance-fee trap before depositing any funds. +25 XP!",
          },
        ],
      },
      step_3_group: {
        message: "[Telegram Adm]: Congratulations! To withdraw your premium salary of ₹15,000, you must make a security deposit of ₹5,000 to verify your account. It will be refunded in 5 minutes.",
        options: [
          {
            text: "Transfer the ₹5,000 deposit.",
            consequence: "hack",
            feedback: "🚨 SIMULATED HACK: This is a Task Scam! Once you deposit ₹5,000, they will block you or demand ₹15,000 more for taxes. Your money is gone forever.",
          },
          {
            text: "Refuse to pay and report the Telegram channel to cyber police.",
            consequence: "correct",
            feedback: "🎉 CORRECT! Never pay money to receive money. Reporting helps block these phishing syndicates. +25 XP!",
          },
        ],
      },
    },
  },
  {
    id: 2,
    title: "Urgent PAN Verification Path",
    sender: "IN-INCOMETAX",
    channel: "SMS",
    type: "Phishing / Identity Theft",
    startNodeId: "start",
    nodes: {
      start: {
        message: "Income Tax Department Notification: Your refund of ₹18,450 is approved. Claim immediately by verifying your PAN card at https://incometax-refund-in.xyz/verify.",
        options: [
          {
            text: "Click the link to verify your PAN.",
            consequence: "risk",
            feedback: "You clicked the link. You are redirected to a mock website mimicking the income tax portal.",
            nextNodeId: "step_2_phish",
          },
          {
            text: "Manually navigate to the official portal 'incometax.gov.in'.",
            consequence: "correct",
            feedback: "🎉 CORRECT! Always type official URLs yourself instead of clicking SMS links. +25 XP!",
          },
        ],
      },
      step_2_phish: {
        message: "[Phishing Site]: Enter your PAN Number and Bank Account details below to process the refund immediately.",
        options: [
          {
            text: "Enter your real PAN and bank credentials.",
            consequence: "hack",
            feedback: "🚨 SIMULATED HACK: The copycat portal harvested your credentials! They can now log in, set up auto-debits, or clone your identity.",
          },
          {
            text: "Close the browser immediately and change banking passwords.",
            consequence: "correct",
            feedback: "🎉 CORRECT! Escaping early and resetting security keys protects your assets. +25 XP!",
          },
        ],
      },
    },
  },
];

export function ScamSimulatorClient({ user }: ScamSimulatorClientProps) {
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [currentNodeId, setCurrentNodeId] = useState("start");
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  const scenario = BRANCHING_SCENARIOS[currentScenarioIdx];
  const node = scenario.nodes[currentNodeId];

  const handleOptionSelect = (idx: number) => {
    setSelectedOptionIdx(idx);
    setShowFeedback(true);
    if (node.options[idx].consequence === "correct") {
      setTotalXP((prev) => prev + 25);
    }
  };

  const handleNext = () => {
    const option = node.options[selectedOptionIdx!];
    if (option.nextNodeId) {
      // Transition to next dialogue node inside the branching path
      setCurrentNodeId(option.nextNodeId);
      setSelectedOptionIdx(null);
      setShowFeedback(false);
    } else {
      // Complete path, transition to next scenario
      setSelectedOptionIdx(null);
      setShowFeedback(false);
      setCurrentNodeId("start");
      setCurrentScenarioIdx((prev) => (prev + 1) % BRANCHING_SCENARIOS.length);
    }
  };

  return (
    <main className="min-h-screen bg-[#040407]/45 text-zinc-100 px-6 py-6 pt-24 overflow-y-auto scrollbar-none backdrop-blur-sm">
      <div className="mx-auto max-w-4xl space-y-6">
        <DashboardHeader user={user} visible={true} />

        {/* Back navigation & Title */}
        <div className="flex items-center justify-between border-b border-zinc-800/40 pb-5">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/learning"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                <GraduationCap className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-50">Scam & Phishing Simulator</h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Interactive branching drills to test your scam defense instincts
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-[#D4AF37] px-3 py-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg">
              Earned XP: +{totalXP} XP
            </div>
          </div>
        </div>

        {/* Challenge Box */}
        <div className="max-w-2xl mx-auto p-6 rounded-xl border border-zinc-800/60 bg-[#06060a]/90 backdrop-blur-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-40 h-40 rounded-full bg-cyan-500/5 blur-3xl" />

          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-zinc-850 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                Defense Drill
              </span>
              <h3 className="text-sm font-bold text-zinc-200 mt-0.5">
                {scenario.title}
              </h3>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {scenario.type}
            </div>
          </div>

          {/* Scenario Details */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-850 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">From:</span>
                  <span className="text-[11px] font-mono text-zinc-300 font-semibold">{scenario.sender}</span>
                </div>
                <span className="text-[9px] uppercase font-black tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  {scenario.channel}
                </span>
              </div>
              <div className="border-t border-zinc-850 my-1" />
              <p className="text-xs text-zinc-200 leading-relaxed font-mono bg-black/40 p-3 rounded border border-zinc-900 whitespace-pre-wrap select-text">
                {node.message}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">How will you respond?</span>
              {node.options.map((opt, idx) => {
                const isChosen = selectedOptionIdx === idx;
                let btnStyle = "border-zinc-850 bg-zinc-900/30 hover:border-zinc-700 text-zinc-300";

                if (showFeedback && isChosen) {
                  if (opt.consequence === "correct") btnStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-300";
                  else if (opt.consequence === "hack") btnStyle = "border-rose-500/40 bg-rose-500/5 text-rose-300 animate-pulse";
                  else if (opt.consequence === "risk") btnStyle = "border-amber-500/40 bg-amber-500/5 text-amber-300";
                  else btnStyle = "border-blue-500/40 bg-blue-500/5 text-blue-300";
                }

                return (
                  <button
                    key={idx}
                    disabled={showFeedback}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full text-left p-3.5 rounded-lg border text-xs font-medium transition-all duration-200 flex items-center justify-between gap-3 ${btnStyle}`}
                  >
                    <span>{opt.text}</span>
                    {!showFeedback && <ChevronRight size={13} className="text-zinc-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Feedback Message */}
            {showFeedback && selectedOptionIdx !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-3"
              >
                <p className="text-xs leading-relaxed text-zinc-300">
                  {node.options[selectedOptionIdx].feedback}
                </p>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 py-1.5 px-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded transition"
                >
                  {node.options[selectedOptionIdx].nextNodeId ? "Continue Drill" : "Next Challenge"} <ChevronRight size={12} />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
