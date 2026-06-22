import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import {
  ChatRole,
  FraudInputType,
  GoalType,
  RiskAppetite,
  TradeType,
} from "../src/generated/prisma/enums";

async function main() {
  const passwordHash = await bcrypt.hash("demo123456", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@vaultiq.ai" },
    update: { passwordHash, name: "Demo User" },
    create: {
      name: "Demo User",
      email: "demo@vaultiq.ai",
      passwordHash,
      profile: {
        create: {
          age: 28,
          income: 75000,
          currency: "INR",
          riskAppetite: RiskAppetite.MODERATE,
          xp: 250,
          streak: 5,
          badges: ["early-adopter", "budget-master"],
        },
      },
    },
  });

  const userId = user.id;
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  await prisma.expense.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.fraudReport.deleteMany({ where: { userId } });
  await prisma.learningProgress.deleteMany({ where: { userId } });
  await prisma.quizResult.deleteMany({ where: { userId } });
  await prisma.chatHistory.deleteMany({ where: { userId } });
  await prisma.roadmap.deleteMany({ where: { userId } });
  await prisma.emergencyPlan.deleteMany({ where: { userId } });
  await prisma.platformRecommendation.deleteMany({ where: { userId } });
  await prisma.watchlist.deleteMany({ where: { userId } });
  await prisma.financialTwin.deleteMany({ where: { userId } });

  const portfolios = await prisma.portfolio.findMany({ where: { userId } });
  for (const p of portfolios) {
    await prisma.trade.deleteMany({ where: { portfolioId: p.id } });
  }
  await prisma.portfolio.deleteMany({ where: { userId } });

  await prisma.expense.createMany({
    data: [
      { userId, amount: 450, category: "Food", notes: "Groceries", date: new Date(year, month - 1, 5) },
      { userId, amount: 1200, category: "Rent", notes: "Monthly rent share", date: new Date(year, month - 1, 1) },
      { userId, amount: 299, category: "Entertainment", notes: "Streaming", date: new Date(year, month - 1, 10) },
      { userId, amount: 3500, category: "Transport", notes: "Fuel", date: new Date(year, month - 1, 15) },
      { userId, amount: 800, category: "Utilities", notes: "Electricity", date: new Date(year, month - 1, 8) },
      { userId, amount: 1500, category: "Shopping", notes: "Clothes", date: new Date(year, month - 1, 20) },
    ],
  });

  await prisma.budget.createMany({
    data: [
      { userId, category: "Food", limit: 5000, month, year },
      { userId, category: "Transport", limit: 4000, month, year },
      { userId, category: "Entertainment", limit: 2000, month, year },
      { userId, category: "Shopping", limit: 3000, month, year },
    ],
  });

  await prisma.goal.createMany({
    data: [
      { userId, name: "Emergency Fund", targetAmount: 150000, currentAmount: 45000, type: GoalType.EMERGENCY },
      { userId, name: "Vacation to Goa", targetAmount: 50000, currentAmount: 12000, type: GoalType.SAVINGS, deadline: new Date(year + 1, 5, 1) },
      { userId, name: "Mutual Fund SIP", targetAmount: 200000, currentAmount: 80000, type: GoalType.INVESTMENT },
    ],
  });

  await prisma.fraudReport.createMany({
    data: [
      {
        userId,
        inputType: FraudInputType.MESSAGE,
        content: "URGENT! Your bank account will be suspended. Share OTP immediately to verify.",
        riskScore: 85,
        threatCategory: "Confirmed Scam Pattern",
        explanation: "Multiple high-risk fraud indicators detected.",
        actions: ["Block sender", "Report to cybercrime.gov.in", "Change passwords"],
      },
      {
        userId,
        inputType: FraudInputType.LINK,
        content: "https://paytm-kyc-verify.tk/update",
        riskScore: 72,
        threatCategory: "Phishing Attempt",
        explanation: "Suspicious domain and phishing patterns detected.",
        actions: ["Do not click", "Verify through official app"],
      },
      {
        userId,
        inputType: FraudInputType.PHONE,
        content: "+919876543210",
        riskScore: 15,
        threatCategory: "General Suspicion",
        explanation: "Valid Indian mobile number format.",
        actions: ["Continue normal caution"],
      },
    ],
  });

  await prisma.learningProgress.createMany({
    data: [
      { userId, courseId: "personal-finance-101", lessonId: "pf-l1", completed: true, completedAt: new Date() },
      { userId, courseId: "personal-finance-101", lessonId: "pf-l2", completed: true, completedAt: new Date() },
      { userId, courseId: "investing-basics", lessonId: "ib-l1", completed: true, completedAt: new Date() },
    ],
  });

  await prisma.quizResult.create({
    data: { userId, courseId: "personal-finance-101", score: 2, total: 2, passed: true },
  });

  const sessionId = "demo-session-001";
  await prisma.chatHistory.createMany({
    data: [
      { userId, sessionId, role: ChatRole.USER, content: "How should I allocate my monthly salary?" },
      { userId, sessionId, role: ChatRole.ASSISTANT, content: "I recommend the 50/30/20 rule: 50% needs, 30% wants, 20% savings. With your income, aim to save at least ₹15,000/month." },
      { userId, sessionId, role: ChatRole.USER, content: "What about investing in stocks?" },
      { userId, sessionId, role: ChatRole.ASSISTANT, content: "Start with an emergency fund, then consider SIP in index funds. Begin with 10-15% of income in equity." },
    ],
  });

  await prisma.roadmap.create({
    data: {
      userId,
      input: { goals: ["Buy a house", "Retire early"], income: 75000, age: 28, riskAppetite: "MODERATE", timelineMonths: 120 },
      output: { summary: "10-year financial roadmap", monthlySavingsTarget: 15000 },
    },
  });

  await prisma.emergencyPlan.create({
    data: {
      userId,
      scenario: "Job loss",
      plan: { emergencyFundTarget: 270000, monthsToFullyFund: 8, immediateActions: ["Activate emergency fund", "Cut discretionary spending"] },
    },
  });

  await prisma.platformRecommendation.create({
    data: {
      userId,
      preferences: { experience: "intermediate", tradingFrequency: "weekly" },
      result: { recommendation: { name: "Zerodha", matchScore: 88 } },
    },
  });

  const portfolio = await prisma.portfolio.create({
    data: { userId, name: "Main Portfolio", cashBalance: 85000, totalValue: 115000, isDefault: true },
  });

  await prisma.trade.createMany({
    data: [
      { portfolioId: portfolio.id, symbol: "RELIANCE", type: TradeType.BUY, quantity: 10, price: 2450, totalAmount: 24500 },
      { portfolioId: portfolio.id, symbol: "TCS", type: TradeType.BUY, quantity: 5, price: 3800, totalAmount: 19000 },
      { portfolioId: portfolio.id, symbol: "INFY", type: TradeType.SELL, quantity: 5, price: 1650, totalAmount: 8250 },
    ],
  });

  await prisma.watchlist.createMany({
    data: [
      { userId, symbol: "HDFCBANK", companyName: "HDFC Bank", targetPrice: 1800 },
      { userId, symbol: "ICICIBANK", companyName: "ICICI Bank", targetPrice: 1200 },
      { userId, symbol: "SBIN", companyName: "State Bank of India" },
    ],
  });

  await prisma.financialTwin.create({
    data: {
      userId,
      name: "Demo Financial Twin",
      healthScore: 72,
      riskAppetite: RiskAppetite.MODERATE,
      isActive: true,
      snapshot: { income: 75000, expenses: 45000, savings: 120000, investments: 80000, debts: 25000, netWorth: 175000 },
      projections: { oneYear: { netWorth: 231000 }, fiveYear: { netWorth: 450000 } },
      recommendations: ["Increase SIP by 10%", "Build 6-month emergency fund", "Review insurance coverage"],
    },
  });

  console.log("Seed completed. Demo user: demo@vaultiq.ai / demo123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
