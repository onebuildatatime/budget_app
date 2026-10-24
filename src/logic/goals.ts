import type { Category, Goal, Transaction } from '../../budgetModel';

/** The goal an expense pays into: a subcategory's link wins over its category's. */
export function goalIdFor(category: Category | undefined, tx: Transaction): string | undefined {
  if (!category || tx.kind === 'income') return undefined;
  return (tx.subcategory && category.subcategoryGoals?.[tx.subcategory]) || category.goalId || undefined;
}

/** Moves goal balances to reflect a transaction being added (no `before`), edited, or deleted (no `after`). */
export function applyGoalContribution(
  goals: Goal[],
  categories: Category[],
  before?: Transaction,
  after?: Transaction,
): Goal[] {
  const delta = new Map<string, number>();
  const add = (tx: Transaction, sign: 1 | -1) => {
    const id = goalIdFor(
      categories.find((c) => c.id === tx.categoryId),
      tx,
    );
    if (id) delta.set(id, (delta.get(id) ?? 0) + sign * tx.amount);
  };
  if (before) add(before, -1);
  if (after) add(after, 1);
  if (![...delta.values()].some((d) => d !== 0)) return goals;
  return goals.map((g) =>
    delta.has(g.id) ? { ...g, saved: Math.max(0, Math.round((g.saved + delta.get(g.id)!) * 100) / 100) } : g,
  );
}

/** Names of the categories / subcategories that pay into each goal, for display. */
export function goalSources(categories: Category[]): Map<string, string[]> {
  const sources = new Map<string, string[]>();
  const push = (goalId: string, label: string) => sources.set(goalId, [...(sources.get(goalId) ?? []), label]);
  for (const c of categories) {
    if (c.goalId) push(c.goalId, c.name);
    for (const [sub, goalId] of Object.entries(c.subcategoryGoals ?? {})) push(goalId, `${c.name} › ${sub}`);
  }
  return sources;
}
