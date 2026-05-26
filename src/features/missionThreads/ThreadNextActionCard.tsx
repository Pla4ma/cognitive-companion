// ══════════════════════════════════════════════════════════════
// INTENT — Thread Next Action Card
// Embeddable card showing the next tiny action from a thread
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  threadTitle: string
  nextAction: string
  attempts: number
  completions: number
  onStart: () => void
  onDismiss?: () => void
}

export const ThreadNextActionCard: React.FC<Props> = ({
  threadTitle,
  nextAction,
  attempts,
  completions,
  onStart,
  onDismiss,
}) => {
  return (
    <View style={styles.card}>
      {/* Thread Info */}
      <View style={styles.header}>
        <Text style={styles.threadLabel}>THREAD</Text>
        <Text style={styles.threadTitle}>{threadTitle}</Text>
      </View>

      {/* Progress */}
      <Text style={styles.progress}>
        {completions}/{attempts} completed
      </Text>

      {/* Next Action */}
      <View style={styles.actionBox}>
        <Text style={styles.actionLabel}>NEXT TINY ACTION</Text>
        <Text style={styles.actionText}>{nextAction}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.startButton} onPress={onStart}>
          <Text style={styles.startText}>Start</Text>
        </TouchableOpacity>
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Not now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: { marginBottom: 8 },
  threadLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888888',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  progress: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 12,
  },
  actionBox: {
    backgroundColor: '#0a0a0a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00ff88',
    letterSpacing: 1,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  startButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dismissText: {
    fontSize: 14,
    color: '#666666',
  },
})
