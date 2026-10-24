import React, { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useBudgetStore } from './src/store/useBudgetStore';
import { initialBudgetData } from './budgetData';
import { addMonths, getMonthId, type Transaction } from './budgetModel';
import { HomeScreen } from './src/screens/HomeScreen';
import { SpendScreen } from './src/screens/SpendScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { BudgetEditorScreen } from './src/screens/BudgetEditorScreen';
import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { AddTransactionSheet } from './src/screens/AddTransactionSheet';
import { NewBudgetSheet } from './src/screens/NewBudgetSheet';
import { CurrencySheet } from './src/screens/CurrencySheet';
import { BudgetSwitcherSheet } from './src/screens/BudgetSwitcherSheet';
import { TabBar, type TabName } from './src/ui/TabBar';
import { usePalette } from './src/ui/theme';

type Route =
  | { name: 'BudgetEditor' }
  | { name: 'Budgets' }
  | { name: 'Category'; categoryId: string }
  | { name: 'Accounts' };

export function AppNavigator() {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const goals = useBudgetStore((s) => s.goals);
  const accounts = useBudgetStore((s) => s.accounts);
  const activeMonthId = useBudgetStore((s) => s.activeMonthId);
  const budgetCount = useBudgetStore((s) => s.budgets.length);
  const activeBudgetId = useBudgetStore((s) => s.activeBudgetId);
  const updateState = useBudgetStore((s) => s.updateState);

  const [hydrated, setHydrated] = useState(() => useBudgetStore.persist.hasHydrated());
  const [tab, setTab] = useState<TabName>('Home');
  const [stack, setStack] = useState<Route[]>([]);
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const [txSheet, setTxSheet] = useState<{ transaction: Transaction | null } | null>(null);
  const [newBudgetFor, setNewBudgetFor] = useState<string | null>(null);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const isFreshInstall =
    budgetCount === 1 &&
    goals.length === 0 &&
    accounts.length === 0 &&
    months.every((m) => m.categories.length === 0 && m.transactions.length === 0);

  useEffect(() => {
    if (hydrated) return;
    const unsubscribe = useBudgetStore.persist.onFinishHydration(() => setHydrated(true));
    if (useBudgetStore.persist.hasHydrated()) setHydrated(true);
    return unsubscribe;
  }, [hydrated]);

  useEffect(() => {
    if (hydrated && isFreshInstall) {
      updateState({
        months: initialBudgetData.months,
        accounts: initialBudgetData.accounts,
        goals: initialBudgetData.goals,
        preferences: initialBudgetData.preferences,
        activeMonthId: initialBudgetData.activeMonthId,
      });
    }
  }, [hydrated, isFreshInstall, updateState]);

  useEffect(() => {
    setSelectedMonthId(null);
    setStack([]);
  }, [activeBudgetId]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length === 0) return false;
      setStack((s) => s.slice(0, -1));
      return true;
    });
    return () => sub.remove();
  }, [stack.length]);

  if (!hydrated || isFreshInstall) return <View style={{ flex: 1, backgroundColor: p.bg }} />;

  const monthIds = new Set(months.map((m) => m.id));
  const currentMonthId = getMonthId(new Date());
  const defaultMonthId = monthIds.has(currentMonthId)
    ? currentMonthId
    : monthIds.has(activeMonthId)
      ? activeMonthId
      : (months[months.length - 1]?.id ?? currentMonthId);
  const monthId = selectedMonthId ?? defaultMonthId;
  const monthExists = monthIds.has(monthId);

  const nextFreeMonth = () => {
    let id = monthId;
    while (monthIds.has(id)) id = addMonths(id, 1);
    return id;
  };

  const push = (route: Route) => setStack((s) => [...s, route]);
  const pop = () => setStack((s) => s.slice(0, -1));
  const openMonth = (id: string) => {
    setSelectedMonthId(id);
    setStack([]);
    setTab('Home');
  };
  const openNewBudget = () => setNewBudgetFor(nextFreeMonth());
  const openBudgets = () => push({ name: 'Budgets' });
  const editTransaction = (transaction: Transaction) => setTxSheet({ transaction });
  const editBudget = () => push({ name: 'BudgetEditor' });

  const route = stack[stack.length - 1];
  let screen: React.ReactNode = null;

  if (route?.name === 'BudgetEditor') {
    screen = <BudgetEditorScreen key={monthId} monthId={monthId} onBack={pop} />;
  } else if (route?.name === 'Budgets') {
    screen = <BudgetsScreen viewingMonthId={monthId} onBack={pop} onOpen={openMonth} onCreate={openNewBudget} />;
  } else if (route?.name === 'Category') {
    screen = (
      <CategoryScreen
        monthId={monthId}
        categoryId={route.categoryId}
        onBack={pop}
        onEditBudget={editBudget}
        onEditTransaction={editTransaction}
      />
    );
  } else if (route?.name === 'Accounts') {
    screen = <AccountsScreen onBack={pop} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      {screen ?? (
        <>
          <View style={{ flex: 1 }}>
            {tab === 'Home' && (
              <HomeScreen
                monthId={monthId}
                onMonthChange={setSelectedMonthId}
                onOpenBudgets={openBudgets}
                onOpenSwitcher={() => setSwitcherOpen(true)}
                onCreateBudget={() => setNewBudgetFor(monthId)}
                onEditBudget={editBudget}
                onOpenCategory={(categoryId) => push({ name: 'Category', categoryId })}
                onSeeAll={() => setTab('Spend')}
                onEditTransaction={editTransaction}
              />
            )}
            {tab === 'Spend' && (
              <SpendScreen
                monthId={monthId}
                onMonthChange={setSelectedMonthId}
                onOpenBudgets={openBudgets}
                onOpenSwitcher={() => setSwitcherOpen(true)}
                onEditTransaction={editTransaction}
              />
            )}
            {tab === 'Goals' && <GoalsScreen />}
            {tab === 'Menu' && (
              <MenuScreen
                monthId={monthId}
                onOpenBudgets={openBudgets}
                onOpenSwitcher={() => setSwitcherOpen(true)}
                onEditBudget={editBudget}
                onNewBudget={openNewBudget}
                onOpenAccounts={() => push({ name: 'Accounts' })}
                onOpenCurrency={() => setCurrencyOpen(true)}
              />
            )}
          </View>
          <TabBar
            current={tab}
            onSelect={setTab}
            onAdd={() => (monthExists ? setTxSheet({ transaction: null }) : setNewBudgetFor(monthId))}
          />
        </>
      )}

      <AddTransactionSheet
        visible={!!txSheet}
        monthId={monthId}
        transaction={txSheet?.transaction}
        onClose={() => setTxSheet(null)}
      />
      <NewBudgetSheet
        visible={newBudgetFor !== null}
        initialMonthId={newBudgetFor ?? monthId}
        onClose={() => setNewBudgetFor(null)}
        onCreated={(id, openEditor) => {
          setNewBudgetFor(null);
          openMonth(id);
          if (openEditor) setStack([{ name: 'BudgetEditor' }]);
        }}
      />
      <CurrencySheet visible={currencyOpen} onClose={() => setCurrencyOpen(false)} />
      <BudgetSwitcherSheet visible={switcherOpen} monthId={monthId} onClose={() => setSwitcherOpen(false)} />
    </View>
  );
}
