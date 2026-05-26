// ══════════════════════════════════════════════════════════════
// INTENT — Memory Controls v4 (Phase 16)
// View, edit, delete what INTENT learned about you
// Sections: What INTENT learned, What helps you, What blocks you,
// Best rescue patterns, Distraction patterns, Comeback patterns
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  Brain, Trash2, Edit3, Eye, EyeOff, ChevronRight,
  Zap, Shield, AlertTriangle, CheckCircle2, X,
} from 'lucide-react-native'
import { colors, spacing, radius, typography } from '../src/theme'
import { Screen, Card } from '../src/components'
import type { MemoryItem, MemoryControls } from '../src/types/memory'

// ── Mock Data (replace with real store data) ────────────────

const MOCK_MEMORY_ITEMS: MemoryItem[] = [
  {
    id: 'mem_1', type: 'blocker', title: 'Perfectionism blocks writing tasks',
    summary: 'You often feel stuck when starting writing tasks. The Ugly First Move protocol works best.',
    source: 'drift_graph', confidence: 'reliable', sensitivity: 'normal',
    storageLocation: 'local_only', userVisible: true, userEditable: true,
    createdAt: '2025-01-15T10:00:00Z', updatedAt: '2025-01-20T10:00:00Z',
    expiresAt: null, retentionPolicy: 'keep_until_deleted',
    relatedIds: [], rawEvidenceIds: [], deletedAt: null,
  },
  {
    id: 'mem_2', type: 'successful_protocol', title: 'Two-Minute Ignition works when avoiding',
    summary: 'When avoiding, 2-minute missions have a 78% completion rate.',
    source: 'mission', confidence: 'strong', sensitivity: 'normal',
    storageLocation: 'local_only', userVisible: true, userEditable: true,
    createdAt: '2025-01-10T10:00:00Z', updatedAt: '2025-01-22T10:00:00Z',
    expiresAt: null, retentionPolicy: 'keep_until_deleted',
    relatedIds: [], rawEvidenceIds: [], deletedAt: null,
  },
  {
    id: 'mem_3', type: 'energy_pattern', title: 'Low energy after 3pm',
    summary: 'Your completion rate drops significantly after 3pm. Maintenance Spark works better.',
    source: 'drift_graph', confidence: 'emerging', sensitivity: 'normal',
    storageLocation: 'local_only', userVisible: true, userEditable: true,
    createdAt: '2025-01-18T10:00:00Z', updatedAt: '2025-01-21T10:00:00Z',
    expiresAt: null, retentionPolicy: 'keep_until_deleted',
    relatedIds: [], rawEvidenceIds: [], deletedAt: null,
  },
  {
    id: 'mem_4', type: 'comeback_pattern', title: 'Comeback Seed → 2-min timer works',
    summary: 'Your best recovery pattern is Comeback Seed followed by a 2-minute timer with body double.',
    source: 'mission', confidence: 'reliable', sensitivity: 'normal',
    storageLocation: 'local_only', userVisible: true, userEditable: true,
    createdAt: '2025-01-12T10:00:00Z', updatedAt: '2025-01-19T10:00:00Z',
    expiresAt: null, retentionPolicy: 'keep_until_deleted',
    relatedIds: [], rawEvidenceIds: [], deletedAt: null,
  },
  {
    id: 'mem_5', type: 'distraction_pattern', title: 'Phone distractions during study',
    summary: 'Most distractions during study sessions are phone-related. Lock The Door helps.',
    source: 'moment', confidence: 'reliable', sensitivity: 'normal',
    storageLocation: 'local_only', userVisible: true, userEditable: true,
    createdAt: '2025-01-08T10:00:00Z', updatedAt: '2025-01-20T10:00:00Z',
    expiresAt: null, retentionPolicy: 'keep_until_deleted',
    relatedIds: [], rawEvidenceIds: [], deletedAt: null,
  },
]

type MemorySection = 'all' | 'blockers' | 'protocols' | 'patterns' | 'distractions' | 'comebacks'

export default function MemoryScreen() {
  const router = useRouter()
  const [memoryItems, setMemoryItems] = useState<MemoryItem[]>(MOCK_MEMORY_ITEMS)
  const [activeSection, setActiveSection] = useState<MemorySection>('all')
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [aiUseEnabled, setAiUseEnabled] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const handleDeleteItem = useCallback((id: string) => {
    Alert.alert('Delete Memory', 'Remove this learned pattern?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setMemoryItems(prev => prev.filter(item => item.id !== id)),
      },
    ])
  }, [])

  const handleDeleteAll = useCallback(() => {
    Alert.alert(
      'Delete All Memory',
      'This will erase everything INTENT learned about your patterns. You\'ll start fresh.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete All', style: 'destructive', onPress: () => setMemoryItems([]) },
      ]
    )
  }, [])

  const handleMarkWrong = useCallback((id: string) => {
    Alert.alert('Mark as Wrong', 'INTENT will ignore this pattern and learn from new data.')
  }, [])

  const handleMarkSensitive = useCallback((id: string) => {
    Alert.alert('Mark as Sensitive', 'This memory will be kept local and never used for AI.')
  }, [])

  const handleStartEdit = useCallback((item: MemoryItem) => {
    setEditingId(item.id)
    setEditText(item.summary)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!editingId) return
    setMemoryItems(prev =>
      prev.map(item =>
        item.id === editingId ? { ...item, summary: editText, updatedAt: new Date().toISOString() } : item
      )
    )
    setEditingId(null)
    setEditText('')
  }, [editingId, editText])

  const filteredItems = activeSection === 'all'
    ? memoryItems
    : memoryItems.filter(item => {
        switch (activeSection) {
          case 'blockers': return item.type === 'blocker'
          case 'protocols': return item.type === 'successful_protocol' || item.type === 'failed_protocol'
          case 'patterns': return item.type === 'energy_pattern' || item.type === 'time_pattern' || item.type === 'context_pattern'
          case 'distractions': return item.type === 'distraction_pattern'
          case 'comebacks': return item.type === 'comeback_pattern'
          default: return true
        }
      })

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'strong': return colors.accent.green
      case 'reliable': return colors.brand[400]
      case 'emerging': return colors.accent.orange
      case 'low': return colors.text.tertiary
      default: return colors.text.tertiary
    }
  }

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case 'strong': return 'Strong (20+ events)'
      case 'reliable': return 'Reliable (8-20 events)'
      case 'emerging': return 'Emerging (3-7 events)'
      case 'low': return 'Early (<3 events)'
      default: return confidence
    }
  }

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'blocker': return '🚧'
      case 'successful_protocol': return '✅'
      case 'failed_protocol': return '❌'
      case 'energy_pattern': return '⚡'
      case 'time_pattern': return '🕐'
      case 'context_pattern': return '📋'
      case 'distraction_pattern': return '📱'
      case 'comeback_pattern': return '🔄'
      case 'push_style_preference': return '🎨'
      case 'user_rule': return '📝'
      case 'user_note': return '💭'
      default: return '💡'
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory</Text>
        <TouchableOpacity onPress={handleDeleteAll}>
          <Trash2 size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Intro */}
        <Card variant="glow" style={styles.introCard}>
          <Brain size={24} color={colors.brand[400]} style={{ marginBottom: spacing.sm }} />
          <Text style={styles.introTitle}>What INTENT Learned</Text>
          <Text style={styles.introSub}>
            INTENT remembers patterns to help you start faster. You can inspect, edit, or delete anything.
          </Text>
        </Card>

        {/* Memory Controls */}
        <View style={styles.controlsSection}>
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlLabel}>Memory</Text>
              <Text style={styles.controlDesc}>Let INTENT learn your patterns</Text>
            </View>
            <Switch value={memoryEnabled} onValueChange={setMemoryEnabled}
              trackColor={{ false: colors.border.subtle, true: colors.brand[400] }} />
          </View>
          <View style={styles.controlRow}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlLabel}>AI Use of Memory</Text>
              <Text style={styles.controlDesc}>AI can use memory for better missions</Text>
            </View>
            <Switch value={aiUseEnabled} onValueChange={setAiUseEnabled}
              trackColor={{ false: colors.border.subtle, true: colors.brand[400] }} />
          </View>
        </View>

        {/* Section Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filterRow}>
            {([
              { id: 'all', label: 'All' },
              { id: 'blockers', label: 'Blockers' },
              { id: 'protocols', label: 'Protocols' },
              { id: 'patterns', label: 'Patterns' },
              { id: 'distractions', label: 'Distractions' },
              { id: 'comebacks', label: 'Comebacks' },
            ] as const).map(section => (
              <TouchableOpacity
                key={section.id}
                style={[styles.filterChip, activeSection === section.id && styles.filterChipActive]}
                onPress={() => setActiveSection(section.id)}
              >
                <Text style={[styles.filterText, activeSection === section.id && styles.filterTextActive]}>
                  {section.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Memory Items */}
        {filteredItems.length === 0 ? (
          <Card variant="subtle" style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {memoryEnabled
                ? 'No memories yet. Complete a few missions to start learning.'
                : 'Memory is disabled. Turn it on to let INTENT learn your patterns.'}
            </Text>
          </Card>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} variant="subtle" style={styles.memoryCard}>
              <View style={styles.memoryHeader}>
                <Text style={styles.memoryIcon}>{getSectionIcon(item.type)}</Text>
                <View style={styles.memoryInfo}>
                  <Text style={styles.memoryTitle}>{item.title}</Text>
                  <View style={styles.memoryMeta}>
                    <View style={[styles.confidenceDot, { backgroundColor: getConfidenceColor(item.confidence) }]} />
                    <Text style={styles.confidenceText}>{getConfidenceLabel(item.confidence)}</Text>
                    <Text style={styles.sourceText}>• {item.source}</Text>
                  </View>
                </View>
              </View>

              {editingId === item.id ? (
                <View style={styles.editBox}>
                  <Text style={styles.editLabel}>Edit summary:</Text>
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                      <CheckCircle2 size={16} color={colors.accent.green} />
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
                      <X size={16} color={colors.text.tertiary} />
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.memorySummary}>{item.summary}</Text>
              )}

              <View style={styles.memoryActions}>
                {item.userEditable && editingId !== item.id && (
                  <TouchableOpacity style={styles.memoryAction} onPress={() => handleStartEdit(item)}>
                    <Edit3 size={14} color={colors.text.tertiary} />
                    <Text style={styles.memoryActionText}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.memoryAction} onPress={() => handleMarkWrong(item.id)}>
                  <AlertTriangle size={14} color={colors.accent.orange} />
                  <Text style={styles.memoryActionText}>Wrong</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.memoryAction} onPress={() => handleMarkSensitive(item.id)}>
                  <EyeOff size={14} color={colors.brand[400]} />
                  <Text style={styles.memoryActionText}>Sensitive</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.memoryAction} onPress={() => handleDeleteItem(item.id)}>
                  <Trash2 size={14} color={colors.error} />
                  <Text style={[styles.memoryActionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        {/* Principles */}
        <Card variant="subtle" style={styles.principlesCard}>
          <Text style={styles.principlesTitle}>Memory Principles</Text>
          <View style={styles.principlesList}>
            <Text style={styles.principle}>1. Never silently store sensitive memories forever</Text>
            <Text style={styles.principle}>2. Never send restricted memories to remote AI</Text>
            <Text style={styles.principle}>3. Never use memory to shame you</Text>
            <Text style={styles.principle}>4. Never infer medical conditions</Text>
            <Text style={styles.principle}>5. Always let you inspect what was learned</Text>
            <Text style={styles.principle}>6. Always allow deletion</Text>
            <Text style={styles.principle}>7. Always allow local-only mode</Text>
          </View>
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  backText: { ...typography.bodySmall, color: colors.brand[400] },
  headerTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  content: { padding: spacing.lg },

  // Intro
  introCard: { padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  introTitle: { ...typography.h2, color: colors.text.primary, fontSize: 20, marginBottom: spacing.xs },
  introSub: { ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },

  // Controls
  controlsSection: { marginBottom: spacing.lg },
  controlRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  controlInfo: { flex: 1 },
  controlLabel: { ...typography.bodyMedium, color: colors.text.primary },
  controlDesc: { ...typography.caption, color: colors.text.tertiary },

  // Filter
  filterScroll: { maxHeight: 40, marginBottom: spacing.lg },
  filterRow: { flexDirection: 'row', gap: spacing.xs },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full, backgroundColor: colors.bg.surface,
  },
  filterChipActive: { backgroundColor: colors.brand[400] + '15', borderWidth: 1, borderColor: colors.brand[400] + '30' },
  filterText: { ...typography.caption, color: colors.text.tertiary },
  filterTextActive: { color: colors.brand[400], fontWeight: '600' },

  // Memory Items
  emptyCard: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.bodyMedium, color: colors.text.tertiary, textAlign: 'center' },
  memoryCard: { padding: spacing.md, marginBottom: spacing.sm },
  memoryHeader: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  memoryIcon: { fontSize: 20 },
  memoryInfo: { flex: 1 },
  memoryTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  memoryMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  confidenceDot: { width: 6, height: 6, borderRadius: 3 },
  confidenceText: { ...typography.caption, color: colors.text.tertiary },
  sourceText: { ...typography.caption, color: colors.text.tertiary },
  memorySummary: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 18, marginBottom: spacing.sm },

  // Edit
  editBox: { marginBottom: spacing.sm },
  editLabel: { ...typography.labelSmall, color: colors.text.tertiary, marginBottom: spacing.xs },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveText: { ...typography.bodySmall, color: colors.accent.green },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cancelText: { ...typography.bodySmall, color: colors.text.tertiary },

  // Actions
  memoryActions: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border.subtle },
  memoryAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  memoryActionText: { ...typography.caption, color: colors.text.tertiary },

  // Principles
  principlesCard: { padding: spacing.md, marginTop: spacing.lg },
  principlesTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600', marginBottom: spacing.sm },
  principlesList: { gap: spacing.xs },
  principle: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 18 },
})
