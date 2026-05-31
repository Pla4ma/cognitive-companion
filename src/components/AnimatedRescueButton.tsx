// ══════════════════════════════════════════════════════════════
// AnimatedRescueButton — Spring-animated rescue CTA
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { Text, StyleSheet, Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { Zap } from 'lucide-react-native'
import { colors, spacing, radius, typography } from '../../theme'

interface AnimatedRescueButtonProps {
  visible: boolean
  protocolHint: string
  onPress: () => void
  accessibilityHint?: string
}

export function AnimatedRescueButton({ visible, protocolHint, onPress, accessibilityHint }: AnimatedRescueButtonProps) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  if (!visible) return null

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <Animated.View style={animStyle}>
        <Pressable
          onPress={() => {
            scale.value = withSpring(0.96, { damping: 15, stiffness: 400 }, () => {
              scale.value = withSpring(1, { damping: 12, stiffness: 300 })
            })
            onPress()
          }}
          style={styles.btn}
          accessibilityRole="button"
          accessibilityLabel="Start rescue session"
          accessibilityHint={accessibilityHint}
          accessibilityState={{ busy: false }}
        >
          <LinearGradient colors={colors.gradients.brand} style={styles.gradient}>
            <Zap size={22} color={colors.text.inverse} />
            <Text style={styles.text}>Rescue Me</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
      {protocolHint ? (
        <Text style={styles.hint}>{protocolHint}</Text>
      ) : null}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  btn: { borderRadius: radius.lg, overflow: 'hidden' },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  text: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '700', fontSize: 18 },
  hint: { ...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.xs },
})
