import { useColorScheme, type TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export type Palette = {
  bg: string;
  elevated: string;
  fill: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  hairline: string;
  accent: string;
  onAccent: string;
  positive: string;
  warning: string;
  negative: string;
  scrim: string;
  dark: boolean;
};

const light = {
  bg: '#FFFFFF',
  elevated: '#FFFFFF',
  fill: '#F2F2F5',
  text: '#111114',
  textSecondary: '#6B6B73',
  textTertiary: '#A1A1A8',
  hairline: '#E6E6EA',
  positive: '#1F9D55',
  warning: '#C98A00',
  negative: '#D93B3B',
  scrim: 'rgba(0,0,0,0.32)',
  dark: false,
};

const dark = {
  bg: '#0B0B0D',
  elevated: '#18181B',
  fill: '#1F1F23',
  text: '#F4F4F5',
  textSecondary: '#9C9CA3',
  textTertiary: '#63636A',
  hairline: '#26262A',
  positive: '#3CCB7F',
  warning: '#E5A826',
  negative: '#F06464',
  scrim: 'rgba(0,0,0,0.6)',
  dark: true,
};

export function usePalette(): Palette {
  const scheme = useColorScheme();
  const appTheme = useTheme();
  const base = scheme === 'dark' ? dark : light;
  return { ...base, accent: appTheme.accent, onAccent: '#FFFFFF' };
}

export const type = {
  display: { fontSize: 40, fontWeight: '600', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  title: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  body: { fontSize: 16, fontWeight: '400' },
  bodyStrong: { fontSize: 16, fontWeight: '600' },
  amount: { fontSize: 16, fontWeight: '500', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 13, fontWeight: '400' },
  overline: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export function toneColor(p: Palette, ratio: number) {
  if (ratio > 1) return p.negative;
  if (ratio >= 0.85) return p.warning;
  return p.accent;
}
