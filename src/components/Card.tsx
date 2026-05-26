import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Animated, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, radius, shadows, animation, glass } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'subtle' | 'glow';
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Card({ children, style, variant = 'default', onPress, accessibilityLabel }: CardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.97, ...animation.spring, useNativeDriver: true }).start();
  }, []);

  const handleOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, ...animation.spring, useNativeDriver: true }).start();
  }, []);

  const variantMap: Record<string, ViewStyle> = {
    default: { backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.subtle },
    elevated: { backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default, ...shadows.md },
    subtle: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    glow: { backgroundColor: colors.bg.card, borderWidth: 1, borderColor: `${colors.brand[500]}33`, ...shadows.glow },
  };

  const content = (
    <Animated.View style={{ transform: [{ scale }] }} accessibilityLabel={accessibilityLabel}>
      <BlurView intensity={glass.medium.blur} style={[styles.base, variantMap[variant], style]}>
        {children}
      </BlurView>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.xxl, overflow: 'hidden' },
});
