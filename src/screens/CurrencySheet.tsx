import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useBudgetStore } from '../store/useBudgetStore';
import { currencyOptions, featuredCurrencyCodes } from '../../budgetModel';
import { usePalette, type as t, space } from '../ui/theme';
import { Sheet } from '../ui/Sheet';

const ordered = [
  ...featuredCurrencyCodes.flatMap((code) => currencyOptions.filter((o) => o.code === code)),
  ...currencyOptions.filter((o) => !featuredCurrencyCodes.includes(o.code)),
];

export function CurrencySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const p = usePalette();
  const preferences = useBudgetStore((s) => s.preferences);
  const updateState = useBudgetStore((s) => s.updateState);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const list = q ? ordered.filter((o) => o.code.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)) : ordered;

  const choose = (code: string) => {
    updateState({ preferences: { ...preferences, currencyCode: code } });
    setQuery('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[t.title, { color: p.text }]}>Currency</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Feather name="x" size={22} color={p.textSecondary} />
          </Pressable>
        </View>
        <Text style={[t.caption, { color: p.textSecondary, marginTop: space.xs }]}>
          Changes how amounts are shown. Existing amounts aren't converted.
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={p.textTertiary}
          autoCorrect={false}
          style={[t.body, styles.search, { color: p.text, backgroundColor: p.fill }]}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(o) => o.code}
        keyboardShouldPersistTaps="handled"
        style={{ height: 380 }}
        renderItem={({ item }) => {
          const selected = item.code === preferences.currencyCode;
          return (
            <Pressable
              onPress={() => choose(item.code)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: p.fill }]}
            >
              <Text style={[t.bodyStrong, { color: p.text, width: 48 }]}>{item.code}</Text>
              <Text style={[t.body, { color: p.text, flex: 1 }]}>{item.label}</Text>
              {selected && <Feather name="check" size={18} color={p.accent} />}
            </Pressable>
          );
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space.xl, paddingBottom: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: space.sm },
  search: { borderRadius: 10, paddingHorizontal: space.md, paddingVertical: space.sm + 2, marginTop: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 14 },
});
