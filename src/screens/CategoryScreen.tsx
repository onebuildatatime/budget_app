import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useBudgetStore } from '../store/useBudgetStore';
import { currency, sortTransactions, type Transaction } from '../../budgetModel';
import { usePalette, type as t, space, toneColor } from '../ui/theme';
import { Screen, Header, SectionLabel, ProgressBar, Divider } from '../ui/primitives';
import { TransactionRow } from '../ui/TransactionRow';

export function CategoryScreen({
  monthId,
  categoryId,
  onBack,
  onEditBudget,
  onEditTransaction,
}: {
  monthId: string;
  categoryId: string;
  onBack: () => void;
  onEditBudget: () => void;
  onEditTransaction: (tx: Transaction) => void;
}) {
  const p = usePalette();
  const month = useBudgetStore((s) => s.months.find((m) => m.id === monthId));
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const category = month?.categories.find((c) => c.id === categoryId);

  if (!month || !category) {
    return (
      <Screen>
        <Header title="Category" onBack={onBack} />
      </Screen>
    );
  }

  const transactions = sortTransactions(
    month.transactions.filter((x) => x.kind !== 'income' && x.categoryId === categoryId),
    'recent',
  );
  const spent = transactions.reduce((sum, x) => sum + x.amount, 0);
  const left = category.planned - spent;
  const ratio = category.planned > 0 ? spent / category.planned : 0;

  const bySub = category.subcategories.map((name) => {
    const subSpent = transactions.filter((x) => x.subcategory === name).reduce((sum, x) => sum + x.amount, 0);
    return { name, spent: subSpent, budget: category.subcategoryBudgets?.[name] ?? 0 };
  });
  const unsorted = transactions
    .filter((x) => !x.subcategory || !category.subcategories.includes(x.subcategory))
    .reduce((sum, x) => sum + x.amount, 0);

  return (
    <Screen>
      <Header
        title={category.name}
        onBack={onBack}
        right={
          <Pressable onPress={onEditBudget} hitSlop={10}>
            <Text style={[t.caption, { color: p.accent, fontWeight: '600' }]}>Edit</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <View style={styles.hero}>
          <Text style={[t.caption, { color: p.textSecondary }]}>{left >= 0 ? 'Left to spend' : 'Over budget'}</Text>
          <Text style={[t.display, { color: left >= 0 ? p.text : p.negative, marginVertical: space.xs }]}>
            {currency(Math.abs(left), currencyCode)}
          </Text>
          <View style={{ marginTop: space.md }}>
            <ProgressBar ratio={ratio} color={toneColor(p, ratio)} height={6} />
          </View>
          <Text style={[t.caption, { color: p.textSecondary, marginTop: space.sm }]}>
            {currency(spent, currencyCode)} of {currency(category.planned, currencyCode)}
          </Text>
        </View>

        {bySub.length > 0 && (
          <>
            <SectionLabel>Subcategories</SectionLabel>
            {bySub.map((s) => (
              <View key={s.name} style={styles.subRow}>
                <View style={styles.subLine}>
                  <Text style={[t.body, { color: p.text, flex: 1 }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={[t.amount, { color: s.budget && s.spent > s.budget ? p.negative : p.text }]}>
                    {currency(s.spent, currencyCode)}
                    {s.budget > 0 && (
                      <Text style={{ color: p.textTertiary }}> / {currency(s.budget, currencyCode)}</Text>
                    )}
                  </Text>
                </View>
                {s.budget > 0 && <ProgressBar ratio={s.spent / s.budget} color={toneColor(p, s.spent / s.budget)} />}
              </View>
            ))}
            {unsorted > 0 && (
              <View style={styles.subRow}>
                <View style={styles.subLine}>
                  <Text style={[t.body, { color: p.textSecondary, flex: 1 }]}>No subcategory</Text>
                  <Text style={[t.amount, { color: p.textSecondary }]}>{currency(unsorted, currencyCode)}</Text>
                </View>
              </View>
            )}
          </>
        )}

        <SectionLabel>Transactions</SectionLabel>
        {transactions.length === 0 ? (
          <Text style={[t.body, { color: p.textSecondary, paddingHorizontal: space.xl }]}>
            Nothing spent here yet.
          </Text>
        ) : (
          transactions.map((tx, i) => (
            <View key={tx.id}>
              <TransactionRow
                transaction={tx}
                categoryName={category.name}
                currencyCode={currencyCode}
                onPress={() => onEditTransaction(tx)}
              />
              {i < transactions.length - 1 && <Divider inset={space.xl + 36 + space.md} />}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.sm },
  subRow: { paddingHorizontal: space.xl, paddingVertical: space.sm, gap: space.sm },
  subLine: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
});
