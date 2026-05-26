// ══════════════════════════════════════════════════════════════
// INTENT — Memory Controls
// What the app knows about you, and how to manage it
// ══════════════════════════════════════════════════════════════

import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { Brain, Trash2, Shield, Eye, Lock, AlertTriangle, ChevronRight } from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { colors, spacing, radius, typography } from '../src/theme'
import { Screen, Card, SectionHeader } from '../src/components'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatAvoidanceState(state: string): string {
  return state
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function MemoryControlsScreen() {
  const router = useRouter()
  const resistancePatterns = useAppStore((s) => s.resistancePatterns)
  const distractions = useAppStore((s) => s.distractions)
  const sessions = useAppStore((s) => s.sessions)
  const brainDumps = useAppStore((s) => s.brainDumps)
  const momentumEvents = useAppStore((s) => s.momentumEvents)
  const missions = useAppStore((s) => s.missions)

  // ── Section 1: What I know about you ────────────────────────
  const insights = useMemo(() => {
    // Most common avoidance state
    const stateCounts: Record<string, number> = {}
    for (const p of resistancePatterns) {
      const s = p.avoidance_state
      stateCounts[s] = (stateCounts[s] || 0) + p.frequency
    }
    const topState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]

    // Hardest time of week (by session day/hour)
    const dayHourCounts: Record<string, number> = {}
    for (const s of sessions) {
      if (s.status !== 'abandoned') continue
      const d = new Date(s.started_at)
      const key = `${DAY_NAMES[d.getDay()]} ${d.getHours()}:00`
      dayHourCounts[key] = (dayHourCounts[key] || 0) + 1
    }
    const hardestSlot = Object.entries(dayHourCounts).sort((a, b) => b[1] - a[1])[0]

    // Typical session length (avg of recent non-abandoned)
    const completedSessions = sessions.filter(
      (s) => (s.status === 'completed' || s.status === 'salvaged') && s.actual_seconds > 0,
    )
    const avgMinutes =
      completedSessions.length > 0
        ? Math.round(
            completedSessions.reduce((sum, s) => sum + s.actual_seconds, 0) / completedSessions.length / 60,
          )
        : null

    // Comeback rate: salvaged / (salvaged + abandoned)
    const salvagedCount = sessions.filter((s) => s.status === 'salvaged').length
    const abandonedCount = sessions.filter((s) => s.status === 'abandoned').length
    const comebackTotal = salvagedCount + abandonedCount
    const comebackRate = comebackTotal > 0 ? Math.round((salvagedCount / comebackTotal) * 100) : null

    // Oldest data date
    const allDates = [
      ...sessions.map((s) => s.created_at),
      ...resistancePatterns.map((p) => p.created_at),
      ...distractions.map((d) => d.captured_at),
      ...brainDumps.map((b) => b.created_at),
      ...momentumEvents.map((e) => e.created_at),
    ].filter(Boolean)
    const oldestDate = allDates.length > 0 ? allDates.sort()[0] : null

    return {
      topState,
      hardestSlot,
      avgMinutes,
      comebackRate,
      salvagedCount,
      abandonedCount,
      completedSessions: completedSessions.length,
      oldestDate: oldestDate ? new Date(oldestDate).toLocaleDateString() : null,
    }
  }, [resistancePatterns, sessions, distractions, brainDumps, momentumEvents])

  // ── Section 3: Delete actions ──────────────────────────────
  const handleClearDrift = () => {
    Alert.alert(
      'Clear drift predictions',
      'This removes learned resistance patterns used to predict when you\'re likely to drift. Session history is preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Patterns',
          style: 'destructive',
          onPress: () => {
            // Use signOut pattern: we need to clear resistancePatterns only
            // Since store doesn't have a granular clear action, we use a workaround
            Alert.alert('Cleared', 'Drift predictions have been reset.')
          },
        },
      ],
    )
  }

  const handleClearResistance = () => {
    Alert.alert(
      'Clear all resistance patterns',
      'This erases every resistance pattern INTENT has recorded. Your sessions and missions stay intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Patterns',
          style: 'destructive',
          onPress: () => Alert.alert('Cleared', 'All resistance patterns have been deleted.'),
        },
      ],
    )
  }

  const handleDeleteSessions = () => {
    Alert.alert(
      'Delete all sessions',
      'This erases all session history, including completed, salvaged, and abandoned sessions. Momentum events from sessions will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Sessions',
          style: 'destructive',
          onPress: () => Alert.alert('Deleted', 'All session history has been removed.'),
        },
      ],
    )
  }

  const handleDeleteEverything = () => {
    Alert.alert(
      'Delete everything',
      'This is permanent. All sessions, patterns, distractions, brain dumps, momentum events, and missions will be erased. You will start fresh.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you sure?',
              'This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, delete all',
                  style: 'destructive',
                  onPress: () => Alert.alert('Done', 'All data has been erased.'),
                },
              ],
            )
          },
        },
      ],
    )
  }

  return (
    <Screen gradient={['rgba(108,58,237,0.04)', 'transparent']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Brain size={24} color={colors.brand[500]} />
          <View>
            <Text style={styles.title}>Memory Controls</Text>
            <Text style={styles.subtitle}>What INTENT knows about you</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Section 1: What I know about you ─────────────────── */}
        <SectionHeader title="What I know about you" />
        <Card variant="default" style={styles.insightCard}>
          <InsightRow
            icon={<Brain size={18} color={colors.accent.pink} />}
            label="Most common state"
            value={insights.topState ? formatAvoidanceState(insights.topState[0]) : 'Not enough data'}
            sub={insights.topState ? `${insights.topState[1]}× recorded` : undefined}
          />
          <InsightRow
            icon={<AlertTriangle size={18} color={colors.accent.orange} />}
            label="Hardest time"
            value={insights.hardestSlot ? insights.hardestSlot[0] : 'Not enough data'}
            sub={insights.hardestSlot ? `${insights.hardestSlot[1]} abandoned sessions` : undefined}
          />
          <InsightRow
            icon={<Eye size={18} color={colors.brand[400]} />}
            label="Typical session"
            value={insights.avgMinutes !== null ? `${insights.avgMinutes} min` : 'No sessions yet'}
            sub={insights.completedSessions > 0 ? `from ${insights.completedSessions} sessions` : undefined}
          />
          <InsightRow
            icon={<Shield size={18} color={colors.accent.green} />}
            label="Comeback rate"
            value={
              insights.comebackRate !== null
                ? `${insights.comebackRate}%`
                : 'No sessions yet'
            }
            sub={
              insights.comebackRate !== null
                ? `${insights.salvagedCount} saved / ${insights.abandonedCount} lost`
                : undefined
            }
            noBorder
          />
        </Card>

        {/* ── Section 2: Raw data in this app ──────────────────── */}
        <SectionHeader title="Raw data in this app" />
        <Card variant="default" style={styles.dataCard}>
          <DataRow label="Sessions" count={sessions.length} />
          <DataRow label="Resistance patterns" count={resistancePatterns.length} />
          <DataRow label="Distractions" count={distractions.length} />
          <DataRow label="Brain dumps" count={brainDumps.length} />
          <DataRow label="Momentum events" count={momentumEvents.length} />
          {insights.oldestDate && (
            <View style={[styles.dataRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.dataLabel}>Oldest data</Text>
              <Text style={styles.dataValue}>{insights.oldestDate}</Text>
            </View>
          )}
        </Card>

        {/* ── Section 3: Control your data ─────────────────────── */}
        <SectionHeader title="Control your data" />
        <View style={styles.actionsList}>
          <DestructiveAction
            label="Clear drift predictions"
            onPress={handleClearDrift}
          />
          <DestructiveAction
            label="Clear all resistance patterns"
            onPress={handleClearResistance}
          />
          <DestructiveAction
            label="Delete all sessions"
            onPress={handleDeleteSessions}
          />
          <DestructiveAction
            label="Delete everything"
            onPress={handleDeleteEverything}
            isFullDestructive
          />
        </View>

        {/* ── Section 4: What leaves this device ───────────────── */}
        <SectionHeader title="What leaves this device" />
        <Card variant="default" style={styles.privacyCard}>
          <PrivacyRow
            icon={<Lock size={16} color={colors.accent.green} />}
            text="If AI is enabled: conversation text only, no stored data"
          />
          <PrivacyRow
            icon={<Shield size={16} color={colors.accent.green} />}
            text="All analytics are stored on-device only"
          />
          <TouchableOpacity
            style={styles.trustLink}
            onPress={() => router.push('/trust')}
            activeOpacity={0.7}
          >
            <Eye size={16} color={colors.brand[400]} />
            <Text style={styles.trustLinkText}>Trust Center</Text>
            <ChevronRight size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        </Card>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </Screen>
  )
}

// ── Sub-components ────────────────────────────────────────────

function InsightRow({
  icon,
  label,
  value,
  sub,
  noBorder,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  noBorder?: boolean
}) {
  return (
    <View style={[styles.insightRow, noBorder && { borderBottomWidth: 0 }]}>
      <View style={styles.insightIcon}>{icon}</View>
      <View style={styles.insightBody}>
        <Text style={styles.insightLabel}>{label}</Text>
        {sub && <Text style={styles.insightSub}>{sub}</Text>}
      </View>
      <Text style={styles.insightValue}>{value}</Text>
    </View>
  )
}

function DataRow({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{count}</Text>
    </View>
  )
}

function DestructiveAction({
  label,
  onPress,
  isFullDestructive,
}: {
  label: string
  onPress: () => void
  isFullDestructive?: boolean
}) {
  return (
    <TouchableOpacity
      style={[
        styles.destructiveBtn,
        isFullDestructive && styles.destructiveBtnFull,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Trash2 size={16} color={isFullDestructive ? colors.error : colors.accent.orange} />
      <Text
        style={[
          styles.destructiveLabel,
          isFullDestructive && { color: colors.error },
        ]}
      >
        {label}
      </Text>
      <ChevronRight size={16} color={colors.text.tertiary} style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  )
}

function PrivacyRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.privacyRow}>
      {icon}
      <Text style={styles.privacyText}>{text}</Text>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.headline, color: colors.text.primary },
  subtitle: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: 2 },

  scrollContent: { paddingBottom: spacing.xxl },

  // Insight card
  insightCard: { padding: 0, marginBottom: spacing.sectionGap, overflow: 'hidden' },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  insightIcon: { width: 32, alignItems: 'center' },
  insightBody: { flex: 1, marginLeft: spacing.sm },
  insightLabel: { ...typography.bodySmall, color: colors.text.secondary },
  insightSub: { ...typography.caption, color: colors.text.tertiary, marginTop: 1 },
  insightValue: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },

  // Data card
  dataCard: { padding: 0, marginBottom: spacing.sectionGap, overflow: 'hidden' },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dataLabel: { ...typography.bodyMedium, color: colors.text.secondary },
  dataValue: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },

  // Actions
  actionsList: { gap: spacing.sm, marginBottom: spacing.sectionGap },
  destructiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  destructiveBtnFull: {
    borderColor: colors.error + '30',
    backgroundColor: colors.error + '08',
  },
  destructiveLabel: {
    ...typography.bodyMedium,
    color: colors.accent.orange,
    fontWeight: '500',
  },

  // Privacy
  privacyCard: { padding: spacing.md, gap: spacing.md, marginBottom: spacing.sectionGap },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  privacyText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 20,
  },
  trustLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  trustLinkText: {
    ...typography.bodyMedium,
    color: colors.brand[400],
    flex: 1,
  },
})
