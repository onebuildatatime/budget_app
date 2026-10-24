import {
  addMonths,
  buildIsoDateForMonth,
  compareMonthIds,
  createId,
  type MonthRecord,
} from '../../budgetModel';

const MAX_GAP_MONTHS = 12;

/** Copies a month's income and categories (new ids) and, optionally, its recurring transactions. */
export function copyMonth(source: MonthRecord, targetId: string, withRecurring = true): MonthRecord {
  const idMap = new Map<string, string>();
  const categories = source.categories.map((c) => {
    const id = createId('cat');
    idMap.set(c.id, id);
    return { ...c, id };
  });
  const transactions = withRecurring
    ? source.transactions
        .filter((t) => t.recurring)
        .map((t) => ({
          ...t,
          id: createId('txn'),
          categoryId: idMap.get(t.categoryId) ?? t.categoryId,
          happenedAt: buildIsoDateForMonth(targetId, new Date(t.happenedAt).getDate()),
        }))
    : [];
  return {
    id: targetId,
    currencyCode: source.currencyCode,
    monthlyLimit: source.monthlyLimit,
    categories,
    transactions,
    updatedAt: Date.now(),
  };
}

/**
 * If `currentMonthId` has no budget yet but an earlier month does, creates every missing month up to it,
 * each copied from the one before (so recurring items keep flowing). Returns null when nothing changes.
 */
export function rollForward(
  months: MonthRecord[],
  currentMonthId: string,
): { months: MonthRecord[]; created: MonthRecord[] } | null {
  if (months.some((m) => m.id === currentMonthId)) return null;
  const earlier = months
    .filter((m) => compareMonthIds(m.id, currentMonthId) < 0 && m.categories.length > 0)
    .sort((a, b) => compareMonthIds(a.id, b.id));
  let previous = earlier[earlier.length - 1];
  if (!previous) return null;

  const created: MonthRecord[] = [];
  let id = addMonths(previous.id, 1);
  for (let i = 0; i < MAX_GAP_MONTHS && compareMonthIds(id, currentMonthId) <= 0; i++) {
    const existing = months.find((m) => m.id === id);
    if (existing) {
      previous = existing;
    } else {
      const month = copyMonth(previous, id);
      created.push(month);
      previous = month;
    }
    id = addMonths(id, 1);
  }
  if (!created.length) return null;
  return { months: [...months, ...created].sort((a, b) => compareMonthIds(a.id, b.id)), created };
}
