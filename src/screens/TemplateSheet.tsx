import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { currency } from '../../budgetModel';
import { bucketTargets } from '../budgetTemplate';
import { usePalette, type as t, space } from '../ui/theme';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/primitives';
import { cleanAmountInput, toAmount } from './CategorySheet';

const rows = [
  { bucket: 'needs', label: 'Needs', hint: 'Housing, groceries, bills, transport' },
  { bucket: 'wants', label: 'Wants', hint: 'Eating out, shopping, fun, travel' },
  { bucket: 'savings', label: 'Savings', hint: 'Emergency fund, investing, debt' },
] as const;

export function TemplateSheet({
  visible,
  initialIncome,
  currencyCode,
  existingCount,
  onApply,
  onClose,
}: {
  visible: boolean;
  initialIncome: string;
  currencyCode: string;
  existingCount: number;
  onApply: (income: number) => void;
  onClose: () => void;
}) {
  const p = usePalette();
  const [income, setIncome] = useState(initialIncome);

  useEffect(() => {
    if (visible) setIncome(initialIncome);
  }, [visible, initialIncome]);

  const value = toAmount(income);

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[t.title, { color: p.text }]}>50/30/20 budget</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Feather name="x" size={22} color={p.textSecondary} />
          </Pressable>
        </View>
        <Text style={[t.caption, { color: p.textSecondary }]}>
          The most widely used budgeting rule: half your take-home pay on needs, 30% on wants, 20% on savings.
        </Text>

        <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Monthly take-home income</Text>
        <TextInput
          value={income}
          onChangeText={(v) => setIncome(cleanAmountInput(v))}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={p.textTertiary}
          style={[t.amount, styles.field, { color: p.text, backgroundColor: p.fill }]}
        />

        <View style={{ marginTop: space.lg }}>
          {rows.map((r) => (
            <View key={r.bucket} style={styles.row}>
              <Text style={[t.bodyStrong, { color: p.text, width: 44 }]}>{bucketTargets[r.bucket] * 100}%</Text>
              <View style={{ flex: 1 }}>
                <Text style={[t.body, { color: p.text }]}>{r.label}</Text>
                <Text style={[t.caption, { color: p.textSecondary }]}>{r.hint}</Text>
              </View>
              <Text style={[t.amount, { color: p.text }]}>
                {currency(value * bucketTargets[r.bucket], currencyCode)}
              </Text>
            </View>
          ))}
        </View>

        {existingCount > 0 && (
          <Text style={[t.caption, { color: p.warning, marginTop: space.md }]}>
            This replaces your {existingCount} current categories. Nothing changes until you tap Save, and you can
            edit every category afterwards.
          </Text>
        )}

        <View style={{ marginTop: space.xl }}>
          <Button label="Use this budget" onPress={() => onApply(value)} disabled={value <= 0} />
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: space.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  label: { marginTop: space.lg, marginBottom: space.sm },
  field: { borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
});
