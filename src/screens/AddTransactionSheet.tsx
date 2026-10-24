import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import {
  buildIsoDateForMonth,
  createId,
  currency,
  getDaysInMonth,
  getMonthId,
  INCOME_CATEGORY_ID,
  type Transaction,
} from '../../budgetModel';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Sheet } from '../ui/Sheet';
import { Segmented, Chip, Button } from '../ui/primitives';

type Kind = 'expense' | 'income';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const;

// Hermes on iOS has no Intl.NumberFormat.formatToParts.
const currencySymbol = (code: string) => currency(0, code).replace(/[\d.,\s ]/g, '') || code;

const toAmountString = (n: number) => String(Math.round(n * 100) / 100);

export function AddTransactionSheet({
  visible,
  monthId,
  transaction,
  onClose,
}: {
  visible: boolean;
  monthId: string;
  transaction?: Transaction | null;
  onClose: () => void;
}) {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const accounts = useBudgetStore((s) => s.accounts);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const updateState = useBudgetStore((s) => s.updateState);
  const month = months.find((m) => m.id === monthId);
  const editing = !!transaction;
  const daysInMonth = getDaysInMonth(monthId);
  const isCurrentMonth = getMonthId(new Date()) === monthId;

  const [kind, setKind] = useState<Kind>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [subcategory, setSubcategory] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>();
  const [day, setDay] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setConfirmDelete(false);
    if (transaction) {
      setKind(transaction.kind === 'income' ? 'income' : 'expense');
      setAmount(toAmountString(transaction.amount));
      setNote(transaction.note ?? '');
      setCategoryId(transaction.kind === 'income' ? undefined : transaction.categoryId);
      setSubcategory(transaction.subcategory);
      setAccountId(transaction.accountId);
      setDay(new Date(transaction.happenedAt).getDate());
    } else {
      setKind('expense');
      setAmount('');
      setNote('');
      setCategoryId(undefined);
      setSubcategory(undefined);
      setAccountId(accounts.find((a) => a.kinds.includes('spending'))?.id ?? accounts[0]?.id);
      setDay(isCurrentMonth ? new Date().getDate() : 1);
    }
  }, [visible, transaction, accounts, isCurrentMonth]);

  const subcategories = month?.categories.find((c) => c.id === categoryId)?.subcategories ?? [];
  const date = new Date(buildIsoDateForMonth(monthId, day));
  const isToday = isCurrentMonth && day === new Date().getDate();
  const dateLabel = isToday
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const value = parseFloat(amount);
  const categoryValid = kind === 'income' || month?.categories.some((c) => c.id === categoryId);
  const canSave = Number.isFinite(value) && value > 0 && !!categoryValid && !!month;

  const press = (key: (typeof KEYS)[number]) => {
    triggerHaptic('selection');
    setAmount((current) => {
      if (key === 'del') return current.slice(0, -1);
      if (key === '.') return current.includes('.') ? current : (current || '0') + '.';
      const [, decimals] = current.split('.');
      if (decimals !== undefined && decimals.length >= 2) return current;
      if (current === '0') return key;
      if (current.replace('.', '').length >= 7) return current;
      return current + key;
    });
  };

  const writeTransactions = (update: (list: Transaction[]) => Transaction[]) => {
    if (!month) return;
    updateState({
      months: months.map((m) =>
        m.id === month.id ? { ...m, transactions: update(m.transactions), updatedAt: Date.now() } : m,
      ),
    });
  };

  const save = () => {
    if (!canSave) return;
    const next: Transaction = {
      id: transaction?.id ?? createId('txn'),
      kind,
      categoryId: kind === 'expense' ? categoryId! : INCOME_CATEGORY_ID,
      subcategory: kind === 'expense' ? subcategory : undefined,
      accountId,
      amount: value,
      note: note.trim(),
      happenedAt: buildIsoDateForMonth(monthId, day),
      recurring: transaction?.recurring ?? false,
    };
    writeTransactions((list) =>
      editing ? list.map((x) => (x.id === next.id ? next : x)) : [...list, next],
    );
    triggerHaptic('success');
    onClose();
  };

  const remove = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    writeTransactions((list) => list.filter((x) => x.id !== transaction?.id));
    triggerHaptic('success');
    onClose();
  };

  const saveLabel =
    kind === 'expense' && !categoryValid && value > 0
      ? 'Pick a category'
      : editing
        ? 'Save changes'
        : `Add ${kind}`;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.topRow}>
          <View style={{ width: 200 }}>
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
            />
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Feather name="x" size={22} color={p.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.amountBlock}>
          <Text
            style={[t.display, { fontSize: 52, color: amount ? p.text : p.textTertiary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {currencySymbol(currencyCode)}
            {amount || '0'}
          </Text>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => setDay((d) => Math.max(1, d - 1))}
              disabled={day <= 1}
              hitSlop={10}
              accessibilityLabel="Previous day"
            >
              <Feather name="chevron-left" size={18} color={day <= 1 ? p.hairline : p.textSecondary} />
            </Pressable>
            <Text style={[t.caption, { color: p.textSecondary, minWidth: 110, textAlign: 'center' }]}>
              {dateLabel}
            </Text>
            <Pressable
              onPress={() => setDay((d) => Math.min(daysInMonth, d + 1))}
              disabled={day >= daysInMonth}
              hitSlop={10}
              accessibilityLabel="Next day"
            >
              <Feather name="chevron-right" size={18} color={day >= daysInMonth ? p.hairline : p.textSecondary} />
            </Pressable>
          </View>
        </View>

        {kind === 'expense' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {month?.categories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={c.id === categoryId}
                onPress={() => {
                  setCategoryId(c.id);
                  setSubcategory(undefined);
                }}
              />
            ))}
          </ScrollView>
        )}

        {kind === 'expense' && subcategories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {subcategories.map((name) => (
              <Chip
                key={name}
                label={name}
                variant="subtle"
                selected={name === subcategory}
                onPress={() => setSubcategory((current) => (current === name ? undefined : name))}
              />
            ))}
          </ScrollView>
        )}

        {accounts.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {accounts.map((a) => (
              <Pressable key={a.id} onPress={() => setAccountId(a.id)} style={styles.account}>
                <Feather
                  name={a.id === accountId ? 'check-circle' : 'circle'}
                  size={16}
                  color={a.id === accountId ? p.accent : p.textTertiary}
                />
                <Text style={[t.caption, { color: a.id === accountId ? p.text : p.textSecondary }]}>{a.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add a note"
          placeholderTextColor={p.textTertiary}
          returnKeyType="done"
          style={[t.body, styles.note, { color: p.text, backgroundColor: p.fill }]}
        />

        <View style={styles.pad}>
          {KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => press(key)}
              onLongPress={key === 'del' ? () => setAmount('') : undefined}
              style={({ pressed }) => [styles.key, pressed && { backgroundColor: p.fill }]}
              accessibilityLabel={key === 'del' ? 'Delete' : key}
            >
              {key === 'del' ? (
                <Feather name="delete" size={22} color={p.text} />
              ) : (
                <Text style={[t.title, { color: p.text, fontWeight: '400' }]}>{key}</Text>
              )}
            </Pressable>
          ))}
        </View>

        <Button label={saveLabel} onPress={save} disabled={!canSave} />
        {editing && (
          <Pressable onPress={remove} style={styles.delete}>
            <Text style={[t.bodyStrong, { color: p.negative }]}>
              {confirmDelete ? 'Tap again to delete' : 'Delete transaction'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl,
    paddingBottom: space.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.sm,
  },
  amountBlock: {
    alignItems: 'center',
    paddingTop: space.xl,
    paddingBottom: space.lg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
  },
  chips: {
    gap: space.sm,
    paddingBottom: space.md,
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: space.md,
  },
  note: {
    borderRadius: 10,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    marginBottom: space.sm,
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: space.md,
  },
  key: {
    width: '33.333%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  delete: { alignItems: 'center', paddingVertical: space.md },
});
