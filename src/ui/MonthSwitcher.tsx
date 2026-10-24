import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { addMonths, getMonthLabel } from '../../budgetModel';
import { usePalette, type as t } from './theme';

export function MonthSwitcher({
  monthId,
  onChange,
  onOpenList,
}: {
  monthId: string;
  onChange: (id: string) => void;
  onOpenList?: () => void;
}) {
  const p = usePalette();

  const arrow = (dir: 'left' | 'right') => (
    <Pressable
      onPress={() => onChange(addMonths(monthId, dir === 'left' ? -1 : 1))}
      hitSlop={10}
      accessibilityLabel={dir === 'left' ? 'Previous month' : 'Next month'}
      style={({ pressed }) => [styles.arrow, { backgroundColor: pressed ? p.fill : 'transparent' }]}
    >
      <Feather name={`chevron-${dir}`} size={20} color={p.textSecondary} />
    </Pressable>
  );

  return (
    <View style={styles.row}>
      {arrow('left')}
      <Pressable
        onPress={onOpenList}
        disabled={!onOpenList}
        style={styles.label}
        accessibilityLabel={onOpenList ? 'All months' : undefined}
      >
        <Text style={[t.bodyStrong, { color: p.text }]}>{getMonthLabel(monthId, 'en-US')}</Text>
        {onOpenList && <Feather name="chevron-down" size={16} color={p.textSecondary} />}
      </Pressable>
      {arrow('right')}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 120,
  },
});
