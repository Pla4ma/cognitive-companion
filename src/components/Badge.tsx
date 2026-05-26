import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  style?: ViewStyle;
}

const dotColor: Record<BadgeVariant, string> = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.error,
  info: colors.info,
};

const bgColor: Record<BadgeVariant, string> = {
  success: 'rgba(16,185,129,0.12)',
  warning: 'rgba(245,158,11,0.12)',
  danger: 'rgba(239,68,68,0.12)',
  info: 'rgba(59,130,246,0.12)',
};

export function Badge({ label, variant, style }: BadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: bgColor[variant] }, style]}>
      <View style={[styles.dot, { backgroundColor: dotColor[variant] }]} />
      <Text style={[styles.label, { color: dotColor[variant] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    gap: spacing.xxs,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { ...typography.labelSmall },
});
