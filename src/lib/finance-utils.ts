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
