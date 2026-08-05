"use client";

import React from "react";

import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";

// Reusable card component
interface PricingCardProps {
  title: string;
  badge: string;
  priceMonthly: string;
  priceYearly?: string;
  features: string[];
  buttonText: string;
  highlight?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
  title,
  badge,
  priceMonthly,
  priceYearly,
  features,
  buttonText,
  highlight = false,
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`relative flex flex-col h-full rounded-2xl border ${
        highlight ? "border-amber-400/80 bg-amber-400/5" : "border-white/[0.06] bg-white/[0.02]"
      } backdrop-blur-sm p-6 sm:p-8 transition-all duration-300`}
    >
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-medium text-black shadow-md">
          <Star className="inline-block h-4 w-4 align-middle mr-1" /> {badge}
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="mb-4 text-sm text-amber-200">{badge}</p>
      <div className="mb-6 flex flex-col items-start">
        <span className="text-3xl font-bold text-white">{priceMonthly}</span>
        {priceYearly && (
          <span className="mt-1 text-sm text-zinc-400">{priceYearly}</span>
        )}
      </div>
      <ul className="mb-6 space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
            <Check className="h-4 w-4 text-teal-400" /> {f}
          </li>
        ))}
      </ul>
      <button className="mt-auto w-full rounded-full bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors">
        {buttonText}
      </button>
    </motion.div>
  );
};

// Comparison table component
const featuresComparison = [
  "Expense Tracking",
  "Income Tracking",
  "Budgeting",
  "AI Insights",
  "Financial Twin",
  "Investment Tracking",
  "Tax Planning",
  "AI Copilot",
  "Document Uploads",
  "Advanced Reports",
  "Family Accounts",
  "Priority Support",
];

const planFeatures = {
  Free: [
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
    "Up to 5/month",
    false,
    false,
    false,
    false,
  ],
  Pro: [
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    "Unlimited",
    true,
    false,
    false,
    true,
  ],
  Premium: new Array(13).fill(true),
};

const ComparisonTable: React.FC = () => {
  return (
    <div className="overflow-x-auto rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 backdrop-blur-sm">
      <table className="w-full min-w-[600px] text-left text-sm text-zinc-300">
        <thead className="text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-2"></th>
            {Object.keys(planFeatures).map((plan) => (
              <th key={plan} className="px-4 py-2 text-center">
                {plan}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {featuresComparison.map((feat, i) => (
            <tr key={feat} className="border-t border-white/[0.02]">
              <td className="px-4 py-3 font-medium text-white">{feat}</td>
              {Object.values(planFeatures).map((list, idx) => (
                <td key={idx} className="px-4 py-3 text-center">
                  {typeof list[i] === "boolean" ? (
                    list[i] ? <Check className="inline-block h-4 w-4 text-teal-400" /> : "-"
                  ) : (
                    list[i]
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// FAQ component
interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  { q: "Can I use VaultIQ for free?", a: "Yes. The Free plan includes essential financial management tools." },
  { q: "Can I upgrade later?", a: "Yes. You can upgrade or downgrade at any time." },
  { q: "Can I cancel anytime?", a: "Yes. There are no long-term contracts." },
  { q: "Are my financial documents secure?", a: "Yes. All uploaded documents are encrypted and processed securely." },
];

const FAQSection: React.FC = () => {
  return (
    <section className="mt-16">
      <h3 className="mb-8 text-center text-2xl font-bold text-white">Frequently Asked Questions</h3>
      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <details key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
            <summary className="cursor-pointer text-lg font-medium text-white">{item.q}</summary>
            <p className="mt-2 text-zinc-400">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
};

// CTA section
const CTASection: React.FC = () => {
  return (
    <section className="mt-20 text-center">
      <h3 className="mb-4 text-3xl font-bold text-white">Ready to Take Control of Your Financial Future?</h3>
      <p className="mb-6 text-zinc-400">
        Join thousands of users who trust VaultIQ AI to manage, analyze, and improve their financial life.
      </p>
      <div className="flex justify-center gap-4">
        <button className="rounded-full bg-teal-500 px-6 py-2 font-medium text-white hover:bg-teal-600 transition-colors">
          Start Free
        </button>
        <button className="rounded-full border border-teal-400 px-6 py-2 font-medium text-teal-400 hover:bg-teal-400/10 transition-colors">
          Explore Features
        </button>
      </div>
    </section>
  );
};

// Main Pricing Section component
export default function PricingSection() {
  const freeFeatures = [
    "Expense Tracking",
    "Income Tracking",
    "Budget Management",
    "Goal Tracking",
    "Basic Financial Dashboard",
    "Basic AI Assistant",
    "Monthly Reports",
    "Up to 5 Document Uploads per Month",
    "Community Support",
  ];

  const proFeatures = [
    ...freeFeatures,
    "Unlimited Document Uploads",
    "AI Financial Insights",
    "AI Budget Recommendations",
    "Smart Expense Categorization",
    "AI Financial Twin",
    "Predictive Spending Analysis",
    "Investment Tracking",
    "Tax Insights",
    "Unlimited AI Copilot",
    "Advanced Reports",
    "Fraud Detection Alerts",
    "Priority Email Support",
  ];

  const premiumFeatures = [
    ...proFeatures,
    "Family Accounts",
    "Shared Financial Dashboard",
    "AI Wealth Planning",
    "Advanced Investment Analytics",
    "Retirement Planning",
    "Portfolio Optimization",
    "Net Worth Forecasting",
    "AI Tax Optimization",
    "Priority Processing",
    "Early Access to New AI Features",
    "Dedicated Premium Support",
  ];

  return (
    <section id="pricing" className="relative bg-[#050508] py-24 sm:py-32">
      {/* Background glow */}
      <div className="absolute left-1/2 top-0 h-[800px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.03] blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">Choose Your Plan</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Choose the Right Plan for Your Financial Journey
          </h2>
          <p className="mx-auto max-w-2xl text-zinc-400">
            Start for free and upgrade anytime to unlock advanced AI-powered financial intelligence.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
        >
          <PricingCard
            title="Free"
            badge="Perfect for Beginners"
            priceMonthly="₹0 / month"
            features={freeFeatures}
            buttonText="Get Started Free"
          />
          <PricingCard
            title="Pro"
            badge="⭐ Most Popular"
            priceMonthly="₹299 / month"
            priceYearly="₹2,999 / year (Save 17%)"
            features={proFeatures}
            buttonText="Upgrade to Pro"
            highlight
          />
          <PricingCard
            title="Premium"
            badge="Best Value"
            priceMonthly="₹699 / month"
            priceYearly="₹6,999 / year"
            features={premiumFeatures}
            buttonText="Go Premium"
          />
        </motion.div>

        {/* Comparison Table */}
        <div className="mt-16">
          <h3 className="mb-6 text-center text-xl font-semibold text-white">Feature Comparison</h3>
          <ComparisonTable />
        </div>

        {/* FAQ */}
        <FAQSection />

        {/* CTA */}
        <CTASection />
      </div>
    </section>
  );
}
