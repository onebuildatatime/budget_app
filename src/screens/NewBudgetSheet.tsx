import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import {
  compareMonthIds,
  createEmptyMonth,
  currency,
  getMonthLabel,
  type MonthRecord,
} from '../../budgetModel';
import { buildTemplateCategories } from '../budgetTemplate';
import { copyMonth } from '../logic/rollover';
import { applyGoalContribution } from '../logic/goals';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/primitives';
import { MonthSwitcher } from '../ui/MonthSwitcher';
import { cleanAmountInput, toAmount } from './CategorySheet';
import { deviceLocale } from '../logic/locale';

type Start = 'copy' | 'template' | 'empty';

export function NewBudgetSheet({
  visible,
  initialMonthId,
  onClose,
  onCreated,
}: {
  visible: boolean;
  initialMonthId: string;
  onClose: () => void;
  onCreated: (monthId: string, openEditor: boolean) => void;
}) {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const goals = useBudgetStore((s) => s.goals);
  const updateState = useBudgetStore((s) => s.updateState);

  const [monthId, setMonthId] = useState(initialMonthId);
  const [start, setStart] = useState<Start>('copy');
  const [income, setIncome] = useState('');

  const withBudgets = useMemo(
    () => [...months].filter((m) => m.categories.length > 0).sort((a, b) => compareMonthIds(a.id, b.id)),
    [months],
  );
  // Copy the closest earlier month, or the earliest one if creating a month before all others.
  const source: MonthRecord | undefined =
    [...withBudgets].reverse().find((m) => compareMonthIds(m.id, monthId) < 0) ?? withBudgets[0];

  useEffect(() => {
    if (!visible) return;
    setMonthId(initialMonthId);
    setStart(source ? 'copy' : 'template');
    setIncome(source ? source.monthlyLimit : '');
  }, [visible, initialMonthId]);

  const exists = months.some((m) => m.id === monthId);
  const recurringCount = source?.transactions.filter((x) => x.recurring).length ?? 0;
  const incomeValue = toAmount(income);

  const create = () => {
    let record: MonthRecord;
    if (start === 'copy' && source) {
      record = copyMonth(source, monthId);
    } else {
      record = createEmptyMonth(monthId, String(incomeValue), currencyCode);
      if (start === 'template') record.categories = buildTemplateCategories(incomeValue);
    }
    const nextGoals = record.transactions.reduce(
      (acc, tx) => applyGoalContribution(acc, record.categories, undefined, tx),
      goals,
    );
    updateState({ months: [...months, record].sort((a, b) => compareMonthIds(a.id, b.id)), goals: nextGoals });
    triggerHaptic('success');
    onCreated(monthId, start !== 'copy');
  };

  const options: { value: Start; title: string; detail: string; hidden?: boolean }[] = [
    {
      value: 'copy',
      title: source ? `Copy ${getMonthLabel(source.id, deviceLocale)}` : 'Copy a month',
      detail: source
        ? `${source.categories.length} categories, ${currency(parseFloat(source.monthlyLimit), currencyCode)} income${
            recurringCount ? `, ${recurringCount} repeating ${recurringCount === 1 ? 'item' : 'items'}` : ''
          }. Other transactions aren't copied.`
        : '',
      hidden: !source,
    },
    {
      value: 'template',
      title: '50/30/20 starter',
      detail: '12 common categories split 50% needs, 30% wants, 20% savings.',
    },
    { value: 'empty', title: 'Start empty', detail: 'Just your income. Add categories yourself.' },
  ];

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[t.title, { color: p.text }]}>Set up a month</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Feather name="x" size={22} color={p.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.month}>
          <MonthSwitcher monthId={monthId} onChange={setMonthId} />
        </View>

        {exists ? (
          <Text style={[t.body, { color: p.textSecondary, textAlign: 'center', marginVertical: space.lg }]}>
            {getMonthLabel(monthId, deviceLocale)} is already set up.
          </Text>
        ) : (
          <>
            {options
              .filter((o) => !o.hidden)
              .map((o) => {
                const selected = o.value === start;
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => setStart(o.value)}
                    style={[
                      styles.option,
                      { borderColor: selected ? p.accent : p.hairline, backgroundColor: selected ? p.fill : 'transparent' },
                    ]}
                  >
                    <Feather
                      name={selected ? 'check-circle' : 'circle'}
                      size={20}
                      color={selected ? p.accent : p.textTertiary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[t.bodyStrong, { color: p.text }]}>{o.title}</Text>
                      <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>{o.detail}</Text>
                    </View>
                  </Pressable>
                );
              })}

            {start !== 'copy' && (
              <View style={styles.incomeRow}>
                <Text style={[t.body, { color: p.text, flex: 1 }]}>Monthly income</Text>
                <TextInput
                  value={income}
                  onChangeText={(v) => setIncome(cleanAmountInput(v))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={p.textTertiary}
                  style={[t.amount, styles.input, { color: p.text, backgroundColor: p.fill }]}
                />
              </View>
            )}
          </>
        )}

        <View style={{ marginTop: space.lg }}>
          {exists ? (
            <Button label="Open this month" onPress={() => onCreated(monthId, false)} />
          ) : (
            <Button
              label={`Create ${getMonthLabel(monthId, deviceLocale)}`}
              onPress={create}
              disabled={start !== 'copy' && incomeValue <= 0}
            />
          )}
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
  month: { alignItems: 'center', paddingVertical: space.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: space.sm,
  },
  incomeRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.md },
  input: {
    width: 128,
    textAlign: 'right',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 8,
  },
});
