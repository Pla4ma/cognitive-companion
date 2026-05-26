// ══════════════════════════════════════════════════════════════
// INTENT — Attention Receipt Card
// "What did I do with the moment I almost lost?"
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { AttentionReceipt } from '../../engine/attentionReceiptEngine'

interface Props {
  receipt: AttentionReceipt
  onShare?: () => void
  onDismiss?: () => void
}

export const AttentionReceiptCard: React.FC<Props> = ({ receipt, onShare, onDismiss }) => {
  const getOutcomeColor = () => {
    switch (receipt.outcome) {
      case 'completed': return '#00ff88'
      case 'salvaged': return '#ffaa00'
      case 'partial': return '#4488ff'
      default: return '#666666'
    }
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <Text style={styles.headerTitle}>Attention Receipt</Text>
      <View style={[styles.outcomeBadge, { borderColor: getOutcomeColor() }]}>
        <Text style={[styles.outcomeText, { color: getOutcomeColor() }]}>
          {receipt.outcome.toUpperCase()}
        </Text>
      </View>

      {/* Before */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>BEFORE</Text>
        <Text style={styles.sectionValue}>{receipt.beforeState}</Text>
      </View>

      {/* Risk */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>RISK</Text>
        <Text style={styles.sectionValue}>{receipt.driftRisk}</Text>
      </View>

      {/* Action */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACTION</Text>
        <Text style={styles.sectionValue}>{receipt.missionAction}</Text>
      </View>

      {/* Duration */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>TIME</Text>
        <Text style={styles.sectionValue}>{receipt.duration} minutes</Text>
      </View>

      {/* What Changed */}
      {receipt.whatChanged && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>WHAT CHANGED</Text>
          <Text style={styles.sectionValue}>{receipt.whatChanged}</Text>
        </View>
      )}

      {/* Next Step */}
      {receipt.nextMicroStep && (
        <View style={styles.nextStepCard}>
          <Text style={styles.nextStepLabel}>NEXT TINY STEP</Text>
          <Text style={styles.nextStepValue}>{receipt.nextMicroStep}</Text>
        </View>
      )}

      {/* Timestamp */}
      <Text style={styles.timestamp}>
        {new Date(receipt.createdAt).toLocaleDateString()} {new Date(receipt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        {onShare && (
          <TouchableOpacity style={styles.shareButton} onPress={onShare}>
            <Text style={styles.shareText}>Share receipt</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  outcomeBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  outcomeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 20,
  },
  nextStepCard: {
    backgroundColor: '#1a2a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#00ff8840',
  },
  nextStepLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00ff88',
    letterSpacing: 1,
    marginBottom: 4,
  },
  nextStepValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    color: '#555555',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
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
