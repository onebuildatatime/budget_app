import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createInitialBudgetState,
  type Category,
  type Goal,
  type MonthRecord,
  type Transaction,
} from '../budgetModel';
import { loadBooks, materializeBooks, removeBook, switchBook, type BooksState } from '../src/logic/books';
import { copyMonth, rollForward } from '../src/logic/rollover';
import { applyGoalContribution, goalIdFor } from '../src/logic/goals';
import { buildBackup, parseBackup, transactionsCsv } from '../src/logic/backup';
import { buildTemplateCategories, buildTripCategories } from '../src/budgetTemplate';
import { daysLeftInPeriod, formatTripRange, monthPeriod, tripLength } from '../src/logic/period';

const category = (o: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  name: 'Household',
  planned: 500,
  subcategories: ['Groceries'],
  bucket: 'needs',
  themeId: 'citrus',
  recurring: false,
  ...o,
});

const tx = (o: Partial<Transaction> = {}): Transaction => ({
  id: 'txn-1',
  kind: 'expense',
  categoryId: 'cat-1',
  amount: 10,
  note: '',
  happenedAt: '2026-11-05T12:00:00.000Z',
  recurring: false,
  ...o,
});

const month = (id: string, o: Partial<MonthRecord> = {}): MonthRecord => ({
  id,
  currencyCode: 'EUR',
  monthlyLimit: '1000',
  categories: [category()],
  transactions: [],
  updatedAt: 0,
  ...o,
});

const booksState = (): BooksState => {
  const preferences = { ...createInitialBudgetState().preferences, currencyCode: 'EUR' };
  return {
    budgets: [
      { id: 'a', name: 'Personal', currencyCode: 'USD', months: [] },
      { id: 'b', name: 'Trip', currencyCode: 'JPY', months: [month('2026-12')], kind: 'trip' },
    ],
    activeBudgetId: 'a',
    months: [month('2026-11')],
    activeMonthId: '2026-11',
    preferences,
  };
};

test('switchBook swaps months and currency and stores the old active budget', () => {
  const state = booksState();
  const next = { ...state, ...switchBook(state, 'b') };
  assert.equal(next.activeBudgetId, 'b');
  assert.deepEqual(next.months.map((m) => m.id), ['2026-12']);
  assert.equal(next.preferences.currencyCode, 'JPY');
  const personal = next.budgets.find((b) => b.id === 'a')!;
  assert.deepEqual(personal.months.map((m) => m.id), ['2026-11']);
  assert.equal(personal.currencyCode, 'EUR');

  const back = { ...next, ...switchBook(next, 'a') };
  assert.deepEqual(back.months.map((m) => m.id), ['2026-11']);
  assert.equal(back.preferences.currencyCode, 'EUR');
  assert.deepEqual(back.budgets.find((b) => b.id === 'b')!.months.map((m) => m.id), ['2026-12']);
});

test('switchBook is a no-op for the active or an unknown budget', () => {
  assert.equal(switchBook(booksState(), 'a'), null);
  assert.equal(switchBook(booksState(), 'nope'), null);
});

test('removeBook switches away from the active budget before deleting it', () => {
  const next = { ...booksState(), ...removeBook(booksState(), 'a') };
  assert.equal(next.activeBudgetId, 'b');
  assert.deepEqual(next.budgets.map((b) => b.id), ['b']);
  assert.deepEqual(next.months.map((m) => m.id), ['2026-12']);
  assert.equal(removeBook({ ...next } as BooksState, 'b'), null, 'cannot delete the last budget');
});

test('materializeBooks and loadBooks round-trip every budget', () => {
  const state = booksState();
  const all = materializeBooks(state);
  assert.deepEqual(all.map((b) => b.months.length), [1, 1]);
  const loaded = loadBooks(all, 'b', state.preferences);
  assert.equal(loaded.activeBudgetId, 'b');
  assert.equal(loaded.preferences.currencyCode, 'JPY');
  assert.deepEqual(loaded.budgets.find((b) => b.id === 'b')!.months, []);
  assert.equal(loaded.budgets.find((b) => b.id === 'a')!.months.length, 1);
});

test('copyMonth gives categories new ids and remaps recurring transactions', () => {
  const source = month('2026-10', {
    transactions: [
      tx({ id: 'rent', recurring: true, happenedAt: new Date(2026, 9, 31, 12).toISOString() }),
      tx({ id: 'coffee', recurring: false }),
      tx({ id: 'salary', kind: 'income', categoryId: '__income__', recurring: true }),
    ],
  });
  const copy = copyMonth(source, '2026-11');
  assert.equal(copy.id, '2026-11');
  assert.notEqual(copy.categories[0].id, 'cat-1');
  assert.equal(copy.transactions.length, 2);
  const rent = copy.transactions.find((t) => t.kind === 'expense')!;
  assert.equal(rent.categoryId, copy.categories[0].id);
  assert.equal(new Date(rent.happenedAt).getDate(), 30, 'Oct 31 clamps to Nov 30');
  assert.equal(copy.transactions.find((t) => t.kind === 'income')!.categoryId, '__income__');
  assert.equal(copyMonth(source, '2026-11', false).transactions.length, 0);
});

test('rollForward fills every missing month up to the current one', () => {
  const months = [month('2026-09', { transactions: [tx({ recurring: true })] })];
  const result = rollForward(months, '2026-11')!;
  assert.deepEqual(result.months.map((m) => m.id), ['2026-09', '2026-10', '2026-11']);
  assert.equal(result.created.length, 2);
  assert.equal(result.created[1].transactions.length, 1, 'recurring items keep flowing');
  assert.equal(rollForward(result.months, '2026-11'), null);
  assert.equal(rollForward([month('2026-12')], '2026-11'), null, 'never creates from future months');
});

test('goal contributions follow add, edit and delete, with subcategory links winning', () => {
  const goals: Goal[] = [
    { id: 'g1', name: 'Emergency', target: 1000, saved: 100, themeId: 'clay' },
    { id: 'g2', name: 'House', target: 1000, saved: 0, themeId: 'clay' },
  ];
  const cats = [category({ goalId: 'g1', subcategories: ['House'], subcategoryGoals: { House: 'g2' } })];
  assert.equal(goalIdFor(cats[0], tx()), 'g1');
  assert.equal(goalIdFor(cats[0], tx({ subcategory: 'House' })), 'g2');
  assert.equal(goalIdFor(cats[0], tx({ kind: 'income' })), undefined);

  const added = applyGoalContribution(goals, cats, undefined, tx({ amount: 50 }));
  assert.equal(added[0].saved, 150);
  const moved = applyGoalContribution(added, cats, tx({ amount: 50 }), tx({ amount: 20, subcategory: 'House' }));
  assert.deepEqual(moved.map((g) => g.saved), [100, 20]);
  const deleted = applyGoalContribution(moved, cats, tx({ amount: 20, subcategory: 'House' }));
  assert.deepEqual(deleted.map((g) => g.saved), [100, 0]);
  assert.equal(applyGoalContribution(goals, [category()], undefined, tx()), goals, 'unlinked is untouched');
});

test('backups round-trip and reject bad files', () => {
  const state = { ...booksState(), accounts: [{ id: 'acc', name: 'Bank', kinds: ['spending' as const], customKinds: [] }], goals: [] };
  const text = JSON.stringify(buildBackup(state));
  const data = parseBackup(text);
  assert.equal(data.budgets.length, 2);
  assert.equal(data.budgets.find((b) => b.id === 'a')!.months.length, 1, 'active budget months are included');
  assert.equal(data.activeBudgetId, 'a');
  assert.throws(() => parseBackup('not json'), /not valid JSON/);
  assert.throws(() => parseBackup('{"app":"other"}'), /isn't a Budget Buddy backup/);
  assert.throws(() => parseBackup(text.replace('"version":1', '"version":99')), /newer version/);
  assert.throws(() => parseBackup(text.replace('"months":[{"id":"2026-11"', '"months":[{"id":"bad"')), /damaged/);
});

test('transactionsCsv escapes cells and signs amounts', () => {
  const books = [
    {
      id: 'a',
      name: 'Personal',
      currencyCode: 'EUR',
      months: [
        month('2026-11', {
          transactions: [
            tx({ note: 'Lidl, "big" shop', accountId: 'acc', subcategory: 'Groceries' }),
            tx({ id: 't2', kind: 'income', categoryId: '__income__', amount: 2000, note: 'Salary' }),
          ],
        }),
      ],
    },
  ];
  const lines = transactionsCsv(books, [{ id: 'acc', name: 'Bank', kinds: ['spending'], customKinds: [] }]).trim().split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[1], '2026-11-05,Personal,2026-11,Expense,Household,Groceries,Bank,-10,EUR,"Lidl, ""big"" shop",');
  assert.match(lines[2], /,Income,,,,2000,EUR,Salary,$/);
});

test('templates assign exactly the whole amount', () => {
  for (const amount of [3296.84, 1234.57, 300000]) {
    const sum = (cs: Category[]) => Math.round(cs.reduce((s, c) => s + c.planned, 0) * 100) / 100;
    assert.equal(sum(buildTemplateCategories(amount)), amount);
    assert.equal(sum(buildTripCategories(amount)), amount);
  }
});

test('period helpers', () => {
  const nov = monthPeriod('2026-11');
  assert.equal(nov.end.getDate(), 30);
  assert.equal(daysLeftInPeriod(nov, new Date(2026, 10, 30)), 1);
  assert.equal(daysLeftInPeriod(nov, new Date(2026, 9, 30)), null);
  const trip = { start: '2026-12-20', end: '2027-01-05' };
  assert.equal(tripLength(trip), 17);
  assert.equal(formatTripRange(trip, 'en-US'), 'Dec 20, 2026 – Jan 5, 2027');
});

test('trends: monthly totals, category changes and shares', async () => {
  const { monthlyTotals, categoryChanges, categoryShares, dailyTotals } = await import('../src/logic/trends');
  const oct = month('2026-10', { transactions: [tx({ amount: 100 }), tx({ id: 't2', amount: 50 })] });
  const nov = month('2026-11', {
    categories: [category({ id: 'n1' }), category({ id: 'n2', name: 'Fun' })],
    transactions: [tx({ categoryId: 'n1', amount: 90 }), tx({ id: 't3', categoryId: 'n2', amount: 30 }), tx({ id: 'i', kind: 'income', amount: 999 })],
  });
  const dec = month('2026-12');
  assert.deepEqual(
    monthlyTotals([dec, nov, oct], '2026-11').map((m) => [m.monthId, m.spent]),
    [['2026-10', 150], ['2026-11', 120]],
  );
  const changes = categoryChanges(nov, oct);
  assert.deepEqual(changes.map((c) => [c.name, c.change, c.percent]), [['Household', -60, -40], ['Fun', 30, null]]);
  const shares = categoryShares(nov);
  assert.equal(shares[0].name, 'Household');
  assert.equal(shares[0].share, 0.75);
  const days = dailyTotals(nov, { start: new Date(2026, 10, 4, 12), end: new Date(2026, 10, 6, 12) });
  assert.deepEqual(days.map((d) => d.spent), [0, 120, 0]);
});

test('budget alerts fire only when crossing 85% or 100%', async () => {
  const { budgetAlert } = await import('../src/logic/alerts');
  assert.equal(budgetAlert('Food', 100, 50, 80), null);
  assert.match(budgetAlert('Food', 100, 80, 90)!.message, /90% of its budget/);
  assert.equal(budgetAlert('Food', 100, 86, 95), null, 'already past 85%');
  assert.equal(budgetAlert('Food', 100, 95, 101)!.tone, 'over');
  assert.equal(budgetAlert('Food', 100, 50, 120)!.tone, 'over', 'jumping straight past 100% says over');
  assert.equal(budgetAlert('Food', 100, 120, 130), null, 'already over');
  assert.equal(budgetAlert('Food', 0, 0, 10), null, 'no budget');
  assert.equal(budgetAlert('Food', 100, 90, 80), null, 'spending went down');
});
