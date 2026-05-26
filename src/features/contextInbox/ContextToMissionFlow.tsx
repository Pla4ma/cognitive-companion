// ══════════════════════════════════════════════════════════════
// INTENT — Context to Mission Flow
// Transforms extracted context into actionable missions
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native'
import type { ContextCapsule } from '../../src/types/contextCapsule'
import type { ExtractionResult, PossibleMission } from '../../src/types/contextInbox'
import { ContextSensitivityBadge } from './ContextSensitivityBadge'

interface ContextToMissionFlowProps {
  visible: boolean
  capsule: ContextCapsule
  extraction: ExtractionResult
  onClose: () => void
  onStartMission: (mission: PossibleMission) => void
}

export function ContextToMissionFlow({
  visible,
  capsule,
  extraction,
  onClose,
  onStartMission,
}: ContextToMissionFlowProps) {
  const [selectedMission, setSelectedMission] = useState<PossibleMission | null>(
    extraction.possibleMissions[0] ?? null,
  )

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>What INTENT Found</Text>
              <ContextSensitivityBadge sensitivity={extraction.sensitivity} />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Summary</Text>
              <Text style={styles.summaryText}>
                {extraction.obligations.length} obligation{extraction.obligations.length !== 1 ? 's' : ''}{' '}
                {extraction.deadlines.length > 0 && `· ${extraction.deadlines.length} deadline`}
                {extraction.blockers.length > 0 && `· blocker detected`}
              </Text>
            </View>

            {/* Obligations */}
            {extraction.obligations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Obligations</Text>
                {extraction.obligations.map((ob, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemBullet}>•</Text>
                    <View style={styles.itemContent}>
                      <Text style={styles.itemText}>{ob.text}</Text>
                      {ob.deadline && (
                        <Text style={styles.itemDeadline}>Due: {ob.deadline}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Deadlines */}
            {extraction.deadlines.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Deadlines</Text>
                {extraction.deadlines.map((dl, i) => (
                  <View key={i} style={styles.deadlineRow}>
                    <Text style={styles.deadlineEmoji}>⏰</Text>
                    <Text style={styles.deadlineText}>{dl.text}</Text>
                    <Text style={[styles.urgencyBadge, dl.urgency === 'high' && styles.urgencyHigh]}>
                      {dl.urgency}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Blockers */}
            {extraction.blockers.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Blockers</Text>
                {extraction.blockers.map((b, i) => (
                  <View key={i} style={styles.blockerRow}>
                    <Text style={styles.blockerEmoji}>🚧</Text>
                    <Text style={styles.blockerText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Possible Missions */}
            {extraction.possibleMissions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Suggested Tiny Missions</Text>
                {extraction.possibleMissions.map((mission, i) => (
                  <Pressable
                    key={i}
                    style={[
                      styles.missionCard,
                      selectedMission === mission && styles.missionCardActive,
                    ]}
                    onPress={() => setSelectedMission(mission)}
                  >
                    <View style={styles.missionHeader}>
                      <Text style={styles.missionPriority}>P{mission.priority}</Text>
                      <Text style={styles.missionTime}>{mission.estimatedMinutes} min</Text>
                    </View>
                    <Text style={styles.missionAction}>{mission.exactAction}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Privacy Controls */}
            <View style={styles.privacySection}>
              <Text style={styles.privacyTitle}>Privacy Controls</Text>
              <View style={styles.privacyRow}>
                <Text style={styles.privacyLabel}>Raw text stored</Text>
                <Text style={styles.privacyValue}>
                  {capsule.rawContent.length > 0 ? 'Yes' : 'No'}
                </Text>
              </View>
              <View style={styles.privacyRow}>
                <Text style={styles.privacyLabel}>AI processing</Text>
                <Text style={styles.privacyValue}>
                  {capsule.aiProcessingAllowed ? 'Allowed' : 'Disabled'}
                </Text>
              </View>
              <Pressable style={styles.deleteRawButton}>
                <Text style={styles.deleteRawText}>Delete raw text</Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Save for later</Text>
            </Pressable>
            <Pressable
              style={[styles.startButton, !selectedMission && styles.startButtonDisabled]}
              onPress={() => selectedMission && onStartMission(selectedMission)}
              disabled={!selectedMission}
            >
              <Text style={styles.startText}>
                {selectedMission ? 'Start this mission' : 'Select a mission'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0A0A0F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#F1F1F1' },
  summaryCard: {
    backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 20,
  },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  summaryText: { fontSize: 15, color: '#D1D5DB' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  itemRow: { flexDirection: 'row', marginBottom: 8 },
  itemBullet: { fontSize: 14, color: '#6C3AED', marginRight: 8, marginTop: 2 },
  itemContent: { flex: 1 },
  itemText: { fontSize: 15, color: '#D1D5DB' },
  itemDeadline: { fontSize: 13, color: '#F59E0B', marginTop: 2 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  deadlineEmoji: { fontSize: 14, marginRight: 8 },
  deadlineText: { fontSize: 14, color: '#D1D5DB', flex: 1 },
  urgencyBadge: {
    fontSize: 11, color: '#10B981', fontWeight: '600',
    backgroundColor: '#10B98122', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  urgencyHigh: { color: '#EF4444', backgroundColor: '#EF444422' },
  blockerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  blockerEmoji: { fontSize: 14, marginRight: 8 },
  blockerText: { fontSize: 14, color: '#F59E0B', flex: 1 },
  missionCard: {
    backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  missionCardActive: { borderColor: '#6C3AED' },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  missionPriority: { fontSize: 12, color: '#6C3AED', fontWeight: '700' },
  missionTime: { fontSize: 12, color: '#6B7280' },
  missionAction: { fontSize: 15, color: '#F1F1F1' },
  privacySection: {
    backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 20,
  },
  privacyTitle: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 12 },
  privacyRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
  },
  privacyLabel: { fontSize: 14, color: '#D1D5DB' },
  privacyValue: { fontSize: 14, color: '#9CA3AF' },
  deleteRawButton: { marginTop: 12 },
  deleteRawText: { fontSize: 14, color: '#EF4444' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelButton: {
    flex: 1, backgroundColor: '#2A2A3E', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  cancelText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  startButton: {
    flex: 1, backgroundColor: '#6C3AED', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  startButtonDisabled: { opacity: 0.5 },
  startText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
})
