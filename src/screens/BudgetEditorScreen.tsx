import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBudgetStore } from '../store/useBudgetStore';
import {
  categoryBucketOrder,
  createId,
  currency,
  inferThemeId,
  type CategoryBucket,
} from '../../budgetModel';
import { bucketTargets, buildTemplateCategories } from '../budgetTemplate';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, Header, SectionLabel, Divider, Button } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';
import {
  CategorySheet,
  cleanAmountInput,
  fromDraft,
  toAmount,
  toDraft,
  type DraftCategory,
} from './CategorySheet';
import { TemplateSheet } from './TemplateSheet';

const bucketLabel: Record<CategoryBucket, string> = { needs: 'Needs', wants: 'Wants', savings: 'Savings' };

const snapshot = (income: number, cats: DraftCategory[]) => JSON.stringify({ income, cats: cats.map(fromDraft) });

export function BudgetEditorScreen({ monthId, onBack }: { monthId: string; onBack: () => void }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const months = useBudgetStore((s) => s.months);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const updateState = useBudgetStore((s) => s.updateState);
  const month = months.find((m) => m.id === monthId);

  const [income, setIncome] = useState(() => month?.monthlyLimit ?? '');
  const [cats, setCats] = useState<DraftCategory[]>(() => month?.categories.map(toDraft) ?? []);
  const [original] = useState(() => snapshot(toAmount(month?.monthlyLimit ?? ''), month?.categories.map(toDraft) ?? []));
  const [editing, setEditing] = useState<DraftCategory | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  if (!month) return null;

  const incomeValue = toAmount(income);
  const assigned = cats.reduce((sum, c) => sum + toAmount(c.planned), 0);
  const diff = Math.round((incomeValue - assigned) * 100) / 100;
  const dirty = snapshot(incomeValue, cats) !== original;

  const back = () => (dirty ? setDiscardOpen(true) : onBack());

  const save = () => {
    updateState({
      months: months.map((m) =>
        m.id === month.id
          ? { ...m, monthlyLimit: String(incomeValue), categories: cats.map(fromDraft), updatedAt: Date.now() }
          : m,
      ),
    });
    triggerHaptic('success');
    onBack();
  };

  const newCategory = (bucket: CategoryBucket) =>
    setEditing({
      id: createId('cat'),
      name: '',
      bucket,
      planned: '',
      subs: [],
      themeId: inferThemeId('', cats.length),
      recurring: false,
      isNew: true,
    });

  const saveCategory = (draft: DraftCategory) => {
    const { isNew, ...rest } = draft;
    const cleaned = toDraft(fromDraft(rest));
    setCats((current) => (isNew ? [...current, cleaned] : current.map((c) => (c.id === draft.id ? cleaned : c))));
    setEditing(null);
  };

  const applyTemplate = (value: number) => {
    setIncome(String(value));
    setCats(buildTemplateCategories(value).map(toDraft));
    setTemplateOpen(false);
    triggerHaptic('success');
  };

  return (
    <Screen>
      <Header
        title="Budget"
        onBack={back}
        right={
          <Pressable onPress={() => setTemplateOpen(true)} hitSlop={10}>
            <Text style={[t.caption, { color: p.accent, fontWeight: '600' }]}>50/30/20</Text>
          </Pressable>
        }
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: space.xl }}>
          <View style={styles.incomeRow}>
            <Text style={[t.body, { color: p.text, flex: 1 }]}>Monthly income</Text>
            <TextInput
              value={income}
              onChangeText={(v) => setIncome(cleanAmountInput(v))}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={[t.amount, styles.input, { color: p.text, backgroundColor: p.fill }]}
            />
          </View>

          <View style={styles.summary}>
            <Text style={[t.caption, { color: p.textSecondary }]}>
              {diff === 0 ? 'Fully assigned' : diff > 0 ? 'Left to assign' : 'Over-assigned by'}
            </Text>
            <Text
              style={[
                t.display,
                { color: diff === 0 ? p.positive : diff > 0 ? p.text : p.negative, marginTop: space.xs },
              ]}
            >
              {currency(Math.abs(diff), currencyCode)}
            </Text>
            <Text style={[t.caption, { color: p.textSecondary, marginTop: space.sm }]}>
              {currency(assigned, currencyCode)} of {currency(incomeValue, currencyCode)} assigned
            </Text>
          </View>

          {categoryBucketOrder.map((bucket) => {
            const inBucket = cats.filter((c) => c.bucket === bucket);
            const total = inBucket.reduce((sum, c) => sum + toAmount(c.planned), 0);
            const share = incomeValue > 0 ? Math.round((total / incomeValue) * 100) : 0;
            const target = bucketTargets[bucket] * 100;
            const offTarget = bucket === 'savings' ? share < target : share > target;
            return (
              <View key={bucket}>
                <SectionLabel
                  right={
                    <Text style={[t.caption, { color: p.textSecondary }]}>
                      {currency(total, currencyCode)} ·{' '}
                      <Text style={{ color: offTarget ? p.warning : p.textSecondary }}>{share}%</Text>
                      <Text style={{ color: p.textTertiary }}> of {target}%</Text>
                    </Text>
                  }
                >
                  {bucketLabel[bucket]}
                </SectionLabel>
                {inBucket.map((c) => (
                  <View key={c.id}>
                    <View style={styles.row}>
                      <Pressable onPress={() => setEditing(c)} style={styles.rowMain}>
                        <Text style={[t.body, { color: p.text }]} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={[t.caption, { color: p.textTertiary, marginTop: 2 }]} numberOfLines={1}>
                          {c.subs.length ? c.subs.map((s) => s.name).join(', ') : 'No subcategories'}
                        </Text>
                      </Pressable>
                      <TextInput
                        value={c.planned}
                        onChangeText={(v) =>
                          setCats((current) =>
                            current.map((x) => (x.id === c.id ? { ...x, planned: cleanAmountInput(v) } : x)),
                          )
                        }
                        placeholder="0"
                        placeholderTextColor={p.textTertiary}
                        keyboardType="decimal-pad"
                        selectTextOnFocus
                        style={[t.amount, styles.input, { color: p.text, backgroundColor: p.fill }]}
                      />
                      <Pressable onPress={() => setEditing(c)} hitSlop={8} accessibilityLabel={`Edit ${c.name}`}>
                        <Feather name="chevron-right" size={18} color={p.textTertiary} />
                      </Pressable>
                    </View>
                    <Divider inset={space.xl} />
                  </View>
                ))}
                <Pressable onPress={() => newCategory(bucket)} style={styles.addRow}>
                  <Feather name="plus" size={18} color={p.accent} />
                  <Text style={[t.body, { color: p.accent }]}>Add category</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: p.hairline, paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <Button label={dirty ? 'Save' : 'No changes'} onPress={save} disabled={!dirty || incomeValue <= 0} />
        </View>
      </KeyboardAvoidingView>

      <CategorySheet
        category={editing}
        currencyCode={currencyCode}
        onSave={saveCategory}
        onDelete={(id) => {
          setCats((current) => current.filter((c) => c.id !== id));
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />

      <TemplateSheet
        visible={templateOpen}
        initialIncome={income}
        currencyCode={currencyCode}
        existingCount={cats.length}
        onApply={applyTemplate}
        onClose={() => setTemplateOpen(false)}
      />

      <Sheet visible={discardOpen} onClose={() => setDiscardOpen(false)}>
        <View style={styles.discard}>
          <Text style={[t.title, { color: p.text }]}>Discard changes?</Text>
          <Text style={[t.caption, { color: p.textSecondary, marginTop: space.xs, marginBottom: space.xl }]}>
            Your budget edits haven't been saved.
          </Text>
          <View style={{ gap: space.sm }}>
            <Button label="Keep editing" onPress={() => setDiscardOpen(false)} />
            <Button
              label="Discard"
              variant="secondary"
              onPress={() => {
                setDiscardOpen(false);
                onBack();
              }}
            />
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  summary: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  rowMain: { flex: 1 },
  input: {
    width: 112,
    textAlign: 'right',
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 8,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  discard: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.md },
});
