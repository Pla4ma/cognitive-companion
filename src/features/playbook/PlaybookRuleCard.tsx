// ══════════════════════════════════════════════════════════════
// INTENT — Playbook Rule Card
// Card showing a single personal playbook rule
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'

interface PlaybookRule {
  id: string
  state: string
  protocol: string
  duration: number
  confidence: number
  rescueCount: number
  lastUsed?: string
}

interface Props {
  rule: PlaybookRule
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onReset?: (id: string) => void
}

export function PlaybookRuleCard({ rule, onEdit, onDelete, onReset }: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)

  const confidenceLabel = () => {
    if (rule.confidence < 0.3) return 'Learning'
    if (rule.confidence < 0.6) return 'Pattern detected'
    return 'Strong pattern'
  }

  const confidenceColor = () => {
    if (rule.confidence < 0.3) return '#666'
    if (rule.confidence < 0.6) return '#ffaa00'
    return '#00ff88'
  }

  const handleDelete = () => {
    Alert.alert('Delete Rule', 'This rule will be removed from your playbook.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(rule.id) },
    ])
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      {/* Rule Summary */}
      <View style={styles.ruleRow}>
        <View style={styles.stateChip}>
          <Text style={styles.stateText}>{rule.state.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <View style={styles.protocolInfo}>
          <Text style={styles.protocolText}>
            {rule.duration} min · {rule.protocol.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Confidence Bar */}
      <View style={styles.confidenceRow}>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              {
                width: `${rule.confidence * 100}%`,
                backgroundColor: confidenceColor(),
              },
            ]}
          />
        </View>
        <Text style={[styles.confidenceLabel, { color: confidenceColor() }]}>
          {confidenceLabel()}
        </Text>
      </View>

      {/* Meta */}
      <Text style={styles.metaText}>
        Based on {rule.rescueCount} rescues
        {rule.lastUsed ? ` · Last: ${new Date(rule.lastUsed).toLocaleDateString()}` : ''}
      </Text>

      {/* Expanded Actions */}
      {expanded && (
        <View style={styles.expandedActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit?.(rule.id)}
          >
            <Text style={styles.editText}>Edit Rule</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => onReset?.(rule.id)}
          >
            <Text style={styles.resetText}>Reset to Learned</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2a2a3a',
  },
  stateText: { fontSize: 13, color: '#aabbff', fontWeight: '600', textTransform: 'capitalize' },
  arrow: { fontSize: 16, color: '#555', marginHorizontal: 10 },
  protocolInfo: { flex: 1 },
  protocolText: { fontSize: 14, color: '#e0e0e0', fontWeight: '600', textTransform: 'capitalize' },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
  confidenceLabel: { fontSize: 11, fontWeight: '600' },
  metaText: { fontSize: 12, color: '#666' },
  expandedActions: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 8,
  },
  editButton: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#00ff8820',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff8830',
  },
  editText: { fontSize: 14, color: '#00ff88', fontWeight: '600' },
  resetButton: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  resetText: { fontSize: 14, color: '#aaa', fontWeight: '600' },
  deleteButton: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2a1a1a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff444433',
  },
  deleteText: { fontSize: 14, color: '#ff6666', fontWeight: '600' },
})
