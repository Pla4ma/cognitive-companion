// ══════════════════════════════════════════════════════════════
// INTENT — Home Screen v4 (Phase 30)
// Anti-drift agent home. One decisive screen. No dashboard museum.
// Uses v4 engines: runAntiDriftAgent, compileMission, personalDriftGraph
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, type Href } from 'expo-router'
import {
  Zap, Shield, Brain, ChevronRight, Play, Flame, TrendingUp,
} from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { colors, spacing, radius, typography, shadows, layout } from '../src/theme'
import { Screen, Card } from '../src/components'
import { compileMission } from '../src/engine/missionCompiler'
import { getProtocolForState, RESCUE_PROTOCOLS } from '../src/types/rescue'
import type { UserState, EnergyLevel } from '../src/types'
import * as Haptics from 'expo-haptics'
import { getHomeIntelligence, type HomeIntelligence } from '../src/services/systemBridge'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const STATE_CHIPS: { id: UserState; emoji: string; label: string; color: string }[] = [
  { id: 'avoiding', emoji: '🙈', label: 'Avoiding', color: '#EF4444' },
  { id: 'overwhelmed', emoji: '🌊', label: 'Overwhelmed', color: '#F59E0B' },
  { id: 'stuck', emoji: '🫠', label: 'Stuck', color: '#8B5CF6' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: '#6366F1' },
  { id: 'distracted', emoji: '🦋', label: 'Distracted', color: '#EC4899' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#F97316' },
  { id: 'scattered', emoji: '🌪️', label: 'Scattered', color: '#14B8A6' },
  { id: 'ready', emoji: '🚀', label: 'Ready', color: '#10B981' },
]

const riskColors: Record<string, string> = { critical: '#EF4444', high: '#F59E0B', moderate: '#F97316', low: '#10B981' }

const QUICK_ACTIONS: { id: string; emoji: string; label: string; screen: Href }[] = [
  { id: 'before_scroll', emoji: '📱', label: 'Before I Scroll', screen: '/before-scroll' },
  { id: 'body_double', emoji: '🛡️', label: 'Body Double', screen: '/live' },
  { id: 'paste_chaos', emoji: '📋', label: 'Paste Chaos', screen: '/coach' },
]

export default function HomeScreen() {
  const router = useRouter()
  const store = useAppStore()
  const user = store.user
  const sessions = store.sessions
  const momentumEvents = store.momentumEvents
  const retentionState = store.retentionState
  const getComebackStatus = store.getComebackStatus
  const brainDumps = store.brainDumps

  const [selectedState, setSelectedState] = useState<UserState | null>(null)
  const [selectedMinutes, setSelectedMinutes] = useState(5)
  const [rescueStarted, setRescueStarted] = useState(false)

  // ── Derived Data ──
  const displayName = user?.display_name || 'there'
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

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

  // ── Comeback Detection ──
  const comeback = useMemo(() => getComebackStatus(), [sessions, retentionState.lastRescueDate])

  // ── Pending Brain Dumps (Loop 6) ──
  const pendingBrainDumps = useMemo(() => {
    const { getPendingBrainDumpItems } = require('../src/services/retention/retentionEngine')
    return getPendingBrainDumpItems(brainDumps)
  }, [brainDumps])

  // ── Day Tracking (Day 1/2/3/7/30 per audit Section 1.3) ──
  const dayTrackingMessage = useMemo(() => {
    const { getRetentionDay, getDaysSinceActivation } = require('../src/services/retention/retentionEngine')
    const { shouldShowDay2HabitSeed, shouldShowDay3Pattern, shouldShowDay7Insight, shouldShowDay30Commitment } = require('../src/services/retention/retentionEngine')
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

  // ── System Intelligence ──
  const homeIntel = useMemo(() => {
    return getHomeIntelligence({
      sessions,
      retentionState,
      patterns: store.resistancePatterns,
      distractions: store.distractions,
      momentumEvents,
      missions: store.missions,
      microMissions: store.microMissions,
      brainDumps,
      userPatterns: null,
      quietHours: null,
      userName: user?.display_name ?? null,
    })
  }, [sessions, retentionState, store.resistancePatterns, store.distractions, momentumEvents, store.missions, store.microMissions, brainDumps, user?.display_name])

  // ── Handlers ──
  const handleStateSelect = useCallback((state: UserState) => {
    setSelectedState(state)
    Haptics.selectionAsync()
  }, [])

  const handleRescueMe = useCallback(() => {
    if (!selectedState) return

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

    // 1. Create the mission in the store so live screen can find it
    const mission = store.addMission(
      result.primaryMission.exactAction.slice(0, 60),
      `Protocol: ${RESCUE_PROTOCOLS[protocolId].name} · State: ${selectedState}`,
      STATE_CHIPS.find(c => c.id === selectedState)?.color ?? colors.brand[400],
    )

    // 2. Add the micro-mission so live screen shows exactAction
    store.addMicroMission(
      mission.id,
      result.primaryMission.exactAction,
      result.primaryMission.completionCriteria ?? undefined,
      selectedMinutes,
    )

    // 3. Start the session linked to the mission
    store.startSession(mission.id, undefined, 'focus', selectedMinutes)
    store.addMomentumEvent('rescue_started', 5, `Rescue: ${selectedState}`)

    // 4. Record retention event (activation path)
    store.recordRetention('rescue_started', { state: selectedState, minutes: selectedMinutes, protocol: protocolId })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

    setRescueStarted(true)
    router.push('/live')
  }, [selectedState, selectedMinutes, store, router])

  const handleQuickAction = useCallback((screen: Href) => {
    router.push(screen)
  }, [router])

  // ── Rescue Active ──
  if (rescueStarted) {
    return (
      <Screen>
        <View style={styles.rescueActive}>
          <Text style={styles.rescueActiveTitle}>Rescue in progress...</Text>
          <Text style={styles.rescueActiveSub}>Head to your mission</Text>
          <TouchableOpacity style={styles.goToMissionBtn} onPress={() => router.push('/live')}>
            <Play size={20} color={colors.text.inverse} />
            <Text style={styles.goToMissionText}>Go to Mission</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{timeGreeting}, {displayName}</Text>
            <View style={styles.headerMeta}>
              {momentum.last7Days > 0 && (
                <View style={styles.momentumWindowPill}>
                  <TrendingUp size={14} color={colors.accent.green} />
                  <Text style={styles.momentumWindowText}>
                    {momentum.last7Days} rescue{momentum.last7Days !== 1 ? 's' : ''} this week
                  </Text>
                </View>
              )}
              <View style={styles.momentumPill}>
                <Text style={styles.momentumText}>{weeklyMomentum} pts this week</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Comeback Message (Loop 3) */}
        {comeback.isComeback && (
          <Card variant="subtle" style={styles.comebackCard}>
            <Text style={styles.comebackText}>{comeback.message}</Text>
          </Card>
        )}

        {/* Day Tracking Message (Loop 4 - Momentum) */}
        {dayTrackingMessage && !comeback.isComeback && (
          <Card variant="subtle" style={styles.comebackCard}>
            <Text style={styles.comebackText}>{dayTrackingMessage}</Text>
          </Card>
        )}

        {/* Risk Indicator */}
        {homeIntel.riskLevel && homeIntel.riskLevel !== 'low' && (
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
          <Text style={styles.mainQuestionTitle}>About to drift?</Text>
          <Text style={styles.mainQuestionSub}>Pick the state. I'll shrink the action.</Text>
        </View>

        {/* State Chips */}
        <View style={styles.stateGrid}>
          {STATE_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedState === chip.id }}
              accessibilityLabel={`${chip.label} state - tap to select`}
              style={[
                styles.stateChip,
                selectedState === chip.id && {
                  borderColor: chip.color,
                  backgroundColor: chip.color + '15',
                },
              ]}
              onPress={() => handleStateSelect(chip.id)}
            >
              <Text style={styles.stateEmoji}>{chip.emoji}</Text>
              <Text
                style={[
                  styles.stateLabel,
                  selectedState === chip.id && { color: chip.color },
                ]}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rescue Button */}
        {selectedState && (
          <View style={styles.rescueSection}>
            {/* Time Selector */}
            <View style={styles.timeRow}>
              {[1, 2, 5, 10, 15, 25].map(min => (
                <TouchableOpacity
                  key={min}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedMinutes === min }}
                  accessibilityLabel={`${min} minutes`}
                  style={[styles.timeChip, selectedMinutes === min && styles.timeChipActive]}
                  onPress={() => setSelectedMinutes(min)}
                >
                  <Text style={[styles.timeText, selectedMinutes === min && styles.timeTextActive]}>
                    {min}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rescue Me */}
            <TouchableOpacity style={styles.rescueBtn} onPress={handleRescueMe} accessibilityRole="button" accessibilityLabel="Start rescue session">
              <LinearGradient colors={colors.gradients.brand} style={styles.rescueGradient}>
                <Zap size={22} color={colors.text.inverse} />
                <Text style={styles.rescueText}>Rescue Me</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Protocol hint */}
            <Text style={styles.protocolHint}>
              {RESCUE_PROTOCOLS[getProtocolForState(selectedState)].name} • {selectedMinutes} min
            </Text>
          </View>
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
        {pendingBrainDumps.count > 0 && (
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
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.pendingDumpLabel}>Turn thoughts into missions</Text>
              <Text style={styles.pendingDumpPreview} numberOfLines={1}>
                {pendingBrainDumps.items[0]}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.brand[400]} />
          </TouchableOpacity>
        )}

        {/* System Insight */}
        {homeIntel.riskMessage && !homeIntel.riskLevel && (
          <Card variant="subtle" style={styles.insightCard}>
            <Text style={styles.insightText}>{homeIntel.riskMessage}</Text>
          </Card>
        )}

        {/* Today's Stats (minimal) */}
        <View style={styles.todayRow}>
          <View style={styles.todayStat}>
            <Text style={styles.todayValue}>{todayMinutes}m</Text>
            <Text style={styles.todayLabel}>Focus today</Text>
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

        {/* Loop Status */}
        <View style={styles.loopStatus}>
          <Text style={styles.loopText}>{homeIntel.loopStatus.active}/{homeIntel.loopStatus.total} loops</Text>
        </View>

        {/* Weekly Narrative */}
        {homeIntel.weeklyNarrative && (
          <Card variant="subtle" style={styles.narrativeCard}>
            <Text style={styles.narrativeLabel}>YOUR WEEK</Text>
            <Text style={styles.narrativeText}>{homeIntel.weeklyNarrative}</Text>
          </Card>
        )}

        <View style={{ height: layout.tabBarHeight + spacing.lg }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  greeting: { ...typography.headline, color: colors.text.primary, fontSize: 24 },
  headerMeta: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  momentumWindowPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accent.green + '15', paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: radius.full,
  },
  momentumWindowText: { ...typography.caption, color: colors.accent.green, fontWeight: '600' },
  comebackCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accent.orange + '30' },
  comebackText: { ...typography.bodyMedium, color: colors.text.secondary, fontStyle: 'italic' },
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
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 3) / 4,
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
  rescueBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  rescueGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md,
  },
  rescueText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '700', fontSize: 18 },
  protocolHint: { ...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.xs },

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

  // Rescue Active
  rescueActive: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  rescueActiveTitle: { ...typography.h1, color: colors.text.primary, fontSize: 24, marginBottom: spacing.sm },
  rescueActiveSub: { ...typography.bodyMedium, color: colors.text.secondary, marginBottom: spacing.xl },
  goToMissionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.brand[400], borderRadius: radius.lg, padding: spacing.md, paddingHorizontal: spacing.xl,
  },
  goToMissionText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },
  pendingDumpCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent.orange + '10', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.accent.orange + '20',
  },
  pendingDumpLabel: { ...typography.caption, color: colors.accent.orange, fontWeight: '600' },
  pendingDumpPreview: { ...typography.bodySmall, color: colors.text.secondary, marginTop: 2 },

  // Risk Indicator
  riskCard: { padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accent.orange + '30' },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  riskText: { ...typography.bodyMedium, fontWeight: '600' },
  riskAction: { ...typography.bodySmall, color: colors.text.secondary, marginTop: spacing.xs },

  // Loop Status
  loopStatus: { alignItems: 'center', padding: spacing.xs },
  loopText: { ...typography.caption, color: colors.text.disabled },

  // Narrative
  narrativeCard: { padding: spacing.md, marginBottom: spacing.lg },
  narrativeLabel: { ...typography.labelSmall, color: colors.brand[400], marginBottom: spacing.xs },
  narrativeText: { ...typography.bodySmall, color: colors.text.secondary },
})
