"use client";

import { motion } from "framer-motion";
import { Brain, Layout, BarChart3, Check } from "lucide-react";
import { deepDiveFeatures } from "@/lib/landing-data";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Layout,
  BarChart3,
};

export default function DeepDiveFeatures() {
  return (
    <section id="modules" className="relative bg-[#050508] py-24 sm:py-32 overflow-hidden">
      {/* Background glows */}
      <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/[0.03] blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-teal-500/[0.03] blur-[100px]" />

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20 text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
            Platform Deep Dive
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built for How You{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Actually Manage Money
            </span>
          </h2>
          <p className="mx-auto max-w-xl text-zinc-400">
            Three core experiences that work together — an AI command center, an immersive dashboard,
            and real-time market intelligence.
          </p>
        </motion.div>

        {/* Deep dive cards */}
        <div className="space-y-20">
          {deepDiveFeatures.map((feature, index) => {
            const FeatureIcon = iconMap[feature.icon] || Brain;
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className={`flex flex-col gap-10 lg:flex-row lg:items-center ${
                  isEven ? "" : "lg:flex-row-reverse"
                }`}
              >
                {/* Text content */}
                <div className="flex-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-500/60">
                    {feature.subtitle}
                  </p>
                  <h3 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-zinc-400">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                          <Check className="h-3 w-3 text-teal-400" />
                        </div>
                        <span className="text-sm text-zinc-300">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual card */}
                <div className="flex-1">
                  <div className={`relative rounded-2xl border border-white/[0.06] bg-gradient-to-br ${feature.gradient} p-1`}>
                    <div className="rounded-xl bg-[#0a0a0f] p-6 sm:p-8">
                      {/* Mock UI */}
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                          <FeatureIcon className="h-5 w-5 text-teal-400" />
                        </div>
                        <div>
                          <div className="h-3 w-24 rounded bg-white/[0.08]" />
                          <div className="mt-1.5 h-2 w-16 rounded bg-white/[0.04]" />
                        </div>
                      </div>

                      {feature.icon === "Brain" && (
                        <div className="space-y-3">
                          <div className="rounded-lg bg-teal-500/10 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="h-2 w-2 rounded-full bg-teal-400" />
                              <div className="h-2 w-20 rounded bg-teal-500/30" />
                            </div>
                            <div className="h-2 w-full rounded bg-teal-500/20" />
                            <div className="mt-1 h-2 w-3/4 rounded bg-teal-500/20" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {["Goal", "Budget", "Alert", "Trade"].map((label) => (
                              <div key={label} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 text-center">
                                <div className="mx-auto mb-1 h-4 w-4 rounded bg-white/[0.06]" />
                                <div className="h-2 w-8 mx-auto rounded bg-white/[0.04]" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {feature.icon === "Layout" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                                <div className="h-2 w-8 rounded bg-white/[0.06] mb-2" />
                                <div className="h-3 w-12 rounded bg-white/[0.08]" />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                              <div className="h-2 w-12 rounded bg-white/[0.06] mb-2" />
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <div key={i} className="h-6 w-1 rounded-full bg-teal-500/30" style={{ height: `${12 + i * 4}px` }} />
                                ))}
                              </div>
                            </div>
                            <div className="flex-1 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                              <div className="h-2 w-12 rounded bg-white/[0.06] mb-2" />
                              <div className="h-12 w-full rounded-full bg-white/[0.04] overflow-hidden">
                                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-teal-500/40 to-emerald-500/40" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {feature.icon === "BarChart3" && (
                        <div className="space-y-3">
                          <div className="flex items-end gap-1.5 h-20">
                            {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                              <div
                                key={i}
                                className="flex-1 rounded-t bg-gradient-to-t from-teal-500/30 to-teal-500/10"
                                style={{ height: `${h}%` }}
                              />
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: "Gainers", value: "+23", color: "text-emerald-400" },
                              { label: "Losers", value: "-8", color: "text-rose-400" },
                              { label: "Watchlist", value: "12", color: "text-amber-400" },
                            ].map((stat) => (
                              <div key={stat.label} className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 text-center">
                                <p className={`text-xs font-bold ${stat.color}`}>{stat.value}</p>
                                <p className="text-[9px] text-zinc-500">{stat.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
