import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTheme } from '../hooks/useTheme';
import { FloatingNav } from '../components/FloatingNav';
import { MenuNav } from '../components/MenuNav';

import {
  getMonthId,
  buildIsoDateForMonth,
  createId,
  currency,
  getMonthLabel,
} from '../../budgetModel';
import type { Transaction } from '../../budgetModel';

export function AddTransactionScreen({
  currentScreen,
  onNavigate,
}: {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}) {
  const theme = useTheme();
  const { months, accounts, preferences, updateState } = useBudgetStore();
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(months[0]?.categories[0]);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

  const currentMonthId = getMonthId(date);
  const activeMonth = months.find((m) => m.id === currentMonthId);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleAddTransaction = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (transactionType === 'expense' && !selectedCategory) {
      Alert.alert('No category', 'Please select a category for this expense.');
      return;
    }

    const transaction: Transaction = {
      id: createId('txn'),
      kind: transactionType,
      categoryId: transactionType === 'expense' ? selectedCategory!.id : '__income__',
      accountId: selectedAccount?.id,
      amount: parseFloat(amount),
      note,
      happenedAt: buildIsoDateForMonth(currentMonthId, date.getDate()),
      recurring: false,
    };

    // Add to active month
    if (activeMonth) {
      const updatedMonth = {
        ...activeMonth,
        transactions: [...activeMonth.transactions, transaction],
        updatedAt: Date.now(),
      };

      updateState({
        months: months.map((m) => (m.id === activeMonth.id ? updatedMonth : m)),
      });

      Alert.alert('Transaction added', `Added ${currency(transaction.amount, preferences.currencyCode)} to ${selectedCategory?.name}.`, [
        {
          text: 'Add another',
          onPress: () => {
            setAmount('');
            setNote('');
          },
        },
        { text: 'Done', onPress: () => onNavigate('Dashboard') },
      ]);
    }
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Transaction</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Transaction Type Selector */}
          <View style={styles.typeSelector}>
            <Pressable
              style={[
                styles.typeButton,
                {
                  backgroundColor: transactionType === 'expense' ? theme.accent : theme.surface,
                },
              ]}
              onPress={() => setTransactionType('expense')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color: transactionType === 'expense' ? theme.accentText : theme.text,
                  },
                ]}
              >
                Expense
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                {
                  backgroundColor: transactionType === 'income' ? theme.accent : theme.surface,
                },
              ]}
              onPress={() => setTransactionType('income')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  {
                    color: transactionType === 'income' ? theme.accentText : theme.text,
                  },
                ]}
              >
                Income
              </Text>
            </Pressable>
          </View>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
            <View
              style={[
                styles.amountInput,
                { backgroundColor: theme.surface, borderColor: theme.divider },
              ]}
            >
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="0"
                placeholderTextColor={theme.placeholder}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
              <Text style={[styles.currency, { color: theme.textMuted }]}>€</Text>
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Date</Text>
            <Pressable
              style={[styles.field, { backgroundColor: theme.surface }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.fieldValue, { color: theme.text }]}>
                {date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Text style={[styles.fieldIcon, { color: theme.textMuted }]}>📅</Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Category Selector */}
          {transactionType === 'expense' && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Category</Text>
              <Pressable
                style={[styles.field, { backgroundColor: theme.surface }]}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={[styles.fieldValue, { color: theme.text }]}>
                  {selectedCategory?.name || 'Select category'}
                </Text>
                <Text style={[styles.fieldIcon, { color: theme.textMuted }]}>▼</Text>
              </Pressable>
            </View>
          )}

          {/* Account Selector */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Account</Text>
            <Pressable
              style={[styles.field, { backgroundColor: theme.surface }]}
              onPress={() => setShowAccountPicker(true)}
            >
              <Text style={[styles.fieldValue, { color: theme.text }]}>
                {selectedAccount?.name || 'Select account'}
              </Text>
              <Text style={[styles.fieldIcon, { color: theme.textMuted }]}>▼</Text>
            </Pressable>
          </View>

          {/* Note Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Note (optional)</Text>
            <TextInput
              style={[styles.noteInput, { backgroundColor: theme.surface, color: theme.text }]}
              placeholder="Add a note..."
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={3}
              value={note}
              onChangeText={setNote}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Action Button */}
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.accent }]}
            onPress={handleAddTransaction}
          >
            <Text style={[styles.addButtonText, { color: theme.accentText }]}>
              Add {transactionType === 'expense' ? 'Expense' : 'Income'}
            </Text>
          </Pressable>
        </View>

        {/* Category Picker Modal */}
        <Modal visible={showCategoryPicker} transparent animationType="slide">
          <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
              <Pressable onPress={() => setShowCategoryPicker(false)}>
                <Text style={[styles.modalClose, { color: theme.accent }]}>Done</Text>
              </Pressable>
            </View>
            <FlatList
              data={months[0]?.categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalItem,
                    selectedCategory?.id === item.id && {
                      backgroundColor: theme.accentSoft,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      { color: selectedCategory?.id === item.id ? theme.accent : theme.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Account Picker Modal */}
        <Modal visible={showAccountPicker} transparent animationType="slide">
          <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Account</Text>
              <Pressable onPress={() => setShowAccountPicker(false)}>
                <Text style={[styles.modalClose, { color: theme.accent }]}>Done</Text>
              </Pressable>
            </View>
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalItem,
                    selectedAccount?.id === item.id && {
                      backgroundColor: theme.accentSoft,
                    },
                  ]}
                  onPress={() => {
                    setSelectedAccount(item);
                    setShowAccountPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      { color: selectedAccount?.id === item.id ? theme.accent : theme.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              )}
            />
          </SafeAreaView>
        </Modal>
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
  typeSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    paddingVertical: 14,
  },
  currency: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 6,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  fieldIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  noteInput: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  addButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
