export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  lessons: Lesson[];
  quiz: QuizQuestion[];
  youtubeUrl?: string;
}

const COURSES: Course[] = [
  {
    id: "finance-basics",
    title: "Personal Finance Basics",
    description: "Master budgeting, saving, and money management fundamentals.",
    level: "beginner",
    youtubeUrl: "https://www.youtube.com/watch?v=s53cQ_AeeR8",
    lessons: [
      { id: "fb-1", title: "Understanding Income & Expenses", duration: "10 min", content: "Learn to track your cash flow and identify spending patterns." },
      { id: "fb-2", title: "Building a Budget", duration: "12 min", content: "Create a 50/30/20 budget tailored to Indian households." },
      { id: "fb-3", title: "Emergency Fund Essentials", duration: "8 min", content: "Why and how to build 3-6 months of expenses as safety net." },
    ],
    quiz: [
      { id: "fb-q1", question: "What is the recommended emergency fund size?", options: ["1 month", "3-6 months expenses", "1 year income", "No fund needed"], correctIndex: 1 },
      { id: "fb-q2", question: "50/30/20 rule allocates 20% to:", options: ["Wants", "Needs", "Savings", "Taxes"], correctIndex: 2 },
    ],
  },
  {
    id: "investing-101",
    title: "Investing 101",
    description: "Introduction to stocks, mutual funds, and SIP investing.",
    level: "beginner",
    youtubeUrl: "https://www.youtube.com/watch?v=L7G0Of_d4A8",
    lessons: [
      { id: "inv-1", title: "What is Investing?", duration: "10 min", content: "Difference between saving and investing, power of compounding." },
      { id: "inv-2", title: "Mutual Funds & SIPs", duration: "15 min", content: "How SIPs work, types of mutual funds, expense ratios." },
      { id: "inv-3", title: "Stock Market Basics", duration: "12 min", content: "NSE, BSE, demat accounts, and basic stock terminology." },
    ],
    quiz: [
      { id: "inv-q1", question: "SIP stands for:", options: ["Stock Investment Plan", "Systematic Investment Plan", "Savings Interest Program", "Secure Income Portfolio"], correctIndex: 1 },
      { id: "inv-q2", question: "Diversification means:", options: ["All money in one stock", "Spreading investments", "Only gold investment", "Day trading"], correctIndex: 1 },
    ],
  },
  {
    id: "fraud-awareness",
    title: "Fraud & Scam Awareness",
    description: "Protect yourself from financial fraud, phishing, and scams.",
    level: "beginner",
    youtubeUrl: "https://www.youtube.com/watch?v=J5xS5U1mEWY",
    lessons: [
      { id: "fr-1", title: "Common Scam Types", duration: "10 min", content: "OTP fraud, phishing, investment scams, and social engineering." },
      { id: "fr-2", title: "Red Flags to Watch", duration: "8 min", content: "Urgency tactics, guaranteed returns, and suspicious links." },
      { id: "fr-3", title: "Reporting & Recovery", duration: "7 min", content: "How to report fraud and steps for damage control." },
    ],
    quiz: [
      { id: "fr-q1", question: "You should NEVER share:", options: ["Your name", "OTP/PIN/passwords", "Email address", "City name"], correctIndex: 1 },
      { id: "fr-q2", question: "Guaranteed high returns usually indicate:", options: ["Safe investment", "Potential scam", "Government scheme", "Bank offer"], correctIndex: 1 },
    ],
  },
  {
    id: "tax-planning",
    title: "Tax Planning for Indians",
    description: "Understand income tax, deductions, and tax-saving investments.",
    level: "intermediate",
    youtubeUrl: "https://www.youtube.com/watch?v=d_M5L_sJ62k",
    lessons: [
      { id: "tx-1", title: "Income Tax Slabs", duration: "12 min", content: "Old vs new tax regime, applicable slabs for FY 2025-26." },
      { id: "tx-2", title: "Section 80C Deductions", duration: "10 min", content: "PPF, ELSS, LIC, and other 80C instruments up to ₹1.5L." },
      { id: "tx-3", title: "Capital Gains Tax", duration: "10 min", content: "STCG vs LTCG on equity, debt, and property." },
    ],
    quiz: [
      { id: "tx-q1", question: "Section 80C maximum deduction is:", options: ["₹50,000", "₹1,00,000", "₹1,50,000", "₹2,00,000"], correctIndex: 2 },
      { id: "tx-q2", question: "LTCG on equity (above exemption) is taxed at:", options: ["5%", "10%", "15%", "20%"], correctIndex: 1 },
    ],
  },
];

export const coursesService = {
  getAllCourses() {
    return COURSES;
  },

  getCourse(courseId: string) {
    return COURSES.find((c) => c.id === courseId) ?? null;
  },

  gradeQuiz(courseId: string, answers: { questionId: string; answerIndex: number }[]) {
    const course = COURSES.find((c) => c.id === courseId);
    if (!course) return null;

    let score = 0;
    const results = answers.map((a) => {
      const question = course.quiz.find((q) => q.id === a.questionId);
      const correct = question ? a.answerIndex === question.correctIndex : false;
      if (correct) score++;
      return { questionId: a.questionId, correct, correctIndex: question?.correctIndex };
    });

    const total = course.quiz.length;
    const passed = score >= Math.ceil(total * 0.6);
    return { score, total, passed, results };
  },
};
