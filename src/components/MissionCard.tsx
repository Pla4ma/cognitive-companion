// ══════════════════════════════════════════════════════════════
// INTENT — MissionCard Component
// Displays a mission with progress, resistance badge, staleness,
// next micro-mission preview, and quick-start action.
// ══════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import LinearGradient from 'expo-linear-gradient';
import { Play, Clock, ChevronRight } from 'lucide-react-native';
import type { Mission, MicroMission, MissionSession } from '../types';
import { ProgressRing } from './ProgressRing';
import { Card } from './Card';
import { colors, spacing, radius, typography } from '../theme';

// ── Props ─────────────────────────────────────────────────

interface MissionCardProps {
  mission: Mission;
  microMissions: MicroMission[];
  sessions: MissionSession[];
  onStart: (mission: Mission) => void;
  onExpand: (mission: Mission) => void;
}

// ── Resistance Badge Colors ───────────────────────────────

const RESISTANCE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'rgba(59,130,246,0.14)', text: colors.info, label: 'Low Resistance' },
  medium: { bg: 'rgba(245,158,11,0.14)', text: colors.warning, label: 'Medium Resistance' },
  high: { bg: 'rgba(249,115,22,0.14)', text: '#F97316', label: 'High Resistance' },
  critical: { bg: 'rgba(239,68,68,0.14)', text: colors.error, label: 'Stuck' },
};

const DEFAULT_RESISTANCE = { bg: 'rgba(16,185,129,0.14)', text: colors.success, label: 'No Resistance' };

// ── Helpers ───────────────────────────────────────────────

function getProgress(micros: MicroMission[]): number {
  if (micros.length === 0) return 0;
  const done = micros.filter((m) => m.status === 'completed' || m.status === 'skipped').length;
  return done / micros.length;
}

function getDaysSinceLastSession(sessions: MissionSession[]): number | null {
  if (sessions.length === 0) return null;
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
  );
  const lastDate = new Date(sorted[0].started_at);
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getNextMicroMission(micros: MicroMission[]): MicroMission | null {
  const pending = micros
    .filter((m) => m.status === 'pending' || m.status === 'in_progress')
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return pending[0] ?? null;
}

function getAssignedProtocol(micros: MicroMission[]): string | null {
  const withProtocol = micros.find((m) => m.protocolId);
  return withProtocol?.protocolId ?? null;
}

// ── Component ─────────────────────────────────────────────

export const MissionCard = React.memo(function MissionCard({
  mission,
  microMissions,
  sessions,
  onStart,
  onExpand,
}: MissionCardProps) {
  const progress = useMemo(() => getProgress(microMissions), [microMissions]);
  const daysSince = useMemo(() => getDaysSinceLastSession(sessions), [sessions]);
  const nextMicro = useMemo(() => getNextMicroMission(microMissions), [microMissions]);
  const protocol = useMemo(() => getAssignedProtocol(microMissions), [microMissions]);
  const isStale = daysSince !== null && daysSince > 3;

  const resistance = mission.resistance_level
    ? RESISTANCE_COLORS[mission.resistance_level] ?? DEFAULT_RESISTANCE
    : DEFAULT_RESISTANCE;

  const completedCount = microMissions.filter(
    (m) => m.status === 'completed' || m.status === 'skipped',
  ).length;

  return (
    <Card variant="default" onPress={() => onExpand(mission)} style={styles.card}>
      <View style={styles.inner}>
        {/* ── Header Row ── */}
        <View style={styles.headerRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title} numberOfLines={2}>
              {mission.title}
            </Text>
            <Text style={styles.stepCount}>
              {completedCount} / {microMissions.length} steps
            </Text>
          </View>

          <ProgressRing
            progress={progress}
            size={64}
            strokeWidth={6}
            color={mission.color || colors.brand[400]}
            trackColor={colors.border.subtle}
          />
        </View>

        {/* ── Badges Row ── */}
        <View style={styles.badgesRow}>
          {/* Resistance Badge */}
          <View style={[styles.badge, { backgroundColor: resistance.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: resistance.text }]} />
            <Text style={[styles.badgeLabel, { color: resistance.text }]}>
              {resistance.label}
            </Text>
          </View>

          {/* Protocol Badge */}
          {protocol && (
            <View style={[styles.badge, { backgroundColor: 'rgba(108,58,237,0.14)' }]}>
              <Text style={[styles.badgeLabel, { color: colors.brand[400] }]}>
                {protocol}
              </Text>
            </View>
          )}
        </View>

        {/* ── Staleness Warning ── */}
        {isStale && (
          <View style={styles.staleWarning}>
            <Clock size={14} color={colors.warning} />
            <Text style={styles.staleText}>
              {daysSince} days since last session
            </Text>
          </View>
        )}

        {/* ── Next Micro-Mission Preview ── */}
        {nextMicro && (
          <View style={styles.nextRow}>
            <Text style={styles.nextLabel}>Next:</Text>
            <Text style={styles.nextText} numberOfLines={1}>
              {nextMicro.title}
            </Text>
          </View>
        )}

        {/* ── Start Button ── */}
        <LinearGradient
          colors={colors.gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startButton}
        >
          <Pressable
            style={styles.startPressable}
            onPress={() => onStart(mission)}
            accessibilityRole="button"
            accessibilityLabel={`Start mission: ${mission.title}`}
          >
            <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.startText}>Start Now</Text>
            <ChevronRight size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </LinearGradient>
      </View>
    </Card>
  );
});

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  inner: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleCol: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  stepCount: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    gap: spacing.xxs,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeLabel: {
    ...typography.labelSmall,
  },
  staleWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: 'rgba(245,158,11,0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
  },
  staleText: {
    ...typography.bodySmall,
    color: colors.warning,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  nextLabel: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  nextText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  startButton: {
    borderRadius: radius.lg,
    marginTop: spacing.xxs,
  },
  startPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  startText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});
