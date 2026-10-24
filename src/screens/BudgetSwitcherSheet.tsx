import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore, getBudgetMonths, type BudgetBook } from '../store/useBudgetStore';
import { featuredCurrencyCodes, getMonthId } from '../../budgetModel';
import { formatTripRange } from '../logic/period';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Sheet } from '../ui/Sheet';
import { Button, Chip } from '../ui/primitives';
import { DateRangePicker } from '../ui/DateRangePicker';
import { BudgetWizard } from './BudgetWizard';
import { ConversionField, parseRate } from '../ui/ConversionField';

type Mode = { kind: 'list' } | { kind: 'new' } | { kind: 'edit'; book: BudgetBook };

export function BudgetSwitcherSheet({
  visible,
  monthId,
  startInNew = false,
  onClose,
}: {
  visible: boolean;
  monthId: string;
  startInNew?: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const months = useBudgetStore((s) => s.months);
  const activeBook = useBudgetStore((s) => s.budgets.find((b) => b.id === s.activeBudgetId));
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const createBudget = useBudgetStore((s) => s.createBudget);

  useEffect(() => {
    if (visible) setMode(startInNew ? { kind: 'new' } : { kind: 'list' });
  }, [visible, startInNew]);

  const viewed = months.find((m) => m.id === monthId);
  const copySource =
    activeBook && activeBook.kind !== 'trip' && viewed && viewed.categories.length > 0
      ? { budgetName: activeBook.name, month: viewed }
      : undefined;

  return (
    <Sheet visible={visible} onClose={onClose}>
      {mode.kind === 'list' && (
        <BudgetList
          onClose={onClose}
          onNew={() => setMode({ kind: 'new' })}
          onEdit={(book) => setMode({ kind: 'edit', book })}
        />
      )}
      {mode.kind === 'new' && (
        <BudgetWizard
          monthId={getMonthId(new Date())}
          defaultCurrency={currencyCode}
          copySource={copySource}
          onCancel={() => (startInNew ? onClose() : setMode({ kind: 'list' }))}
          onCreate={(result) => {
            createBudget(result);
            triggerHaptic('success');
            onClose();
          }}
        />
      )}
      {mode.kind === 'edit' && (
        <EditBudget book={mode.book} onDone={() => setMode({ kind: 'list' })} />
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
        Keep separate budgets side by side, like everyday spending and a trip. Accounts and goals are shared.
      </Text>
      {budgets.map((book) => {
        const active = book.id === activeBudgetId;
        const months = getBudgetMonths(state, book);
        const code = active ? state.preferences.currencyCode : book.currencyCode;
        const detail =
          book.kind === 'trip' && book.trip
            ? `${formatTripRange(book.trip)} · ${code}`
            : `${months.length} ${months.length === 1 ? 'month' : 'months'} · ${code}`;
        return (
          <View
            key={book.id}
            style={[
              styles.bookRow,
              { borderColor: active ? p.accent : p.hairline, backgroundColor: active ? p.fill : 'transparent' },
            ]}
          >
            <Pressable
              style={styles.bookMain}
              onPress={() => {
                switchBudget(book.id);
                triggerHaptic('selection');
                onClose();
              }}
            >
              <Feather
                name={book.kind === 'trip' ? 'map' : 'calendar'}
                size={20}
                color={active ? p.accent : p.textTertiary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[t.bodyStrong, { color: p.text }]} numberOfLines={1}>
                  {book.name}
                </Text>
                <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>{detail}</Text>
              </View>
              {active && <Feather name="check" size={18} color={p.accent} />}
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

function EditBudget({ book, onDone }: { book: BudgetBook; onDone: () => void }) {
  const p = usePalette();
  const budgets = useBudgetStore((s) => s.budgets);
  const activeBudgetId = useBudgetStore((s) => s.activeBudgetId);
  const preferences = useBudgetStore((s) => s.preferences);
  const updateBudget = useBudgetStore((s) => s.updateBudget);
  const deleteBudget = useBudgetStore((s) => s.deleteBudget);
  const isActive = book.id === activeBudgetId;

  const [name, setName] = useState(book.name);
  const [currencyCode, setCurrencyCode] = useState(isActive ? preferences.currencyCode : book.currencyCode);
  const [dates, setDates] = useState<{ start: string | null; end: string | null }>({
    start: book.trip?.start ?? null,
    end: book.trip?.end ?? null,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const otherCurrency = budgets.find((b) => b.id !== book.id && b.kind !== 'trip');
  const homeCurrency =
    book.conversion?.currencyCode ??
    (otherCurrency ? (otherCurrency.id === activeBudgetId ? preferences.currencyCode : otherCurrency.currencyCode) : 'EUR');
  const [convert, setConvert] = useState(!!book.conversion);
  const [rate, setRate] = useState(book.conversion ? String(book.conversion.rate) : '');

  const currencies = featuredCurrencyCodes.includes(currencyCode)
    ? featuredCurrencyCodes
    : [currencyCode, ...featuredCurrencyCodes];
  const isTrip = book.kind === 'trip';
  const valid = name.trim().length > 0 && (!isTrip || (dates.start && dates.end));

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} style={{ flexGrow: 0, flexShrink: 1 }}>
      <View style={styles.titleRow}>
        <Pressable onPress={onDone} hitSlop={12} accessibilityLabel="Back" style={styles.backRow}>
          <Feather name="chevron-left" size={24} color={p.text} />
          <Text style={[t.title, { color: p.text }]}>Edit budget</Text>
        </Pressable>
      </View>

      <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        style={[t.body, styles.field, { color: p.text, backgroundColor: p.fill }]}
      />

      {isTrip && (
        <>
          <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>
            {dates.start && dates.end ? formatTripRange({ start: dates.start, end: dates.end }) : 'Pick the last day'}
          </Text>
          <DateRangePicker start={dates.start} end={dates.end} onChange={(s, e) => setDates({ start: s, end: e })} />
        </>
      )}

      <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Currency</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {currencies.map((code) => (
          <Chip key={code} label={code} selected={code === currencyCode} onPress={() => setCurrencyCode(code)} />
        ))}
      </ScrollView>
      <Text style={[t.caption, { color: p.textTertiary, marginTop: space.sm }]}>
        Changing currency doesn't convert existing amounts.
      </Text>

      {isTrip && (
        <ConversionField
          tripCurrency={currencyCode}
          homeCurrency={homeCurrency}
          enabled={convert}
          rate={rate}
          onChange={(on, r) => {
            setConvert(on);
            setRate(r);
          }}
        />
      )}

      <View style={{ marginTop: space.xl }}>
        <Button
          label="Save"
          disabled={!valid}
          onPress={() => {
            updateBudget(book.id, {
              name: name.trim(),
              currencyCode,
              ...(isTrip && dates.start && dates.end ? { trip: { start: dates.start, end: dates.end } } : {}),
              ...(isTrip
                ? {
                    conversion:
                      convert && currencyCode !== homeCurrency && parseRate(rate) > 0
                        ? { currencyCode: homeCurrency, rate: parseRate(rate) }
                        : null,
                  }
                : {}),
            });
            onDone();
          }}
        />
      </View>
      {budgets.length > 1 && (
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
  bookRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, marginBottom: space.sm },
  bookMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  edit: { padding: space.md },
  label: { marginTop: space.lg, marginBottom: space.sm },
  field: { borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.md },
  chips: { gap: space.sm },
  delete: { alignItems: 'center', paddingVertical: space.md },
});
