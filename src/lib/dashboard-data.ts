export const user = {
  name: "Alex",
  netWorth: 4825000,
  netWorthChange: 120000,
  netWorthChangePercent: 2.5,
  monthlyIncome: 185000,
  monthlyExpenses: 142000,
  monthlySurplus: 43000,
};

export const healthScore = {
  score: 785,
  maxScore: 1000,
  label: "Excellent",
  breakdown: [
    { name: "Savings", value: 85 },
    { name: "Debt", value: 72 },
    { name: "Invest", value: 78 },
    { name: "Protect", value: 90 },
    { name: "Spend", value: 68 },
    { name: "Plan", value: 82 },
  ],
};

export const expenses = {
  total: 142000,
  categories: [
    { name: "Housing", amount: 45000, color: "bg-violet-500", percent: 32 },
    { name: "Food", amount: 28000, color: "bg-teal-500", percent: 20 },
    { name: "Transport", amount: 18000, color: "bg-blue-500", percent: 13 },
    { name: "Shopping", amount: 22000, color: "bg-amber-500", percent: 15 },
    { name: "Entertainment", amount: 15000, color: "bg-rose-500", percent: 11 },
    { name: "Others", amount: 14000, color: "bg-zinc-600", percent: 9 },
  ],
};

export const portfolio = {
  totalValue: 3250000,
  change: 85000,
  changePercent: 2.7,
  allocation: [
    { name: "Equity", percent: 45, color: "bg-teal-500" },
    { name: "Debt", percent: 30, color: "bg-blue-500" },
    { name: "Gold", percent: 15, color: "bg-amber-500" },
    { name: "Cash", percent: 10, color: "bg-emerald-500" },
  ],
  topHoldings: [
    { name: "Reliance Industries", value: 485000, change: 1.2 },
    { name: "HDFC Bank", value: 320000, change: 0.8 },
    { name: "Nifty 50 ETF", value: 275000, change: 1.5 },
  ],
};

export const goals = [
  {
    id: 1,
    name: "Emergency Fund",
    target: 500000,
    current: 400000,
    color: "bg-emerald-500",
    icon: "Shield",
  },
  {
    id: 2,
    name: "Europe Trip",
    target: 800000,
    current: 360000,
    color: "bg-blue-500",
    icon: "Plane",
  },
  {
    id: 3,
    name: "Home Down Payment",
    target: 2500000,
    current: 500000,
    color: "bg-violet-500",
    icon: "Home",
  },
];

export const aiPrompts = [
  "Should I prepay my home loan?",
  "How to save ₹20L for education?",
  "Is my portfolio balanced?",
  "Best SIP for retirement?",
];