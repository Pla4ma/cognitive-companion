// ══════════════════════════════════════════════════════════════
// INTENT — Intent Lock Overlay
// Full-screen focus mode during active mission
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native'
import type { MicroMission } from '../../types/mission'

interface Props {
  mission: MicroMission
  elapsedSeconds: number
  onNeedOut: () => void
  onComplete: () => void
  onSalvage: () => void
}

const PULSE_TEXTS = [
  'You are here. That is enough.',
  'One thing at a time.',
  'Progress, not perfection.',
  'This is the work.',
  'You chose to start. That matters.',
  'Stay with this moment.',
  'Small steps create momentum.',
  'You are doing it right now.',
]

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export const IntentLockOverlay: React.FC<Props> = ({
  mission,
  elapsedSeconds,
  onNeedOut,
  onComplete,
  onSalvage,
}) => {
  const [pulseIndex, setPulseIndex] = useState(0)
  const pulseAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setPulseIndex((prev) => (prev + 1) % PULSE_TEXTS.length)
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start()
      })
    }, 8000)

    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()

    return () => clearInterval(interval)
  }, [pulseAnim])

  const isOvertime = mission.estimatedMinutes > 0 && elapsedSeconds > mission.estimatedMinutes * 60

  return (
    <View style={styles.container}>
      {/* Top: Mission title */}
      <View style={styles.topSection}>
        <Text style={styles.label}>FOCUSED ON</Text>
        <Text style={styles.title}>{mission.title}</Text>
      </View>

      {/* Center: Exact action + timer */}
      <View style={styles.centerSection}>
        <Text style={styles.exactAction}>{mission.exactAction}</Text>
        <Text style={[styles.timer, isOvertime && styles.timerOvertime]}>
          {formatTimer(elapsedSeconds)}
        </Text>
        <Text style={styles.estimated}>
          {mission.estimatedMinutes > 0
            ? `~${mission.estimatedMinutes} min estimated`
            : 'No time limit'}
        </Text>
      </View>

      {/* Bottom: Pulse text + controls */}
      <View style={styles.bottomSection}>
        <Animated.Text style={[styles.pulseText, { opacity: pulseAnim }]}>
          {PULSE_TEXTS[pulseIndex]}
        </Animated.Text>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Text style={styles.completeText}>Done</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.needOutButton} onPress={onNeedOut}>
            <Text style={styles.needOutText}>Need out?</Text>
          </TouchableOpacity>
        </View>

        {mission.salvageMission && (
          <TouchableOpacity style={styles.salvageLink} onPress={onSalvage}>
            <Text style={styles.salvageText}>Salvage a smaller version</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
  },
  topSection: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  centerSection: {
    alignItems: 'center',
  },
  exactAction: {
    fontSize: 18,
    color: '#00ff88',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  timer: {
    fontSize: 56,
    fontWeight: '200',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  timerOvertime: {
    color: '#F59E0B',
  },
  estimated: {
    fontSize: 14,
    color: '#666666',
  },
  bottomSection: {
    alignItems: 'center',
  },
  pulseText: {
    fontSize: 15,
    color: '#888888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
    minHeight: 22,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: '#00ff88',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  needOutButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  needOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cccccc',
  },
  salvageLink: {
    paddingVertical: 8,
  },
  salvageText: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
  },
})
