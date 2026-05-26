// ══════════════════════════════════════════════════════════════
// INTENT — Before You Scroll (Phase 24)
// 2-minute intercept before doomscrolling
// Flow: Tap → Mission → Complete → Intentional choice
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Play, Check, X, ArrowRight, Smartphone } from 'lucide-react-native'
import { colors, spacing, radius, typography } from '../src/theme'
import { compileMission } from '../src/engine/missionCompiler'
import type { MicroMission } from '../src/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type ScrollStep = 'intro' | 'mission' | 'timer' | 'choice'

export default function BeforeYouScrollScreen() {
  const router = useRouter()
  const [step, setStep] = useState<ScrollStep>('intro')
  const [mission, setMission] = useState<MicroMission | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState(120)
  const [timerActive, setTimerActive] = useState(false)

  const handleStart = useCallback(() => {
    const result = compileMission({
      state: 'doomscroll_risk',
      blocker: null,
      energy: 'medium',
      availableMinutes: 2,
      contextText: null,
      threadId: null,
      previousFailures: [],
      previousSuccesses: [],
      protocolId: 'doomscroll_intercept',
      privacyPolicy: 'local_only',
    })
    setMission(result.primaryMission)
    setStep('mission')
  }, [])

  const handleStartTimer = useCallback(() => {
    setStep('timer')
    setTimerActive(true)
    setSecondsRemaining(120)
  }, [])

  useEffect(() => {
    if (!timerActive || secondsRemaining <= 0) return
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          setTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, secondsRemaining])

  const handleComplete = useCallback(() => {
    setTimerActive(false)
    setStep('choice')
  }, [])

  const handleChoice = useCallback((choice: 'scroll' | 'another' | 'done') => {
    switch (choice) {
      case 'scroll':
        router.back()
        break
      case 'another':
        handleStart()
        break
      case 'done':
        router.replace('/')
        break
    }
  }, [router, handleStart])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // ── Intro ─────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(219,39,119,0.12)', 'transparent']} style={styles.gradientBg} />
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Smartphone size={32} color={colors.accent.pink} />
          </View>

          <Text style={styles.title}>Before You Scroll</Text>
          <Text style={styles.subtitle}>
            Give INTENT 2 minutes before you disappear.{'\n'}
            One tiny action. Then choose intentionally.
          </Text>

          <View style={styles.principleBox}>
            <Text style={styles.principleText}>
              "Scroll after a tiny win. Make it a choice, not a slip."
            </Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <LinearGradient colors={colors.gradients.brand} style={styles.startGradient}>
              <Play size={20} color={colors.text.inverse} />
              <Text style={styles.startText}>Give Me 2 Minutes</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
            <Text style={styles.skipText}>Not right now</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Mission ───────────────────────────────────────────────
  if (step === 'mission' && mission) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(108,58,237,0.1)', 'transparent']} style={styles.gradientBg} />
        <View style={styles.content}>
          <Text style={styles.stepLabel}>YOUR 2-MINUTE MISSION</Text>

          <View style={styles.missionCard}>
            <Text style={styles.missionAction}>{mission.exactAction}</Text>
            <Text style={styles.missionCriteria}>
              Success: {mission.completionCriteria}
            </Text>
          </View>

          {mission.fallbackMission && (
            <View style={styles.fallbackBox}>
              <Text style={styles.fallbackLabel}>Too hard?</Text>
              <Text style={styles.fallbackText}>{mission.fallbackMission}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.startTimerBtn} onPress={handleStartTimer}>
            <LinearGradient colors={colors.gradients.brand} style={styles.startGradient}>
              <Play size={20} color={colors.text.inverse} />
              <Text style={styles.startText}>Start 2-Minute Timer</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
            <Text style={styles.skipText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Timer ─────────────────────────────────────────────────
  if (step === 'timer') {
    const progress = (120 - secondsRemaining) / 120

    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(108,58,237,0.08)', 'transparent']} style={styles.gradientBg} />
        <View style={styles.content}>
          <View style={styles.timerWrap}>
            <View style={styles.timerRing}>
              <Text style={styles.timerText}>{formatTime(secondsRemaining)}</Text>
              <Text style={styles.timerLabel}>remaining</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          {mission && (
            <View style={styles.missionReminder}>
              <Text style={styles.missionReminderText}>{mission.exactAction}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
            <Check size={20} color={colors.text.inverse} />
            <Text style={styles.completeText}>I Did It</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={() => setStep('choice')}>
            <Text style={styles.skipText}>Skip timer</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Choice ────────────────────────────────────────────────
  if (step === 'choice') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(16,185,129,0.12)', 'transparent']} style={styles.gradientBg} />
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Check size={32} color={colors.accent.green} />
          </View>

          <Text style={styles.title}>You rescued 2 minutes.</Text>
          <Text style={styles.subtitle}>Now choose intentionally.</Text>

          <View style={styles.choiceGrid}>
            <TouchableOpacity style={styles.choiceCard} onPress={() => handleChoice('scroll')}>
              <Smartphone size={24} color={colors.accent.pink} />
              <Text style={styles.choiceLabel}>I want to scroll</Text>
              <Text style={styles.choiceSub}>With a clear conscience</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.choiceCard} onPress={() => handleChoice('another')}>
              <ArrowRight size={24} color={colors.brand[400]} />
              <Text style={styles.choiceLabel}>Another tiny mission</Text>
              <Text style={styles.choiceSub}>Keep the momentum</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.choiceCard} onPress={() => handleChoice('done')}>
              <Check size={24} color={colors.accent.green} />
              <Text style={styles.choiceLabel}>I'm done</Text>
              <Text style={styles.choiceSub}>Back to the app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 400 },
  content: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.accent.pink + '20',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  title: { ...typography.h1, color: colors.text.primary, fontSize: 28, textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  stepLabel: { ...typography.labelSmall, color: colors.brand[400], textAlign: 'center', marginBottom: spacing.lg },

  // Principle
  principleBox: {
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.xl,
    borderLeftWidth: 3, borderLeftColor: colors.accent.pink,
  },
  principleText: { ...typography.bodyMedium, color: colors.text.secondary, fontStyle: 'italic' },

  // Mission Card
  missionCard: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.xl, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  missionAction: { ...typography.h2, color: colors.text.primary, fontSize: 20, lineHeight: 28, marginBottom: spacing.sm },
  missionCriteria: { ...typography.bodySmall, color: colors.text.tertiary },

  // Fallback
  fallbackBox: {
    backgroundColor: colors.bg.elevated, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  fallbackLabel: { ...typography.labelSmall, color: colors.accent.orange, marginBottom: spacing.xs },
  fallbackText: { ...typography.bodySmall, color: colors.text.secondary },

  // Timer
  timerWrap: { alignItems: 'center', marginBottom: spacing.xl },
  timerRing: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 4, borderColor: colors.brand[400] + '30',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timerText: { ...typography.h1, color: colors.text.primary, fontSize: 36 },
  timerLabel: { ...typography.caption, color: colors.text.tertiary },
  progressBar: {
    width: SCREEN_WIDTH - spacing.lg * 2, height: 4,
    backgroundColor: colors.border.subtle, borderRadius: 2,
  },
  progressFill: { height: 4, backgroundColor: colors.brand[400], borderRadius: 2 },

  // Mission Reminder
  missionReminder: {
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg,
  },
  missionReminderText: { ...typography.bodyMedium, color: colors.text.primary, textAlign: 'center' },

  // Buttons
  startBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  startTimerBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  startGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md,
  },
  startText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.accent.green, borderRadius: radius.lg, padding: spacing.md,
  },
  completeText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },
  skipBtn: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.md },
  skipText: { ...typography.bodySmall, color: colors.text.tertiary },

  // Choice
  successIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.accent.green + '20',
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: spacing.lg,
  },
  choiceGrid: { gap: spacing.md },
  choiceCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle,
  },
  choiceLabel: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600', flex: 1 },
  choiceSub: { ...typography.caption, color: colors.text.tertiary, flex: 1 },
})
