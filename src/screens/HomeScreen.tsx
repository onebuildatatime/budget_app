import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import {
  currency,
  getCategorySummaries,
  getDaysInMonth,
  getMonthId,
  getMonthLabel,
  getTotalPlanned,
  getTotalSpent,
  sortTransactions,
  type Transaction,
} from '../../budgetModel';
import { usePalette, type as t, space, toneColor } from '../ui/theme';
import { Screen, SectionLabel, ProgressBar, Button } from '../ui/primitives';
import { MonthSwitcher } from '../ui/MonthSwitcher';
import { TransactionRow } from '../ui/TransactionRow';
import { BudgetPill } from '../ui/BudgetPill';

export function HomeScreen({
  monthId,
  onMonthChange,
  onOpenBudgets,
  onOpenSwitcher,
  onCreateBudget,
  onEditBudget,
  onOpenCategory,
  onSeeAll,
  onEditTransaction,
}: {
  monthId: string;
  onMonthChange: (id: string) => void;
  onOpenBudgets: () => void;
  onOpenSwitcher: () => void;
  onCreateBudget: () => void;
  onEditBudget: () => void;
  onOpenCategory: (categoryId: string) => void;
  onSeeAll: () => void;
  onEditTransaction: (tx: Transaction) => void;
}) {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const month = months.find((m) => m.id === monthId);

  const top = (
    <View style={styles.top}>
      <MonthSwitcher monthId={monthId} onChange={onMonthChange} onOpenList={onOpenBudgets} />
      <BudgetPill onPress={onOpenSwitcher} />
    </View>
  );

  if (!month || month.categories.length === 0) {
    return (
      <Screen>
        {top}
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: p.fill }]}>
            <Feather name="pie-chart" size={28} color={p.textSecondary} />
          </View>
          <Text style={[t.title, { color: p.text, textAlign: 'center' }]}>
            {month ? 'No categories yet' : `${getMonthLabel(monthId, 'en-US')} isn't set up yet`}
          </Text>
          <Text style={[t.body, { color: p.textSecondary, textAlign: 'center', marginTop: space.sm }]}>
            {month
              ? 'Add categories to start tracking this month.'
              : 'Copy a previous month, start from the 50/30/20 rule, or build one from scratch.'}
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: space.xl }}>
            {month ? (
              <Button label="Set up categories" onPress={onEditBudget} />
            ) : (
              <Button label={`Set up ${getMonthLabel(monthId, 'en-US')}`} onPress={onCreateBudget} />
            )}
          </View>
        </View>
      </Screen>
    );
  }

  const summaries = getCategorySummaries(month);
  const planned = getTotalPlanned(month);
  const spent = getTotalSpent(month);
  const left = planned - spent;
  const ratio = planned > 0 ? spent / planned : 0;
  const categoryNames = new Map(month.categories.map((c) => [c.id, c.name]));
  const recent = sortTransactions(month.transactions, 'recent').slice(0, 5);
  const uncategorised = month.transactions
    .filter((x) => x.kind !== 'income' && !categoryNames.has(x.categoryId))
    .reduce((sum, x) => sum + x.amount, 0);

  const isCurrentMonth = getMonthId(new Date()) === monthId;
  const daysLeft = isCurrentMonth ? getDaysInMonth(monthId) - new Date().getDate() + 1 : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        {top}

        <View style={styles.hero}>
          <Text style={[t.caption, { color: p.textSecondary }]}>
            {left >= 0 ? 'Left to spend' : 'Over budget'}
          </Text>
          <Text style={[t.display, { color: left >= 0 ? p.text : p.negative, marginVertical: space.xs }]}>
            {currency(Math.abs(left), currencyCode)}
          </Text>
          <View style={{ marginTop: space.md }}>
            <ProgressBar ratio={ratio} color={toneColor(p, ratio)} height={6} />
          </View>
          <Text style={[t.caption, { color: p.textSecondary, marginTop: space.sm }]}>
            {currency(spent, currencyCode)} of {currency(planned, currencyCode)}
            {daysLeft !== null ? ` · ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left` : ''}
          </Text>
          {daysLeft !== null && left > 0 && (
            <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>
              About {currency(left / daysLeft, currencyCode)} a day
            </Text>
          )}
        </View>

        <SectionLabel right={<Link label="Edit" onPress={onEditBudget} />}>Categories</SectionLabel>
        {summaries.map((s) => (
          <Pressable
            key={s.category.id}
            onPress={() => onOpenCategory(s.category.id)}
            style={({ pressed }) => [styles.category, pressed && { backgroundColor: p.fill }]}
          >
            <View style={styles.categoryLine}>
              <Text style={[t.body, { color: p.text, flex: 1 }]} numberOfLines={1}>
                {s.category.name}
              </Text>
              <Text style={[t.amount, { color: s.ratio > 1 ? p.negative : p.text }]}>
                {currency(s.spent, currencyCode)}
                <Text style={{ color: p.textTertiary }}> / {currency(s.category.planned, currencyCode)}</Text>
              </Text>
              <Feather name="chevron-right" size={16} color={p.textTertiary} />
            </View>
            <ProgressBar ratio={s.ratio} color={toneColor(p, s.ratio)} />
          </Pressable>
        ))}
        {uncategorised > 0 && (
          <View style={styles.category}>
            <View style={styles.categoryLine}>
              <Text style={[t.body, { color: p.textSecondary, flex: 1 }]}>Uncategorised</Text>
              <Text style={[t.amount, { color: p.textSecondary }]}>{currency(uncategorised, currencyCode)}</Text>
            </View>
          </View>
        )}

        <SectionLabel right={recent.length > 0 ? <Link label="See all" onPress={onSeeAll} /> : undefined}>
          Recent
        </SectionLabel>
        {recent.length === 0 ? (
          <Text style={[t.body, { color: p.textSecondary, paddingHorizontal: space.xl }]}>
            Nothing yet. Tap + to log your first expense.
          </Text>
        ) : (
          recent.map((tx) => (
            <TransactionRow
              key={tx.id}
              transaction={tx}
              categoryName={categoryNames.get(tx.categoryId) ?? 'Uncategorised'}
              currencyCode={currencyCode}
              onPress={() => onEditTransaction(tx)}
            />
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <Text style={[t.caption, { color: p.accent, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: space.lg,
    paddingRight: space.xl,
    paddingTop: space.md,
  },
  hero: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
  category: {
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    gap: space.sm,
  },
  categoryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
    paddingBottom: space.xxl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
});
