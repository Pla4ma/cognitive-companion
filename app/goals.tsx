// ══════════════════════════════════════════════════════════════
// INTENT — Missions Screen
// Mission management with resistance tracking, micro-missions, salvage
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Modal, TouchableOpacity, Alert } from 'react-native'
import { BlurView } from 'expo-blur'
import { Plus, Target, CheckCircle2, ChevronRight, X, Sparkles, Trash2, Archive, AlertTriangle, RotateCcw } from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { Mission, MicroMission, MissionStatus, AvoidanceState } from '../src/types'
import { generateMissionBreakdown } from '../src/services/ai'
import { colors, spacing, radius, typography, layout } from '../src/theme'
import { Screen, Card, Button, SectionHeader, EmptyState } from '../src/components'
import { TabBar } from '../src/components'

export default function MissionsScreen() {
  const missions = useAppStore((s) => s.missions)
  const microMissions = useAppStore((s) => s.microMissions)
  const addMission = useAppStore((s) => s.addMission)
  const completeMission = useAppStore((s) => s.completeMission)
  const abandonMission = useAppStore((s) => s.abandonMission)
  const salvageMission = useAppStore((s) => s.salvageMission)
  const deleteMission = useAppStore((s) => s.deleteMission)
  const completeMicroMission = useAppStore((s) => s.completeMicroMission)
  const user = useAppStore((s) => s.user)

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [expandedMission, setExpandedMission] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const activeMissions = missions.filter(m => m.status === 'active')
  const completedMissions = missions.filter(m => m.status === 'completed' || m.status === 'salvaged')
  const abandonedMissions = missions.filter(m => m.status === 'abandoned')

  const handleCreate = () => {
    if (!newTitle.trim()) return
    addMission(newTitle.trim(), newDesc.trim())
    setNewTitle('')
    setNewDesc('')
    setShowCreate(false)
  }

  const handleAIBreakdown = async (mission: Mission) => {
    setAiLoading(true)
    try {
      const result = await generateMissionBreakdown(mission.title, mission.description, user?.push_style ?? 'gentle')
      // Add micro-missions
      for (const micro of result.microMissions) {
        useAppStore.getState().addMicroMission(mission.id, micro.title, micro.description, micro.estimated_minutes)
      }
    } catch {
      Alert.alert('Error', 'Failed to generate breakdown')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Screen gradient={['rgba(108,58,237,0.03)', 'transparent']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Missions</Text>
          <Text style={styles.subtitle}>{activeMissions.length} active · {completedMissions.length} completed</Text>
        </View>
        <Button title="" onPress={() => setShowCreate(true)} variant="primary" size="md"
          icon={<Plus size={20} color={colors.text.inverse} />}
          style={{ width: 44, height: 44, borderRadius: 22 }} />
      </View>

      {activeMissions.length === 0 && (
        <EmptyState icon="🎯" title="No active missions"
          description="Create your first mission. Break it into tiny pieces. Start with the smallest one."
          actionLabel="Create Mission" onAction={() => setShowCreate(true)} />
      )}

      {activeMissions.map(mission => {
        const micros = microMissions.filter(mm => mm.threadId === mission.id)
        const completedMicros = micros.filter(mm => mm.status === 'completed').length
        const progress = micros.length > 0 ? completedMicros / micros.length : 0
        const isExpanded = expandedMission === mission.id

        return (
          <Card key={mission.id} variant={isExpanded ? 'glow' : 'default'} style={styles.missionCard}>
            <TouchableOpacity onPress={() => setExpandedMission(isExpanded ? null : mission.id)} activeOpacity={0.8}>
              <View style={styles.missionHeader}>
                <View style={[styles.missionIcon, { backgroundColor: (mission.color || colors.brand[500]) + '22' }]}>
                  {mission.status === 'salvaged' ? <RotateCcw size={18} color={colors.accent.orange} /> :
                   mission.status === 'completed' ? <CheckCircle2 size={18} color={colors.accent.green} /> :
                   <Target size={18} color={mission.color || colors.brand[500]} />}
                </View>
                <View style={styles.missionInfo}>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionMeta}>
                    {micros.length > 0
                      ? `${completedMicros}/${micros.length} micros · ${Math.round(progress * 100)}%`
                      : 'No micro-missions yet'}
                  </Text>
                  {mission.avoidance_state && (
                    <Text style={styles.avoidanceTag}>Avoiding: {mission.avoidance_state}</Text>
                  )}
                </View>
                <ChevronRight size={20} color={colors.text.tertiary}
                  style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
              </View>
              {micros.length > 0 && (
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: mission.color || colors.brand[500] }]} />
                </View>
              )}
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.expanded}>
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleAIBreakdown(mission)} disabled={aiLoading}>
                    <Sparkles size={14} color={colors.accent.pink} />
                    <Text style={styles.actionText}>{aiLoading ? 'Generating...' : 'AI Breakdown'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => completeMission(mission.id)}>
                    <CheckCircle2 size={14} color={colors.accent.green} />
                    <Text style={styles.actionText}>Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => salvageMission(mission.id)}>
                    <RotateCcw size={14} color={colors.accent.orange} />
                    <Text style={styles.actionText}>Salvage</Text>
                  </TouchableOpacity>
                </View>

                {micros.sort((a, b) => a.sortOrder - b.sortOrder).map(micro => (
                  <TouchableOpacity key={micro.id} style={styles.microRow}
                    onPress={() => completeMicroMission(micro.id)}>
                    <View style={[styles.microCheckbox, micro.status === 'completed' && { borderColor: colors.accent.green, backgroundColor: colors.accent.green + '15' }]}>
                      {micro.status === 'completed' && <CheckCircle2 size={14} color={colors.accent.green} />}
                    </View>
                    <View style={styles.microInfo}>
                      <Text style={[styles.microTitle, micro.status === 'completed' && { textDecorationLine: 'line-through', color: colors.text.tertiary }]}>
                        {micro.title}
                      </Text>
                      <Text style={styles.microMeta}>~{micro.estimatedMinutes} min{micro.resistanceBefore ? ` · ${micro.resistanceBefore} resistance` : ''}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {micros.length === 0 && (
                  <Text style={styles.emptyMicros}>Tap "AI Breakdown" to generate micro-missions</Text>
                )}

                <TouchableOpacity style={styles.deleteBtn} onPress={() => {
                  Alert.alert('Delete Mission', 'This will permanently delete this mission and all its micro-missions.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteMission(mission.id) },
                  ])
                }}>
                  <Trash2 size={14} color={colors.error} />
                  <Text style={{ ...typography.caption, color: colors.error }}>Delete mission</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )
      })}

      {/* Abandoned missions */}
      {abandonedMissions.length > 0 && (
        <>
          <SectionHeader title="Abandoned" subtitle={`${abandonedMissions.length} missions`} icon={<AlertTriangle size={16} color={colors.text.tertiary} />} />
          {abandonedMissions.map(mission => (
            <Card key={mission.id} variant="subtle" style={styles.abandonedCard}>
              <Text style={styles.abandonedTitle}>{mission.title}</Text>
              <View style={styles.abandonedActions}>
                <TouchableOpacity onPress={() => {/* reactivate */}}>
                  <Text style={styles.reactivateText}>Reactivate</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteMission(mission.id)}>
                  <Trash2 size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Create Modal */}
      <Modal transparent animationType="slide" visible={showCreate} onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Mission</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <X size={24} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Mission title</Text>
            <TextInput style={styles.textInput} placeholder="e.g. Launch my product"
              placeholderTextColor={colors.text.disabled} value={newTitle} onChangeText={setNewTitle} autoFocus />
            <Text style={styles.inputLabel}>Description (optional)</Text>
            <TextInput style={[styles.textInput, styles.textArea]} placeholder="What does success look like?"
              placeholderTextColor={colors.text.disabled} value={newDesc} onChangeText={setNewDesc} multiline numberOfLines={3} />
            <Button title="Create Mission" onPress={handleCreate} variant="gradient" size="lg"
              disabled={!newTitle.trim()} style={{ width: '100%' }} />
          </BlurView>
        </View>
      </Modal>

      <View style={{ height: layout.tabBarHeight + spacing.lg }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  title: { ...typography.headline, color: colors.text.primary },
  subtitle: { ...typography.bodyMedium, color: colors.text.tertiary, marginTop: 2 },
  missionCard: { padding: spacing.md, marginBottom: spacing.sm },
  missionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  missionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  missionInfo: { flex: 1, marginLeft: spacing.sm },
  missionTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  missionMeta: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
  avoidanceTag: { ...typography.caption, color: colors.accent.orange, marginTop: 2 },
  progressTrack: { height: 4, backgroundColor: colors.border.subtle, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  expanded: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle },
  actions: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: colors.bg.surface },
  actionText: { ...typography.caption, color: colors.text.secondary },
  microRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  microCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border.default, justifyContent: 'center', alignItems: 'center' },
  microInfo: { flex: 1 },
  microTitle: { ...typography.bodyMedium, color: colors.text.primary },
  microMeta: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
  emptyMicros: { ...typography.bodySmall, color: colors.text.disabled, textAlign: 'center', paddingVertical: spacing.md },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, paddingVertical: spacing.xs },
  abandonedCard: { padding: spacing.md, marginBottom: spacing.sm, opacity: 0.6 },
  abandonedTitle: { ...typography.bodyMedium, color: colors.text.tertiary },
  abandonedActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  reactivateText: { ...typography.bodySmall, color: colors.brand[400] },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContainer: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.lg, paddingBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border.subtle },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, color: colors.text.primary },
  inputLabel: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.xs },
  textInput: { backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing.md, color: colors.text.primary, ...typography.body, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.subtle },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
})
