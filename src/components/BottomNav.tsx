import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type NavItem = {
  id: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'Dashboard', label: 'Budget', icon: '📊' },
  { id: 'Transactions', label: 'Spend', icon: '💰' },
  { id: 'AddTransaction', label: 'Add', icon: '➕' },
  { id: 'Budget', label: 'Edit', icon: '✏️' },
  { id: 'Goals', label: 'Goals', icon: '🎯' },
];

export function BottomNav({
  currentScreen,
  onNavigate,
}: {
  currentScreen: string;
  onNavigate: (screen: string, params?: any) => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = currentScreen === item.id;
        return (
          <Pressable
            key={item.id}
            style={[
              styles.button,
              isActive && { backgroundColor: theme.accentSoft },
            ]}
            onPress={() => onNavigate(item.id)}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? theme.accent : theme.textMuted,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
});
