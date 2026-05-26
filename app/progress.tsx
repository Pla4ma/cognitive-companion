// ══════════════════════════════════════════════════════════════
// INTENT — Momentum Screen
// Momentum score, resistance map, comeback tracking, pattern insights
// ══════════════════════════════════════════════════════════════

import React, { useEffect, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { Flame, Zap, Target, TrendingUp, Shield, Brain, RotateCcw, Calendar, Share2 } from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { calculateMomentumScore, analyzeResistancePatterns } from '../src/engine'
import { colors, spacing, radius, typography, layout } from '../src/theme'
import { Screen, Card, SectionHeader, BarChart, StreakBadge } from '../src/components'
import { generateWeeklySummaryCard, shareCard } from '../src/services/share'
import { TabBar } from '../src/components'

export default function MomentumScreen() {
  const momentumEvents = useAppStore((s) => s.momentumEvents)
  const resistancePatterns = useAppStore((s) => s.resistancePatterns)
  const distractions = useAppStore((s) => s.distractions)
  const brainDumps = useAppStore((s) => s.brainDumps)
  const sessions = useAppStore((s) => s.sessions)
  const user = useAppStore((s) => s.user)

  const pushStyle = user?.push_style ?? 'gentle'

  // Momentum score
  const momentum = useMemo(() => calculateMomentumScore(momentumEvents, 7), [momentumEvents])
  const lastWeek = useMemo(() => {
    const prevEvents = momentumEvents.filter(e => {
      const t = new Date(e.created_at).getTime()
      const weekAgo = Date.now() - 7 * 86400000
      const twoWeeksAgo = Date.now() - 14 * 86400000
      return t >= twoWeeksAgo && t < weekAgo
    })
    return prevEvents.reduce((s, e) => s + e.points, 0)
  }, [momentumEvents])

  // Resistance analysis
  const resistanceAnalysis = useMemo(() => analyzeResistancePatterns(resistancePatterns), [resistancePatterns])

  // Chart data
  const weekChartData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const data: { label: string; value: number; color?: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const dateStr = d.toISOString().slice(0, 10)
      const dayEvents = momentumEvents.filter(e => e.created_at.slice(0, 10) === dateStr)
      const points = dayEvents.reduce((s, e) => s + e.points, 0)
      data.push({
        label: dayNames[d.getDay()],
        value: points,
        color: points > 0 ? colors.brand[500] : colors.border.subtle,
      })
    }
    return data
  }, [momentumEvents])

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayEvents = momentumEvents.filter(e => e.created_at.slice(0, 10) === todayStr)
  const todayPoints = todayEvents.reduce((s, e) => s + e.points, 0)

  // Distraction stats
  const distractionCategories = useMemo(() => {
    const cats: Record<string, number> = {}
    for (const d of distractions) {
      cats[d.category] = (cats[d.category] || 0) + 1
    }
    return Object.entries(cats).sort((a, b) => b[1] - a[1])
  }, [distractions])

  // Salvage count
  const salvagedCount = sessions.filter(s => s.status === 'salvaged').length
  const comebackCount = sessions.filter(s => s.status === 'salvaged' && s.actual_seconds > 60).length

  return (
    <Screen gradient={['rgba(245,158,11,0.04)', 'transparent']}>
      <Text style={styles.title}>Momentum</Text>
      <Text style={styles.subtitle}>Your anti-avoidance progress</Text>

      {/* Momentum Score Hero */}
      <Card variant="glow" style={styles.heroCard}>
        <View style={styles.heroContent}>
          <StreakBadge days={momentum.score > 0 ? Math.floor(momentum.score / 20) : 0} size="lg" />
          <View style={styles.heroInfo}>
            <Text style={styles.heroScore}>{momentum.score}</Text>
            <Text style={styles.heroLabel}>momentum points</Text>
            <View style={styles.trendRow}>
              <TrendingUp size={14} color={momentum.trend === 'up' ? colors.accent.green : momentum.trend === 'down' ? colors.error : colors.text.tertiary} />
              <Text style={[styles.trendText, { color: momentum.trend === 'up' ? colors.accent.green : momentum.trend === 'down' ? colors.error : colors.text.tertiary }]}>
                {momentum.trend === 'up' ? 'Up' : momentum.trend === 'down' ? 'Down' : 'Stable'} vs last week ({lastWeek})
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => {
              const todayStr = new Date().toISOString().slice(0, 10)
              const todaySessions = sessions.filter(s => s.started_at.slice(0, 10) === todayStr && (s.status === 'completed' || s.status === 'salvaged'))
              const weekAgo = Date.now() - 7 * 86400000
              const weeklyRescues = momentumEvents.filter(e => e.type === 'rescue_started' && new Date(e.created_at).getTime() >= weekAgo).length
              const card = generateWeeklySummaryCard({
                sessions: todaySessions.length,
                minutes: Math.round(todaySessions.reduce((sum, s) => sum + s.actual_seconds, 0) / 60),
                streak: 0,
                rescues: weeklyRescues,
                topState: 'avoiding',
              })
              shareCard(card)
            }}
          >
            <Share2 size={18} color={colors.brand[400]} />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Today */}
      <SectionHeader title="Today" icon={<Calendar size={16} color={colors.brand[400]} />} />
      <View style={styles.statsRow}>
        <Card variant="default" style={styles.statCard}><View style={styles.statContent}>
          <Zap size={20} color={colors.brand[400]} />
          <Text style={styles.statValue}>{todayPoints}</Text>
          <Text style={styles.statLabel}>points</Text>
        </View></Card>
        <Card variant="default" style={styles.statCard}><View style={styles.statContent}>
          <Target size={20} color={colors.accent.pink} />
          <Text style={styles.statValue}>{sessions.filter(s => s.started_at.slice(0, 10) === todayStr && (s.status === 'completed' || s.status === 'salvaged')).length}</Text>
          <Text style={styles.statLabel}>sessions</Text>
        </View></Card>
        <Card variant="default" style={styles.statCard}><View style={styles.statContent}>
          <Brain size={20} color={colors.accent.green} />
          <Text style={styles.statValue}>{distractions.filter(d => d.captured_at.slice(0, 10) === todayStr).length}</Text>
          <Text style={styles.statLabel}>captured</Text>
        </View></Card>
      </View>

      {/* Weekly Chart */}
      <SectionHeader title="This Week" icon={<TrendingUp size={16} color={colors.accent.pink} />} />
      <Card variant="default" style={styles.chartCard}>
        <BarChart data={weekChartData} height={120} showValues />
        <Text style={styles.chartTotal}>{weekChartData.reduce((s, d) => s + d.value, 0)} points this week</Text>
      </Card>

      {/* Momentum Breakdown */}
      {Object.keys(momentum.breakdown).length > 0 && (
        <>
          <SectionHeader title="Point Sources" icon={<Flame size={16} color={colors.accent.orange} />} />
          <Card variant="default" style={styles.breakdownCard}>
            {Object.entries(momentum.breakdown).map(([type, points]) => {
              const labels: Record<string, { label: string; icon: any; color: string }> = {
                session_completed: { label: 'Sessions', icon: Target, color: colors.brand[500] },
                session_salvaged: { label: 'Salvaged', icon: RotateCcw, color: colors.accent.orange },
                comeback: { label: 'Comebacks', icon: Flame, color: colors.accent.red },
                resistance_overcome: { label: 'Resistance', icon: Shield, color: colors.accent.purple },
                distraction_captured: { label: 'Distractions', icon: Brain, color: colors.accent.pink },
                brain_dump_cleared: { label: 'Brain Dumps', icon: Brain, color: colors.accent.green },
                streak_extended: { label: 'Streaks', icon: Flame, color: colors.accent.orange },
              }
              const info = labels[type] || { label: type, icon: Zap, color: colors.text.tertiary }
              const Icon = info.icon
              return (
                <View key={type} style={styles.breakdownRow}>
                  <View style={[styles.breakdownDot, { backgroundColor: info.color }]} />
                  <Icon size={16} color={info.color} />
                  <Text style={styles.breakdownLabel}>{info.label}</Text>
                  <Text style={styles.breakdownValue}>{points}</Text>
                </View>
              )
            })}
          </Card>
        </>
      )}

      {/* Resistance Map */}
      {resistancePatterns.length > 0 && (
        <>
          <SectionHeader title="Resistance Patterns" icon={<Shield size={16} color={colors.accent.purple} />} />
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

      {/* Salvage & Comeback */}
      {(salvagedCount > 0 || comebackCount > 0) && (
        <>
          <SectionHeader title="Comebacks" icon={<RotateCcw size={16} color={colors.accent.orange} />} />
          <Card variant="subtle" style={styles.comebackCard}>
            <Text style={styles.comebackText}>
              You've salvaged <Text style={styles.comebackHighlight}>{salvagedCount} sessions</Text> and made <Text style={styles.comebackHighlight}>{comebackCount} comebacks</Text>.
              {salvagedCount > 0 && '\n\nSalvaging is a skill. You\'re learning to finish what you start, even when it goes sideways.'}
            </Text>
          </Card>
        </>
      )}

      {/* Distraction Categories */}
      {distractionCategories.length > 0 && (
        <>
          <SectionHeader title="Distraction Patterns" icon={<Brain size={16} color={colors.accent.pink} />} />
          <Card variant="default" style={styles.distractionCard}>
            {distractionCategories.map(([cat, count]) => (
              <View key={cat} style={styles.distractionRow}>
                <Text style={styles.distractionCat}>{cat}</Text>
                <View style={styles.distractionBar}>
                  <View style={[styles.distractionBarFill, { width: `${Math.min((count / distractionCategories[0][1]) * 100, 100)}%`, backgroundColor: colors.accent.pink + '60' }]} />
                </View>
                <Text style={styles.distractionCount}>{count}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      <View style={{ height: layout.tabBarHeight + spacing.lg }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { ...typography.headline, color: colors.text.primary },
  subtitle: { ...typography.bodyMedium, color: colors.text.tertiary, marginTop: 2, marginBottom: spacing.lg },

  heroCard: { marginBottom: spacing.sectionGap },
  heroContent: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
  heroInfo: { flex: 1, marginLeft: spacing.md },
  heroScore: { ...typography.display, color: colors.text.primary, fontSize: 36 },
  heroLabel: { ...typography.bodySmall, color: colors.text.tertiary },
  shareBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.brand[500] + '15',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.brand[500] + '30',
  },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trendText: { ...typography.caption },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sectionGap },
  statCard: { flex: 1, padding: spacing.md },
  statContent: { alignItems: 'center', gap: 6 },
  statValue: { ...typography.h3, color: colors.text.primary, fontSize: 20 },
  statLabel: { ...typography.caption, color: colors.text.tertiary },

  chartCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  chartTotal: { ...typography.bodySmall, color: colors.text.tertiary, textAlign: 'center', marginTop: spacing.sm },

  breakdownCard: { padding: spacing.md, marginBottom: spacing.sectionGap },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  breakdownDot: { width: 8, height: 8, borderRadius: 4 },
  breakdownLabel: { ...typography.bodyMedium, color: colors.text.primary, flex: 1, marginLeft: spacing.xs },
  breakdownValue: { ...typography.bodyMedium, color: colors.text.secondary, fontWeight: '600' },

  resistanceCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  resistanceInsight: { ...typography.bodyMedium, color: colors.text.primary, lineHeight: 20, marginBottom: spacing.md },
  resistanceStats: { flexDirection: 'row', gap: spacing.md },
  resistanceStat: { flex: 1, alignItems: 'center' },
  resistanceStatLabel: { ...typography.caption, color: colors.text.tertiary },
  resistanceStatValue: { ...typography.bodySmall, color: colors.text.primary, marginTop: 2, fontWeight: '600' },

  comebackCard: { padding: spacing.lg, marginBottom: spacing.sectionGap },
  comebackText: { ...typography.bodyMedium, color: colors.text.secondary, lineHeight: 20 },
  comebackHighlight: { fontWeight: '700', color: colors.accent.orange },

  distractionCard: { padding: spacing.md, marginBottom: spacing.sectionGap },
  distractionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  distractionCat: { ...typography.bodySmall, color: colors.text.primary, width: 80, textTransform: 'capitalize' },
  distractionBar: { flex: 1, height: 6, backgroundColor: colors.border.subtle, borderRadius: 3, overflow: 'hidden' },
  distractionBarFill: { height: '100%', borderRadius: 3 },
  distractionCount: { ...typography.caption, color: colors.text.tertiary, width: 30, textAlign: 'right' },
})
