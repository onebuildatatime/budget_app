import type { AppPreferences, BankAccount, Goal, MonthRecord } from '../../budgetModel';
import { INCOME_CATEGORY_ID } from '../../budgetModel';
import { materializeBooks, type BooksState, type BudgetBook } from './books';

export const BACKUP_APP_ID = 'budget-buddy';
export const BACKUP_VERSION = 1;

export type BackupData = {
  budgets: BudgetBook[];
  activeBudgetId: string;
  accounts: BankAccount[];
  goals: Goal[];
  preferences: AppPreferences;
};

export type BackupFile = { app: typeof BACKUP_APP_ID; version: number; exportedAt: string; data: BackupData };

type FullState = BooksState & { accounts: BankAccount[]; goals: Goal[] };

export function buildBackup(state: FullState, now = new Date()): BackupFile {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data: {
      budgets: materializeBooks(state),
      activeBudgetId: state.activeBudgetId,
      accounts: state.accounts,
      goals: state.goals,
      preferences: state.preferences,
    },
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const isMonth = (m: unknown): m is MonthRecord =>
  isObject(m) &&
  typeof m.id === 'string' &&
  /^\d{4}-\d{2}$/.test(m.id) &&
  Array.isArray(m.categories) &&
  Array.isArray(m.transactions);

/** Validates a backup file's text. Throws an Error with a user-facing message when it isn't usable. */
export function parseBackup(text: string): BackupData {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("This file isn't a Budget Buddy backup (it's not valid JSON).");
  }
  if (!isObject(json) || json.app !== BACKUP_APP_ID || !isObject(json.data)) {
    throw new Error("This file isn't a Budget Buddy backup.");
  }
  if (typeof json.version !== 'number' || json.version > BACKUP_VERSION) {
    throw new Error('This backup was made by a newer version of the app. Update the app and try again.');
  }
  const data = json.data;
  const budgets = data.budgets;
  if (
    !Array.isArray(budgets) ||
    budgets.length === 0 ||
    !budgets.every(
      (b) => isObject(b) && typeof b.id === 'string' && typeof b.name === 'string' && Array.isArray(b.months) && b.months.every(isMonth),
    )
  ) {
    throw new Error('This backup is damaged: its budgets could not be read.');
  }
  if (!Array.isArray(data.accounts) || !Array.isArray(data.goals) || !isObject(data.preferences)) {
    throw new Error('This backup is damaged: accounts, goals or settings are missing.');
  }
  const activeBudgetId =
    typeof data.activeBudgetId === 'string' && budgets.some((b) => b.id === data.activeBudgetId)
      ? data.activeBudgetId
      : (budgets[0] as BudgetBook).id;
  return {
    budgets: budgets as BudgetBook[],
    activeBudgetId,
    accounts: data.accounts as BankAccount[],
    goals: data.goals as Goal[],
    preferences: data.preferences as AppPreferences,
  };
}

const csvCell = (value: string | number) => {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Every transaction in every budget, one row each, for spreadsheets. */
export function transactionsCsv(books: BudgetBook[], accounts: BankAccount[]): string {
  const accountNames = new Map(accounts.map((a) => [a.id, a.name]));
  const rows: (string | number)[][] = [
    ['Date', 'Budget', 'Month', 'Type', 'Category', 'Subcategory', 'Account', 'Amount', 'Currency', 'Note', 'Repeats monthly'],
  ];
  for (const book of books) {
    for (const month of book.months) {
      const categories = new Map(month.categories.map((c) => [c.id, c.name]));
      const sorted = [...month.transactions].sort((a, b) => a.happenedAt.localeCompare(b.happenedAt));
      for (const t of sorted) {
        const income = t.kind === 'income' || t.categoryId === INCOME_CATEGORY_ID;
        rows.push([
          t.happenedAt.slice(0, 10),
          book.name,
          month.id,
          income ? 'Income' : 'Expense',
          income ? '' : (categories.get(t.categoryId) ?? 'Uncategorised'),
          t.subcategory ?? '',
          (t.accountId && accountNames.get(t.accountId)) || '',
          income ? t.amount : -t.amount,
          book.currencyCode,
          t.note ?? '',
          t.recurring ? 'yes' : '',
        ]);
      }
    }
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}
