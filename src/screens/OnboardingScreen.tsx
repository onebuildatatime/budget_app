import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBudgetStore } from '../store/useBudgetStore';
import { getMonthId } from '../../budgetModel';
import { parseBackup } from '../logic/backup';
import { pickTextFile } from '../logic/files';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, Button } from '../ui/primitives';
import { BudgetWizard, guessCurrency } from './BudgetWizard';

export function OnboardingScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const startWith = useBudgetStore((s) => s.startWith);
  const restoreBackup = useBudgetStore((s) => s.restoreBackup);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const restore = async () => {
    setError(null);
    try {
      const text = await pickTextFile();
      if (text === null) return;
      restoreBackup(parseBackup(text));
      triggerHaptic('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That file could not be restored.');
    }
  };

  if (creating) {
    return (
      <Screen style={{ paddingBottom: Math.max(insets.bottom, space.lg) }}>
        <BudgetWizard
          monthId={getMonthId(new Date())}
          defaultCurrency={guessCurrency()}
          defaultName="Personal"
          onCancel={() => setCreating(false)}
          onCreate={(result) => {
            startWith(result, []);
            triggerHaptic('success');
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={{ paddingBottom: Math.max(insets.bottom, space.lg) }}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: p.accent }]}>
          <Feather name="pie-chart" size={36} color={p.onAccent} />
        </View>
        <Text style={[t.title, { color: p.text, fontSize: 32, textAlign: 'center' }]}>Budget Buddy</Text>
        <Text style={[t.body, { color: p.textSecondary, textAlign: 'center', marginTop: space.md }]}>
          Give every euro, dollar or yen a job. Plan your month, track spending in a few taps, and save for what
          matters.
        </Text>
        <View style={styles.points}>
          <Point icon="sliders" text="Start from the 50/30/20 rule or your own categories" />
          <Point icon="map" text="Separate budgets for trips and events" />
          <Point icon="lock" text="Your data stays on your phone" />
        </View>
      </View>
      <View style={styles.actions}>
        {error && <Text style={[t.caption, { color: p.negative, textAlign: 'center' }]}>{error}</Text>}
        <Button label="Create my first budget" onPress={() => setCreating(true)} />
        <Button label="Restore from a backup" variant="secondary" onPress={restore} />
      </View>
    </Screen>
  );
}

function Point({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const p = usePalette();
  return (
    <View style={styles.point}>
      <Feather name={icon} size={18} color={p.accent} />
      <Text style={[t.body, { color: p.text, flex: 1 }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', paddingHorizontal: space.xxl },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: space.xl,
  },
  points: { marginTop: space.xxl, gap: space.lg },
  point: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  actions: { paddingHorizontal: space.xl, gap: space.sm },
});
