"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home, LayoutDashboard, Briefcase, LineChart, TrendingDown,
  TrendingUp, PiggyBank, Target, CreditCard, Percent,
  Bot, ShieldAlert, BarChart3, Receipt, FolderOpen, Settings,
  Globe
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_ITEMS = [
  { name: "Home",         href: "/",                    icon: Home          },
  { name: "Dashboard",    href: "/dashboard",            icon: LayoutDashboard},
  { name: "Portfolio",    href: "/dashboard/portfolio",  icon: Briefcase     },
  { name: "Learning",     href: "/dashboard/learning",   icon: LineChart     },
  { name: "Cash Flow",    href: "/dashboard/expenses",   icon: TrendingDown  },
  { name: "Budgets",      href: "/dashboard/budgets",    icon: PiggyBank     },
  { name: "Goals",        href: "/dashboard/goals",      icon: Target        },
  { name: "Bills",        href: "/dashboard/bills",      icon: CreditCard    },
  { name: "Credit",       href: "/dashboard/credit",     icon: Percent       },
  { name: "AI Twin",      href: "/dashboard/twin",       icon: Bot           },
  { name: "Fraud Shield", href: "/dashboard/fraud",      icon: ShieldAlert   },
  { name: "Reports",      href: "/dashboard/reports",    icon: BarChart3     },
  { name: "Tax Planner",  href: "/dashboard/tax",        icon: Receipt       },
  { name: "Settings",     href: "/dashboard/settings",   icon: Settings      },
];

const keyMap: Record<string, string> = {
  "ai twin": "twin",
  "fraud shield": "fraud",
  "tax planner": "tax"
};

export default function LeftNav({ activeItem = "Dashboard" }: { activeItem?: string }) {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="flex h-full shrink-0 flex-col items-center py-3 gap-0.5"
      style={{
        width: 54,
        background: "rgba(5,5,8,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* V Logo */}
      <motion.div
        animate={{ boxShadow: ["0 0 8px rgba(212,175,55,0.2)","0 0 18px rgba(212,175,55,0.6)","0 0 8px rgba(212,175,55,0.2)"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
        style={{ background: "linear-gradient(135deg,#F5D060,#C8922A)" }}
      >
        <span className="text-xs font-black text-black">V</span>
      </motion.div>

      {/* Nav icons */}
      <div className="flex flex-1 flex-col items-center gap-0.5 overflow-y-auto w-full scrollbar-none px-1.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href ||
                (item.href !== "/" && item.href !== "/dashboard" && pathname?.startsWith(item.href));

          const transKey = "nav." + (keyMap[item.name.toLowerCase()] || item.name.toLowerCase());
          const translatedName = t(transKey);

          return (
            <Link
              key={item.name}
              href={item.href}
              title={translatedName}
              className="group relative flex h-9 w-full items-center justify-center rounded-lg transition-all"
              style={
                isActive
                  ? { background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)" }
                  : { border: "1px solid transparent" }
              }
            >
              <Icon
                size={16}
                style={{
                  color: isActive ? "#D4AF37" : "rgba(113,113,122,0.85)",
                  transition: "color 0.2s",
                }}
              />
              {/* Active bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: "#D4AF37", boxShadow: "0 0 8px rgba(212,175,55,0.6)" }}
                />
              )}
              {/* Tooltip */}
              <span
                className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                style={{ background:"rgba(10,10,14,0.95)", border:"1px solid rgba(255,255,255,0.08)", color:"#e4e4e7" }}
              >
                {translatedName}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Language Selector */}
      <div className="relative group/lang flex flex-col items-center justify-center h-9 w-8 rounded-lg border border-transparent hover:border-zinc-850 hover:bg-zinc-900/30 transition-all cursor-pointer mb-2">
        <Globe size={14} className="text-zinc-500 group-hover/lang:text-[#D4AF37] transition-colors" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title="Change Language"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="hi">हिन्दी</option>
        </select>
        <span className="text-[7px] text-zinc-500 group-hover/lang:text-zinc-300 font-bold uppercase mt-0.5 tracking-wider">
          {language}
        </span>
      </div>

      {/* Version */}
      <p className="text-[6px] text-zinc-700 uppercase tracking-widest mt-1 shrink-0" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
        v0.1
      </p>
    </div>
  );
}
