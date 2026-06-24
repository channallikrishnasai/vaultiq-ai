export type RiskBand = "Safe" | "Medium" | "High";

export function getRiskBandColor(band: RiskBand): string {
  switch (band) {
    case "Safe":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "Medium":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "High":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  }
}

export function getRiskScoreColor(score: number): string {
  if (score <= 30) return "text-emerald-400";
  if (score <= 60) return "text-amber-400";
  return "text-rose-400";
}

export const FRAUD_INPUT_TYPES = [
  { value: "MESSAGE", label: "SMS / Message", icon: "💬" },
  { value: "LINK", label: "Suspicious Link", icon: "🔗" },
  { value: "PHONE", label: "Phone Number", icon: "📞" },
  { value: "SCREENSHOT", label: "Screenshot Text", icon: "📸" },
] as const;

export const FRAUD_EXAMPLES = [
  "URGENT: Your SBI account will be blocked. Verify KYC at http://bit.ly/sbi-kyc-update",
  "Congratulations! You won ₹50 lakh lottery. Share OTP to claim prize.",
  "Paytm KYC update required. Click here to avoid account suspension.",
];
