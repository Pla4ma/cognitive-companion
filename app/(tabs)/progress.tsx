// ══════════════════════════════════════════════════════════════
// INTENT — Progress Screen
// Weekly narrative, stats, intelligence panel, heatmap
// ══════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { TrendingUp, Share2, Brain, Calendar } from 'lucide-react-native'
import { MMKV } from 'react-native-mmkv'
import { Share } from 'react-native'
import { useAppStore } from '../../src/store'
import { calculateMomentumScore, analyzeResistancePatterns } from '../../src/engine'
import { colors, spacing, radius, typography, layout } from '../../src/theme'
import { Screen, Card, SectionHeader } from '../../src/components'
import { generateWeeklyNarrative } from '../../src/engine/insights'
import { generateWeeklySummaryCard, shareCard, generateWeeklyImageCard } from '../../src/services/share'
import { WeeklyShareCard } from '../../src/components/WeeklyShareCard'
import { useDriftIntelligence } from '../../src/hooks/useDriftIntelligence'
import { IntelligenceCard } from '../../src/components/IntelligenceCard'
import { DangerWindowHeatmap } from '../../src/components/DangerWindowHeatmap'
import { scheduleWeeklyNarrative } from '../../src/services/notifications'

const storage = new MMKV()

// ── Helpers ─────────────────────────────────────────────────

function getWeekKey(): string {
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `narrative_${now.getFullYear()}_${weekNum}`
}

// ── Component ───────────────────────────────────────────────

export default function ProgressScreen() {
  const shareCardRef = useRef<View>(null)
  const sessions = useAppStore((s) => s.sessions)
  const resistancePatterns = useAppStore((s) => s.resistancePatterns)
  const distractions = useAppStore((s) => s.distractions)
  const momentumEvents = useAppStore((s) => s.momentumEvents)
  const user = useAppStore((s) => s.user)
  const sessionCount = useAppStore((s) => s.sessions.length)
  const plan = user?.plan ?? 'free'

  // ── Weekly Narrative (cached in MMKV) ──
  const weekKey = getWeekKey()
  const weeklyNarrative = useMemo(() => {
    const cachedNarrative = storage.getString(weekKey)
    const cachedSessionCount = storage.getNumber(`${weekKey}_count`)
    if (cachedNarrative != null && cachedSessionCount === sessionCount) return cachedNarrative
    const fresh = generateWeeklyNarrative(sessions, resistancePatterns, distractions, user?.display_name ?? '')
    storage.set(weekKey, fresh)
    storage.set(`${weekKey}_count`, sessionCount)
    return fresh
  }, [sessions.length, resistancePatterns.length, distractions.length, weekKey, sessionCount])

  // Schedule weekly narrative notification (fires once per week)
  React.useEffect(() => {
    if (weeklyNarrative && sessions.length >= 7) {
      const scheduledKey = `${weekKey}_notif_scheduled`
      if (!storage.getBoolean(scheduledKey)) {
        scheduleWeeklyNarrative(weeklyNarrative, user?.display_name ?? null)
          .then(() => { storage.set(scheduledKey, true) })
          .catch(() => {})
      }
    }
  }, [weeklyNarrative, sessions.length, weekKey])

  // ── Weekly stats ──
  const weekAgo = Date.now() - 7 * 86400000
  const weekSessions = useMemo(
    () => sessions.filter((s) => new Date(s.started_at).getTime() >= weekAgo),
    [sessions],
  )
  const rescuedCount = weekSessions.filter(
    (s) => s.status === 'completed' || s.status === 'salvaged',
  ).length
  const completionRate = weekSessions.length > 0
    ? Math.round((weekSessions.filter((s) => s.status === 'completed').length / weekSessions.length) * 100)
    : 0
  const salvageRate = weekSessions.length > 0
    ? Math.round((weekSessions.filter((s) => s.status === 'salvaged').length / weekSessions.length) * 100)
    : 0

  // ── 4-Week Trend ──
  const trendData = useMemo(() => {
    const bars: { label: string; count: number }[] = []
    for (let w = 3; w >= 0; w--) {
      const start = Date.now() - (w + 1) * 7 * 86400000
      const end = Date.now() - w * 7 * 86400000
      const count = sessions.filter((s) => {
        const t = new Date(s.started_at).getTime()
        return t >= start && t < end && (s.status === 'completed' || s.status === 'salvaged')
      }).length
      const label = w === 0 ? 'This' : w === 1 ? 'Last' : `${w + 1}w`
      bars.push({ label, count })
    }
    return bars
  }, [sessions])
  const maxBar = Math.max(...trendData.map((d) => d.count), 1)

  // ── Resistance analysis ──
  const resistanceAnalysis = useMemo(
    () => analyzeResistancePatterns(resistancePatterns),
    [resistancePatterns],
  )

  // ── Intelligence (7+ sessions) ──
  const intelligence = useDriftIntelligence()

  // ── Recent sessions ──
  const recentSessions = sessions.slice(0, 10)

  const handleShare = async () => {
    const minutes = Math.round(weekSessions.reduce((sum, s) => sum + s.actual_seconds, 0) / 60)

    // Try image share first
    const imageUri = await generateWeeklyImageCard(shareCardRef)
    if (imageUri) {
      try {
        await Share.share({ url: imageUri, title: 'My INTENT Week' })
        return
      } catch {
        // fall through to text share
      }
    }

    // Fallback to text share
    const card = generateWeeklySummaryCard({
      sessions: rescuedCount,
      minutes,
      streak: 0,
      rescues: rescuedCount,
      topState: 'avoiding',
      completionRate,
      salvageRate,
      narrative: weeklyNarrative,
    })
    shareCard(card)
  }

  return (
    <Screen gradient={['rgba(139,92,246,0.04)', 'transparent']}>
      <Text accessibilityRole="header" style={styles.title}>Progress</Text>

      {/* ── Weekly Narrative ── */}
      <Card variant="default" style={styles.narrativeCard}>
        <View style={styles.narrativeHeader}>
          <View style={styles.narrativeHeaderLeft}>
            <Calendar size={14} color={colors.brand[400]} />
            <Text style={styles.narrativeLabel}>THIS WEEK</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} accessibilityLabel="Share this week's progress">
            <Share2 size={16} color={colors.brand[400]} />
            <Text style={styles.shareBtnText}>Share this week</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.narrativeText}>{weeklyNarrative}</Text>
        <Text style={styles.narrativeTimestamp}>Generated {new Date().toLocaleDateString()}</Text>
      </Card>

      {/* ── Stats Row ── */}
      <View style={styles.statsRow}>
        <Card variant="default" style={styles.statCard} accessibilityLabel={`${rescuedCount} rescued this week`}>
          <Text style={styles.statValue}>{rescuedCount}</Text>
          <Text style={styles.statLabel}>Rescued this week</Text>
        </Card>
        <Card variant="default" style={styles.statCard} accessibilityLabel={`${completionRate} percent completion rate`}>
          <Text style={styles.statValue}>{completionRate}%</Text>
          <Text style={styles.statLabel}>Completion rate</Text>
        </Card>
        <Card variant="default" style={styles.statCard} accessibilityLabel={`${salvageRate} percent salvage rate`}>
          <Text style={styles.statValue}>{salvageRate}%</Text>
          <Text style={styles.statLabel}>Salvage rate</Text>
        </Card>
      </View>

      {/* ── 4-Week Trend ── */}
      <SectionHeader title="4-Week Trend" icon={<TrendingUp size={16} color={colors.accent.pink} />} />
      <Card variant="default" style={styles.trendCard}>
        <View style={styles.trendBarsContainer}>
          <View style={styles.trendYAxis}>
            <Text style={styles.trendBarValue}>{maxBar}</Text>
            <Text style={styles.trendBarValue}>{Math.round(maxBar/2)}</Text>
            <Text style={styles.trendBarValue}>0</Text>
          </View>
        <View style={styles.trendBars}>
          {trendData.map((bar, i) => (
            <View key={i} style={styles.trendBarCol}>
              <Text style={styles.trendBarValue}>{bar.count}</Text>
              <View style={styles.trendBarTrack}>
                <View
                  style={[
                    styles.trendBarFill,
                    {
                      height: `${Math.round((bar.count / maxBar) * 100)}%`,
                      backgroundColor: i === 3 ? colors.brand[500] : colors.brand[500] + '60',
                    },
                  ]}
                />
              </View>
              <Text style={styles.trendBarLabel}>{bar.label}</Text>
            </View>
          ))}
        </View>
        </View>
      </Card>

      {/* ── Intelligence Panel (7+ sessions, Pro only) ── */}
      {intelligence.hasEnoughData && intelligence.profile && intelligence.prediction && (
        <>
          <SectionHeader title="Intelligence" icon={<Brain size={16} color={colors.accent.purple} />} />
          {plan === 'pro' ? (
            <>
              <IntelligenceCard profile={intelligence.profile} prediction={intelligence.prediction} />

              {intelligence.profile.timeSlots.length > 0 && (
                <Card variant="default" style={styles.heatmapCard}>
                  <DangerWindowHeatmap timeSlots={intelligence.profile.timeSlots} />
                </Card>
              )}
            </>
          ) : (
            <Card variant="default" style={styles.heatmapCard}>
              <Text style={styles.resistanceInsight}>
                Your peak danger window is detected. After {sessions.length} sessions, INTENT maps your hardest hours.
              </Text>
              <Text style={[styles.resistanceInsight, { marginTop: 8, color: colors.brand[400] }]}>
                Upgrade to Pro to see your full resistance map →
              </Text>
            </Card>
          )}
        </>
      )}

      {/* ── Resistance Map ── */}
      {resistancePatterns.length > 0 && (
        <>
          <SectionHeader title="Resistance Map" icon={<TrendingUp size={16} color={colors.accent.purple} />} />
          <Card variant="default" style={styles.resistanceCard}>
            <Text style={styles.resistanceInsight}>{resistanceAnalysis.insight}</Text>
            <View style={styles.resistanceStats}>
              <View style={styles.resistanceStat}>
                <Text style={styles.resistanceStatLabel}>Most common</Text>
                <Text style={styles.resistanceStatValue}>{resistanceAnalysis.most_common_state || 'N/A'}</Text>
              </View>
              <View style={styles.resistanceStat}>
                <Text style={styles.resistanceStatLabel}>Best strategy</Text>
                <Text style={styles.resistanceStatValue}>{resistanceAnalysis.most_effective_strategy || 'N/A'}</Text>
              </View>
              <View style={styles.resistanceStat}>
                <Text style={styles.resistanceStatLabel}>Trend</Text>
                <Text style={styles.resistanceStatValue}>{resistanceAnalysis.trend}</Text>
              </View>
            </View>
          </Card>
        </>
      )}

      {/* ── Recent Sessions ── */}
      {recentSessions.length > 0 && (
        <>
          <SectionHeader title="Recent Sessions" icon={<Calendar size={16} color={colors.brand[400]} />} />
          <View style={{ height: recentSessions.length * 64 }}>
            <FlashList
              data={recentSessions}
              estimatedItemSize={64}
              renderItem={({ item: s }) => {
                const statusColor =
                  s.status === 'completed' ? colors.accent.green
                    : s.status === 'salvaged' ? colors.accent.orange
                    : colors.text.tertiary
                return (
                  <Card variant="default" style={styles.sessionRow}>
                    <View style={styles.sessionRowInner}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionStatus}>{s.status}</Text>
                        <Text style={styles.sessionTime}>
                          {new Date(s.started_at).toLocaleDateString()} · {Math.round(s.actual_seconds / 60)}m
                        </Text>
                      </View>
                    </View>
                  </Card>
                )
              }}
              keyExtractor={(item, i) => item.id ?? String(i)}
            />
          </View>
        </>
      )}

      {/* ── Empty state ── */}
      {sessions.length === 0 && (
        <Card variant="default" style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            No sessions yet. Start your first session to see your progress here.
          </Text>
        </Card>
      )}

      {/* ── Off-screen share card (for image capture) ── */}
      <View style={styles.offScreen} pointerEvents="none">
        <WeeklyShareCard
          ref={shareCardRef}
          rescues={rescuedCount}
          minutes={Math.round(weekSessions.reduce((sum, s) => sum + s.actual_seconds, 0) / 60)}
          completionRate={completionRate}
          narrative={weeklyNarrative}
          userName={user?.display_name ?? 'User'}
        />
      </View>

      <View style={{ height: layout.tabBarHeight + spacing.lg }} />
    </Screen>
  )
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  title: { ...typography.headline, color: colors.text.primary, marginBottom: spacing.lg },

  // Narrative
  narrativeCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  narrativeHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm,
  },
  narrativeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  narrativeLabel: { ...typography.labelSmall, color: colors.text.secondary, letterSpacing: 1 },
  narrativeText: { ...typography.bodyMedium, color: colors.text.primary, lineHeight: 22 },
  narrativeTimestamp: { ...typography.caption, color: colors.text.disabled, marginTop: spacing.xs },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxs,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.brand[500] + '12',
    borderWidth: 1, borderColor: colors.brand[500] + '25',
  },
  shareBtnText: { ...typography.caption, color: colors.brand[400] },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sectionGap },
  statCard: { flex: 1, padding: spacing.md, alignItems: 'center' },
  statValue: { ...typography.h2, color: colors.text.primary },
  statLabel: { ...typography.caption, color: colors.text.tertiary, textAlign: 'center', marginTop: 2 },

  // 4-Week Trend
  trendCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  trendBarsContainer: { flexDirection: 'row' },
  trendYAxis: { justifyContent: 'space-between', height: 60, marginRight: spacing.xs },
  trendBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100, flex: 1 },
  trendBarCol: { alignItems: 'center', gap: spacing.xxs },
  trendBarValue: { ...typography.caption, color: colors.text.tertiary },
  trendBarTrack: {
    width: 32, height: 60, borderRadius: radius.sm,
    backgroundColor: colors.border.subtle, overflow: 'hidden', justifyContent: 'flex-end',
  },
  trendBarFill: { width: '100%', borderRadius: radius.sm },
  trendBarLabel: { ...typography.caption, color: colors.text.tertiary },

  // Heatmap
  heatmapCard: { padding: spacing.md, marginBottom: spacing.sectionGap },

  // Resistance
  resistanceCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  resistanceInsight: { ...typography.bodyMedium, color: colors.text.primary, lineHeight: 20, marginBottom: spacing.md },
  resistanceStats: { flexDirection: 'row', gap: spacing.md },
  resistanceStat: { flex: 1, alignItems: 'center' },
  resistanceStatLabel: { ...typography.caption, color: colors.text.tertiary },
  resistanceStatValue: { ...typography.bodySmall, color: colors.text.primary, marginTop: 2, fontWeight: '600' },

  // Recent Sessions
  sessionRow: { padding: spacing.md, marginBottom: spacing.xs },
  sessionRowInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  sessionInfo: { flex: 1 },
  sessionStatus: { ...typography.bodyMedium, color: colors.text.primary, textTransform: 'capitalize' },
  sessionTime: { ...typography.caption, color: colors.text.tertiary },

  // Empty
  emptyCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  emptyText: { ...typography.bodyMedium, color: colors.text.tertiary, textAlign: 'center' },

  // Off-screen (for image capture)
  offScreen: { position: 'absolute', left: -9999, top: -9999, opacity: 0 },
})
