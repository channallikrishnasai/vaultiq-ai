"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-24">
      <div className="absolute inset-0 bg-zinc-950">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-violet-500/5 blur-3xl"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400"
        >
          AI-Powered Financial Intelligence
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 text-5xl font-extrabold leading-[1.1] tracking-tight text-zinc-50 sm:text-6xl md:text-7xl"
        >
          One Platform.{" "}
          <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            9
          </span>{" "}
          Financial Modules
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl"
        >
          Budgeting, investing, goals, fraud protection, and AI scenario planning —
          your complete financial operating system.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/sign-up"
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-teal-500 px-8 py-4 text-sm font-semibold text-zinc-950 transition-all hover:bg-teal-400"
          >
            <span className="absolute inset-0 animate-pulse bg-teal-400/20 opacity-0 group-hover:opacity-100" />
            Get Started Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-zinc-700 px-8 py-4 text-sm font-semibold text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-900"
          >
            Sign In
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-sm text-zinc-500"
        >
          AI fraud detection · Financial Twin scenarios · Unified health scoring
        </motion.p>
      </div>
    </section>
  );
}
