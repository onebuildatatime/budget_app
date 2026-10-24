import React, { useState } from 'react';
import { View, Text, SectionList, ScrollView, StyleSheet } from 'react-native';
import { useBudgetStore } from '../store/useBudgetStore';
import { currency, sortTransactions, type Transaction } from '../../budgetModel';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, LargeTitle, Segmented, Divider, Chip } from '../ui/primitives';
import { MonthSwitcher } from '../ui/MonthSwitcher';
import { TransactionRow } from '../ui/TransactionRow';
import { BudgetPill } from '../ui/BudgetPill';

type Sort = 'recent' | 'highest';

export function SpendScreen({
  monthId,
  onMonthChange,
  onOpenBudgets,
  onOpenSwitcher,
  onEditTransaction,
}: {
  monthId: string;
  onMonthChange: (id: string) => void;
  onOpenBudgets: () => void;
  onOpenSwitcher: () => void;
  onEditTransaction: (tx: Transaction) => void;
}) {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const [sort, setSort] = useState<Sort>('recent');
  const [filter, setFilter] = useState<string | null>(null);
  const month = months.find((m) => m.id === monthId);

  const categoryNames = new Map(month?.categories.map((c) => [c.id, c.name]) ?? []);
  const all = month ? sortTransactions(month.transactions, sort) : [];
  const transactions = filter
    ? all.filter((x) => (filter === 'income' ? x.kind === 'income' : x.kind !== 'income' && x.categoryId === filter))
    : all;
  const total = transactions.filter((x) => x.kind !== 'income').reduce((sum, x) => sum + x.amount, 0);

  const sections =
    sort === 'recent'
      ? groupByDay(transactions)
      : transactions.length
        ? [{ title: '', data: transactions }]
        : [];

  const changeMonth = (id: string) => {
    setFilter(null);
    onMonthChange(id);
  };

  return (
    <Screen>
      <LargeTitle right={<BudgetPill onPress={onOpenSwitcher} />}>Spending</LargeTitle>
      <View style={styles.controls}>
        <View style={styles.row}>
          <MonthSwitcher monthId={monthId} onChange={changeMonth} onOpenList={onOpenBudgets} />
          <Text style={[t.caption, { color: p.textSecondary }]}>{currency(total, currencyCode)} spent</Text>
        </View>
        <Segmented
          value={sort}
          onChange={setSort}
          options={[
            { value: 'recent', label: 'Recent' },
            { value: 'highest', label: 'Highest' },
          ]}
        />
      </View>
      {month && month.transactions.length > 0 && (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <Chip label="All" selected={filter === null} onPress={() => setFilter(null)} />
            {month.categories
              .filter((c) => month.transactions.some((x) => x.categoryId === c.id))
              .map((c) => (
                <Chip key={c.id} label={c.name} selected={filter === c.id} onPress={() => setFilter(c.id)} />
              ))}
            {month.transactions.some((x) => x.kind === 'income') && (
              <Chip label="Income" selected={filter === 'income'} onPress={() => setFilter('income')} />
            )}
          </ScrollView>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: space.xxl, flexGrow: 1 }}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text style={[t.overline, styles.sectionHeader, { color: p.textSecondary }]}>{section.title}</Text>
          ) : null
        }
        ItemSeparatorComponent={() => <Divider inset={space.xl + 36 + space.md} />}
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            categoryName={categoryNames.get(item.categoryId) ?? 'Uncategorised'}
            currencyCode={currencyCode}
            showDate={sort === 'highest'}
            onPress={() => onEditTransaction(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[t.bodyStrong, { color: p.text }]}>No transactions</Text>
            <Text style={[t.caption, { color: p.textSecondary, marginTop: space.xs, textAlign: 'center' }]}>
              {month ? 'Tap + to add one. Tap a transaction to edit or delete it.' : "This month isn't set up yet."}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function groupByDay(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const label = new Date(tx.happenedAt).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    groups.set(label, [...(groups.get(label) ?? []), tx]);
  }
  return Array.from(groups, ([title, data]) => ({ title, data }));
}

const styles = StyleSheet.create({
  controls: {
    paddingHorizontal: space.xl,
    gap: space.md,
    paddingBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -space.sm,
  },
  filters: {
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  sectionHeader: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
});
