import 'dotenv/config';
import { createPrismaClient } from '../src/lib/create-prisma';

const prisma = createPrismaClient();

// Full YouTube URLs — the VideoPlayer component converts these to embed URLs automatically
// Supports: watch?v=, youtu.be/, shorts/, and bare video IDs
const courses = [
  {
    title: "Personal Finance Basics",
    description: "Master budgeting, saving, and money management fundamentals.",
    difficulty: "beginner",
    published: true,
    modules: [
      {
        title: "Module 1: The Basics",
        order: 1,
        lessons: [
          { title: "Understanding Income & Expenses", videoUrl: "https://www.youtube.com/watch?v=T7JHfLGm_GY", duration: "10 min", order: 1 },
          { title: "Building a Budget", videoUrl: "https://www.youtube.com/watch?v=-bqeNE1DOzA", duration: "12 min", order: 2 },
          { title: "Emergency Fund Essentials", videoUrl: "https://www.youtube.com/watch?v=g-hir-4WzfU", duration: "8 min", order: 3 },
        ]
      }
    ]
  },
  {
    title: "Investing 101",
    description: "Introduction to stocks, mutual funds, and SIP investing.",
    difficulty: "beginner",
    published: true,
    modules: [
      {
        title: "Module 1: Getting Started",
        order: 1,
        lessons: [
          { title: "What is Investing?", videoUrl: "https://www.youtube.com/watch?v=kTxx_Jpnpn0", duration: "10 min", order: 1 },
          { title: "Mutual Funds & SIPs", videoUrl: "https://www.youtube.com/watch?v=PbldLCsspgE", duration: "15 min", order: 2 },
          { title: "Stock Market Basics", videoUrl: "https://www.youtube.com/watch?v=p7HKvqRI_Bo", duration: "12 min", order: 3 },
        ]
      }
    ]
  },
  {
    title: "Fraud & Scam Awareness",
    description: "Protect yourself from financial fraud, phishing, and scams.",
    difficulty: "beginner",
    published: true,
    modules: [
      {
        title: "Module 1: Recognizing Threats",
        order: 1,
        lessons: [
          { title: "Common Scam Types", videoUrl: "https://www.youtube.com/watch?v=gIOz1dZGllg", duration: "10 min", order: 1 },
          { title: "Red Flags to Watch", videoUrl: "https://www.youtube.com/watch?v=KsIdX4FF3xU", duration: "8 min", order: 2 },
          { title: "Reporting & Recovery", videoUrl: "https://www.youtube.com/watch?v=UR0VPinSmbg", duration: "7 min", order: 3 },
        ]
      }
    ]
  },
  {
    title: "Tax Planning for Indians",
    description: "Understand income tax, deductions, and tax-saving investments.",
    difficulty: "intermediate",
    published: true,
    modules: [
      {
        title: "Module 1: Income Tax",
        order: 1,
        lessons: [
          { title: "Income Tax Slab", videoUrl: "https://www.youtube.com/watch?v=xIE-BW_hR5c", duration: "12 min", order: 1 },
          { title: "Section 80C Deduction", videoUrl: "https://www.youtube.com/watch?v=XYy1z8mTA8E", duration: "10 min", order: 2 },
          { title: "Capital Gains Tax", videoUrl: "zOYC9JIGx_A", duration: "10 min", order: 3 },
        ]
      }
    ]
  }
];

async function main() {
  console.log('Start seeding...');
  
  // Clear existing courses to prevent duplicates during testing
  await prisma.course.deleteMany({});
  
  for (const c of courses) {
    const course = await prisma.course.create({
      data: {
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        published: c.published,
        modules: {
          create: c.modules.map(m => ({
            title: m.title,
            order: m.order,
            lessons: {
              create: m.lessons.map(l => ({
                title: l.title,
                videoUrl: l.videoUrl,
                duration: l.duration,
                order: l.order
              }))
            }
          }))
        }
      }
    });
    console.log(`Created course with id: ${course.id}`);
  }
  
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });