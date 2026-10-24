import React from 'react';
import { View, StyleSheet, Pressable, Text, useWindowDimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type NavIcon = {
  icon: string;
  onPress: () => void;
  isActive?: boolean;
};

type BottomNavIconProps = {
  leftIcon: NavIcon;
  centerIcon: NavIcon;
  rightIcon: NavIcon;
};

export function BottomNavIcon({ leftIcon, centerIcon, rightIcon }: BottomNavIconProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const renderButton = (nav: NavIcon, flex: number) => (
    <Pressable
      style={[
        styles.button,
        { width: width * flex, backgroundColor: nav.isActive ? theme.accentSoft : 'transparent' },
      ]}
      onPress={nav.onPress}
    >
      <Text style={[styles.icon, { color: nav.isActive ? theme.accent : theme.textMuted }]}>
        {nav.icon}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
      {renderButton(leftIcon, 0.25)}
      {renderButton(centerIcon, 0.5)}
      {renderButton(rightIcon, 0.25)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  icon: {
    fontSize: 32,
  },
});
