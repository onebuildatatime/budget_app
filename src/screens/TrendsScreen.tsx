import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore, useActiveBook } from '../store/useBudgetStore';
import { addMonths, currency, getMonthLabel, parseMonthId } from '../../budgetModel';
import { categoryChanges, categoryShares, dailyTotals, monthlyTotals } from '../logic/trends';
import { tripPeriod } from '../logic/period';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, Header, SectionLabel, ProgressBar } from '../ui/primitives';

const CHART_HEIGHT = 140;

export function TrendsScreen({
  monthId,
  onBack,
  onOpenMonth,
}: {
  monthId: string;
  onBack: () => void;
  onOpenMonth: (id: string) => void;
}) {
  const p = usePalette();
  const months = useBudgetStore((s) => s.months);
  const currencyCode = useBudgetStore((s) => s.preferences.currencyCode);
  const book = useActiveBook();
  const trip = book?.kind === 'trip' ? book.trip : undefined;
  const month = months.find((m) => m.id === monthId);
  const previous = months.find((m) => m.id === addMonths(monthId, -1));
  const fmt = (n: number) => currency(n, currencyCode);
  const shortMonth = (id: string) => parseMonthId(id).toLocaleDateString('en-US', { month: 'short' });

  if (!month) {
    return (
      <Screen>
        <Header title="Trends" onBack={onBack} />
        <Text style={[t.body, styles.empty, { color: p.textSecondary }]}>Nothing to show for this month yet.</Text>
      </Screen>
    );
  }

  const shares = categoryShares(month);
  const history = trip ? [] : monthlyTotals(months, monthId);
  const days = trip ? dailyTotals(month, tripPeriod(trip)) : [];
  const changes = previous && !trip ? categoryChanges(month, previous) : [];
  const historyMax = Math.max(1, ...history.map((h) => Math.max(h.planned, h.spent)));
  const dayMax = Math.max(1, ...days.map((d) => d.spent));

  return (
    <Screen>
      <Header title={trip ? `${book?.name} trends` : `Trends · ${getMonthLabel(monthId, 'en-US')}`} onBack={onBack} />
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        {!trip && (
          <>
            <SectionLabel>Spent vs planned</SectionLabel>
            {history.length < 2 && (
              <Text style={[t.caption, styles.hint, { color: p.textSecondary }]}>
                Month-by-month comparisons appear once you have two months of data.
              </Text>
            )}
            <View style={styles.chart}>
              {history.map((h) => {
                const over = h.spent > h.planned;
                return (
                  <Pressable key={h.monthId} style={styles.column} onPress={() => onOpenMonth(h.monthId)}>
                    <Text style={[t.caption, { color: p.textSecondary, fontSize: 11 }]} numberOfLines={1}>
                      {fmt(h.spent)}
                    </Text>
                    <View style={[styles.barArea, { height: CHART_HEIGHT }]}>
                      <View
                        style={[styles.bar, { height: (h.planned / historyMax) * CHART_HEIGHT, backgroundColor: p.fill }]}
                      />
                      <View
                        style={[
                          styles.bar,
                          styles.barFront,
                          {
                            height: (h.spent / historyMax) * CHART_HEIGHT,
                            backgroundColor: over ? p.negative : h.monthId === monthId ? p.accent : p.textTertiary,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        t.caption,
                        { color: h.monthId === monthId ? p.text : p.textSecondary, fontWeight: h.monthId === monthId ? '700' : '400' },
                      ]}
                    >
                      {shortMonth(h.monthId)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.legend}>
              <Legend color={p.fill} label="Planned" />
              <Legend color={p.accent} label="Spent" />
              <Legend color={p.negative} label="Over budget" />
            </View>
          </>
        )}

        {trip && (
          <>
            <SectionLabel>Spending by day</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayChart}>
              {days.map((d) => (
                <View key={d.date.toISOString()} style={styles.dayColumn}>
                  <View style={[styles.barArea, { height: CHART_HEIGHT }]}>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(2, (d.spent / dayMax) * CHART_HEIGHT), backgroundColor: d.spent ? p.accent : p.fill },
                      ]}
                    />
                  </View>
                  <Text style={[t.caption, { color: p.textSecondary, fontSize: 11 }]}>{d.date.getDate()}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {previous && !trip && (
          <>
            <SectionLabel>{`Compared with ${getMonthLabel(previous.id, 'en-US')}`}</SectionLabel>
            {changes.length === 0 ? (
              <Text style={[t.caption, styles.hint, { color: p.textSecondary }]}>No changes yet.</Text>
            ) : (
              changes.slice(0, 8).map((c) => {
                const up = c.change > 0;
                return (
                  <View key={c.name} style={styles.changeRow}>
                    <Text style={[t.body, { color: p.text, flex: 1 }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={[t.amount, { color: p.textSecondary }]}>{fmt(c.spent)}</Text>
                    <View style={[styles.changePill, { backgroundColor: p.fill }]}>
                      <Feather name={up ? 'arrow-up-right' : 'arrow-down-right'} size={12} color={up ? p.negative : p.positive} />
                      <Text style={[t.caption, { color: up ? p.negative : p.positive, fontWeight: '600' }]}>
                        {c.percent === null ? fmt(Math.abs(c.change)) : `${Math.abs(c.percent)}%`}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        <SectionLabel>Where the money went</SectionLabel>
        {shares.length === 0 ? (
          <Text style={[t.caption, styles.hint, { color: p.textSecondary }]}>No spending logged yet.</Text>
        ) : (
          shares.map((s) => (
            <View key={s.name} style={styles.shareRow}>
              <View style={styles.shareLine}>
                <Text style={[t.body, { color: p.text, flex: 1 }]} numberOfLines={1}>
                  {s.name}
                </Text>
                <Text style={[t.amount, { color: p.text }]}>{fmt(s.spent)}</Text>
                <Text style={[t.caption, { color: p.textSecondary, width: 40, textAlign: 'right' }]}>
                  {Math.round(s.share * 100)}%
                </Text>
              </View>
              <ProgressBar ratio={s.share} color={p.accent} />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const p = usePalette();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[t.caption, { color: p.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { paddingHorizontal: space.xl, paddingTop: space.xl },
  hint: { paddingHorizontal: space.xl, paddingBottom: space.sm },
  chart: { flexDirection: 'row', paddingHorizontal: space.xl, gap: space.sm, alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center', gap: 4 },
  barArea: { width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', maxWidth: 36, borderRadius: 6 },
  barFront: { position: 'absolute', bottom: 0 },
  legend: { flexDirection: 'row', gap: space.lg, paddingHorizontal: space.xl, paddingTop: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  dayChart: { paddingHorizontal: space.xl, gap: 6, alignItems: 'flex-end' },
  dayColumn: { width: 22, alignItems: 'center', gap: 4 },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 64,
    justifyContent: 'center',
  },
  shareRow: { paddingHorizontal: space.xl, paddingVertical: space.sm, gap: 6 },
  shareLine: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
});
