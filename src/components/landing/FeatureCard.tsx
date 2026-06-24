"use client";

import {
  Sparkles,
  Brain,
  Heart,
  Compass,
  Shield,
  Copy,
  BookOpen,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Brain,
  Heart,
  Compass,
  Shield,
  Copy,
  BookOpen,
  Target,
  TrendingUp,
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  gradient: string;
}

export default function FeatureCard({
  title,
  description,
  icon,
  gradient,
}: FeatureCardProps) {
  const Icon = iconMap[icon] || Sparkles;

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group relative h-full rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-zinc-700/80 hover:bg-zinc-900/80 sm:p-8"
    >
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>

      <h3 className="mb-3 text-lg font-semibold text-zinc-50">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>

      <div
        className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-10`}
      />
    </motion.div>
  );
}
