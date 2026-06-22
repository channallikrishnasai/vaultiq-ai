export const FEATURES = [
  "ai-assistant",
  "fraud-shield",
  "finance-hub",
  "learning",
  "platform-advisor",
  "roadmap",
  "emergency",
  "trading-lab",
  "financial-twin",
] as const;

export type Feature = (typeof FEATURES)[number];
