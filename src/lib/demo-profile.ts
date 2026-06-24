/**
 * Single source of truth for demo user financial profile.
 * All demo data, KPIs, twin snapshots, and health scores derive from these values.
 */
export const DEMO_PROFILE = {
  monthlyIncome: 50_000,
  monthlyExpenses: 35_000,
  savingsBalance: 120_000,
  investments: 50_000,
  debt: 20_000,
  savingsRate: 30,
  annualIncome: 600_000,
  annualExpenses: 420_000,
  netWorth: 150_000, // savings + investments - debt
  goals: {
    emergency: { name: "Emergency Fund", target: 50_000, current: 30_000, type: "EMERGENCY" as const },
    laptop: { name: "Laptop", target: 80_000, current: 25_000, type: "SAVINGS" as const },
    europeTrip: { name: "Europe Trip", target: 200_000, current: 65_000, type: "SAVINGS" as const },
  },
  portfolio: {
    name: "Default Portfolio",
    cashBalance: 5_000,
    totalValue: 50_000,
    trades: [
      { symbol: "TCS", quantity: 5, price: 3_000, totalAmount: 15_000 },
      { symbol: "Infosys", quantity: 10, price: 1_200, totalAmount: 12_000 },
      { symbol: "Reliance", quantity: 6, price: 3_000, totalAmount: 18_000 },
    ],
  },
  riskAppetite: "MODERATE" as const,
  currency: "INR",
} as const;

export const DEMO_EXPENSES = [
  { amount: 12_000, category: "Bills & Utilities", notes: "Rent & utilities" },
  { amount: 8_000, category: "Food & Dining", notes: "Groceries & dining out" },
  { amount: 5_000, category: "Transportation", notes: "Fuel & cab rides" },
  { amount: 5_000, category: "Shopping", notes: "Online purchases" },
  { amount: 3_000, category: "Entertainment", notes: "Streaming & outings" },
  { amount: 2_000, category: "Healthcare", notes: "Medicines & checkup" },
] as const;

export const DEMO_FRAUD_REPORTS = [
  {
    inputType: "MESSAGE" as const,
    content: "Congratulations! You won ₹50 lakh lottery. Share OTP to claim your prize immediately.",
    riskScore: 86,
    threatCategory: "Lottery Scam",
    explanation: "Detected lottery scam indicators: urgency tactics, OTP request, and prize claim language.",
    actions: ["Do not share OTP", "Block sender", "Report to cybercrime.gov.in"],
    daysAgo: 12,
  },
  {
    inputType: "LINK" as const,
    content: "URGENT: Complete KYC update at http://bit.ly/paytm-kyc-verify to avoid account suspension.",
    riskScore: 92,
    threatCategory: "KYC Fraud",
    explanation: "Detected KYC phishing link with urgency tactics and suspicious shortened URL.",
    actions: ["Do not click the link", "Verify via official app", "Report phishing"],
    daysAgo: 9,
  },
  {
    inputType: "PHONE" as const,
    content: "+91 9876543210 — Caller claimed SBI refund pending. Asked for UPI PIN and card details.",
    riskScore: 61,
    threatCategory: "Phishing",
    explanation: "Detected impersonation call requesting sensitive financial credentials.",
    actions: ["Never share UPI PIN", "Call bank official number", "Block number"],
    daysAgo: 7,
  },
  {
    inputType: "MESSAGE" as const,
    content: "Pay ₹1 to receive ₹5000 cashback. Send UPI payment request to scammer@paytm immediately!",
    riskScore: 88,
    threatCategory: "Payment App Phishing",
    explanation: "Detected UPI payment request scam with unrealistic cashback offer.",
    actions: ["Do not send payment", "Block sender", "Report to payment app"],
    daysAgo: 4,
  },
  {
    inputType: "MESSAGE" as const,
    content: "Your account will be blocked in 2 hours. Share OTP sent to your phone to verify identity.",
    riskScore: 84,
    threatCategory: "Credential Harvesting",
    explanation: "Detected OTP harvesting attempt with artificial urgency and account block threat.",
    actions: ["Never share OTP", "Contact bank directly", "Enable transaction alerts"],
    daysAgo: 2,
  },
] as const;

export function computeNetWorth(
  savings: number,
  investments: number,
  debt: number,
): number {
  return savings + investments - debt;
}

export function computeSavingsRate(monthlyIncome: number, monthlyExpenses: number): number {
  if (monthlyIncome <= 0) return 0;
  return Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100);
}
