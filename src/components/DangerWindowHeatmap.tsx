import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import type { TimeSlot } from '../engine/predictiveEngine';

// ── Constants ──────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_MARKERS = [6, 9, 12, 15, 18, 21];

const CELL_SIZE = 28;
const CELL_GAP = 2;
const CELL_TOTAL = CELL_SIZE + CELL_GAP;

// ── Color Scale ────────────────────────────────────────────
// Maps drift rate (0-1) to background colors

function getCellColor(slot: TimeSlot | undefined): string {
  if (!slot || slot.totalSessions === 0) {
    return colors.bg.elevated; // no data
  }

  const rate = slot.driftRate;

  if (rate < 0.15) return blendColor('#10B981', 0.3); // green + 30% opacity
  if (rate < 0.3) return blendColor('#10B981', 0.55); // green + 15% lighter
  if (rate < 0.5) return blendColor('#F59E0B', 0.3); // warning + 30% opacity
  if (rate < 0.7) return blendColor('#F59E0B', 0.6); // warning + 60% opacity
  return blendColor('#EF4444', 0.7); // error + 70% opacity
}

/** Simple alpha-blend helper over a dark base */
function blendColor(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Blend over the dark bg base (#0E0E12)
  const bgR = 14, bgG = 14, bgB = 18;
  const outR = Math.round(r * alpha + bgR * (1 - alpha));
  const outG = Math.round(g * alpha + bgG * (1 - alpha));
  const outB = Math.round(b * alpha + bgB * (1 - alpha));
  return `rgb(${outR},${outG},${outB})`;
}

// ── Legend ──────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { label: 'No data', color: colors.bg.elevated },
  { label: 'Low', color: blendColor('#10B981', 0.3) },
  { label: 'Medium', color: blendColor('#10B981', 0.55) },
  { label: 'Moderate', color: blendColor('#F59E0B', 0.3) },
  { label: 'High', color: blendColor('#F59E0B', 0.6) },
  { label: 'Critical', color: blendColor('#EF4444', 0.7) },
];

// ── Component ──────────────────────────────────────────────

interface DangerWindowHeatmapProps {
  timeSlots: TimeSlot[];
}

export function DangerWindowHeatmap({ timeSlots }: DangerWindowHeatmapProps) {
  // Build a lookup map: "day-hour" → TimeSlot
  const slotMap = useMemo(() => {
    const map = new Map<string, TimeSlot>();
    for (const slot of timeSlots) {
      map.set(`${slot.dayOfWeek}-${slot.hour}`, slot);
    }
    return map;
  }, [timeSlots]);

  return (
    <View style={styles.container}>
      {/* Horizontal scroll for the grid */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {/* ── Hour labels row ── */}
          <View style={styles.hourLabelsRow}>
            {/* Spacer for day-label column */}
            <View style={styles.dayLabelCell} />
            {HOURS.map((h) => (
              <View key={h} style={styles.hourLabelCell}>
                {HOUR_MARKERS.includes(h) && (
                  <Text style={styles.hourLabelText}>
                    {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* ── Day rows ── */}
          {DAY_LABELS.map((dayLabel, dayIdx) => (
            <View key={dayIdx} style={styles.dayRow}>
              <View style={styles.dayLabelCell}>
                <Text style={styles.dayLabelText}>{dayLabel}</Text>
              </View>
              {HOURS.map((hour) => {
                const slot = slotMap.get(`${dayIdx}-${hour}`);
                const bg = getCellColor(slot);
                return (
                  <View
                    key={hour}
                    style={[
                      styles.cell,
                      { backgroundColor: bg },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Legend ── */}
      <View style={styles.legend}>
        {LEGEND_ITEMS.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  scrollContent: {
    paddingRight: spacing.md,
  },
  grid: {
    gap: CELL_GAP,
  },

  // Hour labels
  hourLabelsRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
    marginBottom: spacing.xxs,
  },
  hourLabelCell: {
    width: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 16,
  },
  hourLabelText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 9,
    letterSpacing: 0,
  },

  // Day rows
  dayRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
    alignItems: 'center',
  },
  dayLabelCell: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabelText: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
  },

  // Cell
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: radius.xs,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    fontSize: 10,
  },
});
