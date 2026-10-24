import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useBudgetStore } from '../store/useBudgetStore';
import { useTheme } from '../hooks/useTheme';
import { FloatingNav } from '../components/FloatingNav';
import { MenuNav } from '../components/MenuNav';

import { currency } from '../../budgetModel';
import type { Goal } from '../../budgetModel';

export function GoalsScreen({
  currentScreen,
  onNavigate,
}: {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}) {
  const theme = useTheme();
  const { goals, preferences, updateState } = useBudgetStore();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');

  const sortedGoals = [...goals].sort((a, b) => {
    const progressA = a.target > 0 ? (a.saved / a.target) * 100 : 0;
    const progressB = b.target > 0 ? (b.saved / b.target) * 100 : 0;
    return progressA - progressB;
  });

  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleAddContribution = () => {
    if (!selectedGoal || !contributionAmount || parseFloat(contributionAmount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid contribution amount.');
      return;
    }

    const amount = parseFloat(contributionAmount);
    const updatedGoal: Goal = {
      ...selectedGoal,
      saved: selectedGoal.saved + amount,
    };

    updateState({
      goals: goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)),
    });

    setContributionAmount('');
    setShowModal(false);
    Alert.alert(
      'Added',
      `Added ${currency(amount, preferences.currencyCode)} to ${selectedGoal.name}`
    );
  };

  const handleWithdraw = () => {
    if (!selectedGoal || !contributionAmount || parseFloat(contributionAmount) <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    const amount = parseFloat(contributionAmount);
    if (selectedGoal.saved < amount) {
      Alert.alert('Insufficient balance', `You only have ${currency(selectedGoal.saved, preferences.currencyCode)} saved.`);
      return;
    }

    const updatedGoal: Goal = {
      ...selectedGoal,
      saved: Math.max(0, selectedGoal.saved - amount),
    };

    updateState({
      goals: goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)),
    });

    setContributionAmount('');
    setShowModal(false);
    Alert.alert(
      'Withdrawn',
      `Withdrew ${currency(amount, preferences.currencyCode)} from ${selectedGoal.name}`
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => onNavigate('Dashboard')}>
          <Text style={[styles.backButton, { color: theme.accent }]}>← Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Savings Goals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Overall Progress */}
        <View style={[styles.overallCard, { backgroundColor: theme.hero }]}>
          <Text style={[styles.overallLabel, { color: theme.heroMuted }]}>Total Progress</Text>
          <Text style={[styles.overallAmount, { color: theme.heroText }]}>
            {currency(totalSaved, preferences.currencyCode)}
          </Text>
          <Text style={[styles.overallTarget, { color: theme.heroMuted }]}>
            of {currency(totalTarget, preferences.currencyCode)}
          </Text>

          <View style={[styles.overallProgressBar, { backgroundColor: theme.heroPanelSoft }]}>
            <View
              style={[
                styles.overallProgressFill,
                {
                  width: `${Math.min(overallProgress, 100)}%`,
                  backgroundColor: theme.progressGood,
                },
              ]}
            />
          </View>

          <Text style={[styles.overallPercent, { color: theme.heroText }]}>
            {overallProgress.toFixed(0)}% complete
          </Text>
        </View>

        {/* Goals List */}
        <View style={styles.listContainer}>
          {sortedGoals.map((goal) => {
            const progress = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
            const remaining = Math.max(0, goal.target - goal.saved);

            return (
              <Pressable
                key={goal.id}
                style={[styles.goalCard, { backgroundColor: theme.surface }]}
                onPress={() => {
                  setSelectedGoal(goal);
                  setShowModal(true);
                }}
              >
                <View style={styles.goalHeader}>
                  <Text style={[styles.goalName, { color: theme.text }]}>{goal.name}</Text>
                  <Text style={[styles.goalStatus, { color: theme.textMuted }]}>
                    {progress >= 100 ? '✓ Complete' : `${progress.toFixed(0)}%`}
                  </Text>
                </View>

                <View style={styles.goalProgressBar}>
                  <View
                    style={[
                      styles.goalProgressFill,
                      {
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor:
                          progress >= 100 ? theme.progressGood : theme.progressWarning,
                      },
                    ]}
                  />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={[styles.goalAmount, { color: theme.text }]}>
                    {currency(goal.saved, preferences.currencyCode)}
                  </Text>
                  <Text style={[styles.goalRemaining, { color: theme.textMuted }]}>
                    {remaining > 0
                      ? `${currency(remaining, preferences.currencyCode)} remaining`
                      : 'Target reached'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Contribution Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <SafeAreaView style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedGoal?.name}
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Text style={[styles.modalClose, { color: theme.accent }]}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: theme.textMuted }]}>
                Current: {currency(selectedGoal?.saved ?? 0, preferences.currencyCode)}
              </Text>

              <View
                style={[
                  styles.modalInput,
                  { backgroundColor: theme.surface, borderColor: theme.divider },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.placeholder}
                  keyboardType="decimal-pad"
                  value={contributionAmount}
                  onChangeText={setContributionAmount}
                />
                <Text style={[styles.currency, { color: theme.textMuted }]}>€</Text>
              </View>

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: theme.accent }]}
                  onPress={handleAddContribution}
                >
                  <Text style={[styles.modalButtonText, { color: theme.accentText }]}>
                    Add Contribution
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, { backgroundColor: theme.surfaceMuted }]}
                  onPress={handleWithdraw}
                >
                  <Text style={[styles.modalButtonText, { color: theme.text }]}>
                    Withdraw
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  overallCard: {
    marginHorizontal: 16,
    marginBottom: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  overallLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  overallAmount: {
    fontSize: 38,
    fontWeight: '800',
    marginBottom: 4,
  },
  overallTarget: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 14,
  },
  overallProgressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  overallProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  overallPercent: {
    fontSize: 15,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },
  goalCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  goalStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalProgressBar: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  goalRemaining: {
    fontSize: 12,
    fontWeight: '600',
  },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalClose: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalBody: {
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  modalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
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
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
