export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Investments",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Maps legacy / seed category names to canonical labels */
export const CATEGORY_ALIASES: Record<string, ExpenseCategory> = {
  Food: "Food & Dining",
  "Food & Dining": "Food & Dining",
  Transport: "Transportation",
  Transportation: "Transportation",
  Housing: "Bills & Utilities",
  Rent: "Bills & Utilities",
  Utilities: "Bills & Utilities",
  "Bills & Utilities": "Bills & Utilities",
  Shopping: "Shopping",
  Entertainment: "Entertainment",
  Healthcare: "Healthcare",
  Education: "Education",
  Travel: "Travel",
  Investments: "Investments",
  Other: "Other",
  Others: "Other",
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "Food & Dining": "bg-teal-500",
  Transportation: "bg-blue-500",
  Shopping: "bg-amber-500",
  Entertainment: "bg-rose-500",
  "Bills & Utilities": "bg-violet-500",
  Healthcare: "bg-emerald-500",
  Education: "bg-cyan-500",
  Travel: "bg-indigo-500",
  Investments: "bg-lime-500",
  Other: "bg-zinc-600",
};

export const CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  "Food & Dining": "🍽️",
  Transportation: "🚗",
  Shopping: "🛍️",
  Entertainment: "🎬",
  "Bills & Utilities": "💡",
  Healthcare: "🏥",
  Education: "📚",
  Travel: "✈️",
  Investments: "📈",
  Other: "📦",
};

export function normalizeCategory(raw: string): ExpenseCategory {
  return CATEGORY_ALIASES[raw] ?? "Other";
}

export function getCategoryColor(raw: string): string {
  return CATEGORY_COLORS[normalizeCategory(raw)];
}

export function getCategoryEmoji(raw: string): string {
  return CATEGORY_EMOJI[normalizeCategory(raw)];
}
