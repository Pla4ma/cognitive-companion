import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Brain, Clock, TrendingUp, AlertTriangle, Shield } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../theme';
import { Card } from './Card';
import type {
  UserIntelligenceProfile,
  DriftPrediction,
  DangerWindow,
  TimeSlot,
} from '../engine/predictiveEngine';
import type { UserState } from '../types/moment';

// ── Day Names ──────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatHour(h: number): string {
  if (h === 0) return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

// ── State / Blocker Display Labels ─────────────────────────

const STATE_LABELS: Partial<Record<UserState, string>> = {
  avoiding: 'Avoiding',
  overwhelmed: 'Overwhelmed',
  stuck: 'Stuck',
  tired: 'Tired',
  distracted: 'Distracted',
  anxious: 'Anxious',
  scattered: 'Scattered',
  ready: 'Ready',
  bored: 'Bored',
  perfectionism: 'Perfectionism',
  unclear: 'Unclear',
  time_pressure: 'Time pressure',
  low_confidence: 'Low confidence',
  shame_spiral: 'Shame spiral',
  fake_productivity: 'Fake productivity',
  planning_loop: 'Planning loop',
  doomscroll_risk: 'Doomscroll risk',
};

const BLOCKER_LABELS: Record<string, string> = {
  too_big: 'Too big',
  unclear: 'Unclear',
  boring: 'Boring',
  scary: 'Scary',
  perfectionism: 'Perfectionism',
  tired: 'Tired',
  distracted: 'Distracted',
  no_deadline: 'No deadline',
  too_many_choices: 'Too many choices',
  emotional_resistance: 'Emotional resistance',
  environment: 'Environment',
  unknown: 'Unknown',
};

// ── Risk Colors ────────────────────────────────────────────

const RISK_COLORS: Record<'low' | 'moderate' | 'high' | 'critical', string> = {
  low: colors.success,
  moderate: colors.warning,
  high: '#F97316',
  critical: colors.error,
};

const RISK_BG: Record<'low' | 'moderate' | 'high' | 'critical', string> = {
  low: 'rgba(16,185,129,0.12)',
  moderate: 'rgba(245,158,11,0.12)',
  high: 'rgba(249,115,22,0.12)',
  critical: 'rgba(239,68,68,0.12)',
};

// ── Trend Indicator ────────────────────────────────────────

function TrendArrow({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  const icon = trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→';
  const color = trend === 'improving' ? colors.success : trend === 'declining' ? colors.error : colors.text.tertiary;
  return <Text style={[styles.trendArrow, { color }]}>{icon}</Text>;
}

// ── IntelligenceCard ───────────────────────────────────────

interface IntelligenceCardProps {
  profile: UserIntelligenceProfile;
  prediction: DriftPrediction;
}

export function IntelligenceCard({ profile, prediction }: IntelligenceCardProps) {
  const topDanger = profile.dangerWindows[0];
  const topResistance = profile.resistanceMap[0];

  // Comeback rate: 1 - overall drift rate
  const totalDriftSlots = profile.timeSlots.reduce((s, t) => s + t.driftCount, 0);
  const totalSessions = profile.timeSlots.reduce((s, t) => s + t.totalSessions, 0);
  const comebackRate = totalSessions > 0 ? 1 - totalDriftSlots / totalSessions : 0;

  return (
    <Card variant="elevated" style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Brain size={16} color={colors.brand[400]} />
          <Text style={styles.headerTitle}>YOUR PATTERNS</Text>
        </View>
        <Text style={styles.sessionCount}>
          {profile.totalDataPoints} sessions
        </Text>
      </View>

      {/* ── Danger Window ── */}
      {topDanger && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={14} color={colors.text.tertiary} />
            <Text style={styles.sectionLabel}>TOP DANGER WINDOW</Text>
          </View>
          <View style={styles.dangerRow}>
            <View style={styles.dangerTime}>
              <Text style={styles.dangerDay}>{DAY_NAMES[topDanger.dayOfWeek]}</Text>
              <Text style={styles.dangerHours}>
                {formatHour(topDanger.startHour)} – {formatHour(topDanger.endHour)}
              </Text>
            </View>
            <View style={styles.dangerMeta}>
              <View
                style={[
                  styles.riskBadge,
                  {
                    backgroundColor: RISK_BG[topDanger.riskLevel],
                    borderColor: `${RISK_COLORS[topDanger.riskLevel]}33`,
                  },
                ]}
              >
                <AlertTriangle
                  size={10}
                  color={RISK_COLORS[topDanger.riskLevel]}
                />
                <Text
                  style={[
                    styles.riskBadgeText,
                    { color: RISK_COLORS[topDanger.riskLevel] },
                  ]}
                >
                  {topDanger.riskLevel.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.driftRate}>
                {Math.round(topDanger.riskScore * 100)}% drift
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Top Resistance Pattern ── */}
      {topResistance && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={14} color={colors.text.tertiary} />
            <Text style={styles.sectionLabel}>TOP BATTLE</Text>
          </View>
          <View style={styles.resistanceRow}>
            <View style={styles.resistanceInfo}>
              <Text style={styles.resistanceState}>
                {STATE_LABELS[topResistance.state] || topResistance.state}
              </Text>
              <Text style={styles.resistanceBlocker}>
                + {BLOCKER_LABELS[topResistance.blocker] || topResistance.blocker}
              </Text>
            </View>
            <View style={styles.resistanceMeta}>
              <Text style={styles.resistanceFreq}>
                {topResistance.frequency}×
              </Text>
              <Text style={styles.resistanceSuccess}>
                {Math.round(topResistance.successRate * 100)}% win
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Comeback Rate ── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TrendingUp size={14} color={colors.text.tertiary} />
          <Text style={styles.sectionLabel}>COMEBACK RATE</Text>
        </View>
        <View style={styles.comebackRow}>
          <Text style={styles.comebackValue}>
            {Math.round(comebackRate * 100)}%
          </Text>
          <View style={styles.comebackTrend}>
            <TrendArrow trend={prediction.recentTrend} />
            <Text style={styles.comebackTrendText}>
              {prediction.recentTrend}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Current Risk Bar ── */}
      <View style={styles.riskBarSection}>
        <View style={styles.riskBarHeader}>
          <Text style={styles.riskBarLabel}>Current risk</Text>
          <Text
            style={[
              styles.riskBarValue,
              { color: RISK_COLORS[prediction.currentRiskLevel] },
            ]}
          >
            {prediction.currentRiskLevel.toUpperCase()}
          </Text>
        </View>
        <View style={styles.riskBarTrack}>
          <View
            style={[
              styles.riskBarFill,
              {
                width: `${Math.round(prediction.currentRisk * 100)}%`,
                backgroundColor: RISK_COLORS[prediction.currentRiskLevel],
              },
            ]}
          />
        </View>
      </View>
    </Card>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    ...typography.labelSmall,
    color: colors.text.secondary,
    letterSpacing: 1.2,
  },
  sessionCount: {
    ...typography.caption,
    color: colors.text.tertiary,
  },

  // Section
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  sectionLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    letterSpacing: 0.8,
  },

  // Danger Window
  dangerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dangerTime: {
    gap: 2,
  },
  dangerDay: {
    ...typography.h3,
    color: colors.text.primary,
  },
  dangerHours: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
  },
  dangerMeta: {
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  riskBadgeText: {
    ...typography.labelSmall,
    letterSpacing: 0.6,
  },
  driftRate: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },

  // Resistance Pattern
  resistanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resistanceInfo: {
    gap: 2,
  },
  resistanceState: {
    ...typography.h3,
    color: colors.text.primary,
    textTransform: 'capitalize',
  },
  resistanceBlocker: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textTransform: 'capitalize',
  },
  resistanceMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  resistanceFreq: {
    ...typography.h3,
    color: colors.brand[400],
  },
  resistanceSuccess: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },

  // Comeback
  comebackRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  comebackValue: {
    ...typography.h1,
    color: colors.text.primary,
  },
  comebackTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  comebackTrendText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
  },

  // Risk Bar
  riskBarSection: {
    marginTop: spacing.xs,
    gap: spacing.xxs,
  },
  riskBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskBarLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  riskBarValue: {
    ...typography.labelSmall,
    letterSpacing: 0.6,
  },
  riskBarTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bg.overlay,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
