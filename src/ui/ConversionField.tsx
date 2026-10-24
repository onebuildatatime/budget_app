import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { usePalette, type as t, space } from './theme';

/** For trips in a foreign currency: optionally show amounts in the user's main currency too. */
export function ConversionField({
  tripCurrency,
  homeCurrency,
  enabled,
  rate,
  onChange,
}: {
  tripCurrency: string;
  homeCurrency: string;
  enabled: boolean;
  rate: string;
  onChange: (enabled: boolean, rate: string) => void;
}) {
  const p = usePalette();
  if (tripCurrency === homeCurrency) return null;
  return (
    <View style={styles.root}>
      <View style={styles.switchRow}>
        <Text style={[t.body, { color: p.text, flex: 1 }]}>Also show amounts in {homeCurrency}</Text>
        <Switch
          value={enabled}
          onValueChange={(v) => onChange(v, rate)}
          trackColor={{ true: p.accent, false: p.hairline }}
          accessibilityLabel={`Also show amounts in ${homeCurrency}`}
        />
      </View>
      {enabled && (
        <>
          <View style={styles.rateRow}>
            <Text style={[t.body, { color: p.text }]}>1 {tripCurrency} =</Text>
            <TextInput
              value={rate}
              onChangeText={(v) => onChange(true, v.replace(/[^0-9.,]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={p.textTertiary}
              keyboardType="decimal-pad"
              accessibilityLabel="Exchange rate"
              style={[t.amount, styles.input, { color: p.text, backgroundColor: p.fill }]}
            />
            <Text style={[t.body, { color: p.text }]}>{homeCurrency}</Text>
          </View>
          <Text style={[t.caption, { color: p.textTertiary, marginTop: space.xs }]}>
            Check today's rate in your banking app. You can update it any time.
          </Text>
        </>
      )}
    </View>
  );
}

export const parseRate = (rate: string) => {
  const n = parseFloat(rate.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const styles = StyleSheet.create({
  root: { marginTop: space.lg },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  input: { flex: 1, borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.sm, textAlign: 'right' },
});
