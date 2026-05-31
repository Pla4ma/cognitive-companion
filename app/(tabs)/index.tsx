// ══════════════════════════════════════════════════════════════
// INTENT — Home Screen v5 (Pull Mechanic)
// Anti-drift agent home with pattern naming, daily insights,
// weekly stories, emotional colors, and motion system.
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Dimensions, InteractionManager, AccessibilityInfo, Share,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, SlideInDown } from 'react-native-reanimated'
import { useRouter, type Href } from 'expo-router'
import {
  Shield, Brain, ChevronRight, Play, Flame, TrendingUp, Settings,
} from 'lucide-react-native'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../../src/store'
import { colors, spacing, radius, typography, shadows, layout } from '../../src/theme'
import { getEmotionalColor } from '../../src/theme/emotionalColors'
import { motion } from '../../src/theme/motion'
import { HapticPatterns } from '../../src/services/haptics'
import { Screen, Card } from '../../src/components'
import { AnimatedRescueButton } from '../../src/components/AnimatedRescueButton'
import { compileMission } from '../../src/engine/missionCompiler'
import { getProtocolForState, RESCUE_PROTOCOLS } from '../../src/types/rescue'
import { generatePatternName, generateInsightOfTheDay, type PatternName } from '../../src/engine/patternNaming'
import { minutesToHumanExperience, generateWeeklyStory, generateComebackMessage, type WeeklyStory, type ComebackMessage } from '../../src/engine/humanMetrics'
import {
  getPendingBrainDumpItems,
  getRetentionDay,
  getDaysSinceActivation,
  shouldShowDay2HabitSeed,
  shouldShowDay3Pattern,
  shouldShowDay7Insight,
  shouldShowDay30Commitment,
} from '../../src/services/retention/retentionEngine'
import type { UserState, EnergyLevel } from '../../src/types'
import { getHomeIntelligence, type HomeIntelligence } from '../../src/services/systemBridge'
import { handleNoSessionsYet, handleHighAbandonRate, handleLongAbsence, detectBurnoutPattern } from '../../src/services/edgeCases'
import { getDataConfidence } from '../../src/services/populationPriors'
import { formatUserFacingError } from '../../src/services/errorHandling'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const STATE_CHIPS: { id: UserState; emoji: string; label: string }[] = [
  { id: 'avoiding', emoji: '🙈', label: 'Avoiding' },
  { id: 'overwhelmed', emoji: '🌊', label: 'Overwhelmed' },
  { id: 'stuck', emoji: '🫠', label: 'Stuck' },
  { id: 'tired', emoji: '😴', label: 'Tired' },
  { id: 'distracted', emoji: '🦋', label: 'Distracted' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
  { id: 'scattered', emoji: '🌪️', label: 'Scattered' },
  { id: 'ready', emoji: '🚀', label: 'Ready' },
]

const riskColors: Record<string, string> = { critical: '#EF4444', high: '#F59E0B', moderate: '#F97316', low: '#10B981' }

function getStateProtocolHint(state: UserState): string {
  const protocolId = getProtocolForState(state)
  return `${RESCUE_PROTOCOLS[protocolId].name}`
}

// ── Animated State Chip ─────────────────────────────────────

function AnimatedStateChip({ chip, selected, onPress }: {
  chip: { id: string; emoji: string; label: string }
  selected: boolean
  onPress: () => void
}) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const eColor = getEmotionalColor(chip.id as UserState)

  return (
    <Animated.View style={[styles.stateChip, animStyle, selected && { borderColor: eColor.primary, backgroundColor: eColor.background }]}>
      <Pressable
        onPress={() => {
          scale.value = withSpring(motion.scale.chipPress, motion.springs.stiff, () => {
            scale.value = withSpring(1, motion.springs.gentle)
          })
          onPress()
        }}
        style={{ alignItems: 'center', gap: 4, padding: 0 }}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={chip.label}
      >
        <Text style={styles.stateEmoji}>{chip.emoji}</Text>
        <Text style={[styles.stateLabel, selected && { color: eColor.primary }]}>{chip.label}</Text>
      </Pressable>
    </Animated.View>
  )
}

function truncateTitle(text: string, maxLen: number = 60): string {
  if (text.length <= maxLen) return text
  const truncated = text.slice(0, maxLen - 1)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 30 ? truncated.slice(0, lastSpace) : truncated) + '…'
}

const QUICK_ACTIONS: { id: string; emoji: string; label: string; screen: Href }[] = [
  { id: 'before_scroll', emoji: '📱', label: 'Before I Scroll', screen: '/before-scroll' },
  { id: 'body_double', emoji: '🛡️', label: 'Body Double', screen: '/live' },
  { id: 'paste_chaos', emoji: '📋', label: 'Paste Chaos', screen: '/coach' },
]

export default function HomeScreen() {
  const router = useRouter()
  const { user, retentionState, getComebackStatus } = useAppStore(
    useShallow(s => ({
      user: s.user,
      retentionState: s.retentionState,
      getComebackStatus: s.getComebackStatus,
    }))
  )
  const { sessions, momentumEvents, missions, microMissions, brainDumps, resistancePatterns, distractions } = useAppStore(
    useShallow(s => ({
      sessions: s.sessions,
      momentumEvents: s.momentumEvents,
      missions: s.missions,
      microMissions: s.microMissions,
      brainDumps: s.brainDumps,
      resistancePatterns: s.resistancePatterns,
      distractions: s.distractions,
    }))
  )

  const [selectedState, setSelectedState] = useState<UserState | null>(null)
  const [selectedMinutes, setSelectedMinutes] = useState(5)

  // ── Derived Data ──
  const displayName = user?.display_name || 'there'
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // ── Momentum Visual Warmth ──
  const weeklyRescues = retentionState.momentumWindows.last7Days ?? 0
  const greeting = weeklyRescues >= 5
    ? `You're on a roll, ${displayName}.`
    : displayName === 'there'
      ? 'About to drift?'
      : `${timeGreeting}, ${displayName}`

  const todayMinutes = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return Math.round(
      sessions
        .filter(s => s.started_at.slice(0, 10) === today && (s.status === 'completed' || s.status === 'salvaged'))
        .reduce((sum, s) => sum + s.actual_seconds, 0) / 60
    )
  }, [sessions])

  // ── Momentum Windows (replaces streaks) ──
  const momentum = useMemo(() => ({
    last7Days: retentionState.momentumWindows.last7Days,
    last14Days: retentionState.momentumWindows.last14Days,
    trend: retentionState.momentumWindows.last7Days > 0
      ? (retentionState.momentumWindows.last7Days >= 3 ? 'building' : 'stable')
      : 'cooling' as const,
  }), [retentionState.momentumWindows])

  // ── Comeback Detection (enhanced with personalized message) ──
  const comeback = useMemo(() => {
    const status = getComebackStatus()
    if (status.isComeback && status.daysAway > 0) {
      const msg = generateComebackMessage(status.daysAway)
      return { ...status, message: `${msg.headline} — ${msg.body}` }
    }
    return status
  }, [sessions, retentionState.lastRescueDate])

  // ── Pattern Name (Pull Mechanic 1) ──
  const patternName = useMemo(
    () => generatePatternName(sessions, resistancePatterns),
    [sessions, resistancePatterns],
  )

  // ── Daily Insight (Pull Mechanic 2) ──
  const dailyInsight = useMemo(() => generateInsightOfTheDay(sessions), [sessions])

  // ── Edge Case State ──
  const edgeCaseState = useMemo(() => {
    const onboarding = sessions.length === 0 ? handleNoSessionsYet() : null
    const longAbsence = comeback.isComeback && comeback.daysAway >= 30
      ? handleLongAbsence(comeback.daysAway)
      : null
    const abandonAlert = sessions.length >= 7 ? handleHighAbandonRate(sessions) : null
    const burnout = sessions.length >= 7 ? detectBurnoutPattern(sessions) : null
    return { onboarding, longAbsence, abandonAlert, burnout }
  }, [sessions, comeback.isComeback, comeback.daysAway])

  // ── Data Confidence ──
  const dataConfidence = useMemo(() => getDataConfidence(sessions.length), [sessions.length])

  // ── Weekly Story (Pull Mechanic 3) ──
  const weeklyStory = useMemo(
    () => generateWeeklyStory(sessions, user?.display_name ?? undefined),
    [sessions, user?.display_name],
  )

  // ── Human-readable focus experience ──
  const humanExperience = useMemo(() => minutesToHumanExperience(todayMinutes), [todayMinutes])

  // ── Share handler ──
  const handleShareStory = useCallback(async () => {
    if (!weeklyStory) return
    HapticPatterns.confirm()
    try {
      await Share.share({ message: weeklyStory.shareableText })
    } catch {}
  }, [weeklyStory])

  // ── Pending Brain Dumps (Loop 6) ──
  const pendingBrainDumps = useMemo(() => {
    return getPendingBrainDumpItems(brainDumps)
  }, [brainDumps])

  // ── Day Tracking (Day 1/2/3/7/30 per audit Section 1.3) ──
  const dayTrackingMessage = useMemo(() => {
    if (!retentionState.activated) return null
    const day = getRetentionDay(retentionState)
    if (day === 2 && shouldShowDay2HabitSeed(retentionState)) {
      return "Yesterday you rescued your first session. One small rescue today keeps the momentum."
    }
    if (day === 3 && shouldShowDay3Pattern(retentionState)) {
      return `You've opened the app ${retentionState.totalRescues} times. A pattern is forming.`
    }
    if (day === 7 && shouldShowDay7Insight(retentionState)) {
      return "A week of rescuing. Your weekly pattern is emerging."
    }
    if (day === 30 && shouldShowDay30Commitment(retentionState)) {
      return 'A month of showing up. Ready to commit to a daily practice?'
    }
    return null
  }, [retentionState])

  const weeklyMomentum = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000
    return momentumEvents
      .filter(e => new Date(e.created_at).getTime() >= weekAgo)
      .reduce((sum, e) => sum + e.points, 0)
  }, [momentumEvents])

  // ── System Intelligence (deferred via InteractionManager) ──
  const [homeIntel, setHomeIntel] = useState<HomeIntelligence>(() =>
    getHomeIntelligence({
      sessions,
      retentionState,
      patterns: resistancePatterns,
      distractions,
      momentumEvents,
      missions,
      microMissions,
      brainDumps,
      userPatterns: null,
      quietHours: null,
      userName: user?.display_name ?? null,
    })
  )
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const intel = getHomeIntelligence({
        sessions,
        retentionState,
        patterns: resistancePatterns,
        distractions,
        momentumEvents,
        missions,
        microMissions,
        brainDumps,
        userPatterns: null,
        quietHours: null,
        userName: user?.display_name ?? null,
      })
      setHomeIntel(intel)
    })
    return () => task.cancel()
  }, [sessions.length, retentionState.totalRescues])

  // ── Auto-select last resistance state if recent ──
  useEffect(() => {
    if (resistancePatterns.length > 0) {
      const mostRecent = resistancePatterns[0]
      const hoursSince = (Date.now() - new Date(mostRecent.created_at).getTime()) / 3600000
      if (hoursSince < 2) {
        setSelectedState(mostRecent.state as UserState)
      }
    }
  }, [])  // mount only

  // ── Conditional card visibility (max 2) ──
  let conditionalCardCount = 0
  const showConditional = () => {
    if (conditionalCardCount < 2) { conditionalCardCount++; return true }
    return false
  }
  const showComeback = comeback.isComeback && showConditional()
  const showDayTracking = dayTrackingMessage && !comeback.isComeback && showConditional()
  const showBurnout = edgeCaseState.burnout?.detected && showConditional()
  const showRisk = homeIntel.riskLevel && homeIntel.riskLevel !== 'low' && showConditional()
  const showBrainDumps = pendingBrainDumps.count > 0 && showConditional()
  const showInsight = homeIntel.riskMessage && !homeIntel.riskLevel && showConditional()
  const showNarrative = !!homeIntel.weeklyNarrative && showConditional()

  // ── Handlers ──
  const handleStateSelect = useCallback((state: UserState) => {
    setSelectedState(state)
    HapticPatterns.selection()
    // Accessibility: announce selection for screen reader users
    const chip = STATE_CHIPS.find(c => c.id === state)
    if (chip) {
      AccessibilityInfo.announceForAccessibility(`${chip.label} selected. Tap Rescue Me to begin.`)
    }
  }, [])

  const handleRescueMe = useCallback(() => {
    if (!selectedState) return

    try {
      const protocolId = getProtocolForState(selectedState)
      const result = compileMission({
        state: selectedState,
        blocker: null,
        energy: 'medium',
        availableMinutes: selectedMinutes,
        contextText: null,
        threadId: null,
        previousFailures: [],
        previousSuccesses: [],
        protocolId,
        privacyPolicy: 'local_only',
      })

      const storeActions = useAppStore.getState()

      // 1. Create the mission in the store so live screen can find it
      const mission = storeActions.addMission(
        truncateTitle(result.primaryMission.exactAction),
        `Protocol: ${RESCUE_PROTOCOLS[protocolId].name} · State: ${selectedState}`,
        getEmotionalColor(selectedState).primary,
      )

      // 2. Add the micro-mission so live screen shows exactAction
      storeActions.addMicroMission(
        mission.id,
        result.primaryMission.exactAction,
        result.primaryMission.completionCriteria ?? undefined,
        selectedMinutes,
      )

      // 3. Start the session linked to the mission
      storeActions.startSession(mission.id, undefined, 'focus', selectedMinutes)
      storeActions.addMomentumEvent('rescue_started', 5, `Rescue: ${selectedState}`)

      // 4. Record retention event (activation path)
      storeActions.recordRetention('rescue_started', { state: selectedState, minutes: selectedMinutes, protocol: protocolId })
      HapticPatterns.rescue()

      router.push('/live')
    } catch (err) {
      const userErr = formatUserFacingError(err)
      HapticPatterns.error()
      console.warn(`[Rescue] ${userErr.title}: ${userErr.message}`)
    }
  }, [selectedState, selectedMinutes, router])

  const handleQuickAction = useCallback((screen: Href) => {
    HapticPatterns.tap()
    router.push(screen)
  }, [router])

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.dataConfidence}>{dataConfidence.label}</Text>
            <View style={styles.headerMeta}>
              {momentum.last7Days > 0 && (
                <View style={styles.momentumWindowPill}>
                  <TrendingUp size={14} color={colors.accent.green} />
                  <Text style={styles.momentumWindowText}>
                    {momentum.last7Days} rescue{momentum.last7Days !== 1 ? 's' : ''} this week
                  </Text>
                </View>
              )}
              {momentum.last7Days > 0 && (
                <Text style={styles.momentumExplanation}>rescues matter, not perfect days</Text>
              )}
              <View style={styles.momentumPill}>
                <Text style={styles.momentumText}>{weeklyMomentum} pts this week</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={styles.settingsBtn}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Settings size={22} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Good Timing Banner */}
        {homeIntel?.nextDangerWindow && (
          <Card variant="subtle" style={styles.timingCard}>
            <Text style={styles.timingText}>Your best focus window is coming up</Text>
          </Card>
        )}

        {/* Comeback Message (Loop 3 — enhanced with personalized message) */}
        {showComeback && (
          <Animated.View entering={SlideInDown.springify().damping(motion.springs.slow.damping)}>
            <Card variant="subtle" style={[styles.comebackCard, comeback.daysAway > 7 ? { borderColor: colors.accent.green + '40' } : undefined]}>
              <Text style={styles.comebackText}>{comeback.message}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Day Tracking Message (Loop 4 - Momentum) */}
        {showDayTracking && (
          <Animated.View entering={SlideInDown.delay(100).springify().damping(motion.springs.gentle.damping)}>
            <Card variant="subtle" style={styles.comebackCard}>
              <Text style={styles.comebackText}>{dayTrackingMessage}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Onboarding Hint (Day 0 user) */}
        {edgeCaseState.onboarding?.showOnboarding && (
          <Animated.View entering={SlideInDown.delay(50).springify().damping(motion.springs.gentle.damping)}>
            <Card variant="subtle" style={styles.comebackCard}>
              <Text style={styles.comebackText}>{edgeCaseState.onboarding.message}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Long Absence Message */}
        {edgeCaseState.longAbsence && (
          <Animated.View entering={SlideInDown.delay(75).springify().damping(motion.springs.gentle.damping)}>
            <Card variant="subtle" style={styles.comebackCard}>
              <Text style={styles.comebackText}>{edgeCaseState.longAbsence.message}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Burnout Warning Card */}
        {showBurnout && edgeCaseState.burnout?.message && (
          <Animated.View entering={SlideInDown.delay(250).springify().damping(motion.springs.gentle.damping)}>
            <Card variant="subtle" style={styles.burnoutCard}>
              <Text style={styles.burnoutText}>{edgeCaseState.burnout.message}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Pattern Name Card (Pull Mechanic 1) */}
        {patternName && (
          <Animated.View entering={SlideInDown.delay(150).springify().damping(motion.springs.gentle.damping)}>
            <Card variant="subtle" style={styles.patternCard}>
              <View style={styles.patternHeader}>
                <Text style={styles.patternIcon}>{patternName.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patternTitle}>{patternName.name}</Text>
                  <Text style={styles.patternDesc}>{patternName.description}</Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Daily Insight Card (Pull Mechanic 2) */}
        {dailyInsight && (
          <Animated.View entering={SlideInDown.delay(200).springify().damping(motion.springs.gentle.damping)}>
            <Card variant="subtle" style={styles.dailyInsightCard}>
              <Text style={styles.dailyInsightEmoji}>💡</Text>
              <Text style={styles.dailyInsightText}>{dailyInsight}</Text>
            </Card>
          </Animated.View>
        )}

        {/* Risk Indicator */}
        {showRisk && (
          <Card variant="subtle" style={styles.riskCard}>
            <View style={styles.riskRow}>
              <Shield size={16} color={riskColors[homeIntel.riskLevel]} />
              <Text style={[styles.riskText, { color: riskColors[homeIntel.riskLevel] }]}>
                {homeIntel.riskLevel === 'critical' ? 'High drift risk right now'
                  : homeIntel.riskLevel === 'high' ? 'Elevated drift risk'
                  : 'Moderate drift risk'}
              </Text>
            </View>
            {homeIntel.recommendedAction && (
              <Text style={styles.riskAction}>{homeIntel.recommendedAction}</Text>
            )}
            {homeIntel.nextDangerWindow ? (
              <Text style={styles.riskAction}>⚠ {homeIntel.nextDangerWindow.startHour}:00–{homeIntel.nextDangerWindow.endHour}:00 is your danger window</Text>
            ) : null}
          </Card>
        )}

        {/* Main Question */}
        <View style={styles.mainQuestion}>
          <Text style={styles.mainQuestionTitle}>
            {edgeCaseState.onboarding?.showOnboarding ? 'Ready for your first rescue?' : 'About to drift?'}
          </Text>
          <Text style={styles.mainQuestionSub}>
            {edgeCaseState.onboarding?.showOnboarding
              ? 'Pick how you feel. Start with 2 minutes.'
              : "Pick the state. I'll shrink the action."}
          </Text>
        </View>

        {/* State Chips */}
        <View style={styles.stateGrid}>
          {STATE_CHIPS.map(chip => (
            <AnimatedStateChip
              key={chip.id}
              chip={chip}
              selected={selectedState === chip.id}
              onPress={() => handleStateSelect(chip.id)}
            />
          ))}
        </View>

        {/* Rescue Button */}
        {selectedState && (
          <Animated.View entering={SlideInDown.springify().damping(20)} style={styles.rescueSection}>
            {/* Time Selector */}
            <View style={styles.timeRow}>
              {[1, 2, 5, 10, 15, 25].map(min => (
                <TouchableOpacity
                  key={min}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedMinutes === min }}
                  accessibilityLabel={`${min} minutes`}
                  style={[styles.timeChip, selectedMinutes === min && styles.timeChipActive]}
                  onPress={() => { HapticPatterns.selection(); setSelectedMinutes(min) }}
                >
                  <Text style={[styles.timeText, selectedMinutes === min && styles.timeTextActive]}>
                    {min}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rescue Me */}
            <AnimatedRescueButton
              visible={!!selectedState}
              protocolHint={selectedState ? `${getStateProtocolHint(selectedState)} • ${selectedMinutes} min` : ''}
              onPress={handleRescueMe}
              accessibilityHint="Starts your rescue session based on your current state"
            />
          </Animated.View>
        )}

        {/* Abandon Rate Alert */}
        {edgeCaseState.abandonAlert?.alert && (
          <Card variant="subtle" style={styles.abandonCard}>
            <Text style={styles.abandonText}>{edgeCaseState.abandonAlert.message}</Text>
            {edgeCaseState.abandonAlert.suggestedAction && (
              <Text style={styles.abandonAction}>{edgeCaseState.abandonAlert.suggestedAction}</Text>
            )}
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={styles.quickAction}
              onPress={() => handleQuickAction(action.screen)}
            >
              <View style={styles.quickActionIcon}>
                <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
              </View>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
              <ChevronRight size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Pending Brain Dump — Enhanced (Loop 6: Context Loop) */}
        {showBrainDumps && (
          <TouchableOpacity
            style={styles.pendingDumpCard}
            onPress={() => router.push('/coach')}
            accessibilityRole="button"
            accessibilityLabel={`Turn ${pendingBrainDumps.count} brain dump items into missions`}
          >
            <View style={styles.pendingDumpIconWrap}>
              <Brain size={18} color={colors.accent.orange} />
              <View style={styles.pendingDumpBadge}>
                <Text style={styles.pendingDumpBadgeText}>{pendingBrainDumps.count}</Text>
              </View>
            </View>
            <View style={styles.pendingDumpContent}>
              <Text style={styles.pendingDumpLabel}>Turn thoughts into missions</Text>
              <Text style={styles.pendingDumpPreview} numberOfLines={1}>
                {pendingBrainDumps.items[0]}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.brand[400]} />
          </TouchableOpacity>
        )}

        {/* System Insight */}
        {showInsight && (
          <Card variant="subtle" style={styles.insightCard}>
            <Text style={styles.insightText}>{homeIntel.riskMessage}</Text>
          </Card>
        )}

        {/* Today's Stats (minimal) */}
        <View style={styles.todayRow}>
          <View style={styles.todayStat}>
            <Text style={styles.todayValue}>{todayMinutes}m</Text>
            <Text style={styles.todayLabel}>{humanExperience}</Text>
          </View>
          <View style={styles.todayStat}>
            <Text style={styles.todayValue}>{sessions.filter(s => s.started_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length}</Text>
            <Text style={styles.todayLabel}>Sessions</Text>
          </View>
          <TouchableOpacity style={styles.todayStat} onPress={() => router.push('/progress')}>
            <Text style={[styles.todayValue, { color: colors.brand[400] }]}>→</Text>
            <Text style={styles.todayLabel}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Your Week in Words (Pull Mechanic 3) */}
        {weeklyStory && (
          <Animated.View entering={SlideInDown.delay(300).springify().damping(motion.springs.slow.damping)}>
            <Card variant="subtle" style={styles.weeklyStoryCard}>
              <View style={styles.weeklyStoryHeader}>
                <Text style={styles.weeklyStoryTitle}>{weeklyStory.headline}</Text>
                <TouchableOpacity onPress={handleShareStory} style={styles.shareBtn} accessibilityLabel="Share weekly story">
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.weeklyStoryHighlight}>{weeklyStory.highlight}</Text>
              <Text style={styles.weeklyStoryBody}>{weeklyStory.body}</Text>
            </Card>
          </Animated.View>
        )}
        {/* Fallback: system narrative if no weekly story */}
        {!weeklyStory && showNarrative && (
          <Animated.View entering={SlideInDown.delay(300).springify().damping(motion.springs.slow.damping)}>
            <Card variant="subtle" style={styles.narrativeCard}>
              <Text style={styles.narrativeLabel}>YOUR WEEK</Text>
              <Text style={styles.narrativeText}>{homeIntel.weeklyNarrative}</Text>
            </Card>
          </Animated.View>
        )}

        <View style={styles.bottomSpacer} />
</ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  settingsBtn: { padding: spacing.sm, marginTop: 2 },
  greeting: { ...typography.headline, color: colors.text.primary, fontSize: 24 },
  headerMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  momentumWindowPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accent.green + '15', paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: radius.full,
  },
  momentumWindowText: { ...typography.caption, color: colors.accent.green, fontWeight: '600' },
  momentumExplanation: { ...typography.caption, color: colors.text.disabled, fontSize: 10, marginTop: 1, fontStyle: 'italic' },
  comebackCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accent.orange + '30' },
  comebackText: { ...typography.bodyMedium, color: colors.text.secondary, fontStyle: 'italic' },

  // Timing Banner
  timingCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accent.green + '30' },
  timingText: { ...typography.bodyMedium, color: colors.accent.green },
  momentumPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.bg.surface, paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: radius.full,
  },
  momentumText: { ...typography.caption, color: colors.text.tertiary },

  // Main Question
  mainQuestion: { marginBottom: spacing.lg },
  mainQuestionTitle: { ...typography.h1, color: colors.text.primary, fontSize: 28 },
  mainQuestionSub: { ...typography.bodyMedium, color: colors.text.secondary, marginTop: spacing.xs },

  // State Grid
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  stateChip: {
    width: '22%',
    minWidth: 72,
    alignItems: 'center', padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle,
    gap: spacing.xs,
  },
  stateEmoji: { fontSize: 22 },
  stateLabel: { ...typography.caption, color: colors.text.secondary, textAlign: 'center' },

  // Rescue Section
  rescueSection: { marginBottom: spacing.lg },
  timeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  timeChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, backgroundColor: colors.bg.surface,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  timeChipActive: { borderColor: colors.brand[400], backgroundColor: colors.brand[400] + '15' },
  timeText: { ...typography.bodySmall, color: colors.text.secondary },
  timeTextActive: { color: colors.brand[400], fontWeight: '600' },

  // Quick Actions
  quickActions: { gap: spacing.sm, marginBottom: spacing.lg },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle,
  },
  quickActionIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg.elevated, justifyContent: 'center', alignItems: 'center' },
  quickActionEmoji: { fontSize: 18 },
  quickActionLabel: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },

  // Pending Brain Dump (Enhanced)
  pendingDumpCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent.orange + '10', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.accent.orange + '25',
  },
  pendingDumpIconWrap: { position: 'relative' },
  pendingDumpBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: colors.accent.orange, borderRadius: 8,
    width: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  pendingDumpBadgeText: { ...typography.caption, color: colors.text.inverse, fontSize: 10, fontWeight: '700' as const },
  pendingDumpLabel: { ...typography.bodyMedium, color: colors.accent.orange, fontWeight: '600' as const },
  pendingDumpPreview: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },

  // Insight
  insightCard: { padding: spacing.md, marginBottom: spacing.lg },
  insightText: { ...typography.bodySmall, color: colors.text.secondary, fontStyle: 'italic' },

  // Today
  todayRow: { flexDirection: 'row', gap: spacing.sm },
  todayStat: { flex: 1, alignItems: 'center', padding: spacing.md, backgroundColor: colors.bg.surface, borderRadius: radius.lg },
  todayValue: { ...typography.h2, color: colors.text.primary, fontSize: 20 },
  todayLabel: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },

  // Risk Indicator
  riskCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.warning + '30' },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  riskText: { ...typography.bodyMedium, fontWeight: '600' },
  riskAction: { ...typography.bodySmall, color: colors.text.secondary, marginTop: spacing.xxs },

  // Weekly Narrative
  narrativeCard: { padding: spacing.md, marginBottom: spacing.lg },
  narrativeLabel: { ...typography.labelSmall, color: colors.text.tertiary, letterSpacing: 1, marginBottom: spacing.xs },
  narrativeText: { ...typography.bodyMedium, color: colors.text.secondary, lineHeight: 22 },

  // Pattern Name Card (Pull Mechanic 1)
  patternCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.brand[400] + '25' },
  patternHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  patternIcon: { fontSize: 28 },
  patternTitle: { ...typography.headline, color: colors.text.primary, fontSize: 16 },
  patternDesc: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2, lineHeight: 18 },

  // Daily Insight Card (Pull Mechanic 2)
  dailyInsightCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, marginBottom: spacing.lg, gap: spacing.sm },
  dailyInsightEmoji: { fontSize: 20, marginTop: 1 },
  dailyInsightText: { ...typography.bodySmall, color: colors.text.secondary, flex: 1, lineHeight: 18, fontStyle: 'italic' },

  // Weekly Story Card (Pull Mechanic 3)
  weeklyStoryCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.brand[400] + '20' },
  weeklyStoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  weeklyStoryTitle: { ...typography.headline, color: colors.text.primary, fontSize: 16, flex: 1 },
  shareBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: radius.full, backgroundColor: colors.brand[400] + '15' },
  shareBtnText: { ...typography.caption, color: colors.brand[400], fontWeight: '600' },
  weeklyStoryHighlight: { ...typography.labelSmall, color: colors.brand[400], letterSpacing: 0.5, marginBottom: spacing.xs },
  weeklyStoryBody: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 20 },

  // Pending brain dump content wrapper (extracted from inline)
  pendingDumpContent: { flex: 1, marginLeft: spacing.sm },

  // Data Confidence
  dataConfidence: { ...typography.caption, color: colors.text.disabled, marginTop: 2, fontStyle: 'italic' },

  // Burnout Warning
  burnoutCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: '#F59E0B30', backgroundColor: '#F59E0B08' },
  burnoutText: { ...typography.bodySmall, color: '#92400E', lineHeight: 18 },

  // Abandon Rate Alert
  abandonCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accent.orange + '30' },
  abandonText: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 18 },
  abandonAction: { ...typography.caption, color: colors.accent.orange, fontWeight: '600' as const, marginTop: spacing.xs },

  // Bottom spacer (extracted from inline)
  bottomSpacer: { height: layout.tabBarHeight + spacing.lg },
})
