"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, BarChart3, ArrowUpRight, ArrowDownRight, Flame } from "lucide-react";

interface MoverStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number | null;
  week52High?: number;
  week52Low?: number;
}

interface MarketMovers {
  topGainers: MoverStock[];
  topLosers: MoverStock[];
  mostActive: MoverStock[];
  newHighs: MoverStock[];
  newLows: MoverStock[];
  timestamp: string;
}

type Tab = "gainers" | "losers" | "active" | "highs" | "lows";

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const tabs: TabConfig[] = [
  { id: "gainers", label: "Gainers", icon: <TrendingUp className="w-3.5 h-3.5" />, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { id: "losers", label: "Losers", icon: <TrendingDown className="w-3.5 h-3.5" />, color: "text-red-500", bgColor: "bg-red-500/10" },
  { id: "active", label: "Active", icon: <Flame className="w-3.5 h-3.5" />, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { id: "highs", label: "52W H", icon: <ArrowUpRight className="w-3.5 h-3.5" />, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  { id: "lows", label: "52W L", icon: <ArrowDownRight className="w-3.5 h-3.5" />, color: "text-red-500", bgColor: "bg-red-500/10" },
];

export default function MarketMoversWidget() {
  const [movers, setMovers] = useState<MarketMovers | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("gainers");

  const fetchMovers = useCallback(async () => {
    try {
      const res = await fetch("/api/market/movers");
      if (res.ok) {
        const data = await res.json();
        setMovers(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch market movers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovers();
    const interval = setInterval(fetchMovers, 60000);
    return () => clearInterval(interval);
  }, [fetchMovers]);

  const getStocks = (): MoverStock[] => {
    if (!movers) return [];
    switch (activeTab) {
      case "gainers":
        return movers.topGainers;
      case "losers":
        return movers.topLosers;
      case "active":
        return movers.mostActive;
      case "highs":
        return movers.newHighs;
      case "lows":
        return movers.newLows;
      default:
        return [];
    }
  };

  const formatVolume = (vol: number): string => {
    if (vol >= 10000000) return `${(vol / 10000000).toFixed(1)}Cr`;
    if (vol >= 100000) return `${(vol / 100000).toFixed(1)}L`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
    return vol.toString();
  };

  const activeTabConfig = tabs.find((t) => t.id === activeTab);

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-zinc-800 rounded-lg w-16" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            Market Movers
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-400">Live</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-zinc-800/30 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-1 justify-center ${
                isActive ? "text-white" : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="moversTab"
                  className={`absolute inset-0 ${tab.bgColor} border border-white/5 rounded-lg`}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? tab.color : ""}`}>{tab.icon}</span>
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-1.5"
        >
          {getStocks().length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-zinc-500" />
              </div>
              <p className="text-zinc-400 text-sm">No data available</p>
            </div>
          ) : (
            getStocks().map((stock, index) => {
              const isPositive = stock.changePercent >= 0;

              return (
                <motion.div
                  key={`${stock.symbol}-${index}`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex items-center justify-between p-2.5 bg-zinc-800/20 hover:bg-zinc-800/40 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="w-6 h-6 rounded-lg bg-zinc-700/30 flex items-center justify-center">
                      <span className="text-[10px] text-zinc-400 font-medium">{index + 1}</span>
                    </div>

                    {/* Logo placeholder */}
                    <div className="w-8 h-8 rounded-lg bg-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                      {stock.symbol.slice(0, 2)}
                    </div>

                    {/* Stock info */}
                    <div>
                      <div className="text-white font-medium text-sm">{stock.symbol}</div>
                      <div className="text-zinc-500 text-[10px] truncate max-w-[100px]">{stock.name}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Volume / 52W info */}
                    {activeTab === "active" && (
                      <div className="text-right hidden sm:block">
                        <div className="text-zinc-500 text-[10px]">Vol</div>
                        <div className="text-zinc-300 text-xs">{formatVolume(stock.volume)}</div>
                      </div>
                    )}
                    {(activeTab === "highs" || activeTab === "lows") && (
                      <div className="text-right hidden sm:block">
                        <div className="text-zinc-500 text-[10px]">{activeTab === "highs" ? "52W H" : "52W L"}</div>
                        <div className="text-zinc-300 text-xs">
                          ₹{(activeTab === "highs" ? stock.week52High : stock.week52Low)?.toLocaleString("en-IN") ?? "-"}
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="text-right">
                      <div className="text-white text-sm font-medium">
                        ₹{stock.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`flex items-center gap-0.5 text-[10px] justify-end ${
                          isPositive ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                        <span>
                          {isPositive ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
