import React, { useEffect } from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import Animated, { useAnimatedStyle, withSpring, withTiming, useSharedValue, FadeIn, SlideInUp } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Zap } from 'lucide-react-native'
import { colors, spacing, radius, typography } from '../theme'

interface AnimatedRescueButtonProps {
  visible: boolean
  protocolHint: string
  onPress: () => void
}

export function AnimatedRescueButton({ visible, protocolHint, onPress }: AnimatedRescueButtonProps) {
  const translateY = useSharedValue(40)
  const opacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 })
      opacity.value = withTiming(1, { duration: 200 })
    } else {
      translateY.value = withTiming(40, { duration: 150 })
      opacity.value = withTiming(0, { duration: 150 })
    }
  }, [visible])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  if (!visible) return null

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.85}>
        <LinearGradient colors={colors.gradients.brand} style={styles.gradient}>
          <Zap size={22} color={colors.text.inverse} />
          <Text style={styles.text}>Rescue Me</Text>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.hint}>{protocolHint}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  btn: { borderRadius: radius.lg, overflow: 'hidden' },
  gradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md,
  },
  text: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '700', fontSize: 18 },
  hint: { ...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.xs },
})
