// ══════════════════════════════════════════════════════════════
// INTENT — Momentum Identity Card
// Momentum is about identity, not vanity
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { MomentumIdentity } from '../../services/momentum/momentumNarrative'
import { getIdentityHeadline, getIdentitySubcopy, getMomentumMetricLabel, getMomentumMetricValue } from '../../services/momentum/momentumNarrative'

interface Props {
  identity: MomentumIdentity
}

export const MomentumIdentityCard: React.FC<Props> = ({ identity }) => {
  const metrics = [
    { key: 'rescuedMoments', value: identity.rescuedMoments },
    { key: 'comebackCount', value: identity.comebackCount },
    { key: 'averageTimeToStart', value: identity.averageTimeToStart },
    { key: 'beforeScrollWins', value: identity.beforeScrollWins },
    { key: 'planningLoopsAvoided', value: identity.planningLoopsAvoided },
  ].filter((m) => m.value > 0)

  return (
    <View style={styles.card}>
      <Text style={styles.headline}>{getIdentityHeadline(identity)}</Text>
      <Text style={styles.subcopy}>{getIdentitySubcopy(identity)}</Text>

      {identity.narratives.length > 1 && (
        <View style={styles.narratives}>
          {identity.narratives.slice(1, 4).map((n, i) => (
            <Text key={i} style={styles.narrative}>• {n}</Text>
          ))}
        </View>
      )}

      {metrics.length > 0 && (
        <View style={styles.metrics}>
          {metrics.map((m) => (
            <View key={m.key} style={styles.metricRow}>
              <Text style={styles.metricLabel}>{getMomentumMetricLabel(m.key)}</Text>
              <Text style={styles.metricValue}>{getMomentumMetricValue(m.key, m.value)}</Text>
            </View>
          ))}
        </View>
      )}

      {identity.bestProtocol && (
        <Text style={styles.bestProtocol}>Best protocol: {identity.bestProtocol}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00ff88',
    marginBottom: 4,
  },
  subcopy: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  narratives: {
    marginBottom: 16,
  },
  narrative: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4,
  },
  metrics: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#888888',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  bestProtocol: {
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
    fontStyle: 'italic',
  },
})
