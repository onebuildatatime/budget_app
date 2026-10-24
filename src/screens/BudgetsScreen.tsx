import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import {
  compareMonthIds,
  currency,
  getMonthId,
  getMonthLabel,
  getTotalPlanned,
  getTotalSpent,
} from '../../budgetModel';
import { usePalette, type as t, space, toneColor } from '../ui/theme';
import { Screen, Header, Divider, ProgressBar, Button } from '../ui/primitives';

export function BudgetsScreen({
  viewingMonthId,
  onBack,
  onOpen,
  onCreate,
}: {
  viewingMonthId: string;
  onBack: () => void;
  onOpen: (monthId: string) => void;
  onCreate: () => void;
}) {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const budgetName = useBudgetStore((s) => s.budgets.find((b) => b.id === s.activeBudgetId)?.name);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const currentMonthId = getMonthId(new Date());
  const sorted = [...months].sort((a, b) => compareMonthIds(b.id, a.id));

  return (
    <Screen>
      <Header
        title={budgetName ? `${budgetName} · Months` : 'Months'}
        onBack={onBack}
        right={
          <Pressable onPress={onCreate} hitSlop={10} accessibilityLabel="New month">
            <Feather name="plus" size={22} color={p.accent} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <Text style={[t.caption, styles.intro, { color: p.textSecondary }]}>
          Each month has its own plan. Tap one to open it.
        </Text>
        {sorted.map((m, i) => {
          const planned = getTotalPlanned(m);
          const spent = getTotalSpent(m);
          const ratio = planned > 0 ? spent / planned : 0;
          const viewing = m.id === viewingMonthId;
          return (
            <View key={m.id}>
              <Pressable
                onPress={() => onOpen(m.id)}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: p.fill }]}
              >
                <View style={styles.rowLine}>
                  <Text style={[t.bodyStrong, { color: p.text, flex: 1 }]}>{getMonthLabel(m.id, 'en-US')}</Text>
                  {m.id === currentMonthId && <Badge label="This month" color={p.accent} />}
                  {viewing && <Feather name="check" size={18} color={p.accent} />}
                </View>
                <ProgressBar ratio={ratio} color={toneColor(p, ratio)} />
                <Text style={[t.caption, { color: p.textSecondary }]}>
                  {currency(spent, currencyCode)} spent of {currency(planned, currencyCode)} ·{' '}
                  {plural(m.categories.length, 'category', 'categories')} ·{' '}
                  {plural(m.transactions.length, 'transaction', 'transactions')}
                </Text>
              </Pressable>
              {i < sorted.length - 1 && <Divider inset={space.xl} />}
            </View>
          );
        })}
        <View style={{ paddingHorizontal: space.xl, marginTop: space.xl }}>
          <Button label="Set up another month" variant="secondary" onPress={onCreate} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[t.caption, { color, fontSize: 11, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: space.xl, paddingBottom: space.sm },
  row: { paddingHorizontal: space.xl, paddingVertical: space.lg, gap: space.sm },
  rowLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
