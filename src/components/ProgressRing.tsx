import React, { useEffect, useRef, ReactNode } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, animation } from '../theme';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  children?: ReactNode;
}

export function ProgressRing({
  progress, size = 120, strokeWidth = 8,
  color = colors.brand[500], trackColor = colors.border.subtle, label, children,
}: ProgressRingProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(progress, 0), 1);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: animation.slow,
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [circ, 0],
  });

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={label ? `${label}: ${Math.round(clamped * 100)}% complete` : `${Math.round(clamped * 100)}% complete`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size} style={styles.svg}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.center, { width: size * 0.75 }]}>
        {children || (
          <>
            <Text style={[styles.value, { color }]}>{Math.round(clamped * 100)}%</Text>
            {label && <Text style={styles.label}>{label}</Text>}
          </>
        )}
      </View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  svg: { position: 'absolute' },
  center: { alignItems: 'center' },
  value: { ...typography.h2, fontVariant: ['tabular-nums'] },
  label: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
});
