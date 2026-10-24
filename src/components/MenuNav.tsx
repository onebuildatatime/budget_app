import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, Modal, FlatList, SafeAreaView, Animated, Dimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type MenuItem = {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
};

type MenuNavProps = {
  items: MenuItem[];
};

export function MenuNav({ items }: MenuNavProps) {
  const theme = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const slideAnim = useRef(new Animated.Value(-Dimensions.get('window').width * 0.7)).current;

  useEffect(() => {
    if (showMenu) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -Dimensions.get('window').width * 0.7,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showMenu, slideAnim]);

  return (
    <>
      {/* Menu Button - Top Left */}
      <Pressable
        style={[
          styles.menuButtonContainer,
          { paddingLeft: 16, paddingTop: 16 },
        ]}
        onPress={() => setShowMenu(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View
          style={[
            styles.button,
            {
              backgroundColor: theme.accent,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <Text style={[styles.icon, { color: theme.accentText }]}>☰</Text>
        </View>
      </Pressable>

      {/* Menu Modal - Slide from Left */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setShowMenu(false)} />
        <Animated.View
          style={[
            styles.menuPanel,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Menu</Text>
              <Pressable onPress={() => setShowMenu(false)}>
                <Text style={[styles.closeButton, { color: theme.accent }]}>✕</Text>
              </Pressable>
            </View>

            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.menuItem, { borderBottomColor: theme.divider }]}
                  onPress={() => {
                    item.onPress();
                    setShowMenu(false);
                  }}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                </Pressable>
              )}
            />
          </SafeAreaView>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: {
    fontSize: 26,
    fontWeight: '800',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '70%',
    backgroundColor: 'transparent',
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
