// ══════════════════════════════════════════════════════════════
// INTENT — Calendar Handoff Card
// Card component for calendar block handoff proposals
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native'

interface CalendarHandoff {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  duration: number
  description: string
  sourceMission: string
  status: string
}

interface Props {
  handoff: CalendarHandoff
  onConfirm?: (id: string) => void
  onCancel?: (id: string) => void
}

export function CalendarHandoffCard({ handoff, onConfirm, onCancel }: Props): React.JSX.Element {
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    setConfirmed(true)
    onConfirm?.(handoff.id)
    Alert.alert(
      'Calendar Block Ready',
      'Calendar integration requires a development build. Use the ICS export or add manually.',
      [
        { text: 'OK' },
        {
          text: 'Export ICS',
          onPress: () => {
            // Generate ICS content and share
            const ics = [
              'BEGIN:VCALENDAR',
              'VERSION:2.0',
              `SUMMARY:${handoff.title}`,
              `DTSTART:${handoff.date.replace(/-/g, '')}T${handoff.startTime.replace(':', '')}00`,
              `DTEND:${handoff.date.replace(/-/g, '')}T${handoff.endTime.replace(':', '')}00`,
              `DESCRIPTION:${handoff.description}`,
              'END:VCALENDAR',
            ].join('\n')
            // In production: use expo-sharing to share ICS file
            Alert.alert('ICS Generated', ics.slice(0, 200) + '...')
          },
        },
      ]
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>📅</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Calendar Block</Text>
          <Text style={styles.status}>{confirmed ? 'Ready' : 'Proposed'}</Text>
        </View>
        <View style={styles.riskBadge}>
          <Text style={styles.riskText}>System Review</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eventTitle}>{handoff.title}</Text>
        <Text style={styles.eventTime}>
          {handoff.date} · {handoff.startTime} – {handoff.endTime}
        </Text>
        <Text style={styles.eventDuration}>{handoff.duration} minutes</Text>
        <Text style={styles.eventDesc}>{handoff.description}</Text>
      </View>

      <View style={styles.source}>
        <Text style={styles.sourceText}>From: {handoff.sourceMission}</Text>
      </View>

      <View style={styles.trustBadge}>
        <Text style={styles.trustText}>🔒 Nothing added to calendar without your confirmation</Text>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          📌 Calendar integration requires a development build. ICS export available as fallback.
        </Text>
      </View>

      <View style={styles.actions}>
        {!confirmed ? (
          <>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>Prepare Calendar Block</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => onCancel?.(handoff.id)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.confirmedRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.confirmedText}>Calendar block prepared</Text>
          </View>
        )}
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
    backgroundColor: '#332200',
  },
  riskText: { fontSize: 11, color: '#ffaa00', fontWeight: '600' },
  body: { marginBottom: 12 },
  eventTitle: { fontSize: 17, fontWeight: '700', color: '#e0e0e0', marginBottom: 4 },
  eventTime: { fontSize: 14, color: '#00ff88', marginBottom: 2 },
  eventDuration: { fontSize: 13, color: '#888', marginBottom: 8 },
  eventDesc: { fontSize: 14, color: '#aaa', lineHeight: 20 },
  source: { marginBottom: 10 },
  sourceText: { fontSize: 12, color: '#666' },
  trustBadge: {
    backgroundColor: '#0a1a0a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#00ff8820',
  },
  trustText: { fontSize: 12, color: '#00ff88', textAlign: 'center' },
  note: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  noteText: { fontSize: 12, color: '#888', lineHeight: 18 },
  actions: { gap: 10 },
  confirmButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff444433',
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, color: '#ff6666', fontWeight: '600' },
  confirmedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  checkmark: { fontSize: 20, color: '#00ff88', marginRight: 8 },
  confirmedText: { fontSize: 15, color: '#00ff88', fontWeight: '600' },
})
