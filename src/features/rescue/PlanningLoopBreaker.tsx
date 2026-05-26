// ══════════════════════════════════════════════════════════════
// INTENT — Planning Loop Breaker
// "Planning might be replacing starting."
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { PlanningLoopSignal } from '../../engine/planningLoopDetector'
import { generatePlanningLoopCopy } from '../../engine/planningLoopDetector'

interface Props {
  signal: PlanningLoopSignal
  onStartAction: () => void
  onPickForMe: () => void
  onDismiss: () => void
  onReallyNeedToPlan: () => void
}

export const PlanningLoopBreaker: React.FC<Props> = ({
  signal,
  onStartAction,
  onPickForMe,
  onDismiss,
  onReallyNeedToPlan,
}) => {
  if (!signal.detected) return null

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔄</Text>
        <Text style={styles.message}>{generatePlanningLoopCopy(signal)}</Text>
        <Text style={styles.indicator}>
          {signal.timeInAppWithoutAction} minutes without starting
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={onStartAction}>
          <Text style={styles.primaryText}>Start 2-minute action</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onPickForMe}>
          <Text style={styles.secondaryText}>Pick for me</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tertiaryButton} onPress={onReallyNeedToPlan}>
          <Text style={styles.tertiaryText}>I really need to plan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dismissLink} onPress={onDismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  card: {
    backgroundColor: '#1a1a2a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333355',
  },
  icon: {
    fontSize: 32,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  indicator: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#00ff88',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  secondaryButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  tertiaryButton: {
    paddingVertical: 8,
    marginBottom: 4,
  },
  tertiaryText: {
    fontSize: 14,
    color: '#888888',
  },
  dismissLink: {
    paddingVertical: 4,
  },
  dismissText: {
    fontSize: 13,
    color: '#555555',
  },
})
