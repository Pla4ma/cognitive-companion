// ══════════════════════════════════════════════════════════════
// INTENT — Message Draft Handoff Card
// Card for reviewing SMS/message draft proposals
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

interface MessageDraft {
  id: string
  recipient: string
  message: string
  sourceContext: string
}

interface Props {
  handoff: MessageDraft
  onCopied?: (id: string) => void
  onCancel?: (id: string) => void
}

export function MessageDraftHandoffCard({ handoff, onCopied, onCancel }: Props): React.JSX.Element {
  const [recipient, setRecipient] = useState(handoff.recipient)
  const [message, setMessage] = useState(handoff.message)
  const [copied, setCopied] = useState(false)

  const charCount = message.length
  const isOverSms = charCount > 160

  const handleCopy = () => {
    Clipboard.setString(message)
    setCopied(true)
    onCopied?.(handoff.id)
    Alert.alert('Copied', 'Message copied to clipboard.')
  }

  const handleOpenMessages = () => {
    const smsUrl = `sms:${recipient}?body=${encodeURIComponent(message)}`
    Linking.openURL(smsUrl).catch(() => {
      Alert.alert('Could not open Messages', 'Try copying the draft instead.')
    })
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>💬</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Message Draft</Text>
          <Text style={styles.status}>{copied ? 'Copied' : 'Proposed'}</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>To</Text>
        <TextInput
          style={styles.fieldInput}
          value={recipient}
          onChangeText={setRecipient}
          placeholder="Phone or contact name"
          placeholderTextColor="#555"
        />
      </View>

      <View style={styles.field}>
        <View style={styles.messageHeader}>
          <Text style={styles.fieldLabel}>Message</Text>
          <Text style={[styles.charCount, isOverSms && styles.charCountOver]}>
            {charCount}/160
          </Text>
        </View>
        <TextInput
          style={[styles.fieldInput, styles.messageInput]}
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message"
          placeholderTextColor="#555"
          multiline
          textAlignVertical="top"
        />
        {isOverSms && (
          <Text style={styles.warningText}>Over 160 chars — may split as multiple SMS</Text>
        )}
      </View>

      <View style={styles.trustBadge}>
        <Text style={styles.trustText}>🔒 Nothing will be sent automatically</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.8}>
          <Text style={styles.copyText}>{copied ? '✓ Copied' : 'Copy Message'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smsButton} onPress={handleOpenMessages} activeOpacity={0.8}>
          <Text style={styles.smsText}>Open in Messages</Text>
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
  field: { marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 4 },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  charCount: { fontSize: 12, color: '#666' },
  charCountOver: { color: '#ff8844' },
  fieldInput: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  messageInput: { minHeight: 80 },
  warningText: { fontSize: 11, color: '#ff8844', marginTop: 4 },
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
  smsButton: {
    backgroundColor: '#1a2a1a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#336633',
  },
  smsText: { fontSize: 14, color: '#66cc66', fontWeight: '600' },
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
