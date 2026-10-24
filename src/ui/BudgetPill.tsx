import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import { usePalette, type as t } from './theme';

export function BudgetPill({ onPress }: { onPress: () => void }) {
  const p = usePalette();
  const name = useBudgetStore((s) => s.budgets.find((b) => b.id === s.activeBudgetId)?.name ?? 'Budget');
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Budget: ${name}. Switch budget`}
      style={({ pressed }) => [styles.pill, { backgroundColor: pressed ? p.hairline : p.fill }]}
    >
      <Text style={[t.caption, { color: p.text, fontWeight: '600', maxWidth: 130 }]} numberOfLines={1}>
        {name}
      </Text>
      <Feather name="chevron-down" size={14} color={p.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
});
