// ══════════════════════════════════════════════════════════════
// INTENT — Before You Scroll
// 2-minute intercept before doomscrolling
// Flow: Tap → Mission → Timer (with actions) → Intentional choice
// ══════════════════════════════════════════════════════════════

import { formatTime } from '../src/utils/formatTime'
import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  Play, Check, ArrowRight, Smartphone,
  MessageSquare, Clock, Brain,
} from 'lucide-react-native'
import { colors, spacing, radius, typography } from '../src/theme'
import { compileMission } from '../src/engine/missionCompiler'
import { useAppStore } from '../src/store'
import type { MicroMission } from '../src/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const TIMER_SECONDS = 120

type ScrollStep = 'intro' | 'mission' | 'timer' | 'braindump' | 'choice'

// ── Skip-aware intro copy ────────────────────────────────────
function getIntroCopy(skipCount: number): { title: string; subtitle: string; principle: string } {
  if (skipCount === 0) {
    return {
      title: 'Before You Scroll',
      subtitle: 'Give INTENT 2 minutes before you disappear.\nOne tiny action. Then choose intentionally.',
      principle: '"Scroll after a tiny win. Make it a choice, not a slip."',
    }
  }
  if (skipCount <= 2) {
    return {
      title: 'Still here?',
      subtitle: 'You\'ve skipped this a few times. That\'s okay.\nBut the pattern is worth noticing.',
      principle: '"The thing you\'re avoiding is rarely the phone."',
    }
  }
  if (skipCount <= 5) {
    return {
      title: 'I see the loop',
      subtitle: `You\'ve skipped ${skipCount} times now. Each time, the pull gets stronger.\nWhat if you broke it once?`,
      principle: '"Awareness of the loop is the first step out."',
    }
  }
  return {
    title: 'This is the pattern',
    subtitle: `${skipCount} skips and counting. The scroll isn\'t satisfying — you know that.\nJust 2 minutes. That\'s all I\'m asking.`,
    principle: '"You don\'t have to stop. Just start something first."',
  }
}

export default function BeforeYouScrollScreen() {
  const router = useRouter()
  const skipCount = useAppStore((s) => s.skipCount)
  const incrementSkipCount = useAppStore((s) => s.incrementSkipCount)
  const resetSkipCount = useAppStore((s) => s.resetSkipCount)
  const createBrainDump = useAppStore((s) => s.createBrainDump)

  const [step, setStep] = useState<ScrollStep>('intro')
  const [mission, setMission] = useState<MicroMission | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState(TIMER_SECONDS)
  const [timerActive, setTimerActive] = useState(false)
  const [brainDumpText, setBrainDumpText] = useState('')
  const [brainDumpSaved, setBrainDumpSaved] = useState(false)
  const [didAnything, setDidAnything] = useState(false)
  const brainDumpInputRef = useRef<TextInput>(null)

  const handleStart = useCallback(() => {
    resetSkipCount()
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
  }, [resetSkipCount])

  const handleSkip = useCallback(() => {
    incrementSkipCount()
    router.back()
  }, [incrementSkipCount, router])

  const handleStartTimer = useCallback(() => {
    setStep('timer')
    setTimerActive(true)
    setSecondsRemaining(TIMER_SECONDS)
    setDidAnything(true)
  }, [])

  useEffect(() => {
    if (!timerActive || secondsRemaining <= 0) return
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
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
    setDidAnything(true)
    setStep('choice')
  }, [])

  const handleOpenBrainDump = useCallback(() => {
    setStep('braindump')
    setTimerActive(false)
  }, [])

  const handleSaveBrainDump = useCallback(() => {
    if (brainDumpText.trim()) {
      createBrainDump(brainDumpText.trim())
      setBrainDumpSaved(true)
    }
    // Return to timer
    setStep('timer')
    setTimerActive(true)
  }, [brainDumpText, createBrainDump])

  const handleCancelBrainDump = useCallback(() => {
    setStep('timer')
    setTimerActive(true)
  }, [])

  const handleChoice = useCallback(
    (choice: 'scroll' | 'another' | 'done') => {
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
    },
    [router, handleStart],
  )

  // formatTime imported from shared utility

  const progress = (TIMER_SECONDS - secondsRemaining) / TIMER_SECONDS
  const introCopy = getIntroCopy(skipCount)

  // ── Intro ─────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(219,39,119,0.12)', 'transparent']} style={styles.gradientBg} />
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <Smartphone size={32} color={colors.accent.pink} />
          </View>

          <Text style={styles.title}>{introCopy.title}</Text>
          <Text style={styles.subtitle}>{introCopy.subtitle}</Text>

          <View style={styles.principleBox}>
            <Text style={styles.principleText}>{introCopy.principle}</Text>
          </View>

          {skipCount > 3 && (
            <View style={styles.skipCountBadge}>
              <Clock size={14} color={colors.accent.orange} />
              <Text style={styles.skipCountText}>
                Skipped {skipCount} times — the pattern is the message
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <LinearGradient colors={colors.gradients.brand} style={styles.startGradient}>
              <Play size={20} color={colors.text.inverse} />
              <Text style={styles.startText}>Give Me 2 Minutes</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
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

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // ── Brain Dump (overlay on timer) ─────────────────────────
  if (step === 'braindump') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <LinearGradient colors={['rgba(108,58,237,0.08)', 'transparent']} style={styles.gradientBg} />
        <View style={styles.content}>
          <Text style={styles.stepLabel}>CAPTURE THE THOUGHT</Text>

          <View style={styles.brainDumpCard}>
            <Brain size={24} color={colors.brand[400]} style={{ alignSelf: 'center' }} />
            <Text style={styles.brainDumpTitle}>What's pulling you away?</Text>
            <Text style={styles.brainDumpSub}>
              Get it out of your head so it stops pulling.
            </Text>
            <TextInput
              ref={brainDumpInputRef}
              style={styles.brainDumpInput}
              placeholder="Type the thought..."
              placeholderTextColor={colors.text.tertiary}
              value={brainDumpText}
              onChangeText={setBrainDumpText}
              multiline
              autoFocus
              maxLength={500}
            />
          </View>

          <TouchableOpacity
            style={styles.startTimerBtn}
            onPress={handleSaveBrainDump}
          >
            <LinearGradient colors={colors.gradients.brand} style={styles.startGradient}>
              <Check size={20} color={colors.text.inverse} />
              <Text style={styles.startText}>Saved — back to mission</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleCancelBrainDump}>
            <Text style={styles.skipText}>Never mind, back to timer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // ── Timer ─────────────────────────────────────────────────
  if (step === 'timer') {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(108,58,237,0.08)', 'transparent']} style={styles.gradientBg} />
        <View style={styles.content}>
          {/* Timer ring */}
          <View style={styles.timerWrap}>
            <View style={styles.timerRing}>
              <Text style={styles.timerText}>{formatTime(secondsRemaining)}</Text>
              <Text style={styles.timerLabel}>remaining</Text>
            </View>
            {/* Progress bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          {/* Mission action — visible during countdown */}
          {mission && (
            <View style={styles.missionReminder}>
              <Text style={styles.missionReminderLabel}>DO THIS NOW</Text>
              <Text style={styles.missionReminderText}>{mission.exactAction}</Text>
            </View>
          )}

          {/* Completion state — timer finished */}
          {secondsRemaining <= 0 && (
            <View style={styles.timerDoneBadge}>
              <Check size={18} color={colors.accent.green} />
              <Text style={styles.timerDoneText}>2 minutes complete!</Text>
            </View>
          )}

          {/* Primary action: I Did It */}
          <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
            <Check size={20} color={colors.text.inverse} />
            <Text style={styles.completeText}>
              {secondsRemaining <= 0 ? 'I Did It' : "I'm done (even if not 2 min)"}
            </Text>
          </TouchableOpacity>

          {/* Secondary actions row */}
          <View style={styles.timerActions}>
            {/* Brain dump shortcut */}
            <TouchableOpacity
              style={styles.timerActionBtn}
              onPress={handleOpenBrainDump}
              activeOpacity={0.7}
            >
              <MessageSquare size={16} color={colors.brand[400]} />
              <Text style={styles.timerActionText}>Capture a thought pulling you away</Text>
            </TouchableOpacity>
          </View>

          {brainDumpSaved && (
            <View style={styles.savedBadge}>
              <Check size={14} color={colors.accent.green} />
              <Text style={styles.savedBadgeText}>Thought captured ✓</Text>
            </View>
          )}
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
          <Text style={styles.subtitle}>
            That's 2 minutes you wouldn't have had.
          </Text>

          <View style={styles.choiceGrid}>
            {/* Reframed: credit the user */}
            <TouchableOpacity style={styles.choiceCard} onPress={() => handleChoice('scroll')}>
              <Smartphone size={24} color={colors.accent.pink} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceLabel}>I'll scroll now</Text>
                <Text style={styles.choiceSub}>You did 2 minutes first. Go with a clear conscience.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.choiceCard} onPress={() => handleChoice('another')}>
              <ArrowRight size={24} color={colors.brand[400]} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceLabel}>Another tiny mission</Text>
                <Text style={styles.choiceSub}>Keep the momentum going</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.choiceCard} onPress={() => handleChoice('done')}>
              <Check size={24} color={colors.accent.green} />
              <View style={styles.choiceContent}>
                <Text style={styles.choiceLabel}>I'm done</Text>
                <Text style={styles.choiceSub}>Back to the app</Text>
              </View>
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

  // Skip count badge
  skipCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.accent.orange + '15',
    borderRadius: radius.md, padding: spacing.sm,
    marginBottom: spacing.lg, alignSelf: 'center',
  },
  skipCountText: { ...typography.caption, color: colors.accent.orange },

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
    width: SCREEN_WIDTH - spacing.lg * 2, height: 6,
    backgroundColor: colors.border.subtle, borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.brand[400],
    borderRadius: 3,
  },

  // Mission Reminder (shown during timer)
  missionReminder: {
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.brand[400] + '20',
  },
  missionReminderLabel: {
    ...typography.labelSmall, color: colors.brand[400],
    textAlign: 'center', marginBottom: spacing.xs,
  },
  missionReminderText: {
    ...typography.h3, color: colors.text.primary,
    textAlign: 'center', lineHeight: 26,
  },

  // Timer done badge
  timerDoneBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, backgroundColor: colors.accent.green + '15',
    borderRadius: radius.md, padding: spacing.sm,
    marginBottom: spacing.md,
  },
  timerDoneText: { ...typography.bodyMedium, color: colors.accent.green, fontWeight: '600' },

  // Timer secondary actions
  timerActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  timerActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, padding: spacing.sm,
  },
  timerActionText: { ...typography.bodySmall, color: colors.brand[400] },

  // Saved badge
  savedBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, marginTop: spacing.sm,
  },
  savedBadgeText: { ...typography.caption, color: colors.accent.green },

  // Brain dump
  brainDumpCard: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.xl, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border.subtle,
    gap: spacing.sm,
  },
  brainDumpTitle: { ...typography.h3, color: colors.text.primary, textAlign: 'center' },
  brainDumpSub: { ...typography.bodySmall, color: colors.text.tertiary, textAlign: 'center' },
  brainDumpInput: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: spacing.sm,
  },

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
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle,
  },
  choiceContent: { flex: 1 },
  choiceLabel: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  choiceSub: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
})
