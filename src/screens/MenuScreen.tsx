import React, { type ReactNode } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import { appThemeOrder, appThemes, currencyOptions, getMonthLabel } from '../../budgetModel';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, LargeTitle, SectionLabel, Divider } from '../ui/primitives';

export function MenuScreen({
  monthId,
  onOpenBudgets,
  onOpenSwitcher,
  onEditBudget,
  onNewBudget,
  onOpenAccounts,
  onOpenCurrency,
}: {
  monthId: string;
  onOpenBudgets: () => void;
  onOpenSwitcher: () => void;
  onEditBudget: () => void;
  onNewBudget: () => void;
  onOpenAccounts: () => void;
  onOpenCurrency: () => void;
}) {
  const p = usePalette();
  const monthCount = useBudgetStore((s) => s.months.length);
  const budgetName = useBudgetStore((s) => s.budgets.find((b) => b.id === s.activeBudgetId)?.name ?? 'Budget');
  const budgetCount = useBudgetStore((s) => s.budgets.length);
  const hasMonth = useBudgetStore((s) => s.months.some((m) => m.id === monthId));
  const accountCount = useBudgetStore((s) => s.accounts.length);
  const preferences = useBudgetStore((s) => s.preferences);
  const updateState = useBudgetStore((s) => s.updateState);
  const currencyLabel = currencyOptions.find((o) => o.code === preferences.currencyCode)?.label;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <LargeTitle>Menu</LargeTitle>

        <SectionLabel>Budget</SectionLabel>
        <Row
          icon="briefcase"
          label={budgetName}
          detail={budgetCount > 1 ? `Switch between your ${budgetCount} budgets` : 'Add a budget for a trip, home or project'}
          onPress={onOpenSwitcher}
        />
        <Divider inset={space.xl + 32} />
        <Row icon="calendar" label="Months" value={`${monthCount}`} onPress={onOpenBudgets} />
        <Divider inset={space.xl + 32} />
        {hasMonth && (
          <>
            <Row
              icon="sliders"
              label={`Edit ${getMonthLabel(monthId, 'en-US')}`}
              detail="Income, categories and subcategories"
              onPress={onEditBudget}
            />
            <Divider inset={space.xl + 32} />
          </>
        )}
        <Row icon="plus-circle" label="Set up another month" onPress={onNewBudget} />

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: 14,
  },
  swatches: {
    flexDirection: 'row',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  swatchRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: { width: 28, height: 28, borderRadius: 14 },
});
