import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createId, currency, type Category, type CategoryBucket, type ThemeId } from '../../budgetModel';
import { useBudgetStore, useActiveBook } from '../store/useBudgetStore';
import { usePalette, type as t, space } from '../ui/theme';
import { Sheet } from '../ui/Sheet';
import { Segmented, Button, Chip } from '../ui/primitives';

export type DraftSub = { key: string; name: string; amount: string; goalId?: string };
export type DraftCategory = {
  id: string;
  name: string;
  bucket: CategoryBucket;
  planned: string;
  subs: DraftSub[];
  themeId: ThemeId;
  recurring: boolean;
  goalId?: string;
  isNew?: boolean;
};

export const toAmount = (value: string) => {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

export const cleanAmountInput = (value: string) => value.replace(/[^0-9.,]/g, '');

const formatAmount = (n: number) => (n ? String(n) : '');

export function toDraft(c: Category): DraftCategory {
  return {
    id: c.id,
    name: c.name,
    bucket: c.bucket,
    planned: formatAmount(c.planned),
    subs: c.subcategories.map((name) => ({
      key: createId('sub'),
      name,
      amount: formatAmount(c.subcategoryBudgets?.[name] ?? 0),
      goalId: c.subcategoryGoals?.[name],
    })),
    themeId: c.themeId,
    recurring: c.recurring,
    goalId: c.goalId,
  };
}

export function fromDraft(d: DraftCategory): Category {
  const subs = d.subs
    .map((s) => ({ name: s.name.trim(), amount: toAmount(s.amount), goalId: s.goalId }))
    .filter((s, i, all) => s.name && all.findIndex((x) => x.name === s.name) === i);
  return {
    id: d.id,
    name: d.name.trim(),
    planned: toAmount(d.planned),
    subcategories: subs.map((s) => s.name),
    subcategoryBudgets: Object.fromEntries(subs.filter((s) => s.amount > 0).map((s) => [s.name, s.amount])),
    ...(d.goalId ? { goalId: d.goalId } : {}),
    ...(subs.some((s) => s.goalId)
      ? { subcategoryGoals: Object.fromEntries(subs.filter((s) => s.goalId).map((s) => [s.name, s.goalId!])) }
      : {}),
    bucket: d.bucket,
    themeId: d.themeId,
    recurring: d.recurring,
  };
}

const buckets: { value: CategoryBucket; label: string }[] = [
  { value: 'needs', label: 'Needs' },
  { value: 'wants', label: 'Wants' },
  { value: 'savings', label: 'Savings' },
];

export function CategorySheet({
  category,
  currencyCode,
  onSave,
  onDelete,
  onClose,
}: {
  category: DraftCategory | null;
  currencyCode: string;
  onSave: (category: DraftCategory) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const p = usePalette();
  const [draft, setDraft] = useState<DraftCategory | null>(category);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [linkingSub, setLinkingSub] = useState<string | null>(null);
  const goals = useBudgetStore((s) => s.goals);
  const isTrip = useActiveBook()?.kind === 'trip';
  const goalName = (id?: string) => goals.find((g) => g.id === id)?.name;

  useEffect(() => {
    setDraft(category);
    setConfirmDelete(false);
  }, [category]);

  if (!draft) return <Sheet visible={false} onClose={onClose}>{null}</Sheet>;

  const update = (patch: Partial<DraftCategory>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const updateSub = (key: string, patch: Partial<DraftSub>) =>
    update({ subs: draft.subs.map((s) => (s.key === key ? { ...s, ...patch } : s)) });

  const split = draft.subs.reduce((sum, s) => sum + toAmount(s.amount), 0);
  const planned = toAmount(draft.planned);
  const canSave = draft.name.trim().length > 0;

  return (
    <Sheet visible={!!category} onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[t.title, { color: p.text }]}>{draft.isNew ? 'New category' : 'Edit category'}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Feather name="x" size={22} color={p.textSecondary} />
          </Pressable>
        </View>

        <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Name</Text>
        <TextInput
          value={draft.name}
          onChangeText={(name) => update({ name })}
          placeholder="e.g. Groceries"
          placeholderTextColor={p.textTertiary}
          autoFocus={draft.isNew}
          style={[t.body, styles.field, { color: p.text, backgroundColor: p.fill }]}
        />

        {!isTrip && (
          <>
            <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Type</Text>
            <Segmented options={buckets} value={draft.bucket} onChange={(bucket) => update({ bucket })} />
          </>
        )}

        <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Monthly budget</Text>
        <TextInput
          value={draft.planned}
          onChangeText={(v) => update({ planned: cleanAmountInput(v) })}
          placeholder="0"
          placeholderTextColor={p.textTertiary}
          keyboardType="decimal-pad"
          style={[t.amount, styles.field, { color: p.text, backgroundColor: p.fill }]}
        />

        <View style={[styles.label, styles.subHeader]}>
          <Text style={[t.overline, { color: p.textSecondary }]}>Subcategories</Text>
          {split > 0 && (
            <Text style={[t.caption, { color: split > planned ? p.negative : p.textSecondary }]}>
              {currency(split, currencyCode)} of {currency(planned, currencyCode)} split
            </Text>
          )}
        </View>
        {draft.subs.map((s) => (
          <View key={s.key}>
          <View style={styles.subRow}>
            <TextInput
              value={s.name}
              onChangeText={(name) => updateSub(s.key, { name })}
              placeholder="Name"
              placeholderTextColor={p.textTertiary}
              style={[t.body, styles.field, { flex: 1, color: p.text, backgroundColor: p.fill }]}
            />
            <TextInput
              value={s.amount}
              onChangeText={(v) => updateSub(s.key, { amount: cleanAmountInput(v) })}
              placeholder="Amount"
              placeholderTextColor={p.textTertiary}
              keyboardType="decimal-pad"
              style={[t.amount, styles.field, styles.subAmount, { color: p.text, backgroundColor: p.fill }]}
            />
            <Pressable
              onPress={() => update({ subs: draft.subs.filter((x) => x.key !== s.key) })}
              hitSlop={8}
              accessibilityLabel={`Remove ${s.name || 'subcategory'}`}
            >
              <Feather name="minus-circle" size={20} color={p.negative} />
            </Pressable>
          </View>
          {goals.length > 0 && (
            <Pressable
              onPress={() => setLinkingSub(linkingSub === s.key ? null : s.key)}
              style={styles.subGoal}
              accessibilityLabel={`Link ${s.name || 'subcategory'} to a goal`}
            >
              <Feather name="target" size={13} color={s.goalId ? p.accent : p.textTertiary} />
              <Text style={[t.caption, { color: s.goalId ? p.accent : p.textTertiary }]}>
                {s.goalId ? `Pays into ${goalName(s.goalId) ?? 'a goal'}` : 'Link to a goal'}
              </Text>
            </Pressable>
          )}
          {linkingSub === s.key && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalChips}>
              <Chip label="None" variant="subtle" selected={!s.goalId} onPress={() => updateSub(s.key, { goalId: undefined })} />
              {goals.map((g) => (
                <Chip
                  key={g.id}
                  label={g.name}
                  variant="subtle"
                  selected={s.goalId === g.id}
                  onPress={() => {
                    updateSub(s.key, { goalId: g.id });
                    setLinkingSub(null);
                  }}
                />
              ))}
            </ScrollView>
          )}
          </View>
        ))}
        <Pressable
          onPress={() => update({ subs: [...draft.subs, { key: createId('sub'), name: '', amount: '' }] })}
          style={styles.addSub}
        >
          <Feather name="plus-circle" size={20} color={p.accent} />
          <Text style={[t.body, { color: p.accent }]}>Add subcategory</Text>
        </Pressable>
        <Text style={[t.caption, { color: p.textTertiary }]}>Subcategory amounts are optional.</Text>

        {goals.length > 0 && (
          <>
            <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Pays into a goal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalChips}>
              <Chip label="None" selected={!draft.goalId} onPress={() => update({ goalId: undefined })} />
              {goals.map((g) => (
                <Chip key={g.id} label={g.name} selected={draft.goalId === g.id} onPress={() => update({ goalId: g.id })} />
              ))}
            </ScrollView>
            <Text style={[t.caption, { color: p.textTertiary, marginTop: space.xs }]}>
              Money you log here from now on is added to the goal automatically. A subcategory's own link takes
              priority.
            </Text>
          </>
        )}

        <View style={styles.actions}>
          <Button label={draft.isNew ? 'Add category' : 'Done'} onPress={() => onSave(draft)} disabled={!canSave} />
          {!draft.isNew && (
            <Pressable
              onPress={() => (confirmDelete ? onDelete(draft.id) : setConfirmDelete(true))}
              style={styles.delete}
            >
              <Text style={[t.bodyStrong, { color: p.negative }]}>
                {confirmDelete ? 'Tap again to delete' : 'Delete category'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.xl, paddingBottom: space.md },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  label: { marginTop: space.lg, marginBottom: space.sm },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  field: {
    borderRadius: 10,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  subAmount: { width: 96, textAlign: 'right' },
  subGoal: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -2, marginBottom: space.sm, marginLeft: 2 },
  goalChips: { gap: space.sm, paddingBottom: space.sm },
  addSub: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  actions: { marginTop: space.xl, gap: space.sm },
  delete: { alignItems: 'center', paddingVertical: space.md },
});
