"use client";

import { motion } from "framer-motion";
import { stats } from "@/lib/landing-data";

export default function StatsSection() {
  return (
    <section className="relative border-y border-zinc-800/60 bg-zinc-950 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={`flex flex-col items-center text-center ${
                index < stats.length - 1 ? "md:border-r md:border-zinc-800/60" : ""
              }`}
            >
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                {stat.value}
              </span>
              <span className="mt-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
