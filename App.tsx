import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './AppNavigator';
import { useBudgetStore } from './src/store/useBudgetStore';

export default function App() {
  const preferences = useBudgetStore((state) => state.preferences);

  return (
    <>
      <AppNavigator />
      <StatusBar style={preferences.appThemeId === 'emerald' ? 'light' : 'dark'} />
    </>
  );
}
