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
import { useRouter } from 'expo-router'
import {
  Zap, Shield, Brain, ChevronRight, Play, Flame,
} from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { colors, spacing, radius, typography, shadows, layout } from '../src/theme'
import { Screen, Card } from '../src/components'
import { runAntiDriftAgent } from '../src/agents/antiDriftAgent'
import { compileMission } from '../src/engine/missionCompiler'
import { getProtocolForState, RESCUE_PROTOCOLS } from '../src/types/rescue'
import type { UserState, EnergyLevel } from '../src/types'

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

const QUICK_ACTIONS = [
  { id: 'before_scroll', emoji: '📱', label: 'Before I Scroll', screen: '/before-scroll' as const },
  { id: 'body_double', emoji: '🛡️', label: 'Body Double', screen: '/live' as const },
  { id: 'paste_chaos', emoji: '📋', label: 'Paste Chaos', screen: '/coach' as const },
]

export default function HomeScreen() {
  const router = useRouter()
  const store = useAppStore()
  const user = store.user
  const sessions = store.sessions
  const momentumEvents = store.momentumEvents

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

  const streak = useMemo(() => {
    let count = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().slice(0, 10)
      const hasSession = sessions.some(s =>
        s.started_at.slice(0, 10) === dateStr && (s.status === 'completed' || s.status === 'salvaged')
      )
      if (hasSession) count++
      else if (i > 0) break
    }
    return count
  }, [sessions])

  const weeklyMomentum = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000
    return momentumEvents
      .filter(e => new Date(e.created_at).getTime() >= weekAgo)
      .reduce((sum, e) => sum + e.points, 0)
  }, [momentumEvents])

  // ── Agent Insight ──
  const agentInsight = useMemo(() => {
    if (sessions.length < 3) return null
    try {
      const output = runAntiDriftAgent({
        moment: null,
        recentSignals: [],
        driftGraph: null,
        privacySettings: { localOnlyMode: false, remoteAiEnabled: false, analyticsEnabled: true, aiPersonalizationEnabled: false, memoryEnabled: true, contextProcessingEnabled: true, systemSurfacesEnabled: true, shareAnalyticsEnabled: false, crashReportingEnabled: true },
        activeContext: null,
        isComeback: false,
        missionsCompletedToday: sessions.filter(s => s.status === 'completed').length,
        focusMinutesToday: 0,
        abandonCountToday: 0,
        source: 'app_open',
      })
      return output.coachPulse
    } catch {
      return null
    }
  }, [sessions])

  // ── Handlers ──
  const handleStateSelect = useCallback((state: UserState) => {
    setSelectedState(state)
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

    store.addMomentumEvent('rescue_started', 5, `Rescue: ${selectedState}`)
    store.startSession(undefined, undefined, 'focus', selectedMinutes)
    setRescueStarted(true)

    // Navigate to live mission
    router.push('/live')
  }, [selectedState, selectedMinutes, store, router])

  const handleQuickAction = useCallback((screen: string) => {
    router.push(screen as any)
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
              {streak > 0 && (
                <View style={styles.streakPill}>
                  <Flame size={14} color={colors.accent.orange} />
                  <Text style={styles.streakText}>{streak} day streak</Text>
                </View>
              )}
              <View style={styles.momentumPill}>
                <Text style={styles.momentumText}>{weeklyMomentum} pts this week</Text>
              </View>
            </View>
          </View>
        </View>

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
            <TouchableOpacity style={styles.rescueBtn} onPress={handleRescueMe}>
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

        {/* Tiny Insight */}
        {agentInsight && (
          <Card variant="subtle" style={styles.insightCard}>
            <Text style={styles.insightText}>{agentInsight}</Text>
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
  streakPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accent.orange + '15', paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: radius.full,
  },
  streakText: { ...typography.caption, color: colors.accent.orange, fontWeight: '600' },
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
})
