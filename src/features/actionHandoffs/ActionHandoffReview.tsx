// ══════════════════════════════════════════════════════════════
// INTENT — Action Handoff Review Screen
// Shows proposed handoffs for user approval
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Share, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import type { ActionHandoff, EmailDraftPayload, ReminderPayload, ChecklistPayload, MessageDraftPayload } from '../../src/types/actionHandoff'
import { RISK_LEVEL_COPY } from '../../src/types/actionHandoff'
import { generateReviewCopy, addAuditEntry } from '../../src/services/actionHandoffs/handoffPolicy'

interface ActionHandoffReviewProps {
  handoff: ActionHandoff
  onApprove: (handoff: ActionHandoff) => void
  onCancel: (handoffId: string) => void
  onEdit: (handoff: ActionHandoff) => void
}

export function ActionHandoffReview({ handoff, onApprove, onCancel, onEdit }: ActionHandoffReviewProps) {
  const [editedPayload, setEditedPayload] = useState(handoff.editablePayload)
  const [isEditing, setIsEditing] = useState(false)

  const riskConfig = RISK_LEVEL_COPY[handoff.riskLevel]
  const reviewCopy = generateReviewCopy(handoff)

  const handleCopy = async () => {
    const text = getPayloadText(handoff)
    await Share.share({ message: text })
    onApprove(addAuditEntry(handoff, 'copied'))
  }

  const handleOpenMail = () => {
    if (handoff.type === 'email_draft') {
      const payload = editedPayload as EmailDraftPayload
      const url = `mailto:${payload.to}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.body)}`
      Linking.openURL(url)
      onApprove(addAuditEntry(handoff, 'opened_mail'))
    }
  }

  return (
    <View style={styles.container}>
      {/* Risk Badge */}
      <View style={[styles.riskBadge, { backgroundColor: riskConfig.color + '22' }]}>
        <View style={[styles.riskDot, { backgroundColor: riskConfig.color }]} />
        <Text style={[styles.riskText, { color: riskConfig.color }]}>
          {riskConfig.label}: {riskConfig.description}
        </Text>
      </View>

      {/* Review Copy */}
      <Text style={styles.reviewCopy}>{reviewCopy}</Text>

      {/* Handoff Content */}
      <View style={styles.contentCard}>
        <Text style={styles.handoffType}>{handoff.type.replace(/_/g, ' ').toUpperCase()}</Text>
        <Text style={styles.handoffTitle}>{handoff.title}</Text>
        <Text style={styles.handoffPreview}>{handoff.preview}</Text>

        {/* Type-specific preview */}
        {renderTypeSpecificPreview(handoff, editedPayload, isEditing, setEditedPayload)}
      </View>

      {/* Edit Toggle */}
      <Pressable style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
        <Text style={styles.editText}>{isEditing ? 'Done editing' : 'Edit details'}</Text>
      </Pressable>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable style={styles.cancelButton} onPress={() => onCancel(handoff.id)}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        {handoff.type === 'email_draft' && (
          <Pressable style={styles.copyButton} onPress={handleOpenMail}>
            <Text style={styles.copyText}>Open Mail</Text>
          </Pressable>
        )}

        <Pressable style={styles.copyButton} onPress={handleCopy}>
          <Text style={styles.copyText}>Copy</Text>
        </Pressable>

        <Pressable style={styles.approveButton} onPress={() => onApprove(handoff)}>
          <Text style={styles.approveText}>Approve</Text>
        </Pressable>
      </View>

      {/* Audit Log */}
      <View style={styles.auditSection}>
        <Text style={styles.auditTitle}>Audit Log</Text>
        {handoff.auditLog.map((entry, i) => (
          <Text key={i} style={styles.auditEntry}>
            {entry.action} · {new Date(entry.timestamp).toLocaleTimeString()}
          </Text>
        ))}
      </View>
    </View>
  )
}

// ── Type-Specific Previews ─────────────────────────────────

function renderTypeSpecificPreview(
  handoff: ActionHandoff,
  payload: Record<string, unknown>,
  isEditing: boolean,
  setPayload: (p: Record<string, unknown>) => void,
) {
  switch (handoff.type) {
    case 'email_draft': {
      const p = payload as EmailDraftPayload
      return (
        <View style={styles.typePreview}>
          <PreviewField label="To" value={p.to} editable={isEditing} onChange={(v) => setPayload({ ...payload, to: v })} />
          <PreviewField label="Subject" value={p.subject} editable={isEditing} onChange={(v) => setPayload({ ...payload, subject: v })} />
          <PreviewField label="Body" value={p.body} multiline editable={isEditing} onChange={(v) => setPayload({ ...payload, body: v })} />
        </View>
      )
    }
    case 'message_draft': {
      const p = payload as MessageDraftPayload
      return (
        <View style={styles.typePreview}>
          <PreviewField label="Message" value={p.body} multiline editable={isEditing} onChange={(v) => setPayload({ ...payload, body: v })} />
        </View>
      )
    }
    case 'reminder': {
      const p = payload as ReminderPayload
      return (
        <View style={styles.typePreview}>
          <PreviewField label="Title" value={p.title} editable={isEditing} onChange={(v) => setPayload({ ...payload, title: v })} />
          <PreviewField label="Time" value={p.scheduledTime} />
        </View>
      )
    }
    case 'checklist': {
      const p = payload as ChecklistPayload
      return (
        <View style={styles.typePreview}>
          <Text style={styles.checklistTitle}>{p.title}</Text>
          {p.items.map((item) => (
            <View key={item.id} style={styles.checklistItem}>
              <Text style={styles.checklistBullet}>☐</Text>
              <Text style={styles.checklistText}>{item.text}</Text>
            </View>
          ))}
        </View>
      )
    }
    case 'study_plan': {
      const p = payload as { subject: string; topics: { name: string; estimatedMinutes: number }[]; totalMinutes: number }
      return (
        <View style={styles.typePreview}>
          <Text style={styles.studySubject}>{p.subject}</Text>
          <Text style={styles.studyTotal}>{p.totalMinutes} minutes total</Text>
          {p.topics.map((t, i) => (
            <View key={i} style={styles.studyTopic}>
              <Text style={styles.studyTopicName}>{t.name}</Text>
              <Text style={styles.studyTopicTime}>{t.estimatedMinutes} min</Text>
            </View>
          ))}
        </View>
      )
    }
    default:
      return null
  }
}

function PreviewField({
  label,
  value,
  multiline,
  editable,
  onChange,
}: {
  label: string
  value: string
  multiline?: boolean
  editable?: boolean
  onChange?: (v: string) => void
}) {
  return (
    <View style={styles.previewField}>
      <Text style={styles.previewLabel}>{label}</Text>
      {editable && onChange ? (
        <TextInput
          style={[styles.previewInput, multiline && styles.previewInputMultiline]}
          value={value}
          onChangeText={onChange}
          multiline={multiline}
        />
      ) : (
        <Text style={styles.previewValue}>{value || '(empty)'}</Text>
      )}
    </View>
  )
}

function getPayloadText(handoff: ActionHandoff): string {
  switch (handoff.type) {
    case 'email_draft': {
      const p = handoff.editablePayload as EmailDraftPayload
      return `To: ${p.to}\nSubject: ${p.subject}\n\n${p.body}`
    }
    case 'message_draft': {
      const p = handoff.editablePayload as MessageDraftPayload
      return p.body
    }
    case 'checklist': {
      const p = handoff.editablePayload as ChecklistPayload
      return `${p.title}\n${p.items.map((i) => `☐ ${i.text}`).join('\n')}`
    }
    default:
      return handoff.preview
  }
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  riskBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
  },
  riskDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  riskText: { fontSize: 13, fontWeight: '500' },
  reviewCopy: { fontSize: 14, color: '#9CA3AF', lineHeight: 20, marginBottom: 16 },
  contentCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 12,
  },
  handoffType: { fontSize: 11, color: '#6C3AED', fontWeight: '700', marginBottom: 6 },
  handoffTitle: { fontSize: 18, fontWeight: '700', color: '#F1F1F1', marginBottom: 4 },
  handoffPreview: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  typePreview: { marginTop: 8 },
  previewField: { marginBottom: 12 },
  previewLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  previewValue: { fontSize: 15, color: '#D1D5DB' },
  previewInput: {
    backgroundColor: '#2A2A3E', borderRadius: 10, padding: 12, fontSize: 15, color: '#F1F1F1',
  },
  previewInputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  editButton: { alignSelf: 'center', marginBottom: 16 },
  editText: { fontSize: 14, color: '#6C3AED', textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  cancelButton: {
    flex: 1, backgroundColor: '#2A2A3E', borderRadius: 14, padding: 14, alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#EF4444', fontWeight: '500' },
  copyButton: {
    flex: 1, backgroundColor: '#2A2A3E', borderRadius: 14, padding: 14, alignItems: 'center',
  },
  copyText: { fontSize: 15, color: '#F1F1F1', fontWeight: '500' },
  approveButton: {
    flex: 1, backgroundColor: '#6C3AED', borderRadius: 14, padding: 14, alignItems: 'center',
  },
  approveText: { fontSize: 15, color: '#FFF', fontWeight: '700' },
  auditSection: { borderTopWidth: 1, borderTopColor: '#2A2A3E', paddingTop: 12 },
  auditTitle: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  auditEntry: { fontSize: 12, color: '#4B5563', marginBottom: 2 },
  checklistTitle: { fontSize: 16, fontWeight: '600', color: '#F1F1F1', marginBottom: 8 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  checklistBullet: { fontSize: 14, color: '#6C3AED', marginRight: 8 },
  checklistText: { fontSize: 14, color: '#D1D5DB', flex: 1 },
  studySubject: { fontSize: 16, fontWeight: '600', color: '#F1F1F1', marginBottom: 4 },
  studyTotal: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  studyTopic: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#2A2A3E', borderRadius: 8, padding: 10, marginBottom: 6,
  },
  studyTopicName: { fontSize: 14, color: '#D1D5DB' },
  studyTopicTime: { fontSize: 13, color: '#6B7280' },
})
