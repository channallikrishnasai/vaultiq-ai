"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Target,
  Shield,
  Bot,
  Settings,
  BookOpen,
  Heart,
} from "lucide-react";
import { staggerContainer, fadeInUp } from "@/lib/motion";

export default function QuickActionsCard() {
  const actions = [
    { label: "Add Expense", href: "/dashboard#expenses", icon: Plus },
    { label: "Add Goal", href: "/dashboard#goals", icon: Target },
    { label: "Fraud Shield", href: "/dashboard/fraud", icon: Shield },
    { label: "Financial Twin", href: "/dashboard/twin", icon: Bot },
    { label: "Learning Hub", href: "/dashboard/learning", icon: BookOpen },
    { label: "Health Score", href: "/dashboard/health", icon: Heart },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <motion.div
      {...fadeInUp}
      className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-6 backdrop-blur-sm"
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold text-zinc-50">Quick Actions</h3>
        <p className="text-xs text-zinc-500">Navigate your financial OS</p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 gap-2"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.label} variants={fadeInUp}>
              <Link
                href={action.href}
                className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/50 p-2.5 transition-all hover:-translate-y-0.5 hover:border-teal-500/30 hover:bg-zinc-900 hover:shadow-md hover:shadow-teal-500/5"
              >
                <Icon className="h-4 w-4 shrink-0 text-teal-400" />
                <span className="text-xs text-zinc-300">{action.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
