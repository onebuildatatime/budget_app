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
import {
  getBookMonths,
  loadBooks,
  removeBook,
  switchBook,
  type BudgetBook,
  type BudgetKind,
  type TripDates,
} from '../logic/books';
import type { BackupData } from '../logic/backup';

export type { BudgetBook, BudgetKind, TripDates };
export const getBudgetMonths = getBookMonths;

type NewBook = { name: string; currencyCode: string; months: MonthRecord[]; kind: BudgetKind; trip?: TripDates };

interface BudgetState extends BudgetAppState {
  budgets: BudgetBook[];
  activeBudgetId: string;
  /** False only on a brand-new install, until the first budget is set up. */
  onboarded: boolean;
  setMonths: (months: MonthRecord[]) => void;
  setAccounts: (accounts: BankAccount[]) => void;
  setGoals: (goals: Goal[]) => void;
  setActiveMonthId: (monthId: string) => void;
  updateState: (partial: Partial<BudgetAppState>) => void;
  switchBudget: (id: string) => void;
  createBudget: (book: NewBook) => void;
  updateBudget: (id: string, patch: { name: string; currencyCode: string; trip?: TripDates }) => void;
  deleteBudget: (id: string) => void;
  /** Replaces everything with a single first budget (onboarding). */
  startWith: (book: NewBook, accounts: BankAccount[]) => void;
  restoreBackup: (data: BackupData) => void;
  markOnboarded: () => void;
}

const DEFAULT_BUDGET_ID = 'budget-main';

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => {
      const initial = createInitialBudgetState();
      return {
        ...initial,
        budgets: [{ id: DEFAULT_BUDGET_ID, name: 'Personal', currencyCode: initial.preferences.currencyCode, months: [] }],
        activeBudgetId: DEFAULT_BUDGET_ID,
        onboarded: false,
        setMonths: (months) => set({ months, updatedAt: Date.now() }),
        setAccounts: (accounts) => set({ accounts, updatedAt: Date.now() }),
        setGoals: (goals) => set({ goals, updatedAt: Date.now() }),
        setActiveMonthId: (activeMonthId) => set({ activeMonthId, updatedAt: Date.now() }),
        updateState: (partial) => set({ ...partial, updatedAt: Date.now() }),

        switchBudget: (id) => {
          const next = switchBook(get(), id);
          if (next) set({ ...next, updatedAt: Date.now() });
        },

        createBudget: (book) => {
          const id = createId('budget');
          set((state) => ({ budgets: [...state.budgets, { id, ...book }] }));
          get().switchBudget(id);
        },

        updateBudget: (id, { name, currencyCode, trip }) =>
          set((state) => ({
            budgets: state.budgets.map((b) => (b.id === id ? { ...b, name, currencyCode, ...(trip ? { trip } : {}) } : b)),
            ...(id === state.activeBudgetId ? { preferences: { ...state.preferences, currencyCode } } : {}),
            updatedAt: Date.now(),
          })),

        deleteBudget: (id) => {
          const next = removeBook(get(), id);
          if (next) set({ ...next, updatedAt: Date.now() });
        },

        startWith: (book, accounts) => {
          const id = createId('budget');
          set((state) => ({
            ...loadBooks([{ id, ...book }], id, state.preferences),
            accounts,
            goals: [],
            onboarded: true,
            updatedAt: Date.now(),
          }));
        },

        restoreBackup: (data) =>
          set({
            ...loadBooks(data.budgets, data.activeBudgetId, data.preferences),
            accounts: data.accounts,
            goals: data.goals,
            onboarded: true,
            updatedAt: Date.now(),
          }),

        markOnboarded: () => set({ onboarded: true }),
      };
    },
    {
      name: 'budget-buddy-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useActiveBook = () =>
  useBudgetStore((s) => s.budgets.find((b) => b.id === s.activeBudgetId) ?? s.budgets[0]);
