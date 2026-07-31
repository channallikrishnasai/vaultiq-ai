import { healthScoreService } from "@/services/finance/health-score.service";
import { forecastService } from "./forecast.service";
import {
  predictionEngine,
  type PredictionResult,
  type CashFlowPrediction,
  type GoalPrediction,
  type BudgetPrediction,
  type PortfolioPrediction,
  type PredictionAlert,
  type TimelineEvent,
  type ScenarioResult,
} from "./prediction-engine";
import { riskEngine, type RiskAssessment } from "./risk-engine";
import { timelineService } from "./timeline.service";
import { scenarioService, type ScenarioParams } from "./scenario.service";

export type { PredictionResult, CashFlowPrediction, GoalPrediction, BudgetPrediction, PortfolioPrediction, PredictionAlert, TimelineEvent, ScenarioResult, RiskAssessment };

let cachedPrediction: { userId: string; data: PredictionResult; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

export const predictiveFinanceService = {
  async getPredictions(userId: string, forceRefresh = false): Promise<PredictionResult> {
    if (!forceRefresh && cachedPrediction && cachedPrediction.userId === userId && Date.now() - cachedPrediction.timestamp < CACHE_TTL) {
      return cachedPrediction.data;
    }

    const input = await forecastService.buildPredictionInput(userId);

    const [cashFlow, goals, budget, portfolio, alerts, timeline] = await Promise.all([
      Promise.resolve(predictionEngine.generateCashFlowPredictions(input)),
      Promise.resolve(predictionEngine.generateGoalPredictions(input)),
      Promise.resolve(predictionEngine.generateBudgetPredictions(input)),
      Promise.resolve(predictionEngine.generatePortfolioPrediction(input)),
      Promise.resolve(predictionEngine.generateAlerts(input)),
      timelineService.getTimeline(input),
    ]);

    const result: PredictionResult = {
      cashFlow,
      goals,
      budget,
      portfolio,
      alerts,
      timeline,
      generatedAt: new Date().toISOString(),
    };

    cachedPrediction = { userId, data: result, timestamp: Date.now() };
    return result;
  },

  async getRiskAssessment(userId: string): Promise<RiskAssessment> {
    const input = await forecastService.buildPredictionInput(userId);
    return riskEngine.assessRisk(input);
  },

  async runScenario(userId: string, params: ScenarioParams): Promise<ScenarioResult> {
    const input = await forecastService.buildPredictionInput(userId);
    const healthScore = await healthScoreService.calculate(userId).catch(() => ({ score: 50 }));
    return scenarioService.runScenario(input, params, healthScore.score);
  },

  parseScenario(message: string): ScenarioParams {
    return scenarioService.parseScenarioFromMessage(message);
  },

  formatScenario(result: ScenarioResult): string {
    return scenarioService.formatScenarioResult(result);
  },

  async getPredictionsForCopilot(userId: string): Promise<{
    alerts: { title: string; message: string; severity: string }[];
    goalForecasts: { name: string; advice: string; probability: number }[];
    cashFlowSummary: string;
  }> {
    try {
      const predictions = await this.getPredictions(userId);
      return {
        alerts: predictions.alerts.slice(0, 3).map((a) => ({
          title: a.title,
          message: a.message,
          severity: a.severity,
        })),
        goalForecasts: predictions.goals.slice(0, 3).map((g) => ({
          name: g.name,
          advice: g.advice,
          probability: g.completionProbability,
        })),
        cashFlowSummary: predictions.cashFlow.length > 0
          ? `Projected balance in 30 days: ₹${predictions.cashFlow[1]?.predictedBalance.toLocaleString("en-IN") ?? "N/A"}`
          : "No cash flow data available.",
      };
    } catch {
      return { alerts: [], goalForecasts: [], cashFlowSummary: "Prediction data unavailable." };
    }
  },

  async getPredictionsForDashboard(userId: string): Promise<{
    cashFlow7d: number;
    cashFlow30d: number;
    topGoal: { name: string; probability: number; monthsLeft: number | null } | null;
    alertsCount: number;
    riskLevel: string;
    timelineCount: number;
  }> {
    try {
      const predictions = await this.getPredictions(userId);
      const topGoal = predictions.goals.length > 0
        ? predictions.goals.reduce((best, g) => g.completionProbability > (best?.completionProbability ?? 0) ? g : best, predictions.goals[0])
        : null;
      const risk = await this.getRiskAssessment(userId);
      return {
        cashFlow7d: predictions.cashFlow[0]?.predictedBalance ?? 0,
        cashFlow30d: predictions.cashFlow[1]?.predictedBalance ?? 0,
        topGoal: topGoal ? { name: topGoal.name, probability: topGoal.completionProbability, monthsLeft: topGoal.monthsRemaining } : null,
        alertsCount: predictions.alerts.filter((a) => a.severity === "critical" || a.severity === "warning").length,
        riskLevel: risk.overallRisk,
        timelineCount: predictions.timeline.length,
      };
    } catch {
      return { cashFlow7d: 0, cashFlow30d: 0, topGoal: null, alertsCount: 0, riskLevel: "medium", timelineCount: 0 };
    }
  },
};
