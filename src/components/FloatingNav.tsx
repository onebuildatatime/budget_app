import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type FloatingNavProps = {
  onNavigate: (screen: string) => void;
  currentScreen: string;
};

export function FloatingNav({ onNavigate, currentScreen }: FloatingNavProps) {
  const theme = useTheme();

  const buttons = [
    { screen: 'Dashboard', icon: '📊', label: 'Budget' },
    { screen: 'AddTransaction', icon: '➕', label: 'Add' },
    { screen: 'Goals', icon: '🎯', label: 'Goals' },
  ];

  return (
    <>
      {/* Bottom Center - 3 Main Navigation Buttons */}
      <View style={[styles.bottomNav, { paddingBottom: 24, paddingHorizontal: 12 }]}>
        <View style={styles.navRow}>
          {buttons.map((btn) => (
            <Pressable
              key={btn.screen}
              onPress={() => onNavigate(btn.screen)}
              style={[
                styles.navButton,
                {
                  backgroundColor:
                    currentScreen === btn.screen ? theme.accent : theme.surface,
                  borderColor: theme.accent,
                  shadowColor: currentScreen === btn.screen ? theme.accent : 'transparent',
                },
              ]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.navIcon, { color: currentScreen === btn.screen ? theme.accentText : theme.text }]}>
                {btn.icon}
              </Text>
              <Text
                style={[
                  styles.navLabel,
                  {
                    color: currentScreen === btn.screen ? theme.accentText : theme.textMuted,
                  },
                ]}
              >
                {btn.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topCorner: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  fabIcon: {
    fontSize: 28,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  navIcon: {
    fontSize: 26,
    marginBottom: 5,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
