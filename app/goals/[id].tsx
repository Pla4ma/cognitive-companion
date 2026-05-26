// ══════════════════════════════════════════════════════════════
// INTENT — Goal Detail Screen
// Individual mission detail with full micro-mission breakdown
// ══════════════════════════════════════════════════════════════

import React, { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Target, CheckCircle2, RotateCcw, ArrowLeft, Sparkles } from 'lucide-react-native'
import { useAppStore } from '../../src/store'
import { colors, spacing, radius, typography, layout } from '../../src/theme'
import { Screen, Card, Button, ProgressRing } from '../../src/components'

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const missions = useAppStore((s) => s.missions)
  const microMissions = useAppStore((s) => s.microMissions)
  const completeMicroMission = useAppStore((s) => s.completeMicroMission)
  const completeMission = useAppStore((s) => s.completeMission)

  const mission = useMemo(() => missions.find(m => m.id === id), [missions, id])
  const micros = useMemo(
    () => microMissions.filter(mm => mm.threadId === id).sort((a, b) => a.sortOrder - b.sortOrder),
    [microMissions, id],
  )
  const completedCount = useMemo(() => micros.filter(m => m.status === 'completed').length, [micros])
  const progress = micros.length > 0 ? completedCount / micros.length : 0

  if (!mission) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Mission not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="ghost" size="sm" />
        </View>
      </Screen>
    )
  }

  return (
    <Screen gradient={[(mission.color || colors.brand[500]) + '08', 'transparent']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.text.secondary} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Mission Detail</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mission Header */}
        <Card variant="glow" style={styles.missionCard}>
          <View style={styles.missionHeader}>
            <View style={[styles.iconWrap, { backgroundColor: (mission.color || colors.brand[500]) + '22' }]}>
              <Target size={22} color={mission.color || colors.brand[500]} />
            </View>
            <View style={styles.missionInfo}>
              <Text style={styles.missionTitle}>{mission.title}</Text>
              {mission.description ? <Text style={styles.missionDesc}>{mission.description}</Text> : null}
            </View>
          </View>
          <View style={styles.progressSection}>
            <ProgressRing progress={progress} size={64} strokeWidth={5} color={mission.color || colors.brand[500]}>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </ProgressRing>
            <View style={styles.progressStats}>
              <Text style={styles.progressLabel}>
                {completedCount} of {micros.length} micro-missions
              </Text>
              <Text style={styles.progressHint}>
                {progress === 1 ? '🎉 All done!' : progress > 0 ? '👍 Keep going!' : 'Break it down into steps'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Micro-missions */}
        {micros.length > 0 && (
          <View style={styles.microSection}>
            <Text style={styles.sectionTitle}>Steps</Text>
            {micros.map(micro => (
              <TouchableOpacity
                key={micro.id}
                style={styles.microRow}
                onPress={() => {
                  if (micro.status !== 'completed') completeMicroMission(micro.id)
                }}
                disabled={micro.status === 'completed'}
              >
                <View style={[
                  styles.checkbox,
                  micro.status === 'completed' && { borderColor: colors.accent.green, backgroundColor: colors.accent.green + '20' },
                ]}>
                  {micro.status === 'completed' && <CheckCircle2 size={14} color={colors.accent.green} />}
                </View>
                <View style={styles.microContent}>
                  <Text style={[
                    styles.microTitle,
                    micro.status === 'completed' && { textDecorationLine: 'line-through', color: colors.text.tertiary },
                  ]}>
                    {micro.title}
                  </Text>
                  <Text style={styles.microMeta}>~{micro.estimatedMinutes} min</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {micros.length === 0 && (
          <Card variant="subtle" style={styles.emptyCard}>
            <Sparkles size={24} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>No steps yet. Break this mission into smaller tasks.</Text>
          </Card>
        )}

        {progress > 0 && progress < 1 && (
          <Button
            title="Complete Mission"
            onPress={() => { completeMission(mission.id); router.back() }}
            variant="gradient"
            size="lg"
            style={{ width: '100%', marginTop: spacing.md }}
          />
        )}

        <View style={{ height: layout.tabBarHeight + spacing.lg }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  screenTitle: { ...typography.h3, color: colors.text.primary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  errorText: { ...typography.body, color: colors.text.tertiary },

  missionCard: { padding: spacing.lg, marginBottom: spacing.lg },
  missionHeader: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  iconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  missionInfo: { flex: 1 },
  missionTitle: { ...typography.h2, color: colors.text.primary },
  missionDesc: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: spacing.xs },

  progressSection: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle },
  progressText: { ...typography.caption, color: colors.text.primary, fontWeight: '700' },
  progressStats: { flex: 1 },
  progressLabel: { ...typography.bodyMedium, color: colors.text.primary },
  progressHint: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },

  microSection: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.label, color: colors.text.secondary, marginBottom: spacing.sm },
  microRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border.default, justifyContent: 'center', alignItems: 'center' },
  microContent: { flex: 1 },
  microTitle: { ...typography.bodyMedium, color: colors.text.primary },
  microMeta: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },

  emptyCard: { padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyText: { ...typography.bodySmall, color: colors.text.tertiary, textAlign: 'center' },
})
