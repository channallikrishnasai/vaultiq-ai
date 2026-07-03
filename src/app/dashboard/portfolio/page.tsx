"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, RefreshCw, BarChart2,
  DollarSign, ArrowUpRight, Search, Activity, ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { toast } from "sonner";

interface Stock {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Portfolio {
  id: string;
  name: string;
  cashBalance: number;
  totalValue: number;
  trades: any[];
}

export default function PortfolioPage() {
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activePortfolio, setActivePortfolio] = useState<Portfolio | null>(null);
  const [market, setMarket] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>("RELIANCE");
  const [quantity, setQuantity] = useState<number>(10);
  const [orderType, setOrderType] = useState<string>("MARKET");
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [bracketStop, setBracketStop] = useState<number>(0);
  const [bracketTarget, setBracketTarget] = useState<number>(0);
  const [chartIndicator, setChartIndicator] = useState<string>("NONE");

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trading/portfolio");
      const json = await res.json();
      if (json.success) {
        setMarket(json.data.market || []);
        const ports = json.data.portfolios || [];
        setPortfolios(ports);
        if (ports.length > 0) {
          setActivePortfolio(ports[0]);
        } else {
          // Auto create a virtual portfolio if none exists
          const createRes = await fetch("/api/trading/portfolio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Virtual Demat", cashBalance: 200000 }),
          });
          const createJson = await createRes.json();
          if (createJson.success) {
            setPortfolios([createJson.data]);
            setActivePortfolio(createJson.data);
          }
        }
      }
    } catch (e) {
      toast.error("Failed to load trading details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  // Set default limit price when stock changes
  useEffect(() => {
    const stock = market.find(s => s.symbol === selectedStock);
    if (stock) {
      setLimitPrice(Math.round(stock.price));
      setBracketStop(Math.round(stock.price * 0.95));
      setBracketTarget(Math.round(stock.price * 1.1));
    }
  }, [selectedStock, market]);

  // Execute trade
  const handleTrade = async (tradeType: "BUY" | "SELL") => {
    if (!activePortfolio) return;
    const stock = market.find(s => s.symbol === selectedStock);
    if (!stock) return;

    const price = orderType === "LIMIT" ? limitPrice : stock.price;
    const notes = orderType === "BRACKET" ? `Target: ${bracketTarget}, Stop: ${bracketStop}` : "";

    try {
      const res = await fetch("/api/trading/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId: activePortfolio.id,
          symbol: selectedStock,
          type: tradeType,
          quantity,
          price,
          notes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Order Placed: ${tradeType} ${quantity} shares of ${selectedStock}`);
        fetchData();
      } else {
        toast.error(json.message || "Failed to place order");
      }
    } catch {
      toast.error("Network error executing trade");
    }
  };

  // Mock chart points based on current selected stock
  const activeStock = market.find(s => s.symbol === selectedStock);
  const currentPrice = activeStock?.price || 100;
  const generateChartData = () => {
    const data = [];
    let price = currentPrice * 0.95;
    for (let i = 0; i < 20; i++) {
      price = price * (1 + (Math.random() * 0.04 - 0.02));
      data.push({
        time: `${10 + Math.floor(i/2)}:${(i%2)*30 === 0 ? "00" : "30"}`,
        Price: +price.toFixed(2),
        EMA: +(price * (1 + Math.sin(i / 3) * 0.01)).toFixed(2),
        RSI: Math.floor(40 + Math.sin(i/2)*20 + Math.random()*10),
      });
    }
    return data;
  };
  const chartData = generateChartData();

  // Compute holdings from trades
  const calculateHoldings = () => {
    if (!activePortfolio || !activePortfolio.trades) return [];
    const holdingsMap: Record<string, { qty: number; avgCost: number; spent: number }> = {};
    activePortfolio.trades.forEach((t: any) => {
      const sym = t.symbol;
      if (!holdingsMap[sym]) holdingsMap[sym] = { qty: 0, avgCost: 0, spent: 0 };
      if (t.type === "BUY") {
        holdingsMap[sym].qty += t.quantity;
        holdingsMap[sym].spent += t.totalAmount;
      } else {
        const avg = holdingsMap[sym].qty > 0 ? holdingsMap[sym].spent / holdingsMap[sym].qty : 0;
        holdingsMap[sym].qty = Math.max(0, holdingsMap[sym].qty - t.quantity);
        holdingsMap[sym].spent = holdingsMap[sym].qty * avg;
      }
    });

    return Object.entries(holdingsMap)
      .map(([symbol, h]) => {
        const curPrice = market.find(s => s.symbol === symbol)?.price || 0;
        const curValue = h.qty * curPrice;
        const avgPrice = h.qty > 0 ? h.spent / h.qty : 0;
        const profit = curValue - h.spent;
        return {
          symbol,
          qty: h.qty,
          avgPrice,
          totalCost: h.spent,
          currentValue: curValue,
          profit,
          profitPercent: h.spent > 0 ? (profit / h.spent) * 100 : 0,
        };
      })
      .filter(h => h.qty > 0);
  };

  const holdings = calculateHoldings();
  const totalHoldingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalDematValue = (activePortfolio?.cashBalance || 0) + totalHoldingsValue;

  return (
    <div className="h-full w-full bg-[#040407] text-zinc-100 flex flex-col p-4 overflow-y-auto scrollbar-none">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4 border-b border-zinc-800/40 pb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="text-[#D4AF37] h-5 w-5" /> Virtual Demat & Trading Lab
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Test trading strategies with ₹2,00,000 virtual capital in realtime
          </p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh Markets
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4 flex-1">
        
        {/* LEFT COLUMN: Overview, Watchlist & Portfolio (8 Cols) */}
        <div className="col-span-8 space-y-4">
          
          {/* Virtual Account Balance Card */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Value</p>
              <h2 className="text-xl font-extrabold text-white mt-1">
                ₹{totalDematValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5 mt-1">
                <ArrowUpRight size={10} /> +0.82% today
              </span>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Cash Balance</p>
              <h2 className="text-lg font-bold text-zinc-200 mt-1">
                ₹{(activePortfolio?.cashBalance || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[9px] text-zinc-500 mt-1 block">Buying power available</span>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Invested Value</p>
              <h2 className="text-lg font-bold text-zinc-200 mt-1">
                ₹{totalHoldingsValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[9px] text-[#D4AF37] font-medium mt-1 block">
                {holdings.length} Active Positions
              </span>
            </div>
          </div>

          {/* Interactive Chart Workspace */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded px-1.5 py-0.5 text-[10px] font-bold text-[#D4AF37]">
                  {selectedStock}
                </div>
                <h3 className="text-sm font-bold text-white">₹{currentPrice.toFixed(2)}</h3>
                <span className={`text-[10px] font-semibold ${(activeStock?.changePercent || 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {(activeStock?.changePercent || 0) >= 0 ? "+" : ""}{activeStock?.changePercent}%
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-zinc-500 font-semibold">Overlay Indicator:</span>
                {["NONE", "EMA", "RSI"].map(ind => (
                  <button
                    key={ind}
                    onClick={() => setChartIndicator(ind)}
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition ${chartIndicator === ind ? "bg-[#D4AF37] text-black" : "bg-zinc-800 text-zinc-400"}`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[220px] w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="time" stroke="#52525b" fontSize={8} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} stroke="#52525b" fontSize={8} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", fontSize: 9 }} />
                    <Area type="monotone" dataKey="Price" stroke="#D4AF37" strokeWidth={1.5} fillOpacity={1} fill="url(#goldGrad)" />
                    {chartIndicator === "EMA" && (
                      <Line type="monotone" dataKey="EMA" stroke="#60a5fa" strokeWidth={1.2} dot={false} />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Holdings Portfolio Table */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/30 backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Your Demat Holdings</h3>
            {holdings.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-zinc-800 rounded-lg">
                <BarChart2 className="mx-auto mb-2 text-zinc-600" size={20} />
                <p className="text-xs text-zinc-500">No active positions yet. Place a trade to start investing.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800 pb-2">
                      <th className="pb-2">Symbol</th>
                      <th className="pb-2 text-right">Qty</th>
                      <th className="pb-2 text-right">Avg Price</th>
                      <th className="pb-2 text-right">Current Price</th>
                      <th className="pb-2 text-right">Current Value</th>
                      <th className="pb-2 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {holdings.map((h, i) => (
                      <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="py-2.5 font-bold text-white">{h.symbol}</td>
                        <td className="py-2.5 text-right">{h.qty}</td>
                        <td className="py-2.5 text-right">₹{h.avgPrice.toFixed(2)}</td>
                        <td className="py-2.5 text-right">₹{(market.find(s => s.symbol === h.symbol)?.price || 0).toFixed(2)}</td>
                        <td className="py-2.5 text-right font-semibold">₹{h.currentValue.toFixed(2)}</td>
                        <td className={`py-2.5 text-right font-bold ${h.profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          ₹{h.profit.toFixed(2)} ({h.profitPercent.toFixed(1)}%)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Market Tickers & Place Order Panel (4 Cols) */}
        <div className="col-span-4 space-y-4">
          
          {/* Place Trade Order Panel */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a] shadow-lg">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37] mb-3">Place Trade Order</h3>
            
            {/* Stock Search/Select */}
            <div className="mb-3">
              <label className="text-[10px] text-zinc-500 font-bold block mb-1">Select Ticker Symbol</label>
              <div className="relative">
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {market.map(s => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} (₹{s.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Type Toggle */}
            <div className="mb-3">
              <label className="text-[10px] text-zinc-500 font-bold block mb-1.5">Order Type</label>
              <div className="grid grid-cols-4 gap-1">
                {["MARKET", "LIMIT", "BRACKET", "ICEBERG"].map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`rounded py-1 text-[9px] font-bold transition ${orderType === t ? "bg-[#D4AF37] text-black" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-3">
              <label className="text-[10px] text-zinc-500 font-bold block mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Conditional Limit Inputs */}
            {orderType === "LIMIT" && (
              <div className="mb-3">
                <label className="text-[10px] text-[#D4AF37] font-bold block mb-1">Limit Price (₹)</label>
                <input
                  type="number"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-zinc-900 border border-[#D4AF37]/40 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            )}

            {/* Bracket Stop Loss & Target */}
            {orderType === "BRACKET" && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-[9px] text-rose-400 font-bold block mb-1">Stop Loss (₹)</label>
                  <input
                    type="number"
                    value={bracketStop}
                    onChange={(e) => setBracketStop(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-rose-500/20 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-emerald-400 font-bold block mb-1">Target (₹)</label>
                  <input
                    type="number"
                    value={bracketTarget}
                    onChange={(e) => setBracketTarget(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Trade Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTrade("BUY")}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs tracking-wider"
              >
                BUY / INITIATE
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTrade("SELL")}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-lg text-xs tracking-wider"
              >
                SELL / SQUARE
              </motion.button>
            </div>
          </div>

          {/* Live Market Watchlist */}
          <div className="p-4 rounded-xl border border-zinc-800/60 bg-[#06060a]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
              <span>Markets Watchlist</span>
              <Activity size={10} className="text-[#D4AF37]" />
            </h3>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
              {market.map((s) => (
                <div
                  key={s.symbol}
                  onClick={() => setSelectedStock(s.symbol)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${selectedStock === s.symbol ? "bg-zinc-850/50 border-[#D4AF37]/35" : "bg-zinc-900/20 border-zinc-800/30 hover:border-zinc-800"}`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-white block">{s.symbol}</span>
                    <span className="text-[8px] text-zinc-500">Equity Stock Ticker</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-zinc-200 block">₹{s.price.toFixed(2)}</span>
                    <span className={`text-[8.5px] font-medium ${s.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {s.changePercent >= 0 ? "+" : ""}{s.changePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
