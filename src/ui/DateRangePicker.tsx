import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { fromDateKey, toDateKey } from '../logic/period';
import { usePalette, type as t } from './theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Month calendar: first tap picks the start, second tap the end. */
export function DateRangePicker({
  start,
  end,
  onChange,
}: {
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
}) {
  const p = usePalette();
  const initial = start ? fromDateKey(start) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const todayKey = toDateKey(new Date());

  const pick = (day: number) => {
    const key = toDateKey(new Date(year, month, day, 12));
    if (!start || end || key < start) onChange(key, null);
    else onChange(start, key);
  };

  return (
    <View>
      <View style={styles.header}>
        <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))} hitSlop={10} accessibilityLabel="Previous month">
          <Feather name="chevron-left" size={20} color={p.textSecondary} />
        </Pressable>
        <Text style={[t.bodyStrong, { color: p.text }]}>
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))} hitSlop={10} accessibilityLabel="Next month">
          <Feather name="chevron-right" size={20} color={p.textSecondary} />
        </Pressable>
      </View>
      <View style={styles.grid}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`w${i}`} style={[t.caption, styles.weekday, { color: p.textTertiary }]}>
            {d}
          </Text>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`e${i}`} style={styles.cell} />;
          const key = toDateKey(new Date(year, month, day, 12));
          const isEdge = key === start || key === end;
          const inRange = !!start && !!end && key > start && key < end;
          return (
            <Pressable
              key={key}
              onPress={() => pick(day)}
              style={styles.cell}
              accessibilityLabel={fromDateKey(key).toDateString()}
            >
              {inRange && <View style={[StyleSheet.absoluteFill, styles.band, { backgroundColor: p.fill }]} />}
              {isEdge && start && end && start !== end && (
                <View
                  style={[
                    styles.halfBand,
                    { backgroundColor: p.fill },
                    key === start ? { left: '50%' } : { right: '50%' },
                  ]}
                />
              )}
              <View style={[styles.dayCircle, isEdge && { backgroundColor: p.accent }]}>
                <Text
                  style={[
                    t.body,
                    {
                      color: isEdge ? p.onAccent : p.text,
                      fontWeight: key === todayKey || isEdge ? '700' : '400',
                    },
                  ]}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', paddingVertical: 4 },
  cell: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
  band: { top: 4, bottom: 4 },
  halfBand: { position: 'absolute', top: 4, bottom: 4, left: 0, right: 0 },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
