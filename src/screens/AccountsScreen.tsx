import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import { bankAccountKindMeta, createId, type BankAccount, type BankAccountKind } from '../../budgetModel';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, Header, Divider, Segmented, Button } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';

const kinds: { value: BankAccountKind; label: string }[] = [
  { value: 'spending', label: 'Spending' },
  { value: 'recurring', label: 'Bills' },
  { value: 'savings', label: 'Savings' },
  { value: 'investing', label: 'Investing' },
];

export function AccountsScreen({ onBack }: { onBack: () => void }) {
  const p = usePalette();
  const accounts = useBudgetStore((s) => s.accounts);
  const updateState = useBudgetStore((s) => s.updateState);
  const [editing, setEditing] = useState<BankAccount | 'new' | null>(null);

  const save = (account: BankAccount) => {
    const exists = accounts.some((a) => a.id === account.id);
    updateState({ accounts: exists ? accounts.map((a) => (a.id === account.id ? account : a)) : [...accounts, account] });
    triggerHaptic('success');
    setEditing(null);
  };

  return (
    <Screen>
      <Header
        title="Accounts"
        onBack={onBack}
        right={
          <Pressable onPress={() => setEditing('new')} hitSlop={10} accessibilityLabel="New account">
            <Feather name="plus" size={22} color={p.accent} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <Text style={[t.caption, styles.intro, { color: p.textSecondary }]}>
          Tag each transaction with the account it came from.
        </Text>
        {accounts.map((a, i) => (
          <View key={a.id}>
            <Pressable
              onPress={() => setEditing(a)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: p.fill }]}
            >
              <Feather name="credit-card" size={18} color={p.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={[t.body, { color: p.text }]}>{a.name}</Text>
                <Text style={[t.caption, { color: p.textSecondary }]}>
                  {a.kinds.map((k) => bankAccountKindMeta[k].label).join(', ')}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={p.textTertiary} />
            </Pressable>
            {i < accounts.length - 1 && <Divider inset={space.xl + 30} />}
          </View>
        ))}
        <View style={{ paddingHorizontal: space.xl, marginTop: space.xl }}>
          <Button label="Add account" variant="secondary" onPress={() => setEditing('new')} />
        </View>
      </ScrollView>

      <AccountSheet
        account={editing}
        onSave={save}
        onDelete={(id) => {
          updateState({ accounts: accounts.filter((a) => a.id !== id) });
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
    </Screen>
  );
}

function AccountSheet({
  account,
  onSave,
  onDelete,
  onClose,
}: {
  account: BankAccount | 'new' | null;
  onSave: (account: BankAccount) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const p = usePalette();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<BankAccountKind>('spending');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNew = account === 'new';

  useEffect(() => {
    if (!account) return;
    setConfirmDelete(false);
    setName(isNew ? '' : account.name);
    setKind(isNew ? 'spending' : (account.kinds[0] ?? 'spending'));
  }, [account, isNew]);

  return (
    <Sheet visible={!!account} onClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.titleRow}>
          <Text style={[t.title, { color: p.text }]}>{isNew ? 'New account' : 'Edit account'}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Feather name="x" size={22} color={p.textSecondary} />
          </Pressable>
        </View>
        <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Main bank"
          placeholderTextColor={p.textTertiary}
          autoFocus={isNew}
          style={[t.body, styles.field, { color: p.text, backgroundColor: p.fill }]}
        />
        <Text style={[t.overline, styles.label, { color: p.textSecondary }]}>Used for</Text>
        <Segmented options={kinds} value={kind} onChange={setKind} />
        <Text style={[t.caption, { color: p.textSecondary, marginTop: space.sm }]}>
          {bankAccountKindMeta[kind].description}
        </Text>
        <View style={{ marginTop: space.xl }}>
          <Button
            label={isNew ? 'Add account' : 'Save'}
            disabled={!name.trim()}
            onPress={() =>
              account &&
              onSave({
                id: isNew ? createId('acct') : account.id,
                name: name.trim(),
                kinds: [kind],
                customKinds: isNew ? [] : account.customKinds,
              })
            }
          />
        </View>
        {!isNew && account && (
          <Pressable
            onPress={() => (confirmDelete ? onDelete(account.id) : setConfirmDelete(true))}
            style={styles.delete}
          >
            <Text style={[t.bodyStrong, { color: p.negative }]}>
              {confirmDelete ? 'Tap again to delete' : 'Delete account'}
            </Text>
          </Pressable>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  intro: { paddingHorizontal: space.xl, paddingBottom: space.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
  },
  sheet: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { marginTop: space.lg, marginBottom: space.sm },
  field: { borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.md },
  delete: { alignItems: 'center', paddingVertical: space.md },
});
