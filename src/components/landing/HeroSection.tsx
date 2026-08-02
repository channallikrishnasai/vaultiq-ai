"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Brain, TrendingUp, Target, Sparkles } from "lucide-react";

const floatingIcons = [
  { Icon: Shield, x: "12%", y: "25%", delay: 0, color: "text-rose-400" },
  { Icon: Brain, x: "85%", y: "20%", delay: 0.5, color: "text-violet-400" },
  { Icon: TrendingUp, x: "8%", y: "70%", delay: 1, color: "text-emerald-400" },
  { Icon: Target, x: "88%", y: "65%", delay: 1.5, color: "text-blue-400" },
  { Icon: Sparkles, x: "50%", y: "85%", delay: 0.8, color: "text-amber-400" },
];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24 pb-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[#050508]">
        {/* Main radial glow */}
        <div className="absolute left-1/2 top-1/3 h-[800px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.07] blur-[120px]" />
        {/* Secondary glow */}
        <div className="absolute bottom-0 right-1/4 h-[500px] w-[700px] rounded-full bg-violet-500/[0.04] blur-[100px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, x, y, delay, color }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 + delay }}
          className="absolute hidden lg:block"
          style={{ left: x, top: y }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay }}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm ${color}`}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
          </span>
          <span className="text-xs font-medium text-teal-300">AI-Powered Financial Intelligence</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Your Entire Financial Life,{" "}
          <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            One AI-Powered Platform
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg md:text-xl"
        >
          Budgeting, investing, fraud protection, goal tracking, and AI scenario planning —
          9 intelligent modules working together as your complete financial operating system.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/sign-up"
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-teal-500 px-8 py-4 text-sm font-semibold text-zinc-950 transition-all hover:bg-teal-400 hover:shadow-lg hover:shadow-teal-500/25"
          >
            Start Free — No Card Required
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#features"
            className="rounded-xl border border-zinc-700/50 px-8 py-4 text-sm font-semibold text-zinc-300 transition-all hover:border-zinc-500 hover:bg-white/[0.03]"
          >
            See All Features
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-zinc-500"
        >
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-teal-500/60" />
            Bank-grade security
          </span>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <span className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-violet-500/60" />
            AI that knows your finances
          </span>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <span className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-blue-500/60" />
            Goal-driven recommendations
          </span>
        </motion.div>

        {/* Preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 mx-auto max-w-3xl"
        >
          <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1 backdrop-blur-sm">
            <div className="rounded-xl bg-[#0a0a0f] p-6 sm:p-8">
              {/* Mock dashboard preview */}
              <div className="flex items-center gap-2 mb-6">
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="h-3 w-3 rounded-full bg-zinc-700" />
                <div className="ml-4 h-4 flex-1 rounded-md bg-zinc-800/50" />
              </div>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Net Worth", value: "₹8,45,200", color: "text-white" },
                  { label: "Health Score", value: "82/100", color: "text-emerald-400" },
                  { label: "Savings Rate", value: "34%", color: "text-teal-400" },
                  { label: "Goals Active", value: "3", color: "text-violet-400" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                    <p className="text-[10px] text-zinc-500 mb-1">{kpi.label}</p>
                    <p className={`text-sm font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
                  <p className="text-xs text-zinc-500 mb-2">AI Assistant</p>
                  <div className="flex items-center gap-2 rounded-lg bg-teal-500/10 px-3 py-2">
                    <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                    <p className="text-xs text-teal-300">&quot;Your emergency fund is at 68% — increase SIP by ₹2,000 to hit target by December.&quot;</p>
                  </div>
                </div>
                <div className="w-48 rounded-lg border border-white/[0.04] bg-white/[0.02] p-4">
                  <p className="text-xs text-zinc-500 mb-2">Fraud Shield</p>
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
                    <Shield className="h-3.5 w-3.5 text-emerald-400" />
                    <p className="text-xs text-emerald-300">0 threats detected today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
