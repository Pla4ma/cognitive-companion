import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Inbox } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        {icon ?? <Inbox size={40} color={colors.text.tertiary} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {ctaLabel && onCta && (
        <Button title={ctaLabel} onPress={onCta} variant="primary" size="sm" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.bg.elevated,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3, color: colors.text.primary,
    textAlign: 'center', marginBottom: spacing.xs,
  },
  desc: {
    ...typography.bodyMedium, color: colors.text.tertiary,
    textAlign: 'center', marginBottom: spacing.lg,
  },
});
