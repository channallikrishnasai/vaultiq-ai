import { investmentRiskService } from "@/services/investment/investment-risk.service";
import type { Holding, RiskMetrics, PortfolioSummary, GoalAlignment } from "@/services/portfolio/portfolio-types";
import type { InvestorProfile } from "@/services/investment/investment-types";

const mockHoldings: Holding[] = [
  {
    symbol: "RELIANCE",
    assetType: "stock_nse",
    quantity: 10,
    averageCost: 2000,
    totalCost: 20000,
    currentPrice: 2500,
    currentValue: 25000,
    unrealizedPnL: 5000,
    unrealizedPnLPercent: 25,
    dayChange: 50,
    dayChangePercent: 2,
    weight: 25,
    sector: "Energy",
    exchange: "NSE",
  },
  {
    symbol: "TCS",
    assetType: "stock_nse",
    quantity: 5,
    averageCost: 3500,
    totalCost: 17500,
    currentPrice: 3800,
    currentValue: 19000,
    unrealizedPnL: 1500,
    unrealizedPnLPercent: 8.57,
    dayChange: -20,
    dayChangePercent: -0.52,
    weight: 19,
    sector: "Technology",
    exchange: "NSE",
  },
  {
    symbol: "HDFCBANK",
    assetType: "stock_nse",
    quantity: 15,
    averageCost: 1500,
    totalCost: 22500,
    currentPrice: 1600,
    currentValue: 24000,
    unrealizedPnL: 1500,
    unrealizedPnLPercent: 6.67,
    dayChange: 10,
    dayChangePercent: 0.63,
    weight: 24,
    sector: "Finance",
    exchange: "NSE",
  },
  {
    symbol: "GOLDBEES",
    assetType: "etf",
    quantity: 50,
    averageCost: 400,
    totalCost: 20000,
    currentPrice: 450,
    currentValue: 22500,
    unrealizedPnL: 2500,
    unrealizedPnLPercent: 12.5,
    dayChange: 5,
    dayChangePercent: 1.12,
    weight: 22.5,
    sector: "Finance",
    exchange: "NSE",
  },
];

const mockRisk: RiskMetrics = {
  diversificationScore: 65,
  concentrationScore: 35,
  portfolioRiskScore: 50,
  volatility: 25,
  beta: 0.95,
  riskAlignment: "aligned",
  topHoldingsConcentration: 68,
  sectorConcentration: 25,
  largestPositionPercent: 25,
};

const mockSummary: PortfolioSummary = {
  portfolioId: "test-portfolio",
  portfolioName: "Test Portfolio",
  totalCurrentValue: 100000,
  totalInvested: 80000,
  cashBalance: 10000,
  totalPnL: 20000,
  totalPnLPercent: 25,
  todayPnL: 500,
  todayPnLPercent: 0.5,
  unrealizedPnL: 18000,
  realizedPnL: 2000,
  holdingsCount: 4,
  lastUpdated: new Date().toISOString(),
};

const mockGoals: GoalAlignment[] = [
  {
    goalName: "Retirement",
    goalType: "retirement",
    targetAmount: 5000000,
    currentProgress: 2000000,
    portfolioContribution: 1800000,
    percentComplete: 40,
    onTrack: true,
    monthsToGoal: 120,
    monthlyNeeded: 5000,
  },
  {
    goalName: "House",
    goalType: "home",
    targetAmount: 2000000,
    currentProgress: 500000,
    portfolioContribution: 400000,
    percentComplete: 25,
    onTrack: false,
    monthsToGoal: 60,
    monthlyNeeded: 15000,
  },
];

const mockInvestorProfile: InvestorProfile = {
  age: 30,
  riskAppetite: "moderate",
  annualIncome: 1200000,
  monthlyIncome: 100000,
  savingsRate: 25,
  emergencyFundMonths: 6,
  investmentHorizon: "long",
  goals: [],
  dependents: 0,
  hasInsurance: true,
  debtToIncomeRatio: 0.2,
};

describe("investment-risk-service", () => {
  describe("detectWarnings", () => {
    it("returns empty for healthy portfolio", () => {
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: mockRisk,
        summary: mockSummary,
        goalAlignment: mockGoals.filter(g => g.onTrack),
      });
      expect(warnings).toBeDefined();
      expect(Array.isArray(warnings)).toBe(true);
    });

    it("detects high cash warnings", () => {
      const highCashSummary = { ...mockSummary, cashBalance: 60000 };
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: mockRisk,
        summary: highCashSummary,
        goalAlignment: [],
      });
      const cashWarnings = warnings.filter(w => w.type === "high_cash");
      expect(cashWarnings.length).toBeGreaterThan(0);
    });

    it("detects single stock dependency", () => {
      const highConcentrationRisk = { ...mockRisk, largestPositionPercent: 45 };
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: highConcentrationRisk,
        summary: mockSummary,
        goalAlignment: [],
      });
      const concentrationWarnings = warnings.filter(w => w.type === "single_stock");
      expect(concentrationWarnings.length).toBeGreaterThan(0);
    });

    it("detects sector overconcentration", () => {
      const highSectorRisk = { ...mockRisk, sectorConcentration: 60 };
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: highSectorRisk,
        summary: mockSummary,
        goalAlignment: [],
      });
      const sectorWarnings = warnings.filter(w => w.type === "overexposure");
      expect(sectorWarnings.length).toBeGreaterThan(0);
    });

    it("detects low diversification", () => {
      const lowDivRisk = { ...mockRisk, diversificationScore: 25 };
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: lowDivRisk,
        summary: mockSummary,
        goalAlignment: [],
      });
      const divWarnings = warnings.filter(w => w.type === "low_diversification");
      expect(divWarnings.length).toBeGreaterThan(0);
    });

    it("detects high volatility", () => {
      const highVolRisk = { ...mockRisk, volatility: 55 };
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: highVolRisk,
        summary: mockSummary,
        goalAlignment: [],
      });
      const volWarnings = warnings.filter(w => w.type === "high_volatility");
      expect(volWarnings.length).toBeGreaterThan(0);
    });

    it("detects goal mismatch", () => {
      const offTrackGoals: GoalAlignment[] = [
        { ...mockGoals[1], onTrack: false, monthlyNeeded: 15000 },
      ];
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: mockRisk,
        summary: mockSummary,
        goalAlignment: offTrackGoals,
      });
      const goalWarnings = warnings.filter(w => w.type === "goal_mismatch");
      expect(goalWarnings.length).toBeGreaterThan(0);
    });

    it("detects risk misalignment", () => {
      const aggressiveRisk = { ...mockRisk, riskAlignment: "aggressive" as const };
      const conservativeProfile = { ...mockInvestorProfile, riskAppetite: "conservative" as const };
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: aggressiveRisk,
        summary: mockSummary,
        goalAlignment: [],
        investorProfile: conservativeProfile,
      });
      const riskWarnings = warnings.filter(w => w.type === "risk_misalignment");
      expect(riskWarnings.length).toBeGreaterThan(0);
    });

    it("detects emergency fund warning", () => {
      const lowCashSummary = { ...mockSummary, cashBalance: 5000 };
      const warnings = investmentRiskService.detectWarnings({
        holdings: mockHoldings,
        risk: mockRisk,
        summary: lowCashSummary,
        goalAlignment: [],
        investorProfile: mockInvestorProfile,
      });
      const emergencyWarnings = warnings.filter(w => w.type === "no_emergency_fund");
      expect(emergencyWarnings.length).toBeGreaterThan(0);
    });

    it("detects inactive investments", () => {
      const inactiveHoldings = mockHoldings.map(h => ({
        ...h,
        dayChange: 0,
        dayChangePercent: 0,
      }));
      const warnings = investmentRiskService.detectWarnings({
        holdings: inactiveHoldings,
        risk: mockRisk,
        summary: mockSummary,
        goalAlignment: [],
      });
      const inactiveWarnings = warnings.filter(w => w.type === "inactive_investments");
      expect(inactiveWarnings.length).toBeGreaterThan(0);
    });
  });

  describe("summarizeWarnings", () => {
    it("returns healthy message for no warnings", () => {
      const summary = investmentRiskService.summarizeWarnings([]);
      expect(summary).toContain("No critical warnings");
    });

    it("summarizes critical warnings", () => {
      const warnings = [
        {
          id: "w1",
          type: "single_stock" as const,
          severity: "critical" as const,
          title: "Single Stock",
          description: "desc",
          impact: "impact",
          recommendation: "rec",
        },
        {
          id: "w2",
          type: "high_cash" as const,
          severity: "warning" as const,
          title: "High Cash",
          description: "desc",
          impact: "impact",
          recommendation: "rec",
        },
      ];
      const summary = investmentRiskService.summarizeWarnings(warnings);
      expect(summary).toContain("1 critical");
      expect(summary).toContain("1 warning");
    });
  });
});
