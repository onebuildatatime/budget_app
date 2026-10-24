import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  SafeAreaView,
  useWindowDimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTheme } from '../hooks/useTheme';
import { FloatingNav } from '../components/FloatingNav';
import { MenuNav } from '../components/MenuNav';

import {
  getTotalPlanned,
  getTotalSpent,
  currency,
  getMonthLabel,
  ensureCurrentMonth,
} from '../../budgetModel';
import type { Category, MonthRecord } from '../../budgetModel';

export function BudgetEditorScreen({
  currentScreen,
  route,
  onNavigate,
}: {
  currentScreen: string;
  route: { params?: { monthId?: string } };
  onNavigate: (screen: string) => void;
}) {
  const theme = useTheme();
  const { months, preferences, updateState } = useBudgetStore();
  const monthId = route.params?.monthId;
  const activeMonth = months.find((m) => m.id === monthId);

  const [editedCategories, setEditedCategories] = useState<Map<string, number>>(
    new Map(activeMonth?.categories.map((c) => [c.id, c.planned]) ?? [])
  );

  if (!activeMonth) return null;

  const totalPlanned = Array.from(editedCategories.values()).reduce((a, b) => a + b, 0);
  const limit = parseFloat(activeMonth.monthlyLimit);
  const difference = limit - totalPlanned;
  const isBalanced = Math.abs(difference) < 0.01;

  const handleCategoryChange = (categoryId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setEditedCategories((map) => new Map(map).set(categoryId, Math.max(0, num)));
  };

  const handleSave = () => {
    if (!isBalanced) {
      Alert.alert(
        'Unbalanced Budget',
        `Your allocations differ from your income by ${currency(Math.abs(difference), preferences.currencyCode)}. Adjust categories to 100% allocation.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const updatedMonth: MonthRecord = {
      ...activeMonth,
      categories: activeMonth.categories.map((cat) => ({
        ...cat,
        planned: editedCategories.get(cat.id) ?? cat.planned,
      })),
      updatedAt: Date.now(),
    };

    const nextState = ensureCurrentMonth(
      {
        ...useBudgetStore.getState(),
        months: months.map((m) => (m.id === activeMonth.id ? updatedMonth : m)),
      },
      new Date()
    );

    updateState({
      months: nextState.months,
      activeMonthId: nextState.activeMonthId,
    });

    Alert.alert('Saved', 'Your budget has been updated.', [
      { text: 'OK', onPress: () => onNavigate('Dashboard') },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => onNavigate('Dashboard')}>
            <Text style={[styles.backButton, { color: theme.accent }]}>← Back</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {getMonthLabel(activeMonth.id, 'en-US')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Summary */}
          <View style={[styles.summary, { backgroundColor: theme.hero }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.heroMuted }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: theme.heroText }]}>
                {currency(limit, preferences.currencyCode)}
              </Text>
            </View>
            <View
              style={[
                styles.summaryRow,
                {
                  borderTopWidth: 1,
                  borderTopColor: theme.heroShadow,
                  paddingTop: 8,
                },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: theme.heroMuted }]}>Allocated</Text>
              <Text style={[styles.summaryValue, { color: theme.heroText }]}>
                {currency(totalPlanned, preferences.currencyCode)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.heroMuted }]}>
                {difference > 0 ? 'Remaining' : 'Over'}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color: isBalanced ? theme.heroStatusGoodText : theme.heroStatusAlertText,
                  },
                ]}
              >
                {currency(Math.abs(difference), preferences.currencyCode)}
              </Text>
            </View>
          </View>

          {/* Categories */}
          {activeMonth.categories.map((category) => (
            <View key={category.id} style={styles.categoryGroup}>
              <Text style={[styles.categoryGroupTitle, { color: theme.text }]}>
                {category.name}
              </Text>

              <View style={[styles.categoryInput, { backgroundColor: theme.surface }]}>
                <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Budget</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="0"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="decimal-pad"
                    value={String(editedCategories.get(category.id) ?? category.planned)}
                    onChangeText={(value) => handleCategoryChange(category.id, value)}
                  />
                  <Text style={[styles.currency, { color: theme.textMuted }]}>€</Text>
                </View>
              </View>

              {category.subcategories.length > 0 && (
                <View style={[styles.subcategoryList, { backgroundColor: theme.surfaceSoft }]}>
                  {category.subcategories.map((subcategory, idx) => (
                    <Text
                      key={idx}
                      style={[
                        styles.subcategory,
                        { color: theme.textMuted },
                        idx < category.subcategories.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: theme.divider,
                        },
                      ]}
                    >
                      • {subcategory}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
          <Pressable
            style={[
              styles.saveButton,
              {
                backgroundColor: isBalanced ? theme.accent : theme.surfaceMuted,
              },
            ]}
            onPress={handleSave}
            disabled={!isBalanced}
          >
            <Text
              style={[
                styles.saveButtonText,
                {
                  color: isBalanced ? theme.accentText : theme.textMuted,
                },
              ]}
            >
              {isBalanced ? 'Save Budget' : 'Balance to 100%'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingVertical: 18,
    paddingBottom: 100,
  },
  summary: {
    marginHorizontal: 16,
    marginVertical: 14,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  categoryGroup: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  categoryGroupTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  categoryInput: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    paddingVertical: 6,
  },
  currency: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  subcategoryList: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  subcategory: {
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
