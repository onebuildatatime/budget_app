import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import { compareMonthIds, createId, currency, inferThemeId, type Goal } from '../../budgetModel';
import { goalSources } from '../logic/goals';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, LargeTitle, ProgressBar, Button } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';
import { cleanAmountInput, toAmount } from './CategorySheet';

export function GoalsScreen() {
  const p = usePalette();
  const goals = useBudgetStore((s) => s.goals);
  const months = useBudgetStore((s) => s.months);
  const latest = [...months].sort((a, b) => compareMonthIds(b.id, a.id))[0];
  const sources = goalSources(latest?.categories ?? []);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const updateState = useBudgetStore((s) => s.updateState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formGoal, setFormGoal] = useState<Goal | 'new' | null>(null);
  const [amount, setAmount] = useState('');

  const selected = goals.find((g) => g.id === selectedId) ?? null;
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const parsed = toAmount(amount);

  const close = () => {
    setSelectedId(null);
    setAmount('');
  };

  const apply = (sign: 1 | -1) => {
    if (!selected || parsed <= 0) return;
    const saved = Math.max(0, Math.round((selected.saved + sign * parsed) * 100) / 100);
    updateState({ goals: goals.map((g) => (g.id === selected.id ? { ...g, saved } : g)) });
    triggerHaptic('success');
    close();
  };

  const saveGoal = (goal: Goal) => {
    const exists = goals.some((g) => g.id === goal.id);
    updateState({ goals: exists ? goals.map((g) => (g.id === goal.id ? goal : g)) : [...goals, goal] });
    triggerHaptic('success');
    setFormGoal(null);
  };

  const deleteGoal = (id: string) => {
    updateState({ goals: goals.filter((g) => g.id !== id) });
    setFormGoal(null);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }} showsVerticalScrollIndicator={false}>
        <LargeTitle
          right={
            <Pressable onPress={() => setFormGoal('new')} hitSlop={10} accessibilityLabel="New goal">
              <Feather name="plus" size={24} color={p.accent} />
            </Pressable>
          }
        >
          Goals
        </LargeTitle>

        {goals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[t.body, { color: p.textSecondary, textAlign: 'center', marginBottom: space.lg }]}>
              Save towards something: a trip, an emergency fund, a new laptop.
            </Text>
            <Button label="Create a goal" onPress={() => setFormGoal('new')} />
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <Text style={[t.caption, { color: p.textSecondary }]}>Total saved</Text>
              <Text style={[t.display, { color: p.text, marginVertical: space.xs }]}>
                {currency(totalSaved, currencyCode)}
              </Text>
              <View style={{ marginTop: space.md }}>
                <ProgressBar ratio={totalTarget ? totalSaved / totalTarget : 0} color={p.positive} height={6} />
              </View>
              <Text style={[t.caption, { color: p.textSecondary, marginTop: space.sm }]}>
                of {currency(totalTarget, currencyCode)} across {goals.length} {goals.length === 1 ? 'goal' : 'goals'}
              </Text>
            </View>

            <View style={{ marginTop: space.lg }}>
              {goals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  currencyCode={currencyCode}
                  fundedBy={sources.get(goal.id)}
                  onPress={() => setSelectedId(goal.id)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Sheet visible={!!selected} onClose={close}>
        {selected && (
          <View style={styles.sheet}>
            <View style={styles.titleRow}>
              <Text style={[t.title, { color: p.text, flex: 1 }]} numberOfLines={1}>
                {selected.name}
              </Text>
              <Pressable
                onPress={() => {
                  close();
                  setFormGoal(selected);
                }}
                hitSlop={10}
              >
                <Text style={[t.caption, { color: p.accent, fontWeight: '600' }]}>Edit goal</Text>
              </Pressable>
            </View>
            <Text style={[t.caption, { color: p.textSecondary, marginTop: space.xs }]}>
              {currency(selected.saved, currencyCode)} of {currency(selected.target, currencyCode)}
            </Text>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(cleanAmountInput(v))}
              placeholder="0"
              placeholderTextColor={p.textTertiary}
              keyboardType="decimal-pad"
              autoFocus
              style={[t.display, styles.input, { color: p.text, borderBottomColor: p.hairline }]}
            />
            <View style={{ gap: space.sm }}>
              <Button label="Add to goal" onPress={() => apply(1)} disabled={parsed <= 0} />
              <Button
                label="Withdraw"
                variant="secondary"
                onPress={() => apply(-1)}
                disabled={parsed <= 0 || parsed > selected.saved}
              />
            </View>
          </View>
        )}
      </Sheet>

      <GoalFormSheet
        goal={formGoal}
        index={goals.length}
        onSave={saveGoal}
        onDelete={deleteGoal}
        onClose={() => setFormGoal(null)}
      />
    </Screen>
  );
}

function GoalFormSheet({
  goal,
  index,
  onSave,
  onDelete,
  onClose,
}: {
  goal: Goal | 'new' | null;
  index: number;
  onSave: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const p = usePalette();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNew = goal === 'new';

  useEffect(() => {
    if (!goal) return;
    setConfirmDelete(false);
    setName(isNew ? '' : goal.name);
    setTarget(isNew ? '' : String(goal.target));
    setSaved(isNew ? '' : String(goal.saved));
  }, [goal, isNew]);

  const valid = name.trim().length > 0 && toAmount(target) > 0;

  const submit = () => {
    if (!valid || !goal) return;
    onSave({
      id: isNew ? createId('goal') : goal.id,
      name: name.trim(),
      target: toAmount(target),
      saved: toAmount(saved),
      themeId: isNew ? inferThemeId(name, index) : goal.themeId,
    });
  };

  return (
    <Sheet visible={!!goal} onClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.titleRow}>
          <Text style={[t.title, { color: p.text }]}>{isNew ? 'New goal' : 'Edit goal'}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Feather name="x" size={22} color={p.textSecondary} />
          </Pressable>
        </View>
        <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Summer trip"
          placeholderTextColor={p.textTertiary}
          autoFocus={isNew}
          style={[t.body, styles.field, { color: p.text, backgroundColor: p.fill }]}
        />
        <View style={styles.pair}>
          <View style={{ flex: 1 }}>
            <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Target</Text>
            <TextInput
              value={target}
              onChangeText={(v) => setTarget(cleanAmountInput(v))}
              placeholder="0"
              placeholderTextColor={p.textTertiary}
              keyboardType="decimal-pad"
              style={[t.amount, styles.field, { color: p.text, backgroundColor: p.fill }]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Saved so far</Text>
            <TextInput
              value={saved}
              onChangeText={(v) => setSaved(cleanAmountInput(v))}
              placeholder="0"
              placeholderTextColor={p.textTertiary}
              keyboardType="decimal-pad"
              style={[t.amount, styles.field, { color: p.text, backgroundColor: p.fill }]}
            />
          </View>
        </View>
        <View style={{ marginTop: space.xl }}>
          <Button label={isNew ? 'Create goal' : 'Save'} onPress={submit} disabled={!valid} />
        </View>
        {!isNew && goal && (
          <Pressable
            onPress={() => (confirmDelete ? onDelete(goal.id) : setConfirmDelete(true))}
            style={styles.delete}
          >
            <Text style={[t.bodyStrong, { color: p.negative }]}>
              {confirmDelete ? 'Tap again to delete' : 'Delete goal'}
            </Text>
          </Pressable>
        )}
      </View>
    </Sheet>
  );
}

function GoalRow({
  goal,
  currencyCode,
  fundedBy,
  onPress,
}: {
  goal: Goal;
  currencyCode: string;
  fundedBy?: string[];
  onPress: () => void;
}) {
  const p = usePalette();
  const ratio = goal.target > 0 ? goal.saved / goal.target : 0;
  const done = ratio >= 1;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: p.fill }]}>
      <View style={styles.rowLine}>
        <Text style={[t.body, { color: p.text, flex: 1 }]} numberOfLines={1}>
          {goal.name}
        </Text>
        <Text style={[t.amount, { color: p.text }]}>
          {currency(goal.saved, currencyCode)}
          <Text style={{ color: p.textTertiary }}> / {currency(goal.target, currencyCode)}</Text>
        </Text>
      </View>
      <ProgressBar ratio={ratio} color={done ? p.positive : p.accent} />
      <Text style={[t.caption, { color: done ? p.positive : p.textSecondary }]}>
        {done ? 'Reached' : `${Math.round(ratio * 100)}% · ${currency(goal.target - goal.saved, currencyCode)} to go`}
      </Text>
      {fundedBy && (
        <View style={styles.funded}>
          <Feather name="link" size={12} color={p.textTertiary} />
          <Text style={[t.caption, { color: p.textTertiary, flexShrink: 1 }]} numberOfLines={1}>
            Funded from {fundedBy.join(', ')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summary: { paddingHorizontal: space.xl, paddingTop: space.sm },
  empty: { paddingHorizontal: space.xl, paddingTop: space.xxl },
  row: { paddingHorizontal: space.xl, paddingVertical: space.md, gap: space.sm },
  rowLine: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  sheet: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  label: { marginTop: space.lg, marginBottom: space.sm },
  field: { borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.md },
  pair: { flexDirection: 'row', gap: space.md },
  input: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: space.md, marginVertical: space.xl },
  delete: { alignItems: 'center', paddingVertical: space.md },
  funded: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
