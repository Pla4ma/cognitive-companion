// ══════════════════════════════════════════════════════════════
// INTENT — Playbook Experiment Card
// Card showing an active or completed experiment
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'

interface Experiment {
  id: string
  hypothesis: string
  startDate: string
  durationDays: number
  status: 'active' | 'completed' | 'abandoned'
  completionRate: number
  totalAttempts: number
  successfulAttempts: number
  userFeedback?: string
}

interface Props {
  experiment: Experiment
  onEnd?: (id: string) => void
  onViewDetails?: (id: string) => void
}

export function PlaybookExperimentCard({ experiment, onEnd, onViewDetails }: Props): React.JSX.Element {
  const startDate = new Date(experiment.startDate)
  const daysElapsed = Math.floor(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysRemaining = Math.max(0, experiment.durationDays - daysElapsed)
  const progress = Math.min(1, daysElapsed / experiment.durationDays)

  const statusColor = () => {
    switch (experiment.status) {
      case 'active': return '#00ff88'
      case 'completed': return '#66aaff'
      case 'abandoned': return '#888'
    }
  }

  const statusLabel = () => {
    switch (experiment.status) {
      case 'active': return `${daysRemaining} days left`
      case 'completed': return 'Completed'
      case 'abandoned': return 'Abandoned'
    }
  }

  const handleEnd = () => {
    Alert.alert('End Experiment', 'Stop this experiment early?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End Early',
        style: 'destructive',
        onPress: () => onEnd?.(experiment.id),
      },
    ])
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: statusColor() }]} />
        <Text style={[styles.statusText, { color: statusColor() }]}>
          {statusLabel()}
        </Text>
      </View>

      <Text style={styles.hypothesis}>{experiment.hypothesis}</Text>

      {/* Progress Bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Day {daysElapsed}/{experiment.durationDays}
        </Text>
      </View>

      {/* Results */}
      <View style={styles.resultsRow}>
        <View style={styles.resultBlock}>
          <Text style={styles.resultNumber}>
            {experiment.totalAttempts > 0
              ? `${Math.round(experiment.completionRate * 100)}%`
              : '—'}
          </Text>
          <Text style={styles.resultLabel}>Success</Text>
        </View>
        <View style={styles.resultDivider} />
        <View style={styles.resultBlock}>
          <Text style={styles.resultNumber}>{experiment.successfulAttempts}</Text>
          <Text style={styles.resultLabel}>Wins</Text>
        </View>
        <View style={styles.resultDivider} />
        <View style={styles.resultBlock}>
          <Text style={styles.resultNumber}>{experiment.totalAttempts}</Text>
          <Text style={styles.resultLabel}>Attempts</Text>
        </View>
      </View>

      {experiment.userFeedback && (
        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackLabel}>Your take:</Text>
          <Text style={styles.feedbackText}>{experiment.userFeedback}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {experiment.status === 'active' && (
          <TouchableOpacity style={styles.endButton} onPress={handleEnd}>
            <Text style={styles.endText}>End Experiment Early</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => onViewDetails?.(experiment.id)}
        >
          <Text style={styles.detailText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  hypothesis: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 2,
  },
  progressText: { fontSize: 11, color: '#888' },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderRadius: 10,
  },
  resultBlock: { alignItems: 'center' },
  resultNumber: { fontSize: 22, fontWeight: '800', color: '#fff' },
  resultLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  resultDivider: { width: 1, backgroundColor: '#2a2a2a' },
  feedbackRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  feedbackLabel: { fontSize: 12, color: '#888' },
  feedbackText: { fontSize: 12, color: '#aaa', flex: 1, fontStyle: 'italic' },
  actions: { gap: 8 },
  endButton: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff444433',
  },
  endText: { fontSize: 14, color: '#ff6666', fontWeight: '600' },
  detailButton: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1a1a2a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334',
  },
  detailText: { fontSize: 14, color: '#6688ff', fontWeight: '600' },
})
