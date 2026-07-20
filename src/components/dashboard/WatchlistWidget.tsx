"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Trash2,
  Search,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Clock,
  Eye,
  BarChart3,
  Bell,
  ShoppingCart,
  MoreHorizontal,
  Sparkles,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface WatchlistQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number | null;
}

interface WatchlistItem {
  id: string;
  symbol: string;
  companyName: string | null;
  sector: string | null;
  isFavorite: boolean;
  targetPrice: number | null;
  notes: string | null;
  createdAt: string;
  quote: WatchlistQuote | null;
}

interface WatchlistSummary {
  items: WatchlistItem[];
  totalItems: number;
  favoritesCount: number;
  topGainer: WatchlistItem | null;
  topLoser: WatchlistItem | null;
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
}

interface SearchResult {
  symbol: string;
  name: string;
  assetType: string;
  exchange: string | null;
  currency: string;
}

interface PopularStock {
  symbol: string;
  name: string;
  exchange: string;
  sector?: string;
}

const POPULAR_STOCKS: PopularStock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", exchange: "NSE", sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", exchange: "NSE", sector: "IT" },
  { symbol: "INFY", name: "Infosys Ltd", exchange: "NSE", sector: "IT" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE", sector: "Banking" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", exchange: "NSE", sector: "Banking" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE", sector: "Banking" },
  { symbol: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", sector: "Infrastructure" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", sector: "Telecom" },
  { symbol: "ITC", name: "ITC Ltd", exchange: "NSE", sector: "FMCG" },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", exchange: "NSE", sector: "FMCG" },
];

const STORAGE_KEYS = {
  RECENT_SEARCHES: "vaultiq_recent_searches",
  RECENTLY_VIEWED: "vaultiq_recently_viewed",
};

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 48;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function generateSparklineData(positive: boolean): number[] {
  const points: number[] = [];
  let value = 100;
  for (let i = 0; i < 12; i++) {
    value += (Math.random() - (positive ? 0.4 : 0.6)) * 10;
    points.push(value);
  }
  return points;
}

export default function WatchlistWidget() {
  const [watchlist, setWatchlist] = useState<WatchlistSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getFromStorage(STORAGE_KEYS.RECENT_SEARCHES, []));
    setRecentlyViewed(getFromStorage(STORAGE_KEYS.RECENTLY_VIEWED, []));
  }, []);

  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch("/api/trading/watchlist");
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 30000);
    return () => clearInterval(interval);
  }, [fetchWatchlist]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearch(false);
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 5);
      setToStorage(STORAGE_KEYS.RECENT_SEARCHES, updated);
      return updated;
    });
  }, []);

  const addRecentlyViewed = useCallback((symbol: string) => {
    setRecentlyViewed((prev) => {
      const updated = [symbol, ...prev.filter((s) => s !== symbol)].slice(0, 5);
      setToStorage(STORAGE_KEYS.RECENTLY_VIEWED, updated);
      return updated;
    });
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setSelectedIndex(-1);

      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);

      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const results = data.data ?? [];
          setSearchResults(results.slice(0, 8));
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [],
  );

  const isSymbolInWatchlist = useCallback(
    (symbol: string): boolean => {
      return watchlist?.items.some((item) => item.symbol === symbol) ?? false;
    },
    [watchlist],
  );

  const filteredPopular = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const upper = searchQuery.toUpperCase();
    return POPULAR_STOCKS.filter(
      (s) => s.symbol.includes(upper) || s.name.toUpperCase().includes(upper),
    );
  }, [searchQuery]);

  const showPopularOnFocus = !searchQuery || searchQuery.length < 2;

  const displayResults = useMemo(() => {
    if (showPopularOnFocus) {
      return {
        type: "popular" as const,
        items: POPULAR_STOCKS.map((ps) => ({
          symbol: ps.symbol,
          name: ps.name,
          exchange: ps.exchange,
          sector: ps.sector,
          isInWatchlist: isSymbolInWatchlist(ps.symbol),
        })),
      };
    }

    const merged: {
      symbol: string;
      name: string;
      exchange: string | null;
      sector?: string;
      isInWatchlist: boolean;
      isLive?: boolean;
    }[] = [];

    for (const ps of filteredPopular) {
      if (!merged.some((m) => m.symbol === ps.symbol)) {
        merged.push({
          symbol: ps.symbol,
          name: ps.name,
          exchange: ps.exchange,
          sector: ps.sector,
          isInWatchlist: isSymbolInWatchlist(ps.symbol),
        });
      }
    }

    for (const sr of searchResults) {
      if (!merged.some((m) => m.symbol === sr.symbol)) {
        merged.push({
          symbol: sr.symbol,
          name: sr.name,
          exchange: sr.exchange,
          isInWatchlist: isSymbolInWatchlist(sr.symbol),
          isLive: true,
        });
      }
    }

    return { type: "merged" as const, items: merged.slice(0, 10) };
  }, [showPopularOnFocus, filteredPopular, searchResults, isSymbolInWatchlist]);

  const addToWatchlist = async (symbol: string, name: string, exchange: string | null) => {
    if (isSymbolInWatchlist(symbol)) {
      toast.warning(`${symbol} is already in your watchlist`);
      return;
    }

    setAddingSymbol(symbol);
    try {
      const res = await fetch("/api/trading/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, companyName: name }),
      });

      if (res.ok) {
        await fetchWatchlist();
        addRecentSearch(searchQuery || symbol);
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedIndex(-1);
        toast.success(`${symbol} added to watchlist`, {
          description: exchange ? `${exchange}` : undefined,
        });
      } else {
        const errorData = await res.json();
        toast.error("Failed to add stock", {
          description: errorData.error?.message ?? "Please try again",
        });
      }
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      toast.error("Network error", { description: "Failed to add stock to watchlist" });
    } finally {
      setAddingSymbol(null);
    }
  };

  const removeFromWatchlist = async (id: string, symbol: string) => {
    try {
      const res = await fetch(`/api/trading/watchlist?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchWatchlist();
        setActiveMenu(null);
        toast.success(`${symbol} removed from watchlist`);
      }
    } catch (error) {
      console.error("Failed to remove from watchlist:", error);
      toast.error("Failed to remove stock");
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/trading/watchlist?id=${id}&action=favorite`, { method: "PATCH" });
      if (res.ok) {
        await fetchWatchlist();
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = displayResults.items;
    if (items.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          const item = items[selectedIndex];
          addToWatchlist(item.symbol, item.name, item.exchange);
        }
        break;
      case "Escape":
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
        setSelectedIndex(-1);
        break;
    }
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="h-10 bg-zinc-800 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-zinc-800 rounded-xl" />
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
            <Sparkles className="w-4 h-4 text-amber-500" />
            Watchlist
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {watchlist?.totalItems ?? 0} stocks · {watchlist?.favoritesCount ?? 0} favorites
          </p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          {showSearch ? (
            <X className="w-4 h-4 text-emerald-400" />
          ) : (
            <Plus className="w-4 h-4 text-emerald-400" />
          )}
        </button>
      </div>

      {/* Search Section */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            ref={searchContainerRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl blur-xl" />
              <div className="relative bg-zinc-800/80 backdrop-blur-md border border-zinc-700/50 rounded-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search stocks..."
                    className="w-full pl-10 pr-10 py-3 bg-transparent text-white placeholder-zinc-500 focus:outline-none rounded-xl"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    </div>
                  )}
                  {searchQuery && !searchLoading && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-700 rounded"
                    >
                      <X className="w-3 h-3 text-zinc-400" />
                    </button>
                  )}
                </div>

                {/* Recent searches */}
                {showPopularOnFocus && recentSearches.length > 0 && (
                  <div className="px-3 py-2 border-t border-zinc-700/50">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
                      <Clock className="w-3 h-3" />
                      Recent
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setSearchQuery(term);
                            handleSearch(term);
                          }}
                          className="px-2 py-1 bg-zinc-700/50 hover:bg-zinc-700 text-xs text-zinc-300 rounded-lg transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Results dropdown */}
                <div className="max-h-80 overflow-y-auto">
                  {/* Section header */}
                  <div className="px-3 py-2 border-t border-zinc-700/50">
                    <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                      {showPopularOnFocus ? (
                        <>
                          <Star className="w-3 h-3 text-amber-500" />
                          Popular Stocks
                        </>
                      ) : (
                        <>
                          <Search className="w-3 h-3" />
                          {displayResults.items.length} results
                        </>
                      )}
                    </span>
                  </div>

                  {displayResults.items.length === 0 && !showPopularOnFocus && (
                    <div className="px-4 py-6 text-center">
                      <p className="text-zinc-500 text-sm">No stocks found for &quot;{searchQuery}&quot;</p>
                    </div>
                  )}

                  {displayResults.items.map((item, index) => {
                    const isInWatchlist = item.isInWatchlist;
                    const isSelected = index === selectedIndex;

                    return (
                      <button
                        key={item.symbol}
                        onClick={() => addToWatchlist(item.symbol, item.name, item.exchange)}
                        disabled={addingSymbol === item.symbol || isInWatchlist}
                        className={`w-full px-3 py-2.5 flex items-center gap-3 transition-all text-left ${
                          isSelected
                            ? "bg-emerald-500/10 border-l-2 border-emerald-500"
                            : "hover:bg-zinc-700/30 border-l-2 border-transparent"
                        } ${isInWatchlist ? "opacity-60" : ""}`}
                      >
                        {/* Logo placeholder */}
                        <div className="w-9 h-9 rounded-lg bg-zinc-700/50 flex items-center justify-center text-xs font-semibold text-zinc-300 flex-shrink-0">
                          {item.symbol.slice(0, 2)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{item.symbol}</span>
                            {item.exchange && (
                              <span className="text-[10px] px-1 py-0.5 bg-zinc-700/50 text-zinc-400 rounded">
                                {item.exchange}
                              </span>
                            )}
                            {item.sector && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded hidden sm:inline">
                                {item.sector}
                              </span>
                            )}
                          </div>
                          <div className="text-zinc-400 text-xs truncate mt-0.5">{item.name}</div>
                        </div>

                        {isInWatchlist ? (
                          <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full flex-shrink-0">
                            Added
                          </span>
                        ) : addingSymbol === item.symbol ? (
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <Plus className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Keyboard hint */}
                <div className="px-3 py-2 border-t border-zinc-700/50 text-[10px] text-zinc-500 text-center">
                  ↑↓ navigate · Enter add · Esc close
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watchlist Cards */}
      <div className="space-y-2">
        {watchlist?.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-10"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-white font-medium mb-1">Build Your Watchlist</h4>
            <p className="text-zinc-400 text-sm mb-4 max-w-[240px] mx-auto">
              Track your favourite companies, receive intelligent alerts, and monitor live market movements.
            </p>
            <button
              onClick={() => setShowSearch(true)}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
            >
              Browse Popular Stocks
            </button>
          </motion.div>
        ) : (
          watchlist?.items.map((item, index) => {
            const sparklineData = generateSparklineData((item.quote?.changePercent ?? 0) >= 0);
            const isPositive = (item.quote?.changePercent ?? 0) >= 0;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 hover:border-zinc-700/50 rounded-xl p-3 transition-all"
              >
                <div className="flex items-center gap-3">
                  {/* Favorite button */}
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="p-1 hover:bg-zinc-700/50 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Star
                      className={`w-4 h-4 transition-colors ${
                        item.isFavorite ? "text-amber-500 fill-amber-500" : "text-zinc-600 hover:text-zinc-400"
                      }`}
                    />
                  </button>

                  {/* Stock logo placeholder */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                    {item.symbol.slice(0, 2)}
                  </div>

                  {/* Stock info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{item.symbol}</span>
                      {item.sector && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 rounded hidden sm:inline">
                          {item.sector}
                        </span>
                      )}
                    </div>
                    <div className="text-zinc-500 text-xs truncate">{item.companyName}</div>
                  </div>

                  {/* Sparkline */}
                  <div className="hidden sm:block flex-shrink-0">
                    <MiniSparkline data={sparklineData} positive={isPositive} />
                  </div>

                  {/* Price */}
                  {item.quote && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-white font-medium text-sm">
                        ₹{item.quote.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`flex items-center gap-1 text-xs justify-end ${
                          isPositive ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>
                          {isPositive ? "+" : ""}
                          {item.quote.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-zinc-700/50 rounded-lg transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                    </button>

                    <AnimatePresence>
                      {activeMenu === item.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          className="absolute right-0 top-full mt-1 w-44 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden"
                        >
                          <button
                            onClick={() => {
                              addRecentlyViewed(item.symbol);
                              setActiveMenu(null);
                              toast.info(`Analyzing ${item.symbol}...`);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                          >
                            <BarChart3 className="w-4 h-4 text-emerald-500" />
                            Analyze
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              toast.info(`Compare ${item.symbol}`);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                          >
                            <Activity className="w-4 h-4 text-blue-500" />
                            Compare
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              toast.info(`Set alert for ${item.symbol}`);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                          >
                            <Bell className="w-4 h-4 text-amber-500" />
                            Add Alert
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenu(null);
                              toast.info(`Virtual buy ${item.symbol}`);
                            }}
                            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4 text-purple-500" />
                            Virtual Trade
                          </button>
                          <div className="border-t border-zinc-700/50" />
                          <button
                            onClick={() => removeFromWatchlist(item.id, item.symbol)}
                            className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
