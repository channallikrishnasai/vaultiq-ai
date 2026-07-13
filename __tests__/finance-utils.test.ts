import { computeNetWorth, computeSavingsRate } from "@/lib/finance-utils";

describe("finance-utils", () => {
  describe("computeNetWorth", () => {
    it("calculates net worth correctly", () => {
      expect(computeNetWorth(100000, 50000, 20000)).toBe(130000);
    });

    it("handles zero values", () => {
      expect(computeNetWorth(0, 0, 0)).toBe(0);
    });

    it("handles negative net worth (debt exceeds assets)", () => {
      expect(computeNetWorth(10000, 5000, 30000)).toBe(-15000);
    });

    it("handles large numbers", () => {
      expect(computeNetWorth(10000000, 5000000, 2000000)).toBe(13000000);
    });
  });

  describe("computeSavingsRate", () => {
    it("calculates savings rate correctly", () => {
      expect(computeSavingsRate(100000, 70000)).toBe(30);
    });

    it("returns 0 when income is 0", () => {
      expect(computeSavingsRate(0, 0)).toBe(0);
    });

    it("returns 0 when income is negative", () => {
      expect(computeSavingsRate(-10000, 5000)).toBe(0);
    });

    it("handles 100% savings rate", () => {
      expect(computeSavingsRate(100000, 0)).toBe(100);
    });

    it("handles expenses exceeding income (negative savings)", () => {
      const result = computeSavingsRate(50000, 60000);
      expect(result).toBe(-20);
    });

    it("rounds to nearest integer", () => {
      expect(computeSavingsRate(100000, 33333)).toBe(67);
    });
  });
});
