"use client";

import { motion } from "framer-motion";
import { features } from "@/lib/landing-data";
import { Sparkles, Brain, Heart, Compass, Shield, Copy, BookOpen, Target, TrendingUp, type LucideIcon } from "lucide-react";
import { staggerContainer, fadeInUp } from "@/lib/motion";

const iconMap: Record<string, LucideIcon> = { Sparkles, Brain, Heart, Compass, Shield, Copy, BookOpen, Target, TrendingUp };

export default function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#050508] py-24 sm:py-32">
      {/* Background glow */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.03] blur-[120px]" />

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
            9 Intelligent Modules
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Master Your Money
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-zinc-400">
            Each module is powered by AI and designed to work together — giving you a
            unified financial operating system, not just another app.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => {
            const Icon = iconMap[feature.icon] || Sparkles;
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative h-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] sm:p-8"
              >
                {/* Icon */}
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Title */}
                <h3 className="mb-3 text-lg font-semibold text-white">{feature.title}</h3>

                {/* Description */}
                <p className="mb-4 text-sm leading-relaxed text-zinc-400">{feature.description}</p>

                {/* Detail bullets */}
                {feature.details && (
                  <ul className="space-y-1.5">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-xs text-zinc-500">
                        <div className="h-1 w-1 shrink-0 rounded-full bg-teal-500/50" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Hover glow */}
                <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-[0.06]`} />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
