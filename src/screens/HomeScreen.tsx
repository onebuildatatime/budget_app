import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore, useActiveBook } from '../store/useBudgetStore';
import { daysBetween, daysLeftInPeriod, formatTripRange, monthPeriod, tripLength, tripPeriod } from '../logic/period';
import {
  currency,
  getCategorySummaries,
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
import { deviceLocale } from '../logic/locale';

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
  onOpenTrends,
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
  onOpenTrends: () => void;
}) {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const month = months.find((m) => m.id === monthId);
  const book = useActiveBook();
  const trip = book?.kind === 'trip' ? book.trip : undefined;

  const top = (
    <View style={styles.top}>
      {trip ? (
        <Text style={[t.bodyStrong, { color: p.text, paddingLeft: space.sm }]}>{formatTripRange(trip)}</Text>
      ) : (
        <MonthSwitcher monthId={monthId} onChange={onMonthChange} onOpenList={onOpenBudgets} />
      )}
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
            {month ? 'No categories yet' : `${getMonthLabel(monthId, deviceLocale)} isn't set up yet`}
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
              <Button label={`Set up ${getMonthLabel(monthId, deviceLocale)}`} onPress={onCreateBudget} />
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

  const daysLeft = daysLeftInPeriod(trip ? tripPeriod(trip) : monthPeriod(monthId));
  const tripNote = (() => {
    if (!trip || daysLeft !== null) return null;
    const today = new Date();
    const { start } = tripPeriod(trip);
    if (today < start) {
      const until = daysBetween(today, start);
      return `Starts in ${until} ${until === 1 ? 'day' : 'days'} · about ${currency(left / tripLength(trip), currencyCode)} a day`;
    }
    return 'This trip has ended';
  })();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        {top}

        <View style={styles.hero}>
          <Text style={[t.caption, { color: p.textSecondary }]}>
            {left < 0 ? 'Over budget' : trip ? 'Left for this trip' : 'Left to spend'}
          </Text>
          <Text style={[t.display, { color: left >= 0 ? p.text : p.negative, marginVertical: space.xs }]}>
            {currency(Math.abs(left), currencyCode)}
          </Text>
          {trip && book?.conversion && (
            <Text style={[t.body, { color: p.textSecondary }]}>
              ≈ {currency(Math.abs(left) * book.conversion.rate, book.conversion.currencyCode)}
            </Text>
          )}
          <View style={{ marginTop: space.md }}>
            <ProgressBar ratio={ratio} color={toneColor(p, ratio)} height={6} />
          </View>
          <Text style={[t.caption, { color: p.textSecondary, marginTop: space.sm }]}>
            {currency(spent, currencyCode)} of {currency(planned, currencyCode)}
            {daysLeft !== null ? ` · ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left` : ''}
          </Text>
          {tripNote && <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>{tripNote}</Text>}
          {daysLeft !== null && left > 0 && (
            <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>
              About {currency(left / daysLeft, currencyCode)} a day
            </Text>
          )}
          <Pressable onPress={onOpenTrends} hitSlop={8} style={styles.trendsLink}>
            <Feather name="bar-chart-2" size={16} color={p.accent} />
            <Text style={[t.caption, { color: p.accent, fontWeight: '600' }]}>Trends</Text>
          </Pressable>
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
  trendsLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: space.md },
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
