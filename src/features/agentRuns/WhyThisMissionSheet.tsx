// ══════════════════════════════════════════════════════════════
// INTENT — Why This Mission Sheet
// Shows users why INTENT chose this specific mission
// ══════════════════════════════════════════════════════════════

import React from 'react'
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native'
import type { AgentRun, AgentRunStepDetail } from '../../src/types/agentRun'
import { STEP_LABELS } from '../../src/types/agentRun'

interface WhyThisMissionSheetProps {
  visible: boolean
  run: AgentRun | null
  onClose: () => void
}

export function WhyThisMissionSheet({ visible, run, onClose }: WhyThisMissionSheetProps) {
  if (!run) return null

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView>
            {/* Header */}
            <Text style={styles.title}>Why this mission?</Text>
            <Text style={styles.explanation}>{run.userVisibleExplanation}</Text>

            {/* Confidence */}
            <View style={styles.confidenceRow}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[styles.confidenceFill, { width: `${run.confidence * 100}%` }]}
                />
              </View>
              <Text style={styles.confidenceValue}>{Math.round(run.confidence * 100)}%</Text>
            </View>

            {/* Steps */}
            <Text style={styles.sectionTitle}>Agent Steps</Text>
            {run.steps.map((step) => (
              <StepRow key={step.step} step={step} />
            ))}

            {/* Protocol */}
            {run.selectedProtocol && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Protocol</Text>
                <Text style={styles.infoValue}>{run.selectedProtocol}</Text>
              </View>
            )}

            {/* Rejected Options */}
            {run.rejectedOptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rejected Options</Text>
                {run.rejectedOptions.map((opt, i) => (
                  <Text key={i} style={styles.rejectedItem}>• {opt}</Text>
                ))}
              </View>
            )}

            {/* Privacy */}
            <View style={styles.privacyCard}>
              <Text style={styles.privacyEmoji}>
                {run.privacyClassification === 'local_only' ? '🔒' : '☁️'}
              </Text>
              <Text style={styles.privacyText}>
                {run.privacyClassification === 'local_only'
                  ? 'All processing stayed on your device'
                  : 'Some processing used remote AI'}
              </Text>
            </View>

            {/* AI Usage */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Remote AI</Text>
              <Text style={styles.infoValue}>{run.usedRemoteAI ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Local Fallback</Text>
              <Text style={styles.infoValue}>{run.usedLocalFallback ? 'Yes' : 'No'}</Text>
            </View>

            {/* Latency */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Time</Text>
              <Text style={styles.infoValue}>
                {run.latencyMs ? `${run.latencyMs}ms` : 'N/A'}
              </Text>
            </View>

            {/* Errors */}
            {run.errors.length > 0 && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Errors</Text>
                {run.errors.map((err, i) => (
                  <Text key={i} style={styles.errorText}>• {err}</Text>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Close */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function StepRow({ step }: { step: AgentRunStepDetail }) {
  const statusEmoji = {
    pending: '⏳',
    running: '⚡',
    completed: '✅',
    skipped: '⏭️',
    failed: '❌',
  }[step.status]

  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepEmoji}>{statusEmoji}</Text>
      <View style={styles.stepContent}>
        <Text style={styles.stepName}>{STEP_LABELS[step.step]}</Text>
        {step.reason && <Text style={styles.stepReason}>{step.reason}</Text>}
        {step.durationMs !== null && (
          <Text style={styles.stepDuration}>{step.durationMs}ms</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0A0A0F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '85%',
  },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F1F1', marginBottom: 12 },
  explanation: { fontSize: 15, color: '#D1D5DB', lineHeight: 22, marginBottom: 20 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  confidenceLabel: { fontSize: 14, color: '#9CA3AF', width: 80 },
  confidenceBar: {
    flex: 1, height: 8, backgroundColor: '#2A2A3E', borderRadius: 4, marginHorizontal: 12,
  },
  confidenceFill: { height: '100%', backgroundColor: '#6C3AED', borderRadius: 4 },
  confidenceValue: { fontSize: 14, color: '#F1F1F1', fontWeight: '600', width: 40, textAlign: 'right' },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  section: { marginBottom: 20 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  stepEmoji: { fontSize: 16, marginRight: 10, marginTop: 2 },
  stepContent: { flex: 1 },
  stepName: { fontSize: 15, color: '#F1F1F1', fontWeight: '500' },
  stepReason: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  stepDuration: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
  },
  infoLabel: { fontSize: 14, color: '#9CA3AF' },
  infoValue: { fontSize: 14, color: '#F1F1F1', fontWeight: '500' },
  rejectedItem: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  privacyCard: {
    backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginVertical: 16,
  },
  privacyEmoji: { fontSize: 20, marginRight: 12 },
  privacyText: { fontSize: 14, color: '#D1D5DB', flex: 1 },
  errorCard: { backgroundColor: '#2A1A1A', borderRadius: 12, padding: 14, marginTop: 12 },
  errorTitle: { fontSize: 14, color: '#EF4444', fontWeight: '600', marginBottom: 8 },
  errorText: { fontSize: 13, color: '#F87171', marginBottom: 4 },
  closeButton: {
    backgroundColor: '#6C3AED', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16,
  },
  closeText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
})
