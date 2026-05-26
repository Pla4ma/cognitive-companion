import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  color?: string;
  style?: ViewStyle;
}

export function Slider({
  value, min = 0, max = 100, step = 1,
  label, color = colors.brand[500], style,
}: SliderProps) {
  const clamped = Math.min(Math.max(value, min), max);
  const pct = ((clamped - min) / (max - min)) * 100;

  return (
    <View style={[styles.container, style]}>
      {(label != null) && (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Text style={[styles.value, { color }]}>{clamped}</Text>
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]} />
        <View style={[styles.thumb, { left: `${pct}%`, borderColor: color }]} />
      </View>
      <View style={styles.range}>
        <Text style={styles.rangeText}>{min}</Text>
        <Text style={styles.rangeText}>{max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: { ...typography.label, color: colors.text.secondary },
  value: { ...typography.label, fontVariant: ['tabular-nums'] },
  track: {
    height: 6,
    backgroundColor: colors.bg.overlay,
    borderRadius: radius.full,
    justifyContent: 'center',
    position: 'relative',
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bg.base,
    borderWidth: 3,
    top: -7,
    marginLeft: -10,
  },
  range: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  rangeText: { ...typography.caption, color: colors.text.disabled },
});
