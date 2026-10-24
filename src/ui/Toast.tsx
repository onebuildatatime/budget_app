import React, { useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { create } from 'zustand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette, type as t, space } from './theme';

type Tone = 'info' | 'warning' | 'over' | 'success';
type ToastState = { message: string | null; tone: Tone; key: number; show: (message: string, tone?: Tone) => void };

export const useToast = create<ToastState>((set) => ({
  message: null,
  tone: 'info',
  key: 0,
  show: (message, tone = 'info') => set((s) => ({ message, tone, key: s.key + 1 })),
}));

export function ToastHost() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { message, tone, key } = useToast();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(3200),
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => finished && useToast.setState({ message: null }));
    return () => anim.stop();
  }, [key, message, opacity]);

  if (!message) return null;
  const color = tone === 'over' ? p.negative : tone === 'warning' ? p.warning : tone === 'success' ? p.positive : p.accent;
  const icon = tone === 'over' || tone === 'warning' ? 'alert-triangle' : tone === 'success' ? 'check-circle' : 'info';

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          top: insets.top + space.sm,
          opacity,
          backgroundColor: p.dark ? p.elevated : '#1C1C1F',
        },
      ]}
    >
      <Feather name={icon} size={18} color={color} />
      <Text style={[t.body, styles.text]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.lg,
    right: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 1000,
  },
  text: { color: '#FFFFFF', flex: 1 },
});
