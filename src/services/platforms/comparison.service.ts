import type { RiskAppetite } from "@/generated/prisma/enums";

interface Platform {
  id: string;
  name: string;
  brokerage: string;
  amc: string;
  features: string[];
  pros: string[];
  cons: string[];
  rating: number;
  bestFor: string[];
}

const PLATFORMS: Platform[] = [
  {
    id: "zerodha",
    name: "Zerodha",
    brokerage: "₹0 delivery, ₹20 intraday",
    amc: "₹300/year",
    features: ["Kite app", "Coin MF", "Varsity learning", "API access"],
    pros: ["Lowest brokerage", "Excellent platform", "Large user base"],
    cons: ["No stock tips", "Limited research"],
    rating: 4.5,
    bestFor: ["active_traders", "cost_conscious"],
  },
  {
    id: "groww",
    name: "Groww",
    brokerage: "₹0 equity delivery",
    amc: "₹0 (limited period)",
    features: ["Simple UI", "MF investing", "US stocks", "SIP"],
    pros: ["Beginner friendly", "Clean interface", "Free AMC"],
    cons: ["Limited advanced tools", "Basic charting"],
    rating: 4.3,
    bestFor: ["beginners", "mutual_funds"],
  },
  {
    id: "upstox",
    name: "Upstox",
    brokerage: "₹0 delivery, ₹20 intraday",
    amc: "₹0 (promotional)",
    features: ["Upstox Pro", "MTF", "IPO", "Options chain"],
    pros: ["Good mobile app", "Fast execution", "Pro tools"],
    cons: ["Customer support varies"],
    rating: 4.2,
    bestFor: ["intermediate", "options_traders"],
  },
  {
    id: "angelone",
    name: "Angel One",
    brokerage: "₹0 delivery, flat ₹20",
    amc: "₹0 (first year)",
    features: ["ARQ recommendations", "SmartAPI", "Research reports", "Advisory"],
    pros: ["Research backed", "Advisory services", "Full service"],
    cons: ["Slightly complex for beginners"],
    rating: 4.1,
    bestFor: ["research_focused", "advisory"],
  },
];

export const platformComparisonService = {
  compare(preferences: {
    experience: string;
    tradingFrequency: string;
    preferredFeatures?: string[];
    riskAppetite?: RiskAppetite;
    budget?: number;
  }) {
    const scored = PLATFORMS.map((platform) => {
      let score = platform.rating * 20;

      if (preferences.experience === "beginner" && platform.bestFor.includes("beginners")) score += 15;
      if (preferences.experience === "intermediate" && platform.bestFor.includes("intermediate")) score += 15;
      if (preferences.experience === "advanced" && platform.bestFor.includes("active_traders")) score += 15;

      if (preferences.tradingFrequency === "daily" && platform.bestFor.includes("active_traders")) score += 10;
      if (preferences.tradingFrequency === "rarely" && platform.bestFor.includes("mutual_funds")) score += 10;

      if (preferences.riskAppetite === "CONSERVATIVE" && platform.bestFor.includes("mutual_funds")) score += 8;
      if (preferences.riskAppetite === "AGGRESSIVE" && platform.bestFor.includes("options_traders")) score += 8;

      return { ...platform, matchScore: Math.min(100, Math.round(score)) };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return {
      recommendation: scored[0],
      rankings: scored,
      summary: `Based on your ${preferences.experience} experience and ${preferences.tradingFrequency} trading frequency, ${scored[0].name} is the best match with a ${scored[0].matchScore}% compatibility score.`,
    };
  },
};
