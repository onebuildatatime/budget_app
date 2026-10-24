import React, { useMemo, useState, type ReactNode } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  createEmptyMonth,
  currency,
  currencyOptions,
  featuredCurrencyCodes,
  getMonthLabel,
  type Category,
  type MonthRecord,
} from '../../budgetModel';
import { buildTemplateCategories, buildTripCategories } from '../budgetTemplate';
import { copyMonth } from '../logic/rollover';
import { formatTripRange, tripLength } from '../logic/period';
import type { BudgetKind, TripDates } from '../logic/books';
import { usePalette, type as t, space } from '../ui/theme';
import { Button, Chip } from '../ui/primitives';
import { DateRangePicker } from '../ui/DateRangePicker';
import { cleanAmountInput, toAmount } from './CategorySheet';

export type WizardResult = {
  name: string;
  currencyCode: string;
  months: MonthRecord[];
  kind: BudgetKind;
  trip?: TripDates;
};

type Start = 'template' | 'copy' | 'empty';

export function guessCurrency(fallback = 'USD') {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split('-').pop();
    return (
      currencyOptions.find((o) => o.locale === locale)?.code ??
      currencyOptions.find((o) => o.locale.split('-').pop() === region)?.code ??
      fallback
    );
  } catch {
    return fallback;
  }
}

export function BudgetWizard({
  monthId,
  defaultCurrency,
  defaultName = '',
  copySource,
  onCreate,
  onCancel,
}: {
  monthId: string;
  defaultCurrency: string;
  defaultName?: string;
  copySource?: { budgetName: string; month: MonthRecord };
  onCreate: (result: WizardResult) => void;
  onCancel?: () => void;
}) {
  const p = usePalette();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<BudgetKind>('monthly');
  const [name, setName] = useState(defaultName);
  const [currencyCode, setCurrencyCode] = useState(defaultCurrency);
  const [amount, setAmount] = useState(copySource?.month.monthlyLimit ?? '');
  const [trip, setTrip] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [start, setStart] = useState<Start>('template');

  const value = toAmount(amount);
  const tripDates: TripDates | null = trip.start && trip.end ? { start: trip.start, end: trip.end } : null;
  const currencies = featuredCurrencyCodes.includes(currencyCode)
    ? featuredCurrencyCodes
    : [currencyCode, ...featuredCurrencyCodes];

  const preview: Category[] = useMemo(() => {
    if (start === 'empty' || value <= 0) return [];
    if (kind === 'trip') return buildTripCategories(value);
    if (start === 'copy' && copySource) return copySource.month.categories;
    return buildTemplateCategories(value);
  }, [start, value, kind, copySource]);

  const detailsValid =
    name.trim().length > 0 && value > 0 && (kind === 'monthly' || tripDates !== null);

  const create = () => {
    const recordMonthId = kind === 'trip' && tripDates ? tripDates.start.slice(0, 7) : monthId;
    let record: MonthRecord;
    if (kind === 'monthly' && start === 'copy' && copySource) {
      record = { ...copyMonth(copySource.month, recordMonthId, false), monthlyLimit: String(value), currencyCode };
    } else {
      record = createEmptyMonth(recordMonthId, String(value), currencyCode);
      if (start === 'template') {
        record.categories = kind === 'trip' ? buildTripCategories(value) : buildTemplateCategories(value);
      }
    }
    onCreate({
      name: name.trim(),
      currencyCode,
      months: [record],
      kind,
      ...(kind === 'trip' && tripDates ? { trip: tripDates } : {}),
    });
  };

  const back = () => (step === 0 ? onCancel?.() : setStep(step - 1));

  const chooseKind = (k: BudgetKind) => {
    setKind(k);
    setStart('template');
    if (k === 'trip') {
      if (name === defaultName) setName('');
      setAmount('');
    } else {
      setAmount(copySource?.month.monthlyLimit ?? '');
    }
    setStep(1);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {step > 0 || onCancel ? (
          <Pressable onPress={back} hitSlop={12} accessibilityLabel="Back">
            <Feather name="chevron-left" size={26} color={p.text} />
          </Pressable>
        ) : (
          <View style={{ width: 26 }} />
        )}
        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i <= step ? p.accent : p.hairline }]} />
          ))}
        </View>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <Text style={[t.title, { color: p.text, fontSize: 26 }]}>What are you budgeting?</Text>
            <Text style={[t.body, { color: p.textSecondary, marginTop: space.sm, marginBottom: space.xl }]}>
              You can add more budgets later and switch between them.
            </Text>
            <KindCard
              icon="calendar"
              title="Monthly budget"
              detail="Plan each month: income, bills, everyday spending and saving."
              onPress={() => chooseKind('monthly')}
            />
            <KindCard
              icon="map"
              title="Trip or event"
              detail="One total for a set of dates: a holiday, a wedding, a move."
              onPress={() => chooseKind('trip')}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={[t.title, { color: p.text, fontSize: 26 }]}>
              {kind === 'trip' ? 'Trip details' : 'The basics'}
            </Text>

            <Label>Name</Label>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={kind === 'trip' ? 'e.g. Japan 2027' : 'e.g. Personal, Household'}
              placeholderTextColor={p.textTertiary}
              style={[t.body, styles.field, { color: p.text, backgroundColor: p.fill }]}
            />

            {kind === 'trip' && (
              <>
                <Label right={tripDates ? `${tripLength(tripDates)} days` : undefined}>
                  {tripDates ? formatTripRange(tripDates) : trip.start ? 'Now pick the last day' : 'Pick the first day'}
                </Label>
                <DateRangePicker start={trip.start} end={trip.end} onChange={(s, e) => setTrip({ start: s, end: e })} />
              </>
            )}

            <Label>Currency</Label>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {currencies.map((code) => (
                <Chip key={code} label={code} selected={code === currencyCode} onPress={() => setCurrencyCode(code)} />
              ))}
            </ScrollView>

            <Label>{kind === 'trip' ? 'Total budget for the trip' : 'Monthly take-home income'}</Label>
            <TextInput
              value={amount}
              onChangeText={(v) => setAmount(cleanAmountInput(v))}
              placeholder="0"
              placeholderTextColor={p.textTertiary}
              keyboardType="decimal-pad"
              style={[t.amount, styles.field, { color: p.text, backgroundColor: p.fill, fontSize: 22 }]}
            />
            {kind === 'trip' && tripDates && value > 0 && (
              <Text style={[t.caption, { color: p.textSecondary, marginTop: space.sm }]}>
                About {currency(value / tripLength(tripDates), currencyCode)} a day
              </Text>
            )}
            {kind === 'monthly' && (
              <Text style={[t.caption, { color: p.textSecondary, marginTop: space.sm }]}>
                What lands in your account each month after tax. Starts in {getMonthLabel(monthId, 'en-US')}.
              </Text>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[t.title, { color: p.text, fontSize: 26 }]}>How do you want to start?</Text>
            <View style={{ marginTop: space.lg }}>
              {kind === 'trip' ? (
                <>
                  <StartCard
                    selected={start === 'template'}
                    onPress={() => setStart('template')}
                    title="Typical trip"
                    badge="Recommended"
                    detail="Travel, accommodation, food, local transport, activities, shopping and a buffer."
                  />
                  <StartCard
                    selected={start === 'empty'}
                    onPress={() => setStart('empty')}
                    title="Start empty"
                    detail="Add your own categories."
                  />
                </>
              ) : (
                <>
                  <StartCard
                    selected={start === 'template'}
                    onPress={() => setStart('template')}
                    title="50/30/20 rule"
                    badge="Recommended"
                    detail="Half on needs, 30% on wants, 20% on savings. The most widely used way to budget."
                  />
                  {copySource && (
                    <StartCard
                      selected={start === 'copy'}
                      onPress={() => setStart('copy')}
                      title={`Same categories as ${copySource.budgetName}`}
                      detail={`${copySource.month.categories.length} categories from ${getMonthLabel(copySource.month.id, 'en-US')}.`}
                    />
                  )}
                  <StartCard
                    selected={start === 'empty'}
                    onPress={() => setStart('empty')}
                    title="Start empty"
                    detail="Add your own categories."
                  />
                </>
              )}
            </View>

            {preview.length > 0 && (
              <>
                <Label>You'll start with</Label>
                <View style={[styles.preview, { borderColor: p.hairline }]}>
                  {preview.map((c) => (
                    <View key={c.id} style={styles.previewRow}>
                      <Text style={[t.body, { color: p.text, flex: 1 }]} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={[t.amount, { color: p.textSecondary }]}>{currency(c.planned, currencyCode)}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[t.caption, { color: p.textTertiary, marginTop: space.sm }]}>
                  You can rename, resize or delete any of these afterwards.
                </Text>
              </>
            )}
          </>
        )}
      </ScrollView>

      {step > 0 && (
        <View style={styles.footer}>
          {step === 1 ? (
            <Button label="Continue" onPress={() => setStep(2)} disabled={!detailsValid} />
          ) : (
            <Button label={kind === 'trip' ? 'Create trip budget' : 'Create budget'} onPress={create} />
          )}
        </View>
      )}
    </View>
  );
}

function Label({ children, right }: { children: ReactNode; right?: string }) {
  const p = usePalette();
  return (
    <View style={styles.labelRow}>
      <Text style={[t.overline, { color: p.textSecondary, flex: 1 }]}>{children}</Text>
      {right && <Text style={[t.caption, { color: p.textSecondary }]}>{right}</Text>}
    </View>
  );
}

function KindCard({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { borderColor: p.hairline, backgroundColor: pressed ? p.fill : 'transparent' }]}
    >
      <View style={[styles.cardIcon, { backgroundColor: p.fill }]}>
        <Feather name={icon} size={22} color={p.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[t.bodyStrong, { color: p.text }]}>{title}</Text>
        <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>{detail}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={p.textTertiary} />
    </Pressable>
  );
}

function StartCard({
  selected,
  onPress,
  title,
  detail,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  detail: string;
  badge?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderColor: selected ? p.accent : p.hairline, backgroundColor: selected ? p.fill : 'transparent' }]}
    >
      <Feather name={selected ? 'check-circle' : 'circle'} size={20} color={selected ? p.accent : p.textTertiary} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
          <Text style={[t.bodyStrong, { color: p.text }]}>{title}</Text>
          {badge && <Text style={[t.caption, { color: p.accent, fontWeight: '600' }]}>{badge}</Text>}
        </View>
        <Text style={[t.caption, { color: p.textSecondary, marginTop: 2 }]}>{detail}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexShrink: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 24, height: 4, borderRadius: 2 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.lg },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.xl, marginBottom: space.sm },
  field: { borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.md },
  chips: { gap: space.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: space.md,
  },
  cardIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  preview: { borderWidth: 1, borderRadius: 12, paddingVertical: space.xs },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: 8 },
  footer: { paddingHorizontal: space.xl, paddingTop: space.sm },
});
