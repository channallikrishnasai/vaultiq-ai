"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  type Step2Data,
  type Step3Data,
  type Step4Data,
  type Step5Data,
} from "@/validations/onboarding";

interface OnboardingData {
  occupation: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  emergencyFund: number;
  goalType: "SAVINGS" | "EMERGENCY" | "INVESTMENT";
  goalName: string;
  targetAmount: number;
  targetDate: string;
  riskAppetite: "VERY_CONSERVATIVE" | "CONSERVATIVE" | "MODERATE" | "GROWTH" | "AGGRESSIVE";
}

const INITIAL_DATA: OnboardingData = {
  occupation: "",
  monthlyIncome: 0,
  monthlyExpenses: 0,
  currentSavings: 0,
  emergencyFund: 0,
  goalType: "SAVINGS",
  goalName: "",
  targetAmount: 0,
  targetDate: "",
  riskAppetite: "MODERATE",
};

const GOAL_OPTIONS = [
  { value: "SAVINGS", label: "Buying House", icon: "🏠" },
  { value: "SAVINGS", label: "Buying Car", icon: "🚗" },
  { value: "SAVINGS", label: "Education Fund", icon: "📚" },
  { value: "SAVINGS", label: "Retirement Fund", icon: "🏖️" },
  { value: "EMERGENCY", label: "Emergency Fund", icon: "🛡️" },
  { value: "SAVINGS", label: "Travel Fund", icon: "✈️" },
  { value: "INVESTMENT", label: "Business Fund", icon: "💼" },
] as const;

const RISK_OPTIONS = [
  {
    value: "VERY_CONSERVATIVE" as const,
    label: "Very Conservative",
    desc: "Capital preservation优先 — low risk, steady 5% returns",
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    icon: "🛡️",
    growth: "5%",
  },
  {
    value: "CONSERVATIVE" as const,
    label: "Conservative",
    desc: "Stable growth with minimal volatility — 7% returns",
    color: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/30",
    icon: "🌿",
    growth: "7%",
  },
  {
    value: "MODERATE" as const,
    label: "Balanced",
    desc: "Balanced risk-reward — moderate growth at 10%",
    color: "from-gold/20 to-gold/10",
    border: "border-gold/30",
    icon: "⚖️",
    growth: "10%",
  },
  {
    value: "GROWTH" as const,
    label: "Growth",
    desc: "Higher growth potential with some volatility — 12%",
    color: "from-orange-500/20 to-orange-600/10",
    border: "border-orange-500/30",
    icon: "🚀",
    growth: "12%",
  },
  {
    value: "AGGRESSIVE" as const,
    label: "Aggressive",
    desc: "Maximum growth, higher risk tolerance — 15%",
    color: "from-red-500/20 to-red-600/10",
    border: "border-red-500/30",
    icon: "🔥",
    growth: "15%",
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

export default function OnboardingWizard({ userName }: { userName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const TOTAL_STEPS = 7;

  const validateStep = useCallback(
    (stepNum: number): boolean => {
      setErrors({});
      let result;
      switch (stepNum) {
        case 2:
          result = step2Schema.safeParse({
            occupation: data.occupation,
            monthlyIncome: data.monthlyIncome,
            monthlyExpenses: data.monthlyExpenses,
          });
          break;
        case 3:
          result = step3Schema.safeParse({
            currentSavings: data.currentSavings,
            emergencyFund: data.emergencyFund,
          });
          break;
        case 4:
          result = step4Schema.safeParse({
            goalType: data.goalType,
            goalName: data.goalName,
            targetAmount: data.targetAmount,
            targetDate: data.targetDate,
          });
          break;
        case 5:
          result = step5Schema.safeParse({ riskAppetite: data.riskAppetite });
          break;
        default:
          return true;
      }
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        const merged: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(fieldErrors)) {
          if (msgs?.length) merged[key] = msgs[0];
        }
        setErrors(merged);
        return false;
      }
      return true;
    },
    [data],
  );

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS && validateStep(step)) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step, validateStep]);

  const goBack = useCallback(() => {
    if (step > 1) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      setStep(7);
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
      setSubmitting(false);
    }
  }, [data]);

  useEffect(() => {
    if (step !== 7) return;
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 4500);
    return () => clearTimeout(timer);
  }, [step, router]);

  const updateField = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-zinc-400">
            Step {Math.min(step, 6)} of 6
          </span>
          <span className="text-xs font-medium text-gold">
            {Math.round((Math.min(step, 6) / 6) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-gold-dim to-gold rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(Math.min(step, 6) / 6) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-3 px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i + 1 < step
                  ? "bg-gold"
                  : i + 1 === step
                    ? "bg-gold ring-2 ring-gold/30"
                    : "bg-zinc-700"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {step === 1 && <Step1Welcome userName={userName} />}
            {step === 2 && <Step2Profile data={data} update={updateField} errors={errors} />}
            {step === 3 && <Step3Savings data={data} update={updateField} errors={errors} />}
            {step === 4 && <Step4Goal data={data} update={updateField} errors={errors} />}
            {step === 5 && <Step5Risk data={data} update={updateField} errors={errors} />}
            {step === 6 && <Step6Review data={data} />}
            {step === 7 && <Step7Processing />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Error display */}
      {errors.submit && (
        <p className="mt-4 text-sm text-red-400 text-center">{errors.submit}</p>
      )}

      {/* Navigation buttons */}
      {step < 7 && (
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              onClick={goBack}
              className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800/50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={step === 6 ? handleSubmit : goNext}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-gold text-grey font-medium hover:bg-gold/80 disabled:opacity-50 transition-colors"
          >
            {step === 6
              ? submitting
                ? "Creating..."
                : "Complete Setup"
              : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Step 1: Welcome ────────────────────────────────────────────────────── */

function Step1Welcome({ userName }: { userName: string }) {
  return (
    <div className="glass-gold rounded-2xl p-8 text-center">
      <div className="text-5xl mb-6">✨</div>
      <h1 className="text-2xl font-bold text-white mb-2">
        Welcome, {userName}!
      </h1>
      <p className="text-zinc-400 mb-6 leading-relaxed">
        Let&apos;s set up your financial profile in 6 quick steps.
        <br />
        This takes about 2 minutes.
      </p>
      <div className="grid grid-cols-3 gap-3 text-sm">
        {[
          { icon: "📊", label: "Income & Expenses" },
          { icon: "💰", label: "Savings & Goals" },
          { icon: "🎯", label: "Risk Profile" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3"
          >
            <div className="text-lg mb-1">{item.icon}</div>
            <div className="text-zinc-300 text-xs">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 2: Basic Profile ──────────────────────────────────────────────── */

function Step2Profile({
  data,
  update,
  errors,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, val: OnboardingData[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="glass-gold rounded-2xl p-8">
      <h2 className="text-xl font-bold text-white mb-1">Your Income</h2>
      <p className="text-zinc-400 text-sm mb-6">Tell us about your monthly finances</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Occupation</label>
          <input
            type="text"
            value={data.occupation}
            onChange={(e) => update("occupation", e.target.value)}
            placeholder="e.g. Software Engineer"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
          />
          {errors.occupation && <p className="text-xs text-red-400 mt-1">{errors.occupation}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Monthly Income (₹)
          </label>
          <input
            type="number"
            value={data.monthlyIncome || ""}
            onChange={(e) => update("monthlyIncome", Number(e.target.value))}
            placeholder="e.g. 80000"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
          />
          {errors.monthlyIncome && (
            <p className="text-xs text-red-400 mt-1">{errors.monthlyIncome}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Monthly Expenses (₹)
          </label>
          <input
            type="number"
            value={data.monthlyExpenses || ""}
            onChange={(e) => update("monthlyExpenses", Number(e.target.value))}
            placeholder="e.g. 45000"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
          />
          {errors.monthlyExpenses && (
            <p className="text-xs text-red-400 mt-1">{errors.monthlyExpenses}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Savings ────────────────────────────────────────────────────── */

function Step3Savings({
  data,
  update,
  errors,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, val: OnboardingData[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="glass-gold rounded-2xl p-8">
      <h2 className="text-xl font-bold text-white mb-1">Your Savings</h2>
      <p className="text-zinc-400 text-sm mb-6">How much have you saved so far?</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Current Savings (₹)
          </label>
          <input
            type="number"
            value={data.currentSavings || ""}
            onChange={(e) => update("currentSavings", Number(e.target.value))}
            placeholder="e.g. 200000"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
          />
          {errors.currentSavings && (
            <p className="text-xs text-red-400 mt-1">{errors.currentSavings}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Emergency Fund (₹)
          </label>
          <input
            type="number"
            value={data.emergencyFund || ""}
            onChange={(e) => update("emergencyFund", Number(e.target.value))}
            placeholder="e.g. 50000"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
          />
          {errors.emergencyFund && (
            <p className="text-xs text-red-400 mt-1">{errors.emergencyFund}</p>
          )}
          <p className="text-xs text-zinc-500 mt-1">
            Target: 6 months of expenses (₹{(data.monthlyExpenses * 6).toLocaleString("en-IN")})
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Financial Goal ─────────────────────────────────────────────── */

function Step4Goal({
  data,
  update,
  errors,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, val: OnboardingData[K]) => void;
  errors: Record<string, string>;
}) {
  const [customGoal, setCustomGoal] = useState(false);

  const handleGoalSelect = (goal: (typeof GOAL_OPTIONS)[number]) => {
    update("goalType", goal.value as OnboardingData["goalType"]);
    update("goalName", goal.label);
    setCustomGoal(false);
  };

  return (
    <div className="glass-gold rounded-2xl p-8">
      <h2 className="text-xl font-bold text-white mb-1">Your Goal</h2>
      <p className="text-zinc-400 text-sm mb-6">What are you saving for?</p>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((goal, i) => (
            <button
              key={i}
              onClick={() => handleGoalSelect(goal)}
              className={`text-left p-3 rounded-lg border transition-all ${
                data.goalName === goal.label && !customGoal
                  ? "border-gold bg-gold/10 text-white"
                  : "border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600"
              }`}
            >
              <span className="text-lg mr-2">{goal.icon}</span>
              <span className="text-sm">{goal.label}</span>
            </button>
          ))}
          <button
            onClick={() => setCustomGoal(true)}
            className={`text-left p-3 rounded-lg border transition-all ${
              customGoal
                ? "border-gold bg-gold/10 text-white"
                : "border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600"
            }`}
          >
            <span className="text-lg mr-2">✏️</span>
            <span className="text-sm">Custom Goal</span>
          </button>
        </div>

        {customGoal && (
          <div>
            <input
              type="text"
              value={data.goalName}
              onChange={(e) => update("goalName", e.target.value)}
              placeholder="Enter your goal name"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
            />
            {errors.goalName && <p className="text-xs text-red-400 mt-1">{errors.goalName}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Target Amount (₹)
          </label>
          <input
            type="number"
            value={data.targetAmount || ""}
            onChange={(e) => update("targetAmount", Number(e.target.value))}
            placeholder="e.g. 500000"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
          />
          {errors.targetAmount && (
            <p className="text-xs text-red-400 mt-1">{errors.targetAmount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Date</label>
          <input
            type="date"
            value={data.targetDate}
            onChange={(e) => update("targetDate", e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50"
          />
          {errors.targetDate && (
            <p className="text-xs text-red-400 mt-1">{errors.targetDate}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 5: Risk Profile ───────────────────────────────────────────────── */

function Step5Risk({
  data,
  update,
  errors,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(key: K, val: OnboardingData[K]) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="glass-gold rounded-2xl p-8">
      <h2 className="text-xl font-bold text-white mb-1">Risk Appetite</h2>
      <p className="text-zinc-400 text-sm mb-6">How much risk are you comfortable with?</p>

      <div className="space-y-2">
        {RISK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("riskAppetite", opt.value)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              data.riskAppetite === opt.value
                ? `bg-gradient-to-r ${opt.color} ${opt.border} text-white`
                : "border-zinc-700 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{opt.label}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{opt.desc}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gold">{opt.growth}</div>
                <div className="text-xs text-zinc-500">annual</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {errors.riskAppetite && (
        <p className="text-xs text-red-400 mt-2">{errors.riskAppetite}</p>
      )}
    </div>
  );
}

/* ─── Step 6: Review ─────────────────────────────────────────────────────── */

function Step6Review({ data }: { data: OnboardingData }) {
  const riskLabel = RISK_OPTIONS.find((r) => r.value === data.riskAppetite)?.label ?? data.riskAppetite;

  return (
    <div className="glass-gold rounded-2xl p-8">
      <h2 className="text-xl font-bold text-white mb-1">Review</h2>
      <p className="text-zinc-400 text-sm mb-6">Confirm your financial profile</p>

      <div className="space-y-3">
        {[
          { label: "Occupation", value: data.occupation },
          { label: "Monthly Income", value: `₹${data.monthlyIncome.toLocaleString("en-IN")}` },
          { label: "Monthly Expenses", value: `₹${data.monthlyExpenses.toLocaleString("en-IN")}` },
          { label: "Current Savings", value: `₹${data.currentSavings.toLocaleString("en-IN")}` },
          { label: "Emergency Fund", value: `₹${data.emergencyFund.toLocaleString("en-IN")}` },
          { label: "Goal", value: data.goalName },
          { label: "Target Amount", value: `₹${data.targetAmount.toLocaleString("en-IN")}` },
          { label: "Target Date", value: data.targetDate },
          { label: "Risk Profile", value: riskLabel },
        ].map((item) => (
          <div key={item.label} className="flex justify-between py-2 border-b border-zinc-800 last:border-0">
            <span className="text-zinc-400 text-sm">{item.label}</span>
            <span className="text-white text-sm font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 7: Processing ─────────────────────────────────────────────────── */

function Step7Processing() {
  return (
    <div className="glass-gold rounded-2xl p-8 text-center">
      <motion.div
        className="text-5xl mb-6"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        ✨
      </motion.div>
      <h2 className="text-xl font-bold text-white mb-2">Creating your Financial Twin...</h2>
      <p className="text-zinc-400 text-sm mb-6">
        Analyzing your profile and generating personalized insights
      </p>
      <div className="space-y-2 text-sm text-zinc-500">
        {[
          "Building financial snapshot",
          "Calculating projections",
          "Generating recommendations",
          "Preparing your dashboard",
        ].map((text, i) => (
          <motion.div
            key={text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 1.2, duration: 0.4 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-gold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 1.2 + 0.3 }}
            />
            {text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
