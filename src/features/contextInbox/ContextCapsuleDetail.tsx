// ══════════════════════════════════════════════════════════════
// INTENT — Context Capsule Detail
// Detail view for a single context capsule
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ContextSensitivityBadge } from './ContextSensitivityBadge'

interface ExtractedItem {
  id: string
  type: 'obligation' | 'deadline' | 'blocker' | 'person'
  text: string
}

export function ContextCapsuleDetail(): React.JSX.Element {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { capsuleId, capsule } = route.params ?? {}

  const [showRaw, setShowRaw] = useState(false)
  const [localOnly, setLocalOnly] = useState(false)
  const [deleteAfterMission, setDeleteAfterMission] = useState(false)

  // In production, load capsule from store by ID
  const rawText = capsule?.rawText ?? 'Sample context text would appear here.'
  const summary = capsule?.summary ?? 'Extracted summary of your context.'
  const sensitivity = capsule?.sensitivity ?? 'personal'
  const extractedItems: ExtractedItem[] = capsule?.extractedItems ?? [
    { id: '1', type: 'obligation', text: 'Submit English essay' },
    { id: '2', type: 'deadline', text: 'Friday — essay due' },
    { id: '3', type: 'blocker', text: 'Avoiding email to professor' },
    { id: '4', type: 'person', text: 'Professor Martinez' },
  ]

  const suggestedMission = capsule?.suggestedMission ?? 'Open the email draft and write only the subject line.'

  const typeIcon = (t: string) => {
    switch (t) {
      case 'obligation': return '📌'
      case 'deadline': return '⏰'
      case 'blocker': return '🚧'
      case 'person': return '👤'
      default: return '•'
    }
  }

  const handleStartMission = () => {
    navigation.navigate('ContextToMissionFlow', { capsuleId, suggestedMission })
  }

  const handleDelete = () => {
    Alert.alert('Delete Capsule', 'This will permanently remove all extracted data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <ContextSensitivityBadge level={sensitivity} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>
        <Text style={styles.sectionTitle}>What INTENT Found</Text>

        <View style={styles.itemsList}>
          {extractedItems.map(item => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemIcon}>{typeIcon(item.type)}</Text>
              <View style={styles.itemContent}>
                <Text style={styles.itemType}>{item.type}</Text>
                <Text style={styles.itemText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Suggested Tiny Mission</Text>
        <View style={styles.missionCard}>
          <Text style={styles.missionText}>{suggestedMission}</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartMission}
          >
            <Text style={styles.startButtonText}>Start Mission</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Raw Input</Text>
        <TouchableOpacity
          style={styles.rawToggle}
          onPress={() => setShowRaw(!showRaw)}
        >
          <Text style={styles.rawToggleText}>
            {showRaw ? 'Hide raw text' : 'Show raw text'}
          </Text>
        </TouchableOpacity>
        {showRaw && (
          <View style={styles.rawContainer}>
            <Text style={styles.rawText}>{rawText}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Privacy Controls</Text>
        <View style={styles.privacyCard}>
          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyLabel}>Do not use for AI</Text>
              <Text style={styles.privacyDesc}>Keep this capsule local-only</Text>
            </View>
            <Switch
              value={localOnly}
              onValueChange={setLocalOnly}
              trackColor={{ false: '#333', true: '#00ff88' }}
            />
          </View>
          <View style={styles.privacyDivider} />
          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyLabel}>Delete raw text after mission</Text>
              <Text style={styles.privacyDesc}>Keep only extracted actions</Text>
            </View>
            <Switch
              value={deleteAfterMission}
              onValueChange={setDeleteAfterMission}
              trackColor={{ false: '#333', true: '#00ff88' }}
            />
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit Extraction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallerButton}>
            <Text style={styles.smallerButtonText}>Make Smaller</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Capsule</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backText: { fontSize: 16, color: '#00ff88', fontWeight: '600' },
  content: { flex: 1 },
  contentPad: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  itemsList: { gap: 8 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  itemIcon: { fontSize: 18, marginRight: 12 },
  itemContent: { flex: 1 },
  itemType: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  itemText: { fontSize: 15, color: '#e0e0e0', marginTop: 2 },
  missionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00ff8830',
  },
  missionText: { fontSize: 16, color: '#e0e0e0', lineHeight: 24, marginBottom: 16 },
  startButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: { fontSize: 16, fontWeight: '700', color: '#0a0a0a' },
  rawToggle: { paddingVertical: 8 },
  rawToggleText: { fontSize: 14, color: '#00ff88', fontWeight: '600' },
  rawContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  rawText: { fontSize: 14, color: '#aaa', lineHeight: 20 },
  privacyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  privacyInfo: { flex: 1, marginRight: 12 },
  privacyLabel: { fontSize: 15, color: '#fff', fontWeight: '600' },
  privacyDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  privacyDivider: { height: 1, backgroundColor: '#2a2a2a', marginHorizontal: 16 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  editButtonText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  smallerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  smallerButtonText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  deleteButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff444433',
    alignItems: 'center',
  },
  deleteButtonText: { fontSize: 14, color: '#ff6666', fontWeight: '600' },
})
