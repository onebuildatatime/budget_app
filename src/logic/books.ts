import type { AppPreferences, MonthRecord } from '../../budgetModel';

export type BudgetKind = 'monthly' | 'trip';
export type TripDates = { start: string; end: string }; // YYYY-MM-DD, inclusive
/** For trips abroad: 1 unit of the budget's currency = `rate` units of `currencyCode`. */
export type Conversion = { currencyCode: string; rate: number };

// A separate budget (e.g. "Personal", "Japan trip"). The active budget's months and currency live in the
// top-level `months` / `preferences.currencyCode`, so its entry in `budgets` is stale until switched away.
export type BudgetBook = {
  id: string;
  name: string;
  currencyCode: string;
  months: MonthRecord[];
  kind?: BudgetKind;
  trip?: TripDates;
  conversion?: Conversion;
};

export type BooksState = {
  budgets: BudgetBook[];
  activeBudgetId: string;
  months: MonthRecord[];
  activeMonthId: string;
  preferences: AppPreferences;
};

export const getBookMonths = (state: Pick<BooksState, 'activeBudgetId' | 'months'>, book: BudgetBook) =>
  book.id === state.activeBudgetId ? state.months : book.months;

export const getBookCurrency = (state: Pick<BooksState, 'activeBudgetId' | 'preferences'>, book: BudgetBook) =>
  book.id === state.activeBudgetId ? state.preferences.currencyCode : book.currencyCode;

/** All budgets with their real months, regardless of which one is active. */
export const materializeBooks = (state: BooksState): BudgetBook[] =>
  state.budgets.map((b) => ({ ...b, months: getBookMonths(state, b), currencyCode: getBookCurrency(state, b) }));

export function switchBook(state: BooksState, id: string): Partial<BooksState> | null {
  const target = state.budgets.find((b) => b.id === id);
  if (!target || id === state.activeBudgetId) return null;
  return {
    budgets: state.budgets.map((b) =>
      b.id === state.activeBudgetId
        ? { ...b, months: state.months, currencyCode: state.preferences.currencyCode }
        : b.id === id
          ? { ...b, months: [] }
          : b,
    ),
    activeBudgetId: id,
    months: target.months,
    activeMonthId: target.months[target.months.length - 1]?.id ?? state.activeMonthId,
    preferences: { ...state.preferences, currencyCode: target.currencyCode },
  };
}

export function removeBook(state: BooksState, id: string): Partial<BooksState> | null {
  if (state.budgets.length <= 1 || !state.budgets.some((b) => b.id === id)) return null;
  let next: BooksState = state;
  if (id === state.activeBudgetId) {
    next = { ...state, ...switchBook(state, state.budgets.find((b) => b.id !== id)!.id) };
  }
  return { ...next, budgets: next.budgets.filter((b) => b.id !== id) };
}

/** Puts a complete set of budgets into store shape, with `activeId`'s months moved to the top level. */
export function loadBooks(
  books: BudgetBook[],
  activeId: string,
  preferences: AppPreferences,
): Pick<BooksState, 'budgets' | 'activeBudgetId' | 'months' | 'activeMonthId' | 'preferences'> {
  const active = books.find((b) => b.id === activeId) ?? books[0];
  return {
    budgets: books.map((b) => (b.id === active.id ? { ...b, months: [] } : b)),
    activeBudgetId: active.id,
    months: active.months,
    activeMonthId: active.months[active.months.length - 1]?.id ?? '',
    preferences: { ...preferences, currencyCode: active.currencyCode },
  };
}
