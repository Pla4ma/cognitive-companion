// ══════════════════════════════════════════════════════════════
// INTENT — Context Inbox Screen
// The main context ingestion surface
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppStore } from '../../src/store'
import type { ContextCapsule } from '../../src/types/contextCapsule'
import type { ExtractionResult, ContextCaptureInput } from '../../src/types/contextInbox'
import { extractContext, createCapsuleFromExtraction } from '../../src/services/context/contextInboxEngine'
import { ContextSensitivityBadge } from './ContextSensitivityBadge'
import { ContextToMissionFlow } from './ContextToMissionFlow'

export default function ContextInboxScreen() {
  const router = useRouter()
  const [inputText, setInputText] = useState('')
  const [capsules, setCapsules] = useState<ContextCapsule[]>([])
  const [selectedCapsule, setSelectedCapsule] = useState<ContextCapsule | null>(null)
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null)
  const [showCaptureSheet, setShowCaptureSheet] = useState(false)
  const [showMissionFlow, setShowMissionFlow] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCapture = useCallback(() => {
    if (!inputText.trim()) return

    setIsProcessing(true)
    const captureInput: ContextCaptureInput = {
      text: inputText.trim(),
      source: 'paste_text',
    }

    // Deterministic extraction (instant, no AI needed)
    const result = extractContext(captureInput)
    const capsule = createCapsuleFromExtraction(captureInput, result)

    setCapsules((prev) => [capsule, ...prev])
    setSelectedCapsule(capsule)
    setExtraction(result)
    setIsProcessing(false)
    setShowCaptureSheet(false)
    setShowMissionFlow(true)
    setInputText('')
  }, [inputText])

  const handleDeleteCapsule = (id: string) => {
    setCapsules((prev) => prev.filter((c) => c.id !== id))
    if (selectedCapsule?.id === id) {
      setSelectedCapsule(null)
      setExtraction(null)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Context Inbox</Text>
        <Pressable style={styles.addButton} onPress={() => setShowCaptureSheet(true)}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        Drop messy text. INTENT finds the tiny action.
      </Text>

      {/* Quick Capture */}
      <Pressable style={styles.quickCapture} onPress={() => setShowCaptureSheet(true)}>
        <Text style={styles.quickCaptureEmoji}>📋</Text>
        <Text style={styles.quickCaptureText}>Paste chaos, get a mission</Text>
      </Pressable>

      {/* Capsule List */}
      <ScrollView style={styles.capsuleList}>
        {capsules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={styles.emptyTitle}>No context yet</Text>
            <Text style={styles.emptyHint}>
              Paste a messy paragraph about what you need to do.{'\n'}
              INTENT will find the tiny action.
            </Text>
          </View>
        ) : (
          capsules.map((capsule) => (
            <Pressable
              key={capsule.id}
              style={styles.capsuleCard}
              onPress={() => {
                setSelectedCapsule(capsule)
                const result = extractContext({ text: capsule.rawContent, source: capsule.source })
                setExtraction(result)
                setShowMissionFlow(true)
              }}
            >
              <View style={styles.capsuleHeader}>
                <Text style={styles.capsulePreview} numberOfLines={2}>
                  {capsule.rawContent}
                </Text>
                <ContextSensitivityBadge sensitivity={capsule.sensitivity} />
              </View>
              <Text style={styles.capsuleSummary}>{capsule.summary}</Text>
              <View style={styles.capsuleMeta}>
                <Text style={styles.capsuleSource}>{capsule.source.replace(/_/g, ' ')}</Text>
                <Text style={styles.capsuleTime}>
                  {new Date(capsule.createdAt).toLocaleDateString()}
                </Text>
              </View>
              {capsule.extractedActions.length > 0 && (
                <View style={styles.actionPreview}>
                  <Text style={styles.actionLabel}>Next tiny action:</Text>
                  <Text style={styles.actionText}>{capsule.extractedActions[0]}</Text>
                </View>
              )}
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteCapsule(capsule.id)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Capture Sheet Modal */}
      <Modal visible={showCaptureSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Drop your chaos</Text>
            <Text style={styles.modalHint}>
              Paste anything — assignment, brain dump, to-do list, messy thoughts.
            </Text>
            <TextInput
              style={styles.textInput}
              multiline
              value={inputText}
              onChangeText={setInputText}
              placeholder="I need to submit my essay by Friday, clean my room, and I keep avoiding emailing my professor..."
              placeholderTextColor="#6B7280"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowCaptureSheet(false)
                  setInputText('')
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.processButton, !inputText.trim() && styles.processButtonDisabled]}
                onPress={handleCapture}
                disabled={!inputText.trim() || isProcessing}
              >
                <Text style={styles.processText}>
                  {isProcessing ? 'Processing...' : 'Extract Actions'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mission Flow Modal */}
      {selectedCapsule && extraction && (
        <ContextToMissionFlow
          visible={showMissionFlow}
          capsule={selectedCapsule}
          extraction={extraction}
          onClose={() => setShowMissionFlow(false)}
          onStartMission={(mission) => {
            setShowMissionFlow(false)
            // Navigate to live mission
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingBottom: 8,
  },
  backButton: { padding: 8 },
  backText: { fontSize: 16, color: '#6C3AED' },
  title: { fontSize: 22, fontWeight: '700', color: '#F1F1F1' },
  addButton: {
    backgroundColor: '#6C3AED', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  addButtonText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  subtitle: {
    fontSize: 15, color: '#9CA3AF', textAlign: 'center',
    paddingHorizontal: 20, marginBottom: 16,
  },
  quickCapture: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20,
    marginHorizontal: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#6C3AED33', borderStyle: 'dashed',
  },
  quickCaptureEmoji: { fontSize: 24, marginRight: 12 },
  quickCaptureText: { fontSize: 16, color: '#D1D5DB' },
  capsuleList: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#F1F1F1', marginBottom: 8 },
  emptyHint: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  capsuleCard: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 10,
  },
  capsuleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  capsulePreview: { fontSize: 14, color: '#D1D5DB', flex: 1, marginRight: 8 },
  capsuleSummary: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
  capsuleMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  capsuleSource: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  capsuleTime: { fontSize: 12, color: '#6B7280' },
  actionPreview: {
    backgroundColor: '#6C3AED11', borderRadius: 10, padding: 12, marginTop: 4,
  },
  actionLabel: { fontSize: 12, color: '#6C3AED', fontWeight: '600', marginBottom: 4 },
  actionText: { fontSize: 14, color: '#F1F1F1' },
  deleteButton: { alignSelf: 'flex-end', marginTop: 8 },
  deleteText: { fontSize: 13, color: '#EF4444' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0A0F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '80%',
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#F1F1F1', marginBottom: 8 },
  modalHint: { fontSize: 14, color: '#9CA3AF', marginBottom: 16 },
  textInput: {
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16,
    fontSize: 16, color: '#F1F1F1', minHeight: 120, textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelButton: {
    flex: 1, backgroundColor: '#2A2A3E', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  cancelText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  processButton: {
    flex: 1, backgroundColor: '#6C3AED', borderRadius: 14, padding: 16, alignItems: 'center',
  },
  processButtonDisabled: { opacity: 0.5 },
  processText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
})
