"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap, ShieldAlert, Sparkles, ChevronRight, CheckCircle2, AlertTriangle, Eye, RefreshCw } from "lucide-react";
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

interface Scenario {
  id: number;
  title: string;
  sender: string;
  channel: "SMS" | "WhatsApp" | "Email" | "Instagram";
  message: string;
  type: string;
  options: {
    text: string;
    consequence: "hack" | "correct" | "safe" | "risk";
    feedback: string;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Instant Job Offer",
    sender: "Recruiter_HR_98",
    channel: "WhatsApp",
    message: "Hello! I am a recruiter from Amazon India. We offer simple part-time online jobs. Work 1 hour a day from home and earn ₹5000 daily. Press 1 to get details immediately.",
    type: "Task Scam / Job Fraud",
    options: [
      {
        text: "Reply '1' to check the details and see if it is a legitimate side income.",
        consequence: "hack",
        feedback: "🚨 SIMULATED HACK: This is a Task Scam! The attacker will invite you to a Telegram group and ask you to perform simple YouTube likes. Initially, they pay ₹150, but soon require you to deposit ₹10,000 for 'premium levels'. Once you deposit, your money is stolen."
      },
      {
        text: "Report and block the sender immediately, and delete the message.",
        consequence: "correct",
        feedback: "🎉 CORRECT! Legitimate recruiters do not offer daily part-time salaries of ₹5,000 over WhatsApp. Blocking and reporting flags the account to WhatsApp to prevent them from contacting others. +25 XP!"
      },
      {
        text: "Delete the message and ignore it.",
        consequence: "safe",
        feedback: "✓ SAFE: Deleting it is safe and avoids interaction. However, reporting helps the community filter these numbers."
      }
    ]
  },
  {
    id: 2,
    title: "Urgent PAN Verification",
    sender: "IN-INCOMETAX",
    channel: "SMS",
    message: "Income Tax Department Notification: Your refund of ₹18,450 is approved. Claim immediately by verifying your PAN card at https://incometax-refund-in.xyz/verify.",
    type: "Phishing / Identity Theft",
    options: [
      {
        text: "Click the link to verify your PAN and claim your ₹18,450 refund.",
        consequence: "hack",
        feedback: "🚨 SIMULATED HACK: The domain 'incometax-refund-in.xyz' is a copycat phishing page! Attacker will collect your PAN card, Aadhaar number, and banking details to perform identity theft or empty your account. Official government domains always end in '.gov.in'."
      },
      {
        text: "Check your tax portal directly at the official 'incometax.gov.in' domain.",
        consequence: "correct",
        feedback: "🎉 CORRECT! Always navigate to the official, verified government domain manually rather than clicking link structures from SMS. +25 XP!"
      },
      {
        text: "Delete the SMS and ignore the notification.",
        consequence: "safe",
        feedback: "✓ SAFE: Deleting it prevents you from falling into the trap. Stay alert!"
      }
    ]
  },
  {
    id: 3,
    title: "Instagram Crypto Giveaway",
    sender: "elon_musk_giveaway_real",
    channel: "Instagram",
    message: "Congratulations! You have won 0.05 BTC in our official crypto distribution event. Complete validation by transferring 0.005 BTC to verify your wallet address at https://tesla-giveaway-verification.com.",
    type: "Cryptocurrency Scam",
    options: [
      {
        text: "Send the 0.005 BTC wallet verification fee to claim your prize.",
        consequence: "hack",
        feedback: "🚨 SIMULATED HACK: This is an advance-fee crypto giveaway scam! Elon Musk or any reputable figure will never ask you to send crypto to verify a wallet address. Once sent, your coins are gone forever."
      },
      {
        text: "Report the account for fraud, block the user, and delete the DM.",
        consequence: "correct",
        feedback: "🎉 CORRECT! Wallet addresses never require pre-payments to receive funds. Reporting and blocking the account triggers platform security algorithms. +25 XP!"
      },
      {
        text: "Delete the DM and ignore it.",
        consequence: "safe",
        feedback: "✓ SAFE: Ignoring avoids loss. Stay vigilant about fake celebrity accounts!"
      }
    ]
  }
];

export function ScamSimulatorClient({ user }: ScamSimulatorClientProps) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [totalXP, setTotalXP] = useState(0);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setShowFeedback(true);
    if (SCENARIOS[currentScenario].options[index].consequence === "correct") {
      setTotalXP((prev) => prev + 25);
    }
  };

  const nextScenario = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setCurrentScenario((prev) => (prev + 1) % SCENARIOS.length);
  };

  return (
    <main className="min-h-screen bg-[#040407] text-zinc-100 px-6 py-6 pt-24 overflow-y-auto scrollbar-none">
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
                  Interactive academy to train your scam defense instincts and secure your assets
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
                {SCENARIOS[currentScenario].title}
              </h3>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              {SCENARIOS[currentScenario].type}
            </div>
          </div>

          {/* Scenario Details */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-850 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500">From:</span>
                  <span className="text-[11px] font-mono text-zinc-300 font-semibold">{SCENARIOS[currentScenario].sender}</span>
                </div>
                <span className="text-[9px] uppercase font-black tracking-wider text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  {SCENARIOS[currentScenario].channel}
                </span>
              </div>
              <div className="border-t border-zinc-850 my-1" />
              <p className="text-xs text-zinc-200 leading-relaxed font-mono bg-black/40 p-3 rounded border border-zinc-900 whitespace-pre-wrap select-text">
                {SCENARIOS[currentScenario].message}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">How will you respond?</span>
              {SCENARIOS[currentScenario].options.map((opt, idx) => {
                const isChosen = selectedOption === idx;
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
            {showFeedback && selectedOption !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-3"
              >
                <p className="text-xs leading-relaxed text-zinc-300">
                  {SCENARIOS[currentScenario].options[selectedOption].feedback}
                </p>
                <button
                  onClick={nextScenario}
                  className="flex items-center gap-1 py-1.5 px-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs rounded transition"
                >
                  Next Challenge <ChevronRight size={12} />
                </button>
              </motion.div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
