import React, { useRef, ReactNode } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated, ViewStyle, ActivityIndicator, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadows, animation } from '../theme';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'gradient' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle | ViewStyle[];
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  disabled = false, loading = false, style, icon, iconRight, children,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: animation.instant, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, ...animation.springBouncy, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48;
  const ts = size === 'sm' ? typography.buttonSmall : typography.button;

  const bg: Record<string, ViewStyle> = {
    primary: { backgroundColor: colors.brand[500], ...shadows.glow },
    secondary: { backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default },
    danger: { backgroundColor: colors.error },
    gradient: {},
    ghost: { backgroundColor: 'transparent' },
  };

  const textColor: Record<string, string> = {
    primary: colors.text.inverse,
    secondary: colors.text.primary,
    danger: colors.text.inverse,
    gradient: colors.text.inverse,
    ghost: colors.text.primary,
  };

  const content = (
    <View style={[styles.inner, icon || iconRight ? styles.innerWithIcon : null]}>
      {icon}
      {loading
        ? <ActivityIndicator color={textColor[variant]} />
        : children ?? <Text style={[ts, { color: textColor[variant] }]}>{title}</Text>
      }
      {iconRight}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }]}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled || loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ disabled: disabled || loading, busy: loading }}
          style={[styles.base, { height }, disabled && { opacity: 0.4 }, style]}
        >
          <LinearGradient colors={colors.gradients.brand} style={[styles.gradientFill, { height }]}>
            {content}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[styles.base, bg[variant], { height }, disabled && { opacity: 0.4 }, style]}
      >
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  innerWithIcon: {
    gap: spacing.sm,
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
