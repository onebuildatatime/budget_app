import React, { useState, type ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore, useActiveBook } from '../store/useBudgetStore';
import { appThemeOrder, appThemes, currencyOptions, getMonthLabel } from '../../budgetModel';
import { buildBackup, parseBackup, transactionsCsv, type BackupData } from '../logic/backup';
import { materializeBooks } from '../logic/books';
import { pickTextFile, shareTextFile } from '../logic/files';
import { formatTripRange, toDateKey } from '../logic/period';
import { triggerHaptic } from '../utils/haptics';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, LargeTitle, SectionLabel, Divider, Button } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';

type Notice = { tone: 'ok' | 'error'; text: string } | null;

export function MenuScreen({
  monthId,
  onOpenBudgets,
  onOpenSwitcher,
  onEditBudget,
  onNewBudget,
  onNewBook,
  onOpenAccounts,
  onOpenCurrency,
  onOpenTrends,
}: {
  monthId: string;
  onOpenBudgets: () => void;
  onOpenSwitcher: () => void;
  onEditBudget: () => void;
  onNewBudget: () => void;
  onNewBook: () => void;
  onOpenAccounts: () => void;
  onOpenCurrency: () => void;
  onOpenTrends: () => void;
}) {
  const p = usePalette();
  const book = useActiveBook();
  const monthCount = useBudgetStore((s) => s.months.length);
  const hasMonth = useBudgetStore((s) => s.months.some((m) => m.id === monthId));
  const budgetCount = useBudgetStore((s) => s.budgets.length);
  const accountCount = useBudgetStore((s) => s.accounts.length);
  const preferences = useBudgetStore((s) => s.preferences);
  const updateState = useBudgetStore((s) => s.updateState);
  const restoreBackup = useBudgetStore((s) => s.restoreBackup);
  const currencyLabel = currencyOptions.find((o) => o.code === preferences.currencyCode)?.label;
  const isTrip = book?.kind === 'trip';
  const budgetName = book?.name ?? 'Budget';

  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState<BackupData | null>(null);

  const today = toDateKey(new Date());

  const run = async (action: () => Promise<string | void>) => {
    setNotice(null);
    try {
      const message = await action();
      if (message) setNotice({ tone: 'ok', text: message });
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Something went wrong.' });
    }
  };

  const backUp = () =>
    run(async () => {
      const backup = buildBackup(useBudgetStore.getState());
      await shareTextFile(`budget-buddy-backup-${today}.json`, JSON.stringify(backup, null, 2), 'application/json');
      return 'Backup ready. Save it somewhere safe, like iCloud Drive or Google Drive.';
    });

  const exportCsv = () =>
    run(async () => {
      const state = useBudgetStore.getState();
      await shareTextFile(`budget-buddy-transactions-${today}.csv`, transactionsCsv(materializeBooks(state), state.accounts), 'text/csv');
      return 'Transactions exported.';
    });

  const chooseBackup = () =>
    run(async () => {
      const text = await pickTextFile();
      if (text !== null) setPending(parseBackup(text));
    });

  const pendingStats = pending && {
    budgets: pending.budgets.length,
    months: pending.budgets.reduce((n, b) => n + b.months.length, 0),
    transactions: pending.budgets.reduce((n, b) => n + b.months.reduce((m, x) => m + x.transactions.length, 0), 0),
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <LargeTitle>Menu</LargeTitle>

        <SectionLabel>Budget</SectionLabel>
        <Row
          icon={isTrip ? 'map' : 'briefcase'}
          label={budgetName}
          detail={
            isTrip && book?.trip
              ? formatTripRange(book.trip)
              : budgetCount > 1
                ? `Switch between your ${budgetCount} budgets`
                : 'Switch or add budgets'
          }
          onPress={onOpenSwitcher}
        />
        <Divider inset={space.xl + 32} />
        {!isTrip && (
          <>
            <Row icon="calendar" label="Months" value={`${monthCount}`} onPress={onOpenBudgets} />
            <Divider inset={space.xl + 32} />
          </>
        )}
        {hasMonth && (
          <>
            <Row
              icon="sliders"
              label={isTrip ? 'Edit trip budget' : `Edit ${getMonthLabel(monthId, 'en-US')}`}
              detail={isTrip ? 'Total, categories and subcategories' : 'Income, categories and subcategories'}
              onPress={onEditBudget}
            />
            <Divider inset={space.xl + 32} />
          </>
        )}
        <Row icon="bar-chart-2" label="Trends" onPress={onOpenTrends} />
        <Divider inset={space.xl + 32} />
        {!isTrip && (
          <>
            <Row icon="plus-circle" label="Set up another month" onPress={onNewBudget} />
            <Divider inset={space.xl + 32} />
          </>
        )}
        <Row icon="plus-square" label="New budget" detail="Monthly, or for a trip or event" onPress={onNewBook} />

        <SectionLabel>Money</SectionLabel>
        <Row icon="credit-card" label="Accounts" value={`${accountCount}`} onPress={onOpenAccounts} />
        <Divider inset={space.xl + 32} />
        <Row
          icon="dollar-sign"
          label="Currency"
          detail={`For ${budgetName}`}
          value={currencyLabel ?? preferences.currencyCode}
          onPress={onOpenCurrency}
        />

        <SectionLabel>Data</SectionLabel>
        <Row icon="upload-cloud" label="Back up everything" detail="All budgets, goals and accounts in one file" onPress={backUp} />
        <Divider inset={space.xl + 32} />
        <Row icon="download-cloud" label="Restore from a backup" onPress={chooseBackup} />
        <Divider inset={space.xl + 32} />
        <Row icon="file-text" label="Export transactions" detail="CSV for Excel, Numbers or Sheets" onPress={exportCsv} />
        {notice && (
          <View style={[styles.notice, { backgroundColor: p.fill }]}>
            <Feather
              name={notice.tone === 'ok' ? 'check-circle' : 'alert-circle'}
              size={16}
              color={notice.tone === 'ok' ? p.positive : p.negative}
            />
            <Text style={[t.caption, { color: p.text, flex: 1 }]}>{notice.text}</Text>
          </View>
        )}
        <Text style={[t.caption, styles.footnote, { color: p.textTertiary }]}>
          Your data is stored only on this phone. Back up regularly so you can restore it on a new one.
        </Text>

        <SectionLabel>Appearance</SectionLabel>
        <View style={styles.swatches}>
          {appThemeOrder.map((id) => {
            const selected = preferences.appThemeId === id;
            return (
              <Pressable
                key={id}
                accessibilityLabel={appThemes[id].name}
                onPress={() => updateState({ preferences: { ...preferences, appThemeId: id } })}
                style={[styles.swatchRing, { borderColor: selected ? appThemes[id].accent : 'transparent' }]}
              >
                <View style={[styles.swatch, { backgroundColor: appThemes[id].accent }]} />
              </Pressable>
            );
          })}
        </View>
        <Text style={[t.caption, { color: p.textTertiary, paddingHorizontal: space.xl }]}>
          Light and dark mode follow your phone's setting.
        </Text>
      </ScrollView>

      <Sheet visible={!!pending} onClose={() => setPending(null)}>
        {pending && pendingStats && (
          <View style={styles.sheet}>
            <Text style={[t.title, { color: p.text }]}>Replace your data?</Text>
            <Text style={[t.body, { color: p.textSecondary, marginTop: space.sm }]}>
              This backup has {pendingStats.budgets} {pendingStats.budgets === 1 ? 'budget' : 'budgets'},{' '}
              {pendingStats.months} {pendingStats.months === 1 ? 'month' : 'months'}, {pendingStats.transactions}{' '}
              transactions, {pending.goals.length} goals and {pending.accounts.length} accounts.
            </Text>
            <Text style={[t.body, { color: p.warning, marginTop: space.md }]}>
              Everything currently in the app will be replaced. Back up first if you might need it.
            </Text>
            <View style={{ gap: space.sm, marginTop: space.xl }}>
              <Button
                label="Replace with backup"
                onPress={() => {
                  restoreBackup(pending);
                  setPending(null);
                  triggerHaptic('success');
                  setNotice({ tone: 'ok', text: 'Backup restored.' });
                }}
              />
              <Button label="Cancel" variant="secondary" onPress={() => setPending(null)} />
            </View>
          </View>
        )}
      </Sheet>
    </Screen>
  );
}

function Row({
  icon,
  label,
  detail,
  value,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  detail?: string;
  value?: ReactNode;
  onPress: () => void;
}) {
  const p = usePalette();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: p.fill }]}>
      <Feather name={icon} size={18} color={p.textSecondary} style={{ width: 20 }} />
      <View style={{ flex: 1 }}>
        <Text style={[t.body, { color: p.text }]}>{label}</Text>
        {detail && <Text style={[t.caption, { color: p.textSecondary, marginTop: 1 }]}>{detail}</Text>}
      </View>
      {value !== undefined && <Text style={[t.body, { color: p.textSecondary }]}>{value}</Text>}
      <Feather name="chevron-right" size={18} color={p.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 14 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.xl,
    marginTop: space.sm,
    padding: space.md,
    borderRadius: 10,
  },
  footnote: { paddingHorizontal: space.xl, paddingTop: space.sm },
  swatches: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.xl, paddingVertical: space.sm },
  swatchRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  sheet: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: space.md },
});
