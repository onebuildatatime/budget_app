import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBudgetStore } from './src/store/useBudgetStore';
import { initialBudgetData } from './budgetData';
import { MenuNav } from './src/components/MenuNav';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { BudgetEditorScreen } from './src/screens/BudgetEditorScreen';
import { AddTransactionScreen } from './src/screens/AddTransactionScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';

export type ScreenName = 'Dashboard' | 'Budget' | 'AddTransaction' | 'Transactions' | 'Goals';

interface NavigationState {
  screen: ScreenName;
  params?: Record<string, any>;
}

export function AppNavigator() {
  const { months, updateState } = useBudgetStore();
  const [navigation, setNavigation] = useState<NavigationState>({ screen: 'Dashboard' });
  const [initialized, setInitialized] = useState(false);

  // Initialize with seed data if empty
  useEffect(() => {
    const initializeData = async () => {
      if (months.length === 0) {
        updateState({
          months: initialBudgetData.months,
          accounts: initialBudgetData.accounts,
          goals: initialBudgetData.goals,
          preferences: initialBudgetData.preferences,
        });
      }
      setInitialized(true);
    };

    initializeData();
  }, [months.length, updateState]);

  const navigate = (screen: string, params?: any) => {
    setNavigation({ screen: screen as ScreenName, params });
  };

  if (!initialized) {
    return <View />;
  }

  const route = { params: navigation.params };

  const screenProps = {
    currentScreen: navigation.screen,
    onNavigate: navigate,
  };

  switch (navigation.screen) {
    case 'Dashboard':
      return <DashboardScreen {...screenProps} />;
    case 'Budget':
      return <BudgetEditorScreen route={route} {...screenProps} />;
    case 'AddTransaction':
      return <AddTransactionScreen {...screenProps} />;
    case 'Transactions':
      return <TransactionsScreen route={route} {...screenProps} />;
    case 'Goals':
      return <GoalsScreen {...screenProps} />;
    default:
      return <DashboardScreen {...screenProps} />;
  }
}
