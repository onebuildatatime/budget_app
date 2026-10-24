import React, { type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette, type as t, space } from './theme';

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: p.bg, paddingTop: insets.top }, style]}>{children}</View>
  );
}

export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const p = usePalette();
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Back">
            <Feather name="chevron-left" size={26} color={p.text} />
          </Pressable>
        )}
      </View>
      <Text style={[t.bodyStrong, { color: p.text, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function LargeTitle({ children, right }: { children: string; right?: ReactNode }) {
  const p = usePalette();
  return (
    <View style={styles.largeTitle}>
      <Text style={[t.title, { color: p.text, fontSize: 28 }]}>{children}</Text>
      {right}
    </View>
  );
}

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  const p = usePalette();
  return (
    <View style={styles.sectionLabel}>
      <Text style={[t.overline, { color: p.textSecondary }]}>{children}</Text>
      {right}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const p = usePalette();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: p.hairline, marginLeft: inset }} />;
}

export function ProgressBar({ ratio, color, height = 4 }: { ratio: number; color: string; height?: number }) {
  const p = usePalette();
  return (
    <View style={{ height, borderRadius: height, backgroundColor: p.fill, overflow: 'hidden' }}>
      <View
        style={{
          width: `${Math.max(0, Math.min(ratio, 1)) * 100}%`,
          height: '100%',
          borderRadius: height,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}) {
  const p = usePalette();
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? p.accent : p.fill,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[t.bodyStrong, { color: primary ? p.onAccent : p.text }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const p = usePalette();
  return (
    <View style={[styles.segmented, { backgroundColor: p.fill }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segment, active && { backgroundColor: p.elevated, ...styles.segmentActive }]}
          >
            <Text style={[t.caption, { color: active ? p.text : p.textSecondary, fontWeight: '600' }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  variant = 'solid',
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: 'solid' | 'subtle';
}) {
  const p = usePalette();
  const subtle = variant === 'subtle';
  const background = selected ? (subtle ? p.accent : p.text) : subtle ? 'transparent' : p.fill;
  const color = selected ? (subtle ? p.onAccent : p.bg) : subtle ? p.textSecondary : p.text;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: background },
        subtle && !selected && { borderWidth: StyleSheet.hairlineWidth, borderColor: p.textTertiary },
      ]}
    >
      <Text style={[t.caption, { color, fontWeight: '500' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
  },
  headerSide: { width: 64 },
  largeTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    paddingBottom: space.md,
  },
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.sm,
  },
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
