// ══════════════════════════════════════════════════════════════
// INTENT — Shared UI Components
// Reusable, animated, theme-aware
// ══════════════════════════════════════════════════════════════

import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Pressable, ViewStyle, TextStyle,
  ActivityIndicator, Dimensions,
} from 'react-native'
import Animated, { useSharedValue, withTiming, withSpring, useAnimatedStyle, useAnimatedProps, withRepeat } from 'react-native-reanimated'
import { Svg, Circle } from 'react-native-svg'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)
import { colors, spacing, radius, typography, shadows, glass } from '../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ══════════════════════════════════════════════════════════════
// SCREEN WRAPPER — Consistent layout + animation
// ══════════════════════════════════════════════════════════════

interface ScreenProps {
  children: React.ReactNode
  style?: ViewStyle
  scrollable?: boolean
  gradient?: string[]
}

export function Screen({ children, style, scrollable = true, gradient }: ScreenProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(12)

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 })
    translateY.value = withSpring(0, { damping: 20, stiffness: 300 })
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const content = (
    <Animated.View style={[animStyle, style]}>
      {children}
    </Animated.View>
  )

  return (
    <View
      style={screenStyles.container}
    >
      {gradient && (
        <LinearGradient colors={gradient as [string, string, ...string[]]} style={StyleSheet.absoluteFillObject} />
      )}
      {scrollable ? (
        <ScrollView
          style={screenStyles.scroll}
          contentContainerStyle={screenStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          accessible={false}
        >
          {content}
        </ScrollView>
      ) : content}
    </View>
  )
}

const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.xxxl },
})

// ══════════════════════════════════════════════════════════════
// GLASS CARD — The primary surface component
// ════════════════════════════════════════════════════════──────

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'elevated' | 'subtle' | 'glow'
  onPress?: () => void
  haptic?: boolean
  accessibilityLabel?: string
  accessibilityRole?: 'button' | 'link' | 'none'
  accessibilityHint?: string
}

export function Card({ children, style, variant = 'default', onPress, haptic = true, accessibilityLabel, accessibilityRole, accessibilityHint }: CardProps) {
  const scale = useSharedValue(1)

  const handlePressIn = useCallback(() => {
    if (onPress) scale.value = withSpring(0.97, { damping: 15, stiffness: 400 })
  }, [onPress])

  const handlePressOut = useCallback(() => {
    if (onPress) scale.value = withSpring(1, { damping: 12, stiffness: 300 })
  }, [onPress])

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: colors.border.subtle,
    },
    elevated: {
      backgroundColor: colors.bg.elevated,
      borderWidth: 1,
      borderColor: colors.border.default,
      ...shadows.md,
    },
    subtle: {
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.04)',
    },
    glow: {
      backgroundColor: colors.bg.card,
      borderWidth: 1,
      borderColor: `${colors.brand[500]}33`,
      ...shadows.glow,
    },
  }

  const content = (
    <Animated.View style={[scaleStyle]}>
      <BlurView intensity={glass.medium.blur} style={[cardStyles.base, variantStyles[variant], style]}>
        {children}
      </BlurView>
    </Animated.View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole ?? 'button'}
      >
        {content}
      </Pressable>
    )
  }

  return content
}

const cardStyles = StyleSheet.create({
  base: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
  },
})

// ══════════════════════════════════════════════════════════════
// BUTTON — Primary, secondary, ghost, danger
// ══════════════════════════════════════════════════════════════

interface ButtonProps {
  title?: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  children?: React.ReactNode
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: 'button' | 'link' | 'tab' | 'checkbox' | 'radio' | 'switch' | 'menuitem'
}

export function Button({
  title, onPress, variant = 'primary', size = 'md',
  icon, iconRight, disabled = false, loading = false, style,
  accessibilityLabel, accessibilityHint, accessibilityRole = 'button',
}: ButtonProps) {
  const scale = useSharedValue(1)

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    scale.value = withTiming(0.95, { duration: 80 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 400 })
    })
    onPress()
  }

  const height = size === 'sm' ? 40 : size === 'lg' ? 56 : 48
  const textStyle = size === 'sm' ? typography.buttonSmall : typography.button

  const variants: Record<string, ViewStyle> = {
    primary: { backgroundColor: colors.brand[500], ...shadows.glow },
    secondary: { backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: colors.error },
    gradient: { ...shadows.glow },
  }

  const textColors: Record<string, string> = {
    primary: colors.text.inverse,
    secondary: colors.text.primary,
    ghost: colors.text.secondary,
    danger: colors.text.inverse,
    gradient: colors.text.inverse,
  }

  return (
    <Animated.View style={[scaleStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ disabled: disabled || loading }}
        style={[
          buttonStyles.base,
          variants[variant],
          { height },
          disabled && { opacity: 0.4 },
          style,
        ]}
      >
        {variant === 'gradient' && (
          <LinearGradient colors={colors.gradients.brand} style={StyleSheet.absoluteFillObject} />
        )}
        {loading ? (
          <ActivityIndicator color={textColors[variant]} />
        ) : (
          <View style={buttonStyles.content}>
            {icon}
            <Text style={[textStyle, { color: textColors[variant] }]}>{title}</Text>
            {iconRight}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

const buttonStyles = StyleSheet.create({
  base: {
    borderRadius: radius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
})

// ══════════════════════════════════════════════════════════════
// CHART — Simple bar chart with animations
// ════════════════════════════════════════════════════════──────

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
  showValues?: boolean
  animated?: boolean
}

export function BarChart({ data, height = 100, showValues = true, animated = true }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const values = useSharedValue(data.map(d => animated ? 0 : d.value / maxValue))

  useEffect(() => {
    if (animated) {
      // Animate each bar with staggered delay via JS
      data.forEach((d, i) => {
        setTimeout(() => {
          values.modify((prev) => {
            const next = [...prev]
            next[i] = d.value / maxValue
            return next
          })
        }, i * 80)
      })
    } else {
      values.value = data.map(d => d.value / maxValue)
    }
  }, [data])

  return (
    <View style={chartStyles.container}>
      <View style={[chartStyles.chart, { height }]}>
        {data.map((item, i) => (
          <BarItem key={item.label} item={item} index={i} height={height} showValues={showValues} />
        ))}
      </View>
    </View>
  )
}

function BarItem({ item, index, height, showValues }: { item: { label: string; value: number; color?: string }; index: number; height: number; showValues: boolean }) {
  const barHeight = useSharedValue(0)
  
  useEffect(() => {
    barHeight.value = withTiming(item.value > 0 ? Math.max(2, (item.value / Math.max(...[item.value])) * (height - 24)) : 2, { duration: 600, delay: index * 80 })
  }, [item.value])

  const barStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }))

  return (
    <View style={chartStyles.bar}>
      <View style={chartStyles.barContainer}>
        <Animated.View
          style={[
            chartStyles.barFill,
            barStyle,
            { backgroundColor: item.color ?? colors.brand[500] },
          ]}
        />
      </View>
      {showValues && item.value > 0 && (
        <Text style={[typography.labelSmall, { color: colors.text.tertiary }]}>
          {item.value}
        </Text>
      )}
      <Text style={[typography.caption, { color: colors.text.tertiary }]}>
        {item.label}
      </Text>
    </View>
  )
}

const chartStyles = StyleSheet.create({
  container: { width: '100%' },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  bar: { flex: 1, alignItems: 'center' },
  barContainer: {
    height: 'auto',
    justifyContent: 'flex-end',
    width: '100%',
    minHeight: 40,
  },
  barFill: {
    width: '70%',
    alignSelf: 'center',
    borderRadius: radius.xs,
    minHeight: 2,
  },
})

// ══════════════════════════════════════════════════════════════
// PROGRESS RING — Animated circular progress
// ════════════════════════════════════════════════════════──────

interface ProgressRingProps {
  progress: number // 0 to 1
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  children?: React.ReactNode
}

export function ProgressRing({
  progress, size = 120, strokeWidth = 8,
  color = colors.brand[500], backgroundColor = colors.border.subtle,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progressValue = useSharedValue(0)

  useEffect(() => {
    progressValue.value = withTiming(Math.min(Math.max(progress, 0), 1), { duration: 950 })
  }, [progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progressValue.value),
  }))

  return (
    <View
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
      accessibilityLabel={`Session progress: ${Math.round(progress * 100)}% complete`}
      style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  )
}

// ══════════════════════════════════════════════════════════════
// STREAK FLAME — Animated streak indicator
// ════════════════════════════════════════════════════════════──

interface StreakBadgeProps {
  days: number
  size?: 'sm' | 'md' | 'lg'
}

export function StreakBadge({ days, size = 'md' }: StreakBadgeProps) {
  const pulse = useSharedValue(1)

  useEffect(() => {
    if (days > 0) {
      pulse.value = withRepeat(
        withTiming(1.1, { duration: 1500 }, () => {
          pulse.value = withTiming(1, { duration: 1500 })
        }),
        -1,
        true,
      )
    } else {
      pulse.value = 1
    }
  }, [days])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }))

  const sizes = { sm: 32, md: 48, lg: 72 }
  const s = sizes[size]

  return (
    <Animated.View style={[pulseStyle]}>
      <View style={{
        width: s, height: s, borderRadius: s / 2,
        backgroundColor: days > 0 ? `${colors.accent.orange}22` : colors.bg.surface,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: days > 0 ? `${colors.accent.orange}44` : colors.border.subtle,
      }}>
        <Text style={{ fontSize: s * 0.4 }}>{days > 0 ? '🔥' : '💤'}</Text>
      </View>
    </Animated.View>
  )
}

// ══════════════════════════════════════════════════════════════
// SECTION HEADER
// ════════════════════════════════════════════════════════════──

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; onPress: () => void }
  icon?: React.ReactNode
}

export function SectionHeader({ title, subtitle, action, icon }: SectionHeaderProps) {
  return (
    <View style={sectionStyles.container}>
      <View style={sectionStyles.left}>
        {icon}
        <View>
          <Text style={[typography.label, { color: colors.text.secondary }]}>{title}</Text>
          {subtitle && <Text style={[typography.caption, { color: colors.text.tertiary }]}>{subtitle}</Text>}
        </View>
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={[typography.bodyMedium, { color: colors.brand[400] }]}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const sectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
})

// ══════════════════════════════════════════════════════════════
// EMPTY STATE
// ════════════════════════════════════════════════════════════──

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card variant="subtle" style={{ padding: spacing.xxl, alignItems: 'center' }}>
      <Text style={{ fontSize: 48, marginBottom: spacing.md }}>{icon}</Text>
      <Text style={[typography.h3, { color: colors.text.primary, textAlign: 'center', marginBottom: spacing.xs }]}>
        {title}
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.text.tertiary, textAlign: 'center', marginBottom: spacing.lg }]}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="primary" size="sm" />
      )}
    </Card>
  )
}

// ════════════════════════════════════════════════════════════──
// BOTTOM TAB BAR — Proper tab navigation
// ════════════════════════════════════════════════════════════──
interface TabItem {
  key: string
  label: string
  icon: string
  route: string
}

interface TabBarProps {
  tabs: TabItem[]
  activeKey: string
  onTabPress: (key: string) => void
}

export function TabBar({ tabs, activeKey, onTabPress }: TabBarProps) {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.bg.card,
      borderTopWidth: 1,
      borderTopColor: colors.border.subtle,
      paddingBottom: 20,
      paddingTop: 8,
    }}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 20 }}>{tab.icon}</Text>
            <Text style={{
              fontSize: 10,
              color: isActive ? colors.brand[400] : colors.text.tertiary,
              fontWeight: isActive ? '600' : '400',
              marginTop: 2,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

// Re-export TabBar as named export (already exported above)
