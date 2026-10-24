import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { currency, type Transaction } from '../../budgetModel';
import { usePalette, type as t, space } from './theme';
import { deviceLocale } from '../logic/locale';

export function TransactionRow({
  transaction,
  categoryName,
  currencyCode,
  showDate = true,
  onPress,
}: {
  transaction: Transaction;
  categoryName: string;
  currencyCode: string;
  showDate?: boolean;
  onPress?: () => void;
}) {
  const p = usePalette();
  const income = transaction.kind === 'income';
  const note = transaction.note?.trim();
  const title = note || (income ? 'Income' : transaction.subcategory || categoryName);
  const date = new Date(transaction.happenedAt).toLocaleDateString(deviceLocale, { month: 'short', day: 'numeric' });
  const context = income
    ? null
    : note
      ? [categoryName, transaction.subcategory].filter(Boolean).join(' › ')
      : transaction.subcategory
        ? categoryName
        : null;
  const subtitle = [context, showDate ? date : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: p.fill }]}
    >
      <View style={[styles.icon, { backgroundColor: p.fill }]}>
        <Feather
          name={income ? 'arrow-down-left' : 'arrow-up-right'}
          size={16}
          color={income ? p.positive : p.textSecondary}
        />
      </View>
      <View style={styles.body}>
        <Text style={[t.body, { color: p.text }]} numberOfLines={1}>
          {title}
        </Text>
        {(!!subtitle || transaction.recurring) && (
          <View style={styles.subtitle}>
            {transaction.recurring && <Feather name="repeat" size={12} color={p.textSecondary} />}
            <Text style={[t.caption, { color: p.textSecondary, flexShrink: 1 }]} numberOfLines={1}>
              {subtitle || 'Monthly'}
            </Text>
          </View>
        )}
      </View>
      <Text style={[t.amount, { color: income ? p.positive : p.text }]}>
        {income ? '+' : '−'}
        {currency(transaction.amount, currencyCode)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    gap: space.md,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  subtitle: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
});
