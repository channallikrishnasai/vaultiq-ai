"use client";

import { motion } from "framer-motion";
import { UserPlus, Link, Bot, TrendingUp } from "lucide-react";
import { howItWorksSteps } from "@/lib/landing-data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  Link,
  Bot,
  TrendingUp,
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-[#050508] py-24 sm:py-32">
      {/* Background glow */}
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-teal-500/[0.04] blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
            How It Works
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            From Signup to Financial Clarity{" "}
            <span className="text-zinc-500">in Minutes</span>
          </h2>
          <p className="mx-auto max-w-xl text-zinc-400">
            No complex setup. No manual data entry. VaultIQ learns from your onboarding
            and starts working immediately.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-0 top-0 hidden h-full w-px bg-gradient-to-b from-teal-500/20 via-teal-500/10 to-transparent lg:left-1/2 lg:block" />

          <div className="space-y-12 lg:space-y-0">
            {howItWorksSteps.map((step, index) => {
              const StepIcon = iconMap[step.icon] || TrendingUp;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex items-center gap-8 lg:gap-0 ${
                    isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isEven ? "lg:pr-16 lg:text-right" : "lg:pl-16 lg:text-left"}`}>
                    <div className={`inline-flex items-center gap-3 mb-4 ${isEven ? "lg:flex-row-reverse" : ""}`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal-500/20 bg-teal-500/10">
                        <StepIcon className="h-5 w-5 text-teal-400" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-teal-500/60">
                        Step {step.step}
                      </span>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-white">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-zinc-400 max-w-md inline-block">
                      {step.description}
                    </p>
                  </div>

                  {/* Center dot */}
                  <div className="relative z-10 hidden lg:flex h-4 w-4 shrink-0 items-center justify-center">
                    <div className="h-4 w-4 rounded-full border-2 border-teal-500/40 bg-[#050508]" />
                    <div className="absolute h-2 w-2 rounded-full bg-teal-500/60" />
                  </div>

                  {/* Spacer for opposite side */}
                  <div className="hidden lg:block flex-1" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
