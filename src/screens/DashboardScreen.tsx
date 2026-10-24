import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTheme } from '../hooks/useTheme';
import { FloatingNav } from '../components/FloatingNav';
import { MenuNav } from '../components/MenuNav';
import {
  getCategorySummaries,
  getTotalPlanned,
  getTotalSpent,
  getTotalIncome,
  getMonthLabel,
  addMonths,
  currency,
} from '../../budgetModel';

export function DashboardScreen({
  currentScreen,
  onNavigate,
}: {
  currentScreen: string;
  onNavigate: (screen: string, params?: any) => void;
}) {
  const theme = useTheme();
  const { months, activeMonthId, goals, preferences } = useBudgetStore();
  const { width } = useWindowDimensions();
  const [currentMonthId, setCurrentMonthId] = useState(activeMonthId);

  const activeMonth = months.find((m) => m.id === currentMonthId);
  if (!activeMonth) return null;

  const summaries = getCategorySummaries(activeMonth);
  const totalPlanned = getTotalPlanned(activeMonth);
  const totalSpent = getTotalSpent(activeMonth);
  const totalIncome = getTotalIncome(activeMonth);
  const remaining = totalPlanned - totalSpent;
  const allocatedPercent = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

  const goToPrevMonth = () => setCurrentMonthId(addMonths(currentMonthId, -1));
  const goToNextMonth = () => setCurrentMonthId(addMonths(currentMonthId, 1));

  const menuItems = [
    {
      id: 'transactions',
      label: 'View Transactions',
      icon: '💰',
      onPress: () => onNavigate('Transactions', { monthId: currentMonthId }),
    },
    {
      id: 'budget',
      label: 'Edit Budget',
      icon: '✏️',
      onPress: () => onNavigate('Budget', { monthId: currentMonthId }),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FloatingNav currentScreen={currentScreen} onNavigate={onNavigate} />
      <MenuNav items={menuItems} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} scrollEventThrottle={16}>
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

        {/* Hero Section - Income & Allocation */}
        <View style={[styles.hero, { backgroundColor: theme.hero }]}>
          <View style={styles.heroContent}>
            <Text style={[styles.heroLabel, { color: theme.heroMuted }]}>Monthly Net Income</Text>
            <Text style={[styles.heroAmount, { color: theme.heroText }]}>
              {currency(parseFloat(activeMonth.monthlyLimit), preferences.currencyCode)}
            </Text>
            <Text style={[styles.heroSubtext, { color: theme.heroMuted }]}>
              100% allocated
            </Text>
          </View>
        </View>

        {/* Allocation Overview */}
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.overviewLabel, { color: theme.textMuted }]}>Planned</Text>
            <Text style={[styles.overviewValue, { color: theme.text }]}>
              {currency(totalPlanned, preferences.currencyCode)}
            </Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.overviewLabel, { color: theme.textMuted }]}>Spent</Text>
            <Text style={[styles.overviewValue, { color: theme.text }]}>
              {currency(totalSpent, preferences.currencyCode)}
            </Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.overviewLabel, { color: theme.textMuted }]}>Remaining</Text>
            <Text style={[styles.overviewValue, { color: theme.accent }]}>
              {currency(Math.max(0, remaining), preferences.currencyCode)}
            </Text>
          </View>
        </View>

        {/* Spending Progress */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending Progress</Text>
            <Pressable onPress={() => onNavigate('Budget', { monthId: currentMonthId })}>
              <Text style={[styles.link, { color: theme.accent }]}>Edit →</Text>
            </Pressable>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(allocatedPercent, 100)}%`,
                  backgroundColor: allocatedPercent > 100 ? theme.progressAlert : theme.progressGood,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.textMuted }]}>
            {allocatedPercent.toFixed(0)}% of budget allocated
          </Text>
        </View>

        {/* Top Categories */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Breakdown</Text>
          {summaries.slice(0, 5).map((summary) => (
            <View key={summary.category.id} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: theme.text }]}>
                  {summary.category.name}
                </Text>
                <Text style={[styles.categorySpent, { color: theme.textMuted }]}>
                  {currency(summary.spent, preferences.currencyCode)} of{' '}
                  {currency(summary.category.planned, preferences.currencyCode)}
                </Text>
              </View>
              <Text
                style={[
                  styles.categoryPercent,
                  {
                    color:
                      summary.ratio > 1
                        ? theme.progressAlert
                        : summary.ratio > 0.8
                          ? theme.progressWarning
                          : theme.progressGood,
                  },
                ]}
              >
                {(summary.ratio * 100).toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Savings Goals Preview */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Savings Goals</Text>
            <Pressable onPress={() => onNavigate('Goals')}>
              <Text style={[styles.link, { color: theme.accent }]}>All →</Text>
            </Pressable>
          </View>

          {goals.slice(0, 3).map((goal) => (
            <View key={goal.id} style={styles.goalRow}>
              <View style={styles.goalInfo}>
                <Text style={[styles.goalName, { color: theme.text }]}>{goal.name}</Text>
                <View style={styles.goalProgressBar}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${Math.min((goal.saved / goal.target) * 100, 100)}%`,
                        backgroundColor: theme.progressGood,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={[styles.goalAmount, { color: theme.textMuted }]}>
                {currency(goal.saved, preferences.currencyCode)}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.accent }]}
            onPress={() => onNavigate('AddTransaction')}
          >
            <Text style={[styles.actionButtonText, { color: theme.accentText }]}>+ Add Transaction</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.surfaceTint }]}
            onPress={() => onNavigate('Transactions', { monthId: currentMonthId })}
          >
            <Text style={[styles.actionButtonText, { color: theme.text }]}>View Transactions</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 8,
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
    fontSize: 17,
    fontWeight: '700',
    minWidth: 120,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  hero: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -1,
  },
  heroSubtext: {
    fontSize: 13,
    fontWeight: '600',
  },
  overviewGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 16,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  link: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  categorySpent: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryPercent: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalAmount: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 16,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
