// ══════════════════════════════════════════════════════════════
// INTENT — Drift Mirror Rule Card
// Shows a single learned rule from pattern recognition
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInput,
} from 'react-native'
import type { DriftMirrorInsight } from '../../engine/driftMirror'

interface Props {
  insight: DriftMirrorInsight
  sourceRescueCount: number
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onEdit: (id: string, newRule: string) => void
}

export const DriftMirrorRule: React.FC<Props> = ({
  insight,
  sourceRescueCount,
  onAccept,
  onReject,
  onEdit,
}) => {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending')
  const [isEditing, setIsEditing] = useState(false)
  const [editedRule, setEditedRule] = useState(insight.newRule)
  const checkScale = useRef(new Animated.Value(0)).current
  const cardOpacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (status === 'accepted') {
      Animated.sequence([
        Animated.spring(checkScale, { toValue: 1.2, useNativeDriver: true }),
        Animated.spring(checkScale, { toValue: 1, useNativeDriver: true }),
      ]).start()
    }
  }, [status, checkScale])

  const handleAccept = () => {
    setStatus('accepted')
    onAccept(insight.id)
  }

  const handleReject = () => {
    Animated.timing(cardOpacity, { toValue: 0.3, duration: 300, useNativeDriver: true }).start()
    setStatus('rejected')
    onReject(insight.id)
  }

  const handleSaveEdit = () => {
    setIsEditing(false)
    onEdit(insight.id, editedRule)
  }

  const confidencePercent = Math.round(insight.confidence * 100)
  const confidenceColor = confidencePercent >= 70 ? '#00ff88' : confidencePercent >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <Animated.View style={[styles.card, { opacity: cardOpacity }]}>
      {/* Trigger condition */}
      <View style={styles.triggerRow}>
        <Text style={styles.triggerLabel}>When</Text>
        <Text style={styles.triggerValue}>{insight.situation}</Text>
      </View>

      <Text style={styles.arrow}>→</Text>

      {/* Recommended action / Rule */}
      {isEditing ? (
        <View style={styles.editBox}>
          <TextInput
            style={styles.editInput}
            value={editedRule}
            onChangeText={setEditedRule}
            multiline
            autoFocus
            placeholderTextColor="#666"
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.editCancel}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSaveEdit} style={styles.editSave}>
              <Text style={styles.editSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.ruleText}>{editedRule}</Text>
      )}

      {/* Confidence + rescue count */}
      <View style={styles.metaRow}>
        <View style={styles.confidenceBadge}>
          <View style={[styles.confidenceFill, { width: `${confidencePercent}%`, backgroundColor: confidenceColor }]} />
          <Text style={styles.confidenceText}>{confidencePercent}% confidence</Text>
        </View>
        <Text style={styles.rescueCount}>
          Based on {sourceRescueCount} rescue{sourceRescueCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Actions */}
      {status === 'pending' ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={[styles.resultRow, { transform: [{ scale: checkScale }] }]}>
          <Text style={status === 'accepted' ? styles.acceptedLabel : styles.rejectedLabel}>
            {status === 'accepted' ? '✓ Added to playbook' : '✕ Rule dismissed'}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  triggerLabel: {
    fontSize: 13,
    color: '#888',
    marginRight: 6,
  },
  triggerValue: {
    fontSize: 15,
    color: '#FFB347',
    fontWeight: '600',
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: '#00ff88',
    textAlign: 'center',
    marginVertical: 6,
  },
  ruleText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 12,
  },
  editBox: {
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  editInput: {
    color: '#fff',
    fontSize: 15,
    minHeight: 44,
    padding: 0,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  editCancel: { paddingVertical: 6, paddingHorizontal: 12 },
  editCancelText: { color: '#888', fontSize: 14 },
  editSave: {
    backgroundColor: '#00ff88',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  editSaveText: { color: '#000', fontSize: 14, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  confidenceBadge: {
    height: 22,
    width: 120,
    backgroundColor: '#2a2a2a',
    borderRadius: 11,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  confidenceFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 11,
    opacity: 0.25,
  },
  confidenceText: {
    fontSize: 11,
    color: '#ccc',
    textAlign: 'center',
    fontWeight: '600',
  },
  rescueCount: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  editButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  resultRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  acceptedLabel: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '600',
  },
  rejectedLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
})
