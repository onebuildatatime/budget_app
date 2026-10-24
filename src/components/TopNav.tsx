import React from 'react';
import { View, StyleSheet, Pressable, Text, useWindowDimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type TopNavProps = {
  onLeftPress?: () => void;
  onCenterPress?: () => void;
  onRightPress?: () => void;
  leftIcon?: string;
  centerIcon?: string;
  rightIcon?: string;
  centerLabel?: string;
};

export function TopNav({
  onLeftPress,
  onCenterPress,
  onRightPress,
  leftIcon = '←',
  centerIcon = '📊',
  rightIcon = '⚙️',
  centerLabel = '',
}: TopNavProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.container, { backgroundColor: theme.hero, borderBottomColor: theme.heroShadow }]}>
      {/* Left Icon */}
      <Pressable
        style={[styles.iconButton, { width: width * 0.2 }]}
        onPress={onLeftPress}
      >
        <Text style={styles.icon}>{leftIcon}</Text>
      </Pressable>

      {/* Center Icon/Label */}
      <View style={[styles.centerArea, { width: width * 0.6 }]}>
        <Pressable onPress={onCenterPress} style={styles.centerContent}>
          <Text style={styles.centerIcon}>{centerIcon}</Text>
          {centerLabel && <Text style={[styles.centerLabel, { color: theme.heroText }]}>{centerLabel}</Text>}
        </Pressable>
      </View>

      {/* Right Icon */}
      <Pressable
        style={[styles.iconButton, { width: width * 0.2 }]}
        onPress={onRightPress}
      >
        <Text style={styles.icon}>{rightIcon}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    paddingHorizontal: 8,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  icon: {
    fontSize: 28,
  },
  centerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  centerContent: {
    alignItems: 'center',
  },
  centerIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  centerLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
