import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type BudgetAppState,
  type MonthRecord,
  type BankAccount,
  type Goal,
  createId,
  createInitialBudgetState,
} from '../../budgetModel';

// A separate budget (e.g. "Personal", "Japan trip"). The active budget's months and currency live in the
// top-level `months` / `preferences.currencyCode`, so its entry here holds stale data until switched away.
export type BudgetBook = {
  id: string;
  name: string;
  currencyCode: string;
  months: MonthRecord[];
};

interface BudgetState extends BudgetAppState {
  budgets: BudgetBook[];
  activeBudgetId: string;
  setMonths: (months: MonthRecord[]) => void;
  setAccounts: (accounts: BankAccount[]) => void;
  setGoals: (goals: Goal[]) => void;
  setActiveMonthId: (monthId: string) => void;
  updateState: (partial: Partial<BudgetAppState>) => void;
  switchBudget: (id: string) => void;
  createBudget: (book: { name: string; currencyCode: string; months: MonthRecord[] }) => void;
  updateBudget: (id: string, patch: { name: string; currencyCode: string }) => void;
  deleteBudget: (id: string) => void;
}

const DEFAULT_BUDGET_ID = 'budget-main';

export const getBudgetMonths = (state: Pick<BudgetState, 'activeBudgetId' | 'months'>, book: BudgetBook) =>
  book.id === state.activeBudgetId ? state.months : book.months;

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => {
      const initial = createInitialBudgetState();
      return {
        ...initial,
        budgets: [{ id: DEFAULT_BUDGET_ID, name: 'Personal', currencyCode: initial.preferences.currencyCode, months: [] }],
        activeBudgetId: DEFAULT_BUDGET_ID,
        setMonths: (months) => set({ months, updatedAt: Date.now() }),
        setAccounts: (accounts) => set({ accounts, updatedAt: Date.now() }),
        setGoals: (goals) => set({ goals, updatedAt: Date.now() }),
        setActiveMonthId: (activeMonthId) => set({ activeMonthId, updatedAt: Date.now() }),
        updateState: (partial) => set({ ...partial, updatedAt: Date.now() }),

        switchBudget: (id) =>
          set((state) => {
            const target = state.budgets.find((b) => b.id === id);
            if (!target || id === state.activeBudgetId) return {};
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
              updatedAt: Date.now(),
            };
          }),

        createBudget: ({ name, currencyCode, months }) => {
          const id = createId('budget');
          set((state) => ({ budgets: [...state.budgets, { id, name, currencyCode, months }] }));
          get().switchBudget(id);
        },

        updateBudget: (id, { name, currencyCode }) =>
          set((state) => ({
            budgets: state.budgets.map((b) => (b.id === id ? { ...b, name, currencyCode } : b)),
            ...(id === state.activeBudgetId
              ? { preferences: { ...state.preferences, currencyCode } }
              : {}),
            updatedAt: Date.now(),
          })),

        deleteBudget: (id) => {
          const state = get();
          if (state.budgets.length <= 1) return;
          if (id === state.activeBudgetId) {
            get().switchBudget(state.budgets.find((b) => b.id !== id)!.id);
          }
          set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id), updatedAt: Date.now() }));
        },
      };
    },
    {
      name: 'budget-buddy-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
