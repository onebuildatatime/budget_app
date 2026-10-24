import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore, getBudgetMonths, type BudgetBook } from '../store/useBudgetStore';
import {
  copyMonthBudget,
  createEmptyMonth,
  featuredCurrencyCodes,
  getMonthLabel,
  type MonthRecord,
} from '../../budgetModel';
import { buildTemplateCategories } from '../budgetTemplate';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Sheet } from '../ui/Sheet';
import { Button, Chip } from '../ui/primitives';
import { cleanAmountInput, toAmount } from './CategorySheet';

type Mode = { kind: 'list' } | { kind: 'new' } | { kind: 'edit'; book: BudgetBook };
type Start = 'copy' | 'template' | 'empty';

export function BudgetSwitcherSheet({
  visible,
  monthId,
  onClose,
}: {
  visible: boolean;
  monthId: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });

  useEffect(() => {
    if (visible) setMode({ kind: 'list' });
  }, [visible]);

  return (
    <Sheet visible={visible} onClose={onClose}>
      {mode.kind === 'list' && (
        <BudgetList
          onClose={onClose}
          onNew={() => setMode({ kind: 'new' })}
          onEdit={(book) => setMode({ kind: 'edit', book })}
        />
      )}
      {mode.kind === 'new' && <BudgetForm monthId={monthId} onBack={() => setMode({ kind: 'list' })} onDone={onClose} />}
      {mode.kind === 'edit' && (
        <BudgetForm
          monthId={monthId}
          book={mode.book}
          onBack={() => setMode({ kind: 'list' })}
          onDone={() => setMode({ kind: 'list' })}
        />
      )}
    </Sheet>
  );
}

function BudgetList({
  onClose,
  onNew,
  onEdit,
}: {
  onClose: () => void;
  onNew: () => void;
  onEdit: (book: BudgetBook) => void;
}) {
  const p = usePalette();
  const state = useBudgetStore();
  const { budgets, activeBudgetId, switchBudget } = state;

  return (
    <View style={styles.content}>
      <View style={styles.titleRow}>
        <Text style={[t.title, { color: p.text }]}>Budgets</Text>
        <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
          <Feather name="x" size={22} color={p.textSecondary} />
        </Pressable>
      </View>
      <Text style={[t.caption, { color: p.textSecondary, marginBottom: space.md }]}>
        Keep separate budgets side by side, like personal spending and a trip. Accounts and goals are shared.
      </Text>
      {budgets.map((book) => {
        const active = book.id === activeBudgetId;
        const months = getBudgetMonths(state, book);
        const currency = active ? state.preferences.currencyCode : book.currencyCode;
        return (
          <View
            key={book.id}
            style={[styles.bookRow, { borderColor: active ? p.accent : p.hairline, backgroundColor: active ? p.fill : 'transparent' }]}
          >
            <Pressable
              style={styles.bookMain}
              onPress={() => {
                switchBudget(book.id);
                triggerHaptic('selection');
                onClose();
              }}
            >
              <Feather name={active ? 'check-circle' : 'circle'} size={20} color={active ? p.accent : p.textTertiary} />
              <View style={{ flex: 1 }}>
                <Text style={[t.bodyStrong, { color: p.text }]} numberOfLines={1}>
                  {book.name}
                </Text>
                <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>
                  {months.length} {months.length === 1 ? 'month' : 'months'} · {currency}
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => onEdit(book)} hitSlop={10} style={styles.edit} accessibilityLabel={`Edit ${book.name}`}>
              <Feather name="edit-2" size={16} color={p.textSecondary} />
            </Pressable>
          </View>
        );
      })}
      <View style={{ marginTop: space.md }}>
        <Button label="New budget" variant="secondary" onPress={onNew} />
      </View>
    </View>
  );
}

function BudgetForm({
  monthId,
  book,
  onBack,
  onDone,
}: {
  monthId: string;
  book?: BudgetBook;
  onBack: () => void;
  onDone: () => void;
}) {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const budgets = useBudgetStore((s) => s.budgets);
  const activeBudgetId = useBudgetStore((s) => s.activeBudgetId);
  const preferences = useBudgetStore((s) => s.preferences);
  const createBudget = useBudgetStore((s) => s.createBudget);
  const updateBudget = useBudgetStore((s) => s.updateBudget);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);

  const isActive = book?.id === activeBudgetId;
  const activeName = budgets.find((b) => b.id === activeBudgetId)?.name ?? 'this budget';
  const sourceMonth = months.find((m) => m.id === monthId && m.categories.length > 0);

  const [name, setName] = useState(book?.name ?? '');
  const [currencyCode, setCurrencyCode] = useState(
    book ? (isActive ? preferences.currencyCode : book.currencyCode) : preferences.currencyCode,
  );
  const [start, setStart] = useState<Start>(sourceMonth ? 'copy' : 'template');
  const [income, setIncome] = useState(months.find((m) => m.id === monthId)?.monthlyLimit ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const incomeValue = toAmount(income);
  const currencies = featuredCurrencyCodes.includes(currencyCode)
    ? featuredCurrencyCodes
    : [currencyCode, ...featuredCurrencyCodes];
  const valid = name.trim().length > 0 && (book || start === 'copy' || incomeValue > 0);

  const submit = () => {
    if (!valid) return;
    if (book) {
      updateBudget(book.id, { name: name.trim(), currencyCode });
      onDone();
      return;
    }
    let record: MonthRecord;
    if (start === 'copy' && sourceMonth) {
      record = { ...copyMonthBudget(sourceMonth, monthId), currencyCode };
    } else {
      record = createEmptyMonth(monthId, String(incomeValue), currencyCode);
      if (start === 'template') record.categories = buildTemplateCategories(incomeValue);
    }
    createBudget({ name: name.trim(), currencyCode, months: [record] });
    triggerHaptic('success');
    onDone();
  };

  const startOptions: { value: Start; title: string; detail: string; hidden?: boolean }[] = [
    {
      value: 'copy',
      title: `Copy categories from ${activeName}`,
      detail: `Uses ${getMonthLabel(monthId, 'en-US')}'s categories and income. No transactions.`,
      hidden: !sourceMonth,
    },
    { value: 'template', title: '50/30/20 starter', detail: '12 common categories split 50/30/20.' },
    { value: 'empty', title: 'Start empty', detail: 'Just an income. Add categories yourself.' },
  ];

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back" style={styles.backRow}>
          <Feather name="chevron-left" size={24} color={p.text} />
          <Text style={[t.title, { color: p.text }]}>{book ? 'Edit budget' : 'New budget'}</Text>
        </Pressable>
      </View>

      <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Japan trip, Household, Side business"
        placeholderTextColor={p.textTertiary}
        autoFocus={!book}
        style={[t.body, styles.field, { color: p.text, backgroundColor: p.fill }]}
      />

      <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Currency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {currencies.map((code) => (
          <Chip key={code} label={code} selected={code === currencyCode} onPress={() => setCurrencyCode(code)} />
        ))}
      </ScrollView>
      {book && (
        <Text style={[t.caption, { color: p.textTertiary }]}>Changing currency doesn't convert existing amounts.</Text>
      )}

      {!book && (
        <>
          <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>
            Start {getMonthLabel(monthId, 'en-US')} with
          </Text>
          {startOptions
            .filter((o) => !o.hidden)
            .map((o) => {
              const selected = o.value === start;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => setStart(o.value)}
                  style={[
                    styles.option,
                    { borderColor: selected ? p.accent : p.hairline, backgroundColor: selected ? p.fill : 'transparent' },
                  ]}
                >
                  <Feather name={selected ? 'check-circle' : 'circle'} size={20} color={selected ? p.accent : p.textTertiary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[t.bodyStrong, { color: p.text }]}>{o.title}</Text>
                    <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>{o.detail}</Text>
                  </View>
                </Pressable>
              );
            })}
          {start !== 'copy' && (
            <View style={styles.incomeRow}>
              <Text style={[t.body, { color: p.text, flex: 1 }]}>Monthly amount</Text>
              <TextInput
                value={income}
                onChangeText={(v) => setIncome(cleanAmountInput(v))}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={p.textTertiary}
                style={[t.amount, styles.input, { color: p.text, backgroundColor: p.fill }]}
              />
            </View>
          )}
        </>
      )}

      <View style={{ marginTop: space.xl }}>
        <Button label={book ? 'Save' : 'Create budget'} onPress={submit} disabled={!valid} />
      </View>
      {book && budgets.length > 1 && (
        <Pressable
          onPress={() => {
            if (!confirmDelete) return setConfirmDelete(true);
            deleteBudget(book.id);
            onDone();
          }}
          style={styles.delete}
        >
          <Text style={[t.bodyStrong, { color: p.negative }]}>
            {confirmDelete ? 'Tap again to delete everything in it' : 'Delete budget'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
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
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -6 },
  bookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: space.sm,
  },
  bookMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  edit: { padding: space.md },
  label: { marginTop: space.lg, marginBottom: space.sm },
  field: { borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.md },
  chips: { gap: space.sm, paddingBottom: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: space.sm,
  },
  incomeRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.sm },
  input: { width: 128, textAlign: 'right', paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: 8 },
  delete: { alignItems: 'center', paddingVertical: space.md },
});
