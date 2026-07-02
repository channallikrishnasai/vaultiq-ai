"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, HelpCircle, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { FraudAnalyzer } from "@/components/fraud/FraudAnalyzer";
import { FraudReportList } from "@/components/fraud/FraudReportList";

interface FraudPageClientProps {
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
  channel: "SMS" | "WhatsApp" | "Email";
  message: string;
  options: {
    text: string;
    consequence: "hack" | "correct" | "safe" | "risk";
    feedback: string;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Urgent Bank Reactivation",
    sender: "AD-HDFCBK",
    channel: "SMS",
    message: "Dear Customer, your HDFC bank account is suspended due to PAN card expiry. Update immediately at http://hdfc-verify-pan.net to avoid permanent lock.",
    options: [
      {
        text: "Click the link and fill out the form to reactivate the account.",
        consequence: "hack",
        feedback: "🚨 SIMULATED HACK: The domain 'hdfc-verify-pan.net' is a phishing page! By submitting your PAN and OTP, the attacker stole your internet banking credentials. Always check for 'https' and correct domain names (e.g., 'hdfcbank.com')."
      },
      {
        text: "Report the message as spam and block the sender.",
        consequence: "correct",
        feedback: "🎉 CORRECT! You recognized the urgency tactic and suspicious URL domain. Reporting this keeps your credentials safe and helps spam filters flag it for others. +25 XP!"
      },
      {
        text: "Ignore the SMS and delete it.",
        consequence: "safe",
        feedback: "✓ SAFE: Deleting it prevents accidental clicks, which is safe. However, reporting it helps protect others in the community."
      },
      {
        text: "Reply back requesting more details or support.",
        consequence: "risk",
        feedback: "⚠️ RISK: Replying lets scammers know your number is active and monitored, which leads to target lists and more spam."
      }
    ]
  },
  {
    id: 2,
    title: "Unclaimed Lottery Prize",
    sender: "KBC-Prize-Hub",
    channel: "WhatsApp",
    message: "Congratulations! Your mobile number has been selected for the ₹25 Lakhs KBC Lucky Draw. Contact KBC manager Mr. Kumar at +91 9911002233 to process your bank transfer.",
    options: [
      {
        text: "Call Mr. Kumar on WhatsApp to claim your transfer.",
        consequence: "hack",
        feedback: "🚨 SIMULATED HACK: This is an advance-fee lottery scam! Mr. Kumar will ask for a ₹12,500 'processing/tax fee' first. Once paid, the scammers disappear. Never pay money to receive money!"
      },
      {
        text: "Report the WhatsApp contact, block them, and delete the message.",
        consequence: "correct",
        feedback: "🎉 CORRECT! High-value lottery wins sent over WhatsApp are always scams. Reporting/blocking immediately protects you and flags the fraud account. +25 XP!"
      },
      {
        text: "Ask for proof of lottery license or certificate.",
        consequence: "risk",
        feedback: "⚠️ RISK: Scammers generate fake licenses and government stamps using templates. Attempting to argue or ask for proof validates you as a potential target."
      }
    ]
  },
  {
    id: 3,
    title: "Pending Customs Parcel Duty",
    sender: "BlueDart-Logistics",
    channel: "Email",
    message: "Your shipment #BD-98218-IN is held at customs due to unpaid duty of ₹45. Please settle this fee immediately at https://bluedart-duty-clearance.xyz/pay to schedule delivery.",
    options: [
      {
        text: "Pay the ₹45 using your credit card/UPI immediately to get the parcel.",
        consequence: "hack",
        feedback: "🚨 SIMULATED HACK: This is a package delivery scam! Although the fee is small (₹45), the site captures your full debit/credit card details or UPI PIN. Scammers then charge larger amounts."
      },
      {
        text: "Login to the official BlueDart website using your tracking number to verify.",
        consequence: "correct",
        feedback: "🎉 CORRECT! Always verify through the company's official website using the tracking ID, rather than clicking unsolicited email links. +25 XP!"
      },
      {
        text: "Delete the email and ignore it.",
        consequence: "safe",
        feedback: "✓ SAFE: Ignoring is safe, but verifying independently helps clarify if you actually have a legitimate pending parcel."
      }
    ]
  }
];

export function FraudPageClient({ user }: FraudPageClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "scanner" | "simulator">("overview");

  // Simulator State
  const [currentScenario, setCurrentScenario] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    setShowFeedback(true);
  };

  const nextScenario = () => {
    setSelectedOption(null);
    setShowFeedback(false);
    setCurrentScenario((prev) => (prev + 1) % SCENARIOS.length);
  };

  return (
    <main className="min-h-screen bg-[#040407] text-zinc-100 px-6 py-6 pt-24 overflow-y-auto scrollbar-none">
      <div className="mx-auto max-w-5xl space-y-6">
        <DashboardHeader user={user} visible={true} />

        {/* Back navigation & Title */}
        <div className="flex items-center justify-between border-b border-zinc-800/40 pb-5">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                <Shield className="h-5 w-5 text-rose-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-50">Fraud Shield Hub</h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  AI-powered scam detection for SMS, suspicious links, and interactive risk simulations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-zinc-850 gap-2 p-1">
          {[
            { id: "overview", label: "Shield Dashboard" },
            { id: "scanner", label: "Scam Scanner" },
            { id: "simulator", label: "Risk Simulator" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all relative ${
                activeTab === tab.id
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/25"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3 space-y-4">
                  <div className="p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                      <ShieldAlert size={16} className="text-rose-400" /> Protecting Your Assets
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      VaultIQ AI monitors phishing links and scam SMS messages. Paste suspicious content inside the **Scam Scanner** tab to instantly calculate an AI risk score.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 rounded-lg border border-zinc-850 bg-zinc-900/40">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block">Total Scans</span>
                        <h4 className="text-lg font-bold text-zinc-200 mt-1">12 Attempts</h4>
                      </div>
                      <div className="p-3 rounded-lg border border-zinc-850 bg-zinc-900/40">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block">Threat Blocked</span>
                        <h4 className="text-lg font-bold text-emerald-400 mt-1">100% Secure</h4>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-3">Community Security Alerts</h3>
                    <div className="space-y-3">
                      <div className="p-3 rounded bg-amber-500/5 border border-amber-500/15 flex items-start gap-2.5">
                        <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-zinc-200 block">Electricity Bill Fraud Surge</span>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                            Scammers are sending SMS threats to suspend power unless a payment link is clicked. These are fake.
                          </p>
                        </div>
                      </div>
                      <div className="p-3 rounded bg-rose-500/5 border border-rose-500/15 flex items-start gap-2.5">
                        <AlertTriangle size={15} className="text-rose-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-zinc-200 block">Fake Courier Duty Emails</span>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                            Emails claiming custom duty payment (₹40-₹90) for a parcel delivery are harvesting card numbers.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <FraudReportList refreshKey={refreshKey} />
                </div>
              </div>
            )}

            {activeTab === "scanner" && (
              <div className="grid gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3">
                  <FraudAnalyzer onAnalyzed={() => setRefreshKey((k) => k + 1)} />
                </div>
                <div className="lg:col-span-2">
                  <FraudReportList refreshKey={refreshKey} />
                </div>
              </div>
            )}

            {activeTab === "simulator" && (
              <div className="max-w-3xl mx-auto p-5 rounded-xl border border-zinc-800/60 bg-[#06060a]/90 backdrop-blur-md relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-40 h-40 rounded-full bg-[#D4AF37]/5 blur-3xl" />
                
                {/* Intro */}
                <div className="mb-6 flex items-center justify-between border-b border-zinc-850 pb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#D4AF37] flex items-center gap-1.5">
                      <Sparkles size={14} /> Interactive Scam Simulator
                    </h3>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Test your defense instincts against real-world scam configurations
                    </p>
                  </div>
                  <div className="text-[11px] font-bold text-[#D4AF37] px-2 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded">
                    Scenario {currentScenario + 1} of {SCENARIOS.length}
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
                        className="flex items-center gap-1 py-1.5 px-3 bg-[#D4AF37] hover:bg-[#c49f27] text-black font-bold text-xs rounded transition"
                      >
                        Next Challenge <ChevronRight size={12} />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
