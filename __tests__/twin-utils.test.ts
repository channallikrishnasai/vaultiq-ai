import { computeProjections, scenarioProjection, type RiskAppetite } from "@/lib/twin-utils";

describe("twin-utils", () => {
  describe("computeProjections", () => {
    it("calculates 1-year projection for MODERATE risk", () => {
      const result = computeProjections(100000, "MODERATE");
      expect(result.oneYear).toBe(110000);
    });

    it("calculates 3-year projection for MODERATE risk", () => {
      const result = computeProjections(100000, "MODERATE");
      expect(result.threeYear).toBe(Math.round(100000 * Math.pow(1.1, 3)));
    });

    it("calculates 5-year projection for MODERATE risk", () => {
      const result = computeProjections(100000, "MODERATE");
      expect(result.fiveYear).toBe(Math.round(100000 * Math.pow(1.1, 5)));
    });

    it("calculates 10-year projection for MODERATE risk", () => {
      const result = computeProjections(100000, "MODERATE");
      expect(result.tenYear).toBe(Math.round(100000 * Math.pow(1.1, 10)));
    });

    it("uses correct growth rate for each risk appetite", () => {
      const riskRates: Record<RiskAppetite, number> = {
        VERY_CONSERVATIVE: 0.05,
        CONSERVATIVE: 0.07,
        MODERATE: 0.1,
        GROWTH: 0.12,
        AGGRESSIVE: 0.15,
      };

      for (const [risk, expectedRate] of Object.entries(riskRates)) {
        const result = computeProjections(100000, risk as RiskAppetite);
        expect(result.oneYear).toBe(Math.round(100000 * (1 + expectedRate)));
      }
    });

    it("defaults to MODERATE when no risk specified", () => {
      const result = computeProjections(100000);
      expect(result.oneYear).toBe(110000);
    });

    it("handles zero net worth", () => {
      const result = computeProjections(0, "AGGRESSIVE");
      expect(result.oneYear).toBe(0);
      expect(result.tenYear).toBe(0);
    });

    it("AGGRESSIVE produces highest returns", () => {
      const results = (["VERY_CONSERVATIVE", "CONSERVATIVE", "MODERATE", "GROWTH", "AGGRESSIVE"] as RiskAppetite[])
        .map(r => ({ risk: r, result: computeProjections(100000, r) }));

      for (let i = 1; i < results.length; i++) {
        expect(results[i].result.tenYear).toBeGreaterThan(results[i - 1].result.tenYear);
      }
    });
  });

  describe("scenarioProjection", () => {
    it("calculates projection with extra monthly savings", () => {
      const result = scenarioProjection(100000, 10000, 1, "MODERATE");
      // 100000 * 1.1 + 10000 * 12 = 110000 + 120000 = 230000
      expect(result).toBe(230000);
    });

    it("calculates multi-year projection", () => {
      const result = scenarioProjection(100000, 10000, 2, "MODERATE");
      // Year 1: 100000 * 1.1 + 120000 = 230000
      // Year 2: 230000 * 1.1 + 120000 = 373000
      expect(result).toBe(373000);
    });

    it("handles zero extra savings", () => {
      const result = scenarioProjection(100000, 0, 1, "MODERATE");
      expect(result).toBe(110000);
    });

    it("handles zero years", () => {
      const result = scenarioProjection(100000, 10000, 0, "MODERATE");
      expect(result).toBe(100000);
    });

    it("higher risk produces higher returns", () => {
      const conservative = scenarioProjection(100000, 5000, 5, "CONSERVATIVE");
      const aggressive = scenarioProjection(100000, 5000, 5, "AGGRESSIVE");
      expect(aggressive).toBeGreaterThan(conservative);
    });
  });
});
