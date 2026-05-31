// ══════════════════════════════════════════════════════════════
// INTENT — Weekly Share Card
// Capture-friendly component for image-based sharing
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, typography, spacing, radius } from '../theme'

interface WeeklyShareCardProps {
  rescues: number
  minutes: number
  completionRate: number
  narrative: string
  userName: string
  headline?: string
  patternName?: string
  patternIcon?: string
}

export const WeeklyShareCard = React.forwardRef<View, WeeklyShareCardProps>(
  ({ rescues, minutes, completionRate, narrative, userName, headline, patternName, patternIcon }, ref) => {
    return (
      <View ref={ref} style={styles.card}>
        <Text style={styles.brand}>INTENT</Text>

        {/* Headline from weekly story */}
        {headline ? (
          <Text style={styles.headline}>{headline}</Text>
        ) : (
          <Text style={styles.title}>{userName}'s Week</Text>
        )}

        {/* Pattern name badge */}
        {patternName && (
          <View style={styles.patternBadge}>
            <Text style={styles.patternBadgeText}>
              {patternIcon ? `${patternIcon} ` : ''}{patternName}
            </Text>
          </View>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{rescues}</Text>
            <Text style={styles.statLabel}>Rescues</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{minutes}m</Text>
            <Text style={styles.statLabel}>Focus</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
        </View>
        <Text style={styles.narrative}>{narrative}</Text>
      </View>
    )
  }
)

WeeklyShareCard.displayName = 'WeeklyShareCard'

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  brand: {
    ...typography.caption,
    color: colors.brand[400],
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  headline: {
    ...typography.h2,
    color: colors.brand[300],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  patternBadge: {
    backgroundColor: colors.brand[500] + '18',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand[500] + '30',
  },
  patternBadgeText: {
    ...typography.caption,
    color: colors.brand[300],
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h1,
    color: colors.brand[400],
  },
  statLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  narrative: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
})
