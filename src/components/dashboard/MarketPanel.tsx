"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Star, Bell, ChevronLeft, ChevronRight, TrendingUp, Activity } from "lucide-react";
import WatchlistWidget from "./WatchlistWidget";
import MarketMoversWidget from "./MarketMoversWidget";
import ActiveAlertsWidget from "./ActiveAlertsWidget";

type Tab = "watchlist" | "movers" | "alerts";

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const tabs: TabConfig[] = [
  {
    id: "watchlist",
    label: "Watchlist",
    icon: <Star className="w-4 h-4" />,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    id: "movers",
    label: "Movers",
    icon: <TrendingUp className="w-4 h-4" />,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: "alerts",
    label: "Alerts",
    icon: <Bell className="w-4 h-4" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
];

export default function MarketPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("watchlist");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeTabConfig = tabs.find((t) => t.id === activeTab);

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 52 : 400 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-full flex flex-col"
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-6 h-14 bg-zinc-800/80 backdrop-blur-sm border border-zinc-700/50 rounded-l-xl flex items-center justify-center hover:bg-zinc-700/80 transition-all hover:scale-105"
      >
        {isCollapsed ? (
          <ChevronLeft className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </button>

      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full bg-zinc-900/20 backdrop-blur-sm border-l border-zinc-800/30"
          >
            {/* Tab navigation */}
            <div className="relative px-2 pt-3 pb-1">
              <div className="flex gap-1 p-1 bg-zinc-800/30 rounded-xl">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-lg transition-all ${
                        isActive ? "text-white" : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className={`absolute inset-0 ${tab.bgColor} border border-white/5 rounded-lg`}
                          transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                        />
                      )}
                      <span className={`relative z-10 ${isActive ? tab.color : ""}`}>
                        {tab.icon}
                      </span>
                      <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  {activeTab === "watchlist" && <WatchlistWidget />}
                  {activeTab === "movers" && <MarketMoversWidget />}
                  {activeTab === "alerts" && <ActiveAlertsWidget />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed state - show icons */}
      {isCollapsed && (
        <div className="flex flex-col items-center gap-3 pt-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsCollapsed(false);
                }}
                className={`relative p-2.5 rounded-xl transition-all ${
                  isActive ? `${tab.bgColor} ${tab.color}` : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                }`}
                title={tab.label}
              >
                {tab.icon}
                {isActive && (
                  <motion.div
                    layoutId="collapsedIndicator"
                    className={`absolute -left-3 top-1/2 -translate-y-1/2 w-0.5 h-4 ${tab.bgColor.replace("/10", "")} rounded-full`}
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
