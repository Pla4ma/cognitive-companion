// ══════════════════════════════════════════════════════════════
// INTENT — Reminder Handoff Card
// Card component for reminder handoff with editing & confirmation
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native'
import type { ActionHandoff, ReminderPayload } from '../../types/actionHandoff'
import { RISK_LEVEL_COPY } from '../../types/actionHandoff'

interface ReminderHandoffCardProps {
  handoff: ActionHandoff
  onConfirm: (handoff: ActionHandoff, updatedPayload: ReminderPayload) => void
  onEdit: (handoff: ActionHandoff) => void
  onCancel: (handoffId: string) => void
}

export function ReminderHandoffCard({
  handoff,
  onConfirm,
  onEdit,
  onCancel,
}: ReminderHandoffCardProps) {
  const payload = handoff.editablePayload as ReminderPayload
  const riskConfig = RISK_LEVEL_COPY[handoff.riskLevel]

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(payload.title)
  const [body, setBody] = useState(payload.body)
  const [scheduledTime, setScheduledTime] = useState(payload.scheduledTime)
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>(payload.repeat)

  const formattedTime = new Date(scheduledTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  const handleConfirm = () => {
    onConfirm(handoff, { title, body, scheduledTime, repeat })
  }

  const repeatOptions: { key: 'none' | 'daily' | 'weekly'; label: string }[] = [
    { key: 'none', label: 'Once' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
  ]

  return (
    <View style={styles.card}>
      {/* Trust Badge */}
      <View style={styles.trustBadge}>
        <Text style={styles.trustIcon}>🛡️</Text>
        <Text style={styles.trustText}>Nothing sent without confirmation</Text>
      </View>

      {/* Risk Badge */}
      <View style={[styles.riskRow, { backgroundColor: riskConfig.color + '15' }]}>
        <View style={[styles.riskDot, { backgroundColor: riskConfig.color }]} />
        <Text style={[styles.riskLabel, { color: riskConfig.color }]}>
          {riskConfig.label}: {riskConfig.description}
        </Text>
      </View>

      {/* Reminder Content */}
      <View style={styles.contentSection}>
        <Text style={styles.sectionLabel}>REMINDER</Text>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Reminder title"
              placeholderTextColor="#555"
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={body}
              onChangeText={setBody}
              placeholder="Details..."
              placeholderTextColor="#555"
              multiline
            />
            <TextInput
              style={styles.input}
              value={scheduledTime}
              onChangeText={setScheduledTime}
              placeholder="ISO time"
              placeholderTextColor="#555"
            />
            <View style={styles.repeatRow}>
              {repeatOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.repeatChip, repeat === opt.key && styles.repeatChipActive]}
                  onPress={() => setRepeat(opt.key)}
                >
                  <Text
                    style={[styles.repeatText, repeat === opt.key && styles.repeatTextActive]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.reminderTitle}>{title}</Text>
            {body ? <Text style={styles.reminderBody}>{body}</Text> : null}
            <Text style={styles.reminderTime}>⏰ {formattedTime}</Text>
            {repeat !== 'none' && (
              <Text style={styles.reminderRepeat}>🔁 Repeats {repeat}</Text>
            )}
          </>
        )}
      </View>

      {/* Source */}
      {handoff.sourceMissionId && (
        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel}>Source: Mission {handoff.sourceMissionId.slice(0, 8)}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel(handoff.id)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(!isEditing)}
        >
          <Text style={styles.editText}>{isEditing ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 18,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff8811',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  trustIcon: {
    fontSize: 14,
  },
  trustText: {
    fontSize: 12,
    color: '#00ff88',
    fontWeight: '600',
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  contentSection: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  reminderBody: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
    marginBottom: 8,
  },
  reminderTime: {
    fontSize: 14,
    color: '#ffaa00',
    fontWeight: '600',
  },
  reminderRepeat: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  repeatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  repeatChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  repeatChipActive: {
    borderColor: '#00ff88',
    backgroundColor: '#00ff8815',
  },
  repeatText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  repeatTextActive: {
    color: '#00ff88',
  },
  sourceRow: {
    marginBottom: 14,
  },
  sourceLabel: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff4444',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
})
