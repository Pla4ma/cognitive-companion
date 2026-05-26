// ══════════════════════════════════════════════════════════════
// INTENT — 5-Step Onboarding
// Welcome → Name → State → Rescue (2-min timer) → Complete
// No auth wall. Immediate value. All data stays local.
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Dimensions, ScrollView, KeyboardAvoidingView, Platform, AppState,
} from 'react-native'
import Animated, {
  useSharedValue, withTiming, withDelay,
  useAnimatedStyle, Easing,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Play, ChevronRight, Zap } from 'lucide-react-native'
import LottieView from 'lottie-react-native'
import { colors, spacing, radius, typography, shadows } from '../src/theme'
import { getProtocolForState, RESCUE_PROTOCOLS } from '../src/types/rescue'
import { compileMission } from '../src/engine/missionCompiler'
import { useAppStore } from '../src/store'
import type { UserState, MicroMission, CompiledMission } from '../src/types'
import { processSystemEvent } from '../src/services/systemBridge'

import { uid } from '../src/utils/uid'
import { formatTime } from '../src/utils/formatTime'
const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ── State options for step 3 ────────────────────────────────
const STATE_OPTIONS: { id: UserState; emoji: string; label: string; color: string }[] = [
  { id: 'avoiding', emoji: '🙈', label: 'Avoiding', color: '#EF4444' },
  { id: 'overwhelmed', emoji: '🌊', label: 'Overwhelmed', color: '#F59E0B' },
  { id: 'stuck', emoji: '🫠', label: 'Stuck', color: '#8B5CF6' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: '#6366F1' },
  { id: 'distracted', emoji: '🦋', label: 'Distracted', color: '#EC4899' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#F97316' },
]

// ── Helpers ─────────────────────────────────────────────────
// uid and formatTime imported from shared utilities

// ── Celebration emoji component ─────────────────────────────
function CelebrationEmoji({ emoji, delay }: { emoji: string; delay: number }) {
  const translateY = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }))
    translateY.value = withDelay(
      delay,
      withTiming(-20, { duration: 800, easing: Easing.out(Easing.cubic) }),
    )
    const timeout = setTimeout(() => {
      opacity.value = withDelay(500, withTiming(0, { duration: 500 }))
    }, delay + 800)
    return () => clearTimeout(timeout)
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.Text style={[{ fontSize: 28 }, style]}>{emoji}</Animated.Text>
}

// ══════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════

export default function Onboarding() {
  const router = useRouter()
  const {
    user, setUser, updateProfile, completeOnboarding,
    addMission, addMicroMission, startSession,
    completeSession, updateSessionTimer,
    addMomentumEvent, updateConsent,
  } = useAppStore()

  // ── State ──────────────────────────────────────────────────
  const [step, setStep] = useState(0)
  const [nameInput, setNameInput] = useState('')
  const [selectedState, setSelectedState] = useState<UserState | null>(null)
  const [compiledMission, setCompiledMission] = useState<CompiledMission | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(120) // 2 minutes
  const [timerActive, setTimerActive] = useState(false)
  const [missionStored, setMissionStored] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedAtRef = useRef<number>(0)

  // ── Cleanup timer on unmount ───────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // ── Pause timer when app goes to background, resume on return ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' && timerActive) {
        setTimerActive(false)
        pausedAtRef.current = Date.now()
      } else if (state === 'active' && pausedAtRef.current > 0) {
        pausedAtRef.current = 0
        setTimerActive(true)
      }
    })
    return () => sub.remove()
  }, [timerActive])

  // ── Timer countdown ────────────────────────────────────────
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const next = prev - 1
          // Update session timer in store every second
          const { activeSession } = useAppStore.getState()
          if (activeSession) {
            updateSessionTimer(activeSession.id, (activeSession.planned_minutes * 60) - next)
          }
          if (next <= 0) {
            clearInterval(timerRef.current!)
            setTimerActive(false)
            handleTimerComplete()
            return 0
          }
          return next
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timerActive])

  // ── Create local user ──────────────────────────────────────
  const ensureUser = useCallback((displayName: string | null) => {
    if (user) {
      // Update existing user name if provided
      if (displayName) {
        updateProfile({ display_name: displayName, onboarding_step: 0 })
      }
      return
    }
    const now = new Date().toISOString()
    const newUser = {
      id: uid(),
      email: '',
      display_name: displayName ?? '',
      avatar_url: null,
      push_style: 'gentle' as const,
      onboarding_complete: false,
      onboarding_step: 0 as const,
      plan: 'free' as const,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
      body_double_enabled: false,
      vault_enabled: false,
      local_only: true,
      created_at: now,
      updated_at: now,
    }
    setUser(newUser)
  }, [user, setUser, updateProfile])

  // ── Step 1: Welcome → Name ─────────────────────────────────
  const handleShowMeHow = useCallback(() => {
    setStep(1)
  }, [])

  // ── Step 2: Name → State ───────────────────────────────────
  const handleNameSubmit = useCallback(() => {
    const trimmed = nameInput.trim()
    ensureUser(trimmed || null)
    setStep(2)
  }, [nameInput, ensureUser])

  const handleSkipName = useCallback(() => {
    ensureUser(null)
    setStep(2)
  }, [ensureUser])

  // ── Step 3: State → Rescue ─────────────────────────────────
  const handleStateSelect = useCallback((state: UserState) => {
    setSelectedState(state)
  }, [])

  const handleStateConfirm = useCallback(() => {
    if (!selectedState) return

    // Ensure user exists
    if (!useAppStore.getState().user) {
      ensureUser(null)
    }

    // Compile mission
    const protocolId = getProtocolForState(selectedState)
    const result = compileMission({
      state: selectedState,
      blocker: null,
      energy: 'medium',
      availableMinutes: 2,
      contextText: null,
      threadId: null,
      previousFailures: [],
      previousSuccesses: [],
      protocolId,
      privacyPolicy: 'local_only',
    })

    setCompiledMission(result)
    setStep(3)
  }, [selectedState, ensureUser])

  // ── Step 4: Rescue → Complete ──────────────────────────────
  const handleStartTimer = useCallback(() => {
    if (!compiledMission || missionStored) {
      setTimerActive(true)
      return
    }

    // Create mission in store
    const protocolId = getProtocolForState(selectedState!)
    const protocol = RESCUE_PROTOCOLS[protocolId]
    const mission = addMission(
      protocol.name,
      `Onboarding rescue for ${selectedState}`,
      colors.brand[400],
    )

    // Add the compiled micro-mission to the store
    const micro = addMicroMission(
      mission.id,
      compiledMission.primaryMission.exactAction,
      compiledMission.primaryMission.completionCriteria ?? undefined,
      2,
    )

    // Start a session
    startSession(mission.id, micro.id, 'focus', 2)

    setMissionStored(true)
    setTimerActive(true)
  }, [compiledMission, selectedState, missionStored, addMission, addMicroMission, startSession])

  const handleTimerComplete = useCallback(() => {
    // Complete the session in the store
    const { activeSession } = useAppStore.getState()
    if (activeSession) {
      completeSession('Completed onboarding rescue')
    }

    // Add momentum
    addMomentumEvent('session_completed', 15, 'Onboarding first rescue')

    // Fire system event for coordinated response
    try {
      const session = useAppStore.getState().sessions[useAppStore.getState().sessions.length - 1]
      if (session) {
        processSystemEvent(
          { type: 'session_completed', session },
          {
            retentionState: useAppStore.getState().retentionState,
            sessions: useAppStore.getState().sessions,
            patterns: [],
            distractions: [],
            momentumEvents: useAppStore.getState().momentumEvents,
            missions: useAppStore.getState().missions,
            microMissions: useAppStore.getState().microMissions,
            brainDumps: [],
            userPatterns: null,
            quietHours: null,
            userName: useAppStore.getState().user?.display_name ?? null,
          },
        )
      }
    } catch {}

    // Update onboarding progress
    updateProfile({ onboarding_step: 4 })

    // Move to complete screen
    setStep(4)
  }, [completeSession, addMomentumEvent, updateProfile])

  // ── Step 5: Complete → App ─────────────────────────────────
  const handleAllowNotifications = useCallback(() => {
    updateConsent('notifications_smart', true, 'onboarding', 'Post first rescue notification prompt')
    finishOnboarding()
  }, [updateConsent])

  const handleSkipNotifications = useCallback(() => {
    updateConsent('notifications_smart', false, 'onboarding', 'Declined after first rescue')
    finishOnboarding()
  }, [updateConsent])

  const finishOnboarding = useCallback(() => {
    // Fire app-open event for ambient engine activation
    try {
      const state = useAppStore.getState()
      processSystemEvent(
        { type: 'app_opened', source: 'cold_start' },
        {
          retentionState: state.retentionState,
          sessions: state.sessions,
          patterns: [],
          distractions: [],
          momentumEvents: state.momentumEvents,
          missions: state.missions,
          microMissions: state.microMissions,
          brainDumps: [],
          userPatterns: null,
          quietHours: null,
          userName: state.user?.display_name ?? null,
        },
      )
    } catch {}

    completeOnboarding()
    router.replace('/(tabs)/')
  }, [completeOnboarding, router])

  // ── Skip to app (any step) — creates minimal local user ───
  const handleSkipToApp = useCallback(() => {
    ensureUser(null)
    completeOnboarding()
    router.replace('/(tabs)/')
  }, [ensureUser, completeOnboarding, router])

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  // ── SCREEN 1: Welcome ──────────────────────────────────────
  if (step === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(108,58,237,0.15)', 'rgba(108,58,237,0.02)', 'transparent']}
          style={styles.gradientBg}
        />
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeTop}>
            <Zap size={32} color={colors.brand[400]} />
            <Text style={styles.welcomeBrand}>INTENT</Text>
          </View>

          <View style={styles.welcomeCenter}>
            <Text style={styles.welcomeHeadline}>
              Your brain knows what to do.
            </Text>
            <Text style={styles.welcomeSubheadline}>
              The problem is starting.
            </Text>
          </View>

          <View style={styles.welcomeBottom}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleShowMeHow}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={colors.gradients.brand}
                style={styles.primaryBtnGradient}
              >
                <Text style={styles.primaryBtnText}>Show me how</Text>
                <ChevronRight size={18} color={colors.text.inverse} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkipToApp}>
              <Text style={styles.skipText}>Skip to app</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  // ── SCREEN 2: Name ─────────────────────────────────────────
  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={['rgba(108,58,237,0.08)', 'transparent']}
          style={styles.gradientBg}
        />
        <View style={styles.content}>
          <View style={styles.stepHeader}>
            <View style={styles.stepDots}>
              {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.dot, i <= 1 && styles.dotActive]} />
              ))}
            </View>
            <TouchableOpacity onPress={handleSkipName} style={{ padding: 16, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={styles.skipLink}>Skip</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>What should I call you?</Text>
          <Text style={styles.subtitle}>
            Just a name. No account needed.
          </Text>

          <TextInput
            style={styles.nameInput}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Your name"
            placeholderTextColor={colors.text.disabled}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleNameSubmit}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, !nameInput.trim() && styles.primaryBtnMuted]}
            onPress={handleNameSubmit}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={nameInput.trim() ? colors.gradients.brand : [colors.bg.overlay, colors.bg.overlay]}
              style={styles.primaryBtnGradient}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
              <ChevronRight size={18} color={colors.text.inverse} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
  }

  // ── SCREEN 3: State ────────────────────────────────────────
  if (step === 2) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(108,58,237,0.08)', 'transparent']}
          style={styles.gradientBg}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.stepDots}>
              {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.dot, i <= 2 && styles.dotActive]} />
              ))}
            </View>
          </View>

          <Text style={styles.title}>Right now, what's your biggest obstacle?</Text>
          <Text style={styles.subtitle}>No wrong answer. This helps me help you.</Text>

          <View style={styles.stateGrid}>
            {STATE_OPTIONS.map(state => (
              <TouchableOpacity
                key={state.id}
                style={[
                  styles.stateChip,
                  selectedState === state.id && {
                    borderColor: state.color,
                    backgroundColor: state.color + '18',
                  },
                ]}
                onPress={() => handleStateSelect(state.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.stateEmoji}>{state.emoji}</Text>
                <Text
                  style={[
                    styles.stateLabel,
                    selectedState === state.id && { color: state.color },
                  ]}
                >
                  {state.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedState && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStateConfirm}
              activeOpacity={0.85}
            >
              <LinearGradient colors={colors.gradients.brand} style={styles.primaryBtnGradient}>
                <Zap size={18} color={colors.text.inverse} />
                <Text style={styles.primaryBtnText}>Build my rescue</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── SCREEN 4: Rescue (2-min timer) ─────────────────────────
  if (step === 3 && compiledMission) {
    const protocol = RESCUE_PROTOCOLS[getProtocolForState(selectedState!)]

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(16,185,129,0.10)', 'transparent']}
          style={styles.gradientBg}
        />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <View style={styles.stepDots}>
              {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.dot, i <= 3 && styles.dotActive]} />
              ))}
            </View>
            <Text style={styles.protocolBadge}>{protocol.name}</Text>
          </View>

          {/* Mission action — always visible */}
          <View style={styles.missionCard}>
            <Text style={styles.missionLabel}>YOUR RESCUE</Text>
            <Text style={styles.missionAction}>
              {compiledMission.primaryMission.exactAction}
            </Text>
            <Text style={styles.missionCriteria}>
              ✓ {compiledMission.primaryMission.completionCriteria}
            </Text>
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, timerSeconds <= 10 && timerActive && styles.timerUrgent]}>
              {formatTime(timerSeconds)}
            </Text>
            <Text style={styles.timerLabel}>
              {timerActive
                ? timerSeconds > 0 ? 'Stay with it' : 'Done!'
                : '2-minute rescue'
              }
            </Text>
          </View>

          {/* Fallback (visible before timer starts) */}
          {!timerActive && compiledMission.primaryMission.fallbackMission && (
            <View style={styles.fallbackBox}>
              <Text style={styles.fallbackLabel}>If it's too hard:</Text>
              <Text style={styles.fallbackText}>
                {compiledMission.primaryMission.fallbackMission}
              </Text>
            </View>
          )}

          {/* Start / Restart button */}
          {!timerActive && timerSeconds === 120 && (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleStartTimer}
              activeOpacity={0.85}
            >
              <LinearGradient colors={colors.gradients.brand} style={styles.primaryBtnGradient}>
                <Play size={18} color={colors.text.inverse} />
                <Text style={styles.primaryBtnText}>Start 2-minute rescue</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── SCREEN 5: Complete ─────────────────────────────────────
  if (step === 4) {
    const stateLabel = STATE_OPTIONS.find(s => s.id === selectedState)?.label ?? selectedState

    // Haptic celebration on mount
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    }, [])

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['rgba(16,185,129,0.12)', 'rgba(108,58,237,0.05)', 'transparent']}
          style={styles.gradientBg}
        />
        <View style={styles.content}>
          <View style={styles.stepHeader}>
            <View style={styles.stepDots}>
              {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.dot, styles.dotActive]} />
              ))}
            </View>
          </View>

          <View style={styles.completeCenter}>
            {/* Celebration animation */}
            <LottieView
              source={require('../assets/animations/celebration.json')}
              autoPlay
              loop={false}
              style={{ width: 200, height: 200, alignSelf: 'center' }}
            />

            {/* Celebration emojis */}
            <View style={styles.celebrationRow}>
              <CelebrationEmoji emoji="🎉" delay={0} />
              <CelebrationEmoji emoji="✨" delay={100} />
              <CelebrationEmoji emoji="🔥" delay={200} />
              <CelebrationEmoji emoji="💪" delay={300} />
            </View>

            <Text style={styles.completeHeadline}>You did it.</Text>
            <Text style={styles.completeSubheadline}>
              You just rescued 2 minutes from {stateLabel?.toLowerCase()}.
            </Text>
            <Text style={styles.completeMotivation}>
              You just proved you can start. That's the hardest part.
            </Text>

            <View style={styles.rescuedBadge}>
              <Text style={styles.rescuedNumber}>2</Text>
              <Text style={styles.rescuedUnit}>minutes rescued</Text>
            </View>
          </View>

          {/* Notification permission request */}
          <View style={styles.notifCard}>
            <Text style={styles.notifTitle}>Stay on track?</Text>
            <Text style={styles.notifBody}>
              INTENT can send a quick check-in when it looks like you're drifting. No spam. You control it.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleAllowNotifications}
              activeOpacity={0.85}
            >
              <LinearGradient colors={colors.gradients.brand} style={styles.primaryBtnGradient}>
                <Text style={styles.primaryBtnText}>Allow check-ins</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={handleSkipNotifications}>
              <Text style={styles.skipText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return null
}

// ══════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2.5,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
  },

  // ── Step indicator ──────────────────────────────────────
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  stepDots: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg.overlay,
  },
  dotActive: {
    backgroundColor: colors.brand[400],
  },
  backText: {
    ...typography.bodySmall,
    color: colors.brand[400],
  },
  skipLink: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  protocolBadge: {
    ...typography.labelSmall,
    color: colors.brand[300],
    backgroundColor: colors.brand[400] + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },

  // ── Welcome screen ──────────────────────────────────────
  welcomeContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  welcomeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl * 2,
  },
  welcomeBrand: {
    ...typography.label,
    color: colors.brand[300],
    letterSpacing: 2,
  },
  welcomeCenter: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  welcomeHeadline: {
    ...typography.hero,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  welcomeSubheadline: {
    ...typography.h2,
    color: colors.text.tertiary,
    fontWeight: '400',
  },
  welcomeBottom: {
    gap: spacing.sm,
  },

  // ── Typography ──────────────────────────────────────────
  title: {
    ...typography.headline,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },

  // ── Name input ──────────────────────────────────────────
  nameInput: {
    ...typography.h2,
    color: colors.text.primary,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },

  // ── State grid ──────────────────────────────────────────
  stateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  stateChip: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  stateEmoji: {
    fontSize: 22,
  },
  stateLabel: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  // ── Mission card ────────────────────────────────────────
  missionCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  missionLabel: {
    ...typography.labelSmall,
    color: colors.accent.green,
    marginBottom: spacing.sm,
  },
  missionAction: {
    ...typography.h2,
    color: colors.text.primary,
    fontSize: 20,
    lineHeight: 28,
    marginBottom: spacing.md,
  },
  missionCriteria: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },

  // ── Timer ───────────────────────────────────────────────
  timerContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timerText: {
    ...typography.mono,
    color: colors.text.primary,
    fontSize: 64,
    lineHeight: 68,
  },
  timerUrgent: {
    color: colors.accent.red,
  },
  timerLabel: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },

  // ── Fallback ────────────────────────────────────────────
  fallbackBox: {
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  fallbackLabel: {
    ...typography.labelSmall,
    color: colors.accent.orange,
    marginBottom: spacing.xxs,
  },
  fallbackText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },

  // ── Complete screen ─────────────────────────────────────
  completeCenter: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingTop: spacing.xl,
  },
  celebrationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  completeHeadline: {
    ...typography.hero,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  completeSubheadline: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  completeMotivation: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  rescuedBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent.green + '15',
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.accent.green + '30',
  },
  rescuedNumber: {
    ...typography.mono,
    color: colors.accent.green,
    fontSize: 56,
  },
  rescuedUnit: {
    ...typography.label,
    color: colors.accent.green,
    marginTop: spacing.xxs,
  },

  // ── Notification card ───────────────────────────────────
  notifCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  notifTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  notifBody: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },

  // ── Buttons ─────────────────────────────────────────────
  primaryBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  primaryBtnMuted: {
    opacity: 0.5,
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.text.inverse,
  },
  skipBtn: {
    alignItems: 'center',
    padding: spacing.md,
  },
  skipText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
})
