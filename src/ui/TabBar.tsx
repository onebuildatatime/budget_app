import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette } from './theme';

export type TabName = 'Home' | 'Spend' | 'Goals' | 'Menu';

const tabs: { name: TabName; icon: keyof typeof Feather.glyphMap }[] = [
  { name: 'Home', icon: 'home' },
  { name: 'Spend', icon: 'list' },
  { name: 'Goals', icon: 'target' },
  { name: 'Menu', icon: 'menu' },
];

export function TabBar({
  current,
  onSelect,
  onAdd,
}: {
  current: TabName;
  onSelect: (tab: TabName) => void;
  onAdd: () => void;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();

  const renderTab = (tab: (typeof tabs)[number]) => {
    const active = tab.name === current;
    const color = active ? p.accent : p.textTertiary;
    return (
      <Pressable
        key={tab.name}
        style={styles.tab}
        onPress={() => onSelect(tab.name)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
      >
        <Feather name={tab.icon} size={22} color={color} />
        <Text style={[styles.label, { color }]}>{tab.name}</Text>
      </Pressable>
    );
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: p.bg,
          borderTopColor: p.hairline,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {tabs.slice(0, 2).map(renderTab)}
      <View style={styles.tab}>
        <Pressable
          onPress={onAdd}
          accessibilityLabel="Add transaction"
          style={({ pressed }) => [styles.add, { backgroundColor: p.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Feather name="plus" size={24} color={p.onAccent} />
        </Pressable>
      </View>
      {tabs.slice(2).map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  add: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
