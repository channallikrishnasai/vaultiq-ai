import type { FinancialContext, HealthAnalysis, Finding } from "./types";

export function analyzeHealth(ctx: FinancialContext): HealthAnalysis {
  const { healthScore } = ctx;
  const factors = healthScore.factors.map((f) => {
    const percent = f.maxScore > 0 ? Math.round((f.score / f.maxScore) * 100) : 0;
    let status: HealthAnalysis["factors"][0]["status"];
    if (percent >= 80) status = "excellent";
    else if (percent >= 60) status = "good";
    else if (percent >= 40) status = "needs_improvement";
    else status = "critical";

    return {
      name: f.name,
      score: f.score,
      maxScore: f.maxScore,
      percent,
      status,
      insight: f.tip,
    };
  });

  const strengths: Finding[] = [];
  const weaknesses: Finding[] = [];

  for (const f of factors) {
    if (f.status === "excellent" || f.status === "good") {
      strengths.push({
        category: "health",
        severity: f.status === "excellent" ? "positive" : "neutral",
        title: `${f.name} is strong`,
        detail: `${f.name} scored ${f.score}/${f.maxScore} (${f.percent}%). ${f.insight}`,
        metric: `${f.score}/${f.maxScore}`,
      });
    } else {
      weaknesses.push({
        category: "health",
        severity: f.status === "critical" ? "critical" : "warning",
        title: `${f.name} needs improvement`,
        detail: `${f.name} scored ${f.score}/${f.maxScore} (${f.percent}%). ${f.insight}`,
        metric: `${f.score}/${f.maxScore}`,
        benchmark: `${f.maxScore}/${f.maxScore}`,
      });
    }
  }

  return {
    overallScore: healthScore.score,
    grade: healthScore.grade,
    label: healthScore.label,
    strengths,
    weaknesses,
    factors,
  };
}
