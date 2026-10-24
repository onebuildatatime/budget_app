import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTheme } from '../hooks/useTheme';
import { FloatingNav } from '../components/FloatingNav';
import { MenuNav } from '../components/MenuNav';

import {
  getCategorySummaries,
  currency,
  getMonthLabel,
  sortTransactions,
  addMonths,
} from '../../budgetModel';
import type { Transaction } from '../../budgetModel';

export function TransactionsScreen({
  currentScreen,
  route,
  onNavigate,
}: {
  currentScreen: string;
  route: { params?: { monthId?: string } };
  onNavigate: (screen: string, params?: any) => void;
}) {
  const theme = useTheme();
  const { months, preferences, updateState } = useBudgetStore();
  const [sortBy, setSortBy] = useState<'recent' | 'highest'>('recent');
  const [currentMonthId, setCurrentMonthId] = useState(route.params?.monthId || months[0]?.id);

  const activeMonth = months.find((m) => m.id === currentMonthId);
  if (!activeMonth) return null;

  const summaries = getCategorySummaries(activeMonth);
  const categoryMap = new Map(summaries.map((s) => [s.category.id, s.category]));
  const transactions = sortTransactions(activeMonth.transactions, sortBy);
  const expenseTransactions = transactions.filter((t) => t.kind !== 'income');

  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert('Delete transaction?', `${currency(transaction.amount, preferences.currencyCode)} from ${transaction.note}`, [
      {
        text: 'Delete',
        onPress: () => {
          const updatedMonth = {
            ...activeMonth,
            transactions: activeMonth.transactions.filter((t) => t.id !== transaction.id),
            updatedAt: Date.now(),
          };

          updateState({
            months: months.map((m) => (m.id === activeMonth.id ? updatedMonth : m)),
          });
        },
        style: 'destructive',
      },
      { text: 'Cancel' },
    ]);
  };

  const goToPrevMonth = () => setCurrentMonthId(addMonths(currentMonthId, -1));
  const goToNextMonth = () => setCurrentMonthId(addMonths(currentMonthId, 1));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => onNavigate('Dashboard')}>
          <Text style={[styles.backButton, { color: theme.accent }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transactions</Text>
        <Pressable onPress={() => onNavigate('AddTransaction')}>
          <Text style={[styles.addButton, { color: theme.accent }]}>+ Add</Text>
        </Pressable>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <Pressable onPress={goToPrevMonth} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: theme.text }]}>←</Text>
        </Pressable>
        <Text style={[styles.monthLabel, { color: theme.text }]}>
          {getMonthLabel(currentMonthId, 'en-US')}
        </Text>
        <Pressable onPress={goToNextMonth} style={styles.navButton}>
          <Text style={[styles.navButtonText, { color: theme.text }]}>→</Text>
        </Pressable>
      </View>

      {/* Sort Options */}
      <View style={[styles.sortBar, { backgroundColor: theme.surface }]}>
        <Pressable
          style={[
            styles.sortButton,
            sortBy === 'recent' && { backgroundColor: theme.accentSoft },
          ]}
          onPress={() => setSortBy('recent')}
        >
          <Text style={[styles.sortButtonText, { color: sortBy === 'recent' ? theme.accent : theme.text }]}>
            Recent
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.sortButton,
            sortBy === 'highest' && { backgroundColor: theme.accentSoft },
          ]}
          onPress={() => setSortBy('highest')}
        >
          <Text style={[styles.sortButtonText, { color: sortBy === 'highest' ? theme.accent : theme.text }]}>
            Highest
          </Text>
        </Pressable>
      </View>

      {expenseTransactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>No transactions yet</Text>
          <Pressable
            style={[styles.emptyButton, { backgroundColor: theme.accent }]}
            onPress={() => onNavigate('AddTransaction')}
          >
            <Text style={[styles.emptyButtonText, { color: theme.accentText }]}>Add one now</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={expenseTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const category = categoryMap.get(item.categoryId);
            return (
              <Pressable
                style={[styles.transactionItem, { backgroundColor: theme.surface }]}
                onLongPress={() => handleDeleteTransaction(item)}
              >
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionCategory, { color: theme.text }]}>
                    {category?.name || 'Unknown'}
                  </Text>
                  {item.note && (
                    <Text style={[styles.transactionNote, { color: theme.textMuted }]}>
                      {item.note}
                    </Text>
                  )}
                </View>
                <Text style={[styles.transactionAmount, { color: theme.text }]}>
                  {currency(item.amount, preferences.currencyCode)}
                </Text>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  addButton: {
    fontSize: 15,
    fontWeight: '700',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  navButton: {
    padding: 10,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 22,
    fontWeight: '700',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 13,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 12,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
