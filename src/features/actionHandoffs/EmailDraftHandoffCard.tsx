// ══════════════════════════════════════════════════════════════
// INTENT — Email Draft Handoff Card
// Card for reviewing and editing email draft proposals
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
  Clipboard,
} from 'react-native'

interface EmailDraft {
  id: string
  to: string
  subject: string
  body: string
  sourceContext: string
  sourceMission: string
}

interface Props {
  handoff: EmailDraft
  onCopied?: (id: string) => void
  onCancel?: (id: string) => void
}

export function EmailDraftHandoffCard({ handoff, onCopied, onCancel }: Props): React.JSX.Element {
  const [to, setTo] = useState(handoff.to)
  const [subject, setSubject] = useState(handoff.subject)
  const [body, setBody] = useState(handoff.body)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const emailText = `To: ${to}\nSubject: ${subject}\n\n${body}`
    Clipboard.setString(emailText)
    setCopied(true)
    onCopied?.(handoff.id)
    Alert.alert('Copied', 'Email draft copied to clipboard.')
  }

  const handleOpenMail = () => {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    Linking.openURL(mailto).catch(() => {
      Alert.alert('Could not open mail app', 'Try copying the draft instead.')
    })
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>✉️</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Email Draft</Text>
          <Text style={styles.status}>{copied ? 'Copied' : 'Proposed'}</Text>
        </View>
        <View style={styles.riskBadge}>
          <Text style={styles.riskText}>External Review</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>To</Text>
        <TextInput
          style={styles.fieldInput}
          value={to}
          onChangeText={setTo}
          placeholder="recipient@email.com"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Subject</Text>
        <TextInput
          style={styles.fieldInput}
          value={subject}
          onChangeText={setSubject}
          placeholder="Email subject"
          placeholderTextColor="#555"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Body</Text>
        <TextInput
          style={[styles.fieldInput, styles.bodyInput]}
          value={body}
          onChangeText={setBody}
          placeholder="Email body"
          placeholderTextColor="#555"
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.source}>
        <Text style={styles.sourceText}>From context: {handoff.sourceContext}</Text>
      </View>

      <View style={styles.trustBadge}>
        <Text style={styles.trustText}>🔒 Nothing will be sent automatically</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.8}>
          <Text style={styles.copyText}>{copied ? '✓ Copied' : 'Copy to Clipboard'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mailButton} onPress={handleOpenMail} activeOpacity={0.8}>
          <Text style={styles.mailText}>Open in Mail App</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => onCancel?.(handoff.id)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  icon: { fontSize: 24, marginRight: 10 },
  headerInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff' },
  status: { fontSize: 12, color: '#888', marginTop: 2 },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#2a2200',
  },
  riskText: { fontSize: 11, color: '#ffaa00', fontWeight: '600' },
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 4 },
  fieldInput: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  bodyInput: { minHeight: 100 },
  source: { marginBottom: 10 },
  sourceText: { fontSize: 12, color: '#666' },
  trustBadge: {
    backgroundColor: '#0a1a0a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#00ff8820',
  },
  trustText: { fontSize: 12, color: '#00ff88', textAlign: 'center' },
  actions: { gap: 10 },
  copyButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  copyText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
  mailButton: {
    backgroundColor: '#1a2a3a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#336',
  },
  mailText: { fontSize: 14, color: '#66aaff', fontWeight: '600' },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff444433',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, color: '#ff6666', fontWeight: '600' },
})
