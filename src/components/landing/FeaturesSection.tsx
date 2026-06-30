"use client";

import { motion } from "framer-motion";
import { features } from "@/lib/landing-data";
import FeatureCard from "./FeatureCard";
import { staggerContainer, fadeInUp } from "@/lib/motion";

export default function FeaturesSection() {
  return (
    <section id="features" className="relative bg-zinc-950 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
            Features
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Everything Finance, Unified
          </h2>
          <p className="mx-auto max-w-xl text-zinc-400">
            Nine intelligent modules covering budgeting, investing, protection, learning,
            and AI-powered planning — all in one premium platform.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeInUp}>
              <FeatureCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                gradient={feature.gradient}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
