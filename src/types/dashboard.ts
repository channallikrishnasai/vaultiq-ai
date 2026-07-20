export interface DashboardUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface DashboardProfile {
  income: number;
  currency: string | null;
  riskAppetite: string | null;
  xp: number;
  streak: number;
}

export interface DashboardGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  color: string;
  icon: string;
  percent: number;
}

export interface DashboardPortfolio {
  totalValue: number;
  cashBalance: number;
  change: number;
  changePercent: number;
  allocation: { name: string; percent: number; color: string }[];
  topHoldings: { name: string; value: number; change: number }[];
  isEmpty: boolean;
}

export interface DashboardHealthScore {
  score: number;
  label: string;
  breakdown: { name: string; value: number }[];
  grade: string;
}

export interface DashboardExpenses {
  total: number;
  categories: { name: string; amount: number; color: string; percent: number }[];
}

export interface DashboardData {
  user: DashboardUser;
  profile: DashboardProfile | null;
  netWorth: number;
  netWorthChange: number;
  netWorthChangePercent: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  healthScore: DashboardHealthScore;
  expenses: DashboardExpenses;
  portfolio: DashboardPortfolio;
  virtualPortfolio: DashboardPortfolio;
  goals: DashboardGoal[];
  expensesList: any[];
  goalsList: any[];
  goalsTotal: number;
  emergencyFund: number;
  emergencyFundTarget: number;
  fraudStats: { scanCount: number; highRiskCount: number };
  twinStats: {
    hasTwin: boolean;
    healthScore: number;
    netWorth: number;
    twinName: string | null;
  };
}

export interface AIProfile {
  income: number | null;
  goal: { name: string; targetAmount?: number } | null;
  riskAppetite: string | null;
  portfolioValue: number | null;
  healthScore: number | null;
  healthLabel: string | null;
}