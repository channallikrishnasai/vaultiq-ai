import { computeHealthScore, type HealthMetrics } from "@/lib/financial-health";

describe("financial-health", () => {
  describe("computeHealthScore", () => {
    const baseMetrics: HealthMetrics = {
      monthlyIncome: 100000,
      monthlyExpenses: 60000,
      savingsBalance: 200000,
      investments: 300000,
      debt: 100000,
      emergencyFundCurrent: 180000,
      emergencyFundTarget: 360000,
      goalProgressAvg: 50,
      hasBudgets: true,
    };

    it("returns a score between 0 and 100", () => {
      const result = computeHealthScore(baseMetrics);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("returns valid grade", () => {
      const result = computeHealthScore(baseMetrics);
      expect(["A", "B", "C", "D", "F"]).toContain(result.grade);
    });

    it("returns 6 factors", () => {
      const result = computeHealthScore(baseMetrics);
      expect(result.factors).toHaveLength(6);
    });

    it("returns breakdown with 6 items", () => {
      const result = computeHealthScore(baseMetrics);
      expect(result.breakdown).toHaveLength(6);
    });

    it("each factor has score <= 100", () => {
      const result = computeHealthScore(baseMetrics);
      for (const factor of result.factors) {
        expect(factor.score).toBeGreaterThanOrEqual(0);
        expect(factor.score).toBeLessThanOrEqual(100);
      }
    });

    it("gives higher score for better financial health", () => {
      const goodMetrics: HealthMetrics = {
        monthlyIncome: 200000,
        monthlyExpenses: 60000,
        savingsBalance: 500000,
        investments: 800000,
        debt: 50000,
        emergencyFundCurrent: 400000,
        emergencyFundTarget: 360000,
        goalProgressAvg: 80,
        hasBudgets: true,
      };

      const poorMetrics: HealthMetrics = {
        monthlyIncome: 50000,
        monthlyExpenses: 48000,
        savingsBalance: 10000,
        investments: 5000,
        debt: 200000,
        emergencyFundCurrent: 5000,
        emergencyFundTarget: 288000,
        goalProgressAvg: 10,
        hasBudgets: false,
      };

      const goodResult = computeHealthScore(goodMetrics);
      const poorResult = computeHealthScore(poorMetrics);

      expect(goodResult.score).toBeGreaterThan(poorResult.score);
    });

    it("handles zero income gracefully", () => {
      const metrics: HealthMetrics = {
        ...baseMetrics,
        monthlyIncome: 0,
      };
      const result = computeHealthScore(metrics);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("handles zero expenses gracefully", () => {
      const metrics: HealthMetrics = {
        ...baseMetrics,
        monthlyExpenses: 0,
      };
      const result = computeHealthScore(metrics);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it("includes summary string", () => {
      const result = computeHealthScore(baseMetrics);
      expect(typeof result.summary).toBe("string");
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it("grade is consistent with score thresholds", () => {
      const result = computeHealthScore(baseMetrics);
      const score = result.score;
      if (score >= 80) expect(result.grade).toBe("A");
      else if (score >= 65) expect(result.grade).toBe("B");
      else if (score >= 50) expect(result.grade).toBe("C");
      else if (score >= 35) expect(result.grade).toBe("D");
      else expect(result.grade).toBe("F");
    });
  });
});
