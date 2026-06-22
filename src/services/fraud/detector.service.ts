import type { FraudInputType } from "@/generated/prisma/enums";

export interface FraudAnalysisResult {
  riskScore: number;
  riskBand: "Safe" | "Medium" | "High";
  threatCategory: string;
  explanation: string;
  actions: string[];
}

const SUSPICIOUS_PATTERNS = [
  { pattern: /otp|pin|cvv|password/i, weight: 25, category: "Credential Harvesting" },
  { pattern: /urgent|immediately|act now|limited time/i, weight: 15, category: "Urgency Tactics" },
  { pattern: /lottery|winner|prize|congratulations/i, weight: 20, category: "Lottery Scam" },
  { pattern: /bitcoin|crypto|double your|guaranteed return/i, weight: 22, category: "Investment Fraud" },
  { pattern: /click here|bit\.ly|tinyurl|shorturl/i, weight: 18, category: "Suspicious Link" },
  { pattern: /bank.*suspend|account.*block|verify.*account/i, weight: 28, category: "Phishing" },
  { pattern: /kyc.*update|pan.*link|aadhaar.*verify/i, weight: 24, category: "KYC Fraud" },
  { pattern: /\+91[6-9]\d{9}/g, weight: 5, category: "Phone Contact" },
  { pattern: /\.(tk|ml|ga|cf|gq|xyz|top|buzz)/i, weight: 20, category: "Suspicious Domain" },
  { pattern: /paytm|phonepe|gpay.*link/i, weight: 12, category: "Payment App Phishing" },
];

const SAFE_INDICATORS = [
  /official.*@.*\.(com|in|org)/i,
  /receipt|invoice|order.*confirmed/i,
];

function getRiskBand(score: number): "Safe" | "Medium" | "High" {
  if (score <= 30) return "Safe";
  if (score <= 60) return "Medium";
  return "High";
}

function analyzeContent(content: string, inputType: FraudInputType): FraudAnalysisResult {
  let score = 0;
  const categories: string[] = [];

  if (inputType === "LINK") score += 10;
  if (inputType === "PHONE") score += 8;
  if (inputType === "SCREENSHOT") score += 5;

  for (const { pattern, weight, category } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(content)) {
      score += weight;
      if (!categories.includes(category)) categories.push(category);
    }
  }

  for (const safe of SAFE_INDICATORS) {
    if (safe.test(content)) score = Math.max(0, score - 15);
  }

  if (content.length < 20 && inputType === "MESSAGE") score += 5;
  if (/http/i.test(content) && !/https:\/\//i.test(content)) score += 15;

  score = Math.min(100, Math.max(0, score));
  const riskBand = getRiskBand(score);
  const threatCategory = categories[0] ?? (riskBand === "Safe" ? "No Threat Detected" : "General Suspicion");

  const actions: string[] = [];
  if (riskBand === "High") {
    actions.push("Do not click any links or share personal information");
    actions.push("Report to cybercrime.gov.in");
    actions.push("Block the sender immediately");
    actions.push("Contact your bank if financial details were shared");
  } else if (riskBand === "Medium") {
    actions.push("Verify the sender through official channels");
    actions.push("Do not share OTP, PIN, or passwords");
    actions.push("Check the URL carefully before clicking");
  } else {
    actions.push("Content appears safe, but stay vigilant");
    actions.push("Always verify financial requests independently");
  }

  const explanation =
    riskBand === "Safe"
      ? "No significant fraud indicators detected in the provided content."
      : `Detected ${categories.length} threat indicator(s): ${categories.join(", ")}. Risk score: ${score}/100.`;

  return { riskScore: score, riskBand, threatCategory, explanation, actions };
}

export const fraudDetectorService = {
  analyze(inputType: FraudInputType, content: string): FraudAnalysisResult {
    return analyzeContent(content, inputType);
  },
};
