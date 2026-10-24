import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { biometricLabel, unlock } from '../logic/device';
import { usePalette, type as t, space } from '../ui/theme';
import { Screen, Button } from '../ui/primitives';

export function LockScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const p = usePalette();
  const [label, setLabel] = useState('Face ID');
  const [failed, setFailed] = useState(false);

  const attempt = useCallback(async () => {
    setFailed(false);
    if (await unlock()) onUnlocked();
    else setFailed(true);
  }, [onUnlocked]);

  useEffect(() => {
    biometricLabel().then(setLabel);
    attempt();
  }, [attempt]);

  return (
    <Screen>
      <View style={styles.center}>
        <View style={[styles.icon, { backgroundColor: p.fill }]}>
          <Feather name="lock" size={30} color={p.accent} />
        </View>
        <Text style={[t.title, { color: p.text }]}>Budget Buddy is locked</Text>
        {failed && (
          <Text style={[t.body, { color: p.textSecondary, marginTop: space.sm }]}>Couldn't confirm it's you.</Text>
        )}
      </View>
      <View style={styles.actions}>
        <Button label={`Unlock with ${label}`} onPress={attempt} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xxl },
  icon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
  actions: { paddingHorizontal: space.xl, paddingBottom: space.xxl },
});
