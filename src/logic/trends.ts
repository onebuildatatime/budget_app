import { compareMonthIds, getTotalPlanned, getTotalSpent, type MonthRecord } from '../../budgetModel';
import { addDays, daysBetween, toDateKey, type Period } from './period';

const round2 = (n: number) => Math.round(n * 100) / 100;

export function monthlyTotals(months: MonthRecord[], upToMonthId: string, count = 6) {
  return [...months]
    .filter((m) => compareMonthIds(m.id, upToMonthId) <= 0)
    .sort((a, b) => compareMonthIds(a.id, b.id))
    .slice(-count)
    .map((m) => ({ monthId: m.id, planned: getTotalPlanned(m), spent: getTotalSpent(m) }));
}

const spentByCategoryName = (month: MonthRecord) => {
  const names = new Map(month.categories.map((c) => [c.id, c.name]));
  const totals = new Map<string, number>();
  for (const t of month.transactions) {
    if (t.kind === 'income') continue;
    const name = names.get(t.categoryId) ?? 'Uncategorised';
    totals.set(name, round2((totals.get(name) ?? 0) + t.amount));
  }
  return totals;
};

/** Per-category spending vs the previous month, matched by name (category ids differ between months). */
export function categoryChanges(current: MonthRecord, previous: MonthRecord) {
  const now = spentByCategoryName(current);
  const before = spentByCategoryName(previous);
  const names = new Set([...now.keys(), ...before.keys()]);
  return [...names]
    .map((name) => {
      const spent = now.get(name) ?? 0;
      const previousSpent = before.get(name) ?? 0;
      return {
        name,
        spent,
        previousSpent,
        change: round2(spent - previousSpent),
        percent: previousSpent > 0 ? Math.round(((spent - previousSpent) / previousSpent) * 100) : null,
      };
    })
    .filter((row) => row.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

export function categoryShares(month: MonthRecord) {
  const totals = spentByCategoryName(month);
  const sum = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals]
    .map(([name, spent]) => ({ name, spent, share: sum > 0 ? spent / sum : 0 }))
    .filter((row) => row.spent > 0)
    .sort((a, b) => b.spent - a.spent);
}

export function dailyTotals(month: MonthRecord, period: Period) {
  const days = daysBetween(period.start, period.end) + 1;
  const totals = Array.from({ length: days }, (_, i) => ({ date: addDays(period.start, i), spent: 0 }));
  const index = new Map(totals.map((d, i) => [toDateKey(d.date), i]));
  for (const t of month.transactions) {
    if (t.kind === 'income') continue;
    const i = index.get(toDateKey(new Date(t.happenedAt)));
    if (i !== undefined) totals[i].spent = round2(totals[i].spent + t.amount);
  }
  return totals;
}
