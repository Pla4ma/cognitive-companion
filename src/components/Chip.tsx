import React, { useRef, useCallback } from 'react';
import { Text, Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, typography, animation } from '../theme';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, style }: ChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    void Haptics.selectionAsync();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: animation.instant, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, ...animation.springBouncy, useNativeDriver: true }),
    ]).start();
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={[
          styles.base,
          active ? styles.active : styles.inactive,
          style,
        ]}
      >
        <Text style={[styles.label, { color: active ? colors.text.inverse : colors.text.secondary }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  active: {
    backgroundColor: colors.brand[500],
  },
  inactive: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  label: { ...typography.labelSmall },
});
