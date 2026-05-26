import React, { useEffect, useRef, useCallback } from 'react';
import { Text, StyleSheet, Animated, Pressable, ViewStyle } from 'react-native';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react-native';
import { colors, spacing, radius, typography, zIndex, animation } from '../theme';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  style?: ViewStyle;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colorMap: Record<ToastVariant, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.info,
};

export function Toast({ message, variant = 'info', visible, onDismiss, duration = 3000, style }: ToastProps) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const Icon = iconMap[variant];

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, ...animation.spring, useNativeDriver: true }).start();
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, { toValue: -80, duration: animation.fast, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }, style]}>
      <Icon size={18} color={colorMap[variant]} />
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
      <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss">
        <X size={16} color={colors.text.tertiary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    zIndex: zIndex.toast,
    elevation: zIndex.toast,
  },
  message: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
  },
});
