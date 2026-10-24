export const WARN_AT = 0.85;

/** A message when a new or edited expense pushes a category past 85% or over its budget, else null. */
export function budgetAlert(
  categoryName: string,
  planned: number,
  spentBefore: number,
  spentAfter: number,
): { tone: 'warning' | 'over'; message: string } | null {
  if (planned <= 0 || spentAfter <= spentBefore) return null;
  const before = spentBefore / planned;
  const after = spentAfter / planned;
  if (after > 1 && before <= 1) {
    return { tone: 'over', message: `${categoryName} is now over budget.` };
  }
  if (after >= WARN_AT && before < WARN_AT && after <= 1) {
    return { tone: 'warning', message: `${categoryName} has used ${Math.round(after * 100)}% of its budget.` };
  }
  return null;
}
