import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { TopNav } from './TopNav';
import { BottomNavIcon } from './BottomNavIcon';

type ScreenWrapperProps = {
  children: ReactNode;
  onNavigate: (screen: string) => void;
  currentScreen: string;
};

export function ScreenWrapper({ children, onNavigate, currentScreen }: ScreenWrapperProps) {
  const theme = useTheme();

  const screens = [
    { id: 'Dashboard', icon: '📊', label: 'Budget' },
    { id: 'Transactions', icon: '💰', label: 'Spend' },
    { id: 'AddTransaction', icon: '➕', label: 'Add' },
    { id: 'Budget', icon: '✏️', label: 'Edit' },
    { id: 'Goals', icon: '🎯', label: 'Goals' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Navigation */}
      <TopNav
        leftIcon="🏠"
        centerIcon="💳"
        rightIcon="⚙️"
        centerLabel="My Budget"
        onLeftPress={() => onNavigate('Dashboard')}
        onRightPress={() => onNavigate('Goals')}
      />

      {/* Main Content */}
      <View style={styles.content}>{children}</View>

      {/* Bottom Navigation */}
      <BottomNavIcon
        leftIcon={{
          icon: '👈',
          onPress: () => onNavigate('Dashboard'),
          isActive: currentScreen === 'Dashboard',
        }}
        centerIcon={{
          icon: '🎯',
          onPress: () => onNavigate('AddTransaction'),
          isActive: currentScreen === 'AddTransaction',
        }}
        rightIcon={{
          icon: '👉',
          onPress: () => onNavigate('Transactions'),
          isActive: currentScreen === 'Transactions',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
