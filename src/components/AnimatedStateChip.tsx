import React, { useCallback } from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated'
import { colors, spacing, radius, typography } from '../theme'
import type { UserState } from '../types'

interface AnimatedStateChipProps {
  id: UserState
  emoji: string
  label: string
  color: string
  isSelected: boolean
  onSelect: (state: UserState) => void
  width: number
}

export function AnimatedStateChip({ id, emoji, label, color, isSelected, onSelect, width }: AnimatedStateChipProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 200 })
    })
    onSelect(id)
  }, [id, onSelect])

  return (
    <Animated.View style={[{ width }, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.chip,
          isSelected && { borderColor: color, backgroundColor: color + '15' },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${label} state`}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.label, isSelected && { color }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.xs,
  },
  emoji: { fontSize: 22 },
  label: { ...typography.caption, color: colors.text.secondary, textAlign: 'center' },
})
