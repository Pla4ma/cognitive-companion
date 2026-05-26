     1|// ══════════════════════════════════════════════════════════════
     2|// INTENT — Missions Screen
     3|// Mission management with resistance tracking, micro-missions, salvage
     4|// ══════════════════════════════════════════════════════════════
     5|
     6|import React, { useState } from 'react'
     7|import { View, Text, StyleSheet, ScrollView, TextInput, Modal, TouchableOpacity, Alert } from 'react-native'
     8|import { BlurView } from 'expo-blur'
     9|import { Plus, Target, CheckCircle2, ChevronRight, X, Sparkles, Trash2, Archive, AlertTriangle, RotateCcw } from 'lucide-react-native'
    10|import { useAppStore } from '../../src/store'
    11|import { Mission, MicroMission, MissionStatus, AvoidanceState } from '../../src/types'
    12|import { generateMissionBreakdown } from '../../src/services/ai'
    13|import { colors, spacing, radius, typography, layout } from '../../src/theme'
    14|import { Screen, Card, Button, SectionHeader, EmptyState } from '../../src/components'
    15|
    16|export default function MissionsScreen() {
    17|  const missions = useAppStore((s) => s.missions)
    18|  const microMissions = useAppStore((s) => s.microMissions)
    19|  const addMission = useAppStore((s) => s.addMission)
    20|  const completeMission = useAppStore((s) => s.completeMission)
    21|  const abandonMission = useAppStore((s) => s.abandonMission)
    22|  const salvageMission = useAppStore((s) => s.salvageMission)
    23|  const deleteMission = useAppStore((s) => s.deleteMission)
    24|  const completeMicroMission = useAppStore((s) => s.completeMicroMission)
    25|  const user = useAppStore((s) => s.user)
    26|
    27|  const [showCreate, setShowCreate] = useState(false)
    28|  const [newTitle, setNewTitle] = useState('')
    29|  const [newDesc, setNewDesc] = useState('')
    30|  const [expandedMission, setExpandedMission] = useState<string | null>(null)
    31|  const [aiLoading, setAiLoading] = useState(false)
    32|
    33|  const activeMissions = missions.filter(m => m.status === 'active')
    34|  const completedMissions = missions.filter(m => m.status === 'completed' || m.status === 'salvaged')
    35|  const abandonedMissions = missions.filter(m => m.status === 'abandoned')
    36|
    37|  const handleCreate = () => {
    38|    if (!newTitle.trim()) return
    39|    addMission(newTitle.trim(), newDesc.trim())
    40|    setNewTitle('')
    41|    setNewDesc('')
    42|    setShowCreate(false)
    43|  }
    44|
    45|  const handleAIBreakdown = async (mission: Mission) => {
    46|    setAiLoading(true)
    47|    try {
    48|      const result = await generateMissionBreakdown(mission.title, mission.description, user?.push_style ?? 'gentle')
    49|      // Add micro-missions
    50|      for (const micro of result.microMissions) {
    51|        useAppStore.getState().addMicroMission(mission.id, micro.title, micro.description, micro.estimated_minutes)
    52|      }
    53|    } catch {
    54|      Alert.alert('Error', 'Failed to generate breakdown')
    55|    } finally {
    56|      setAiLoading(false)
    57|    }
    58|  }
    59|
    60|  return (
    61|    <Screen gradient={['rgba(108,58,237,0.03)', 'transparent']}>
    62|      <View style={styles.header}>
    63|        <View>
    64|          <Text style={styles.title}>Missions</Text>
    65|          <Text style={styles.subtitle}>{activeMissions.length} active · {completedMissions.length} completed</Text>
    66|        </View>
    67|        <Button title="" onPress={() => setShowCreate(true)} variant="primary" size="md"
    68|          icon={<Plus size={20} color={colors.text.inverse} />}
    69|          style={{ width: 44, height: 44, borderRadius: 22 }} />
    70|      </View>
    71|
    72|      {activeMissions.length === 0 && (
    73|        <EmptyState icon="🎯" title="No active missions"
    74|          description="Create your first mission. Break it into tiny pieces. Start with the smallest one."
    75|          actionLabel="Create Mission" onAction={() => setShowCreate(true)} />
    76|      )}
    77|
    78|      {activeMissions.map(mission => {
    79|        const micros = microMissions.filter(mm => mm.threadId === mission.id)
    80|        const completedMicros = micros.filter(mm => mm.status === 'completed').length
    81|        const progress = micros.length > 0 ? completedMicros / micros.length : 0
    82|        const isExpanded = expandedMission === mission.id
    83|
    84|        return (
    85|          <Card key={mission.id} variant={isExpanded ? 'glow' : 'default'} style={styles.missionCard}>
    86|            <TouchableOpacity onPress={() => setExpandedMission(isExpanded ? null : mission.id)} activeOpacity={0.8}>
    87|              <View style={styles.missionHeader}>
    88|                <View style={[styles.missionIcon, { backgroundColor: (mission.color || colors.brand[500]) + '22' }]}>
    89|                  {mission.status === 'salvaged' ? <RotateCcw size={18} color={colors.accent.orange} /> :
    90|                   mission.status === 'completed' ? <CheckCircle2 size={18} color={colors.accent.green} /> :
    91|                   <Target size={18} color={mission.color || colors.brand[500]} />}
    92|                </View>
    93|                <View style={styles.missionInfo}>
    94|                  <Text style={styles.missionTitle}>{mission.title}</Text>
    95|                  <Text style={styles.missionMeta}>
    96|                    {micros.length > 0
    97|                      ? `${completedMicros}/${micros.length} micros · ${Math.round(progress * 100)}%`
    98|                      : 'No micro-missions yet'}
    99|                  </Text>
   100|                  {mission.avoidance_state && (
   101|                    <Text style={styles.avoidanceTag}>Avoiding: {mission.avoidance_state}</Text>
   102|                  )}
   103|                </View>
   104|                <ChevronRight size={20} color={colors.text.tertiary}
   105|                  style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} />
   106|              </View>
   107|              {micros.length > 0 && (
   108|                <View style={styles.progressTrack}>
   109|                  <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: mission.color || colors.brand[500] }]} />
   110|                </View>
   111|              )}
   112|            </TouchableOpacity>
   113|
   114|            {isExpanded && (
   115|              <View style={styles.expanded}>
   116|                <View style={styles.actions}>
   117|                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleAIBreakdown(mission)} disabled={aiLoading}>
   118|                    <Sparkles size={14} color={colors.accent.pink} />
   119|                    <Text style={styles.actionText}>{aiLoading ? 'Generating...' : 'AI Breakdown'}</Text>
   120|                  </TouchableOpacity>
   121|                  <TouchableOpacity style={styles.actionBtn} onPress={() => completeMission(mission.id)}>
   122|                    <CheckCircle2 size={14} color={colors.accent.green} />
   123|                    <Text style={styles.actionText}>Complete</Text>
   124|                  </TouchableOpacity>
   125|                  <TouchableOpacity style={styles.actionBtn} onPress={() => salvageMission(mission.id)}>
   126|                    <RotateCcw size={14} color={colors.accent.orange} />
   127|                    <Text style={styles.actionText}>Salvage</Text>
   128|                  </TouchableOpacity>
   129|                </View>
   130|
   131|                {micros.sort((a, b) => a.sortOrder - b.sortOrder).map(micro => (
   132|                  <TouchableOpacity key={micro.id} style={styles.microRow}
   133|                    onPress={() => completeMicroMission(micro.id)}>
   134|                    <View style={[styles.microCheckbox, micro.status === 'completed' && { borderColor: colors.accent.green, backgroundColor: colors.accent.green + '15' }]}>
   135|                      {micro.status === 'completed' && <CheckCircle2 size={14} color={colors.accent.green} />}
   136|                    </View>
   137|                    <View style={styles.microInfo}>
   138|                      <Text style={[styles.microTitle, micro.status === 'completed' && { textDecorationLine: 'line-through', color: colors.text.tertiary }]}>
   139|                        {micro.title}
   140|                      </Text>
   141|                      <Text style={styles.microMeta}>~{micro.estimatedMinutes} min{micro.resistanceBefore ? ` · ${micro.resistanceBefore} resistance` : ''}</Text>
   142|                    </View>
   143|                  </TouchableOpacity>
   144|                ))}
   145|
   146|                {micros.length === 0 && (
   147|                  <Text style={styles.emptyMicros}>Tap "AI Breakdown" to generate micro-missions</Text>
   148|                )}
   149|
   150|                <TouchableOpacity style={styles.deleteBtn} onPress={() => {
   151|                  Alert.alert('Delete Mission', 'This will permanently delete this mission and all its micro-missions.', [
   152|                    { text: 'Cancel', style: 'cancel' },
   153|                    { text: 'Delete', style: 'destructive', onPress: () => deleteMission(mission.id) },
   154|                  ])
   155|                }}>
   156|                  <Trash2 size={14} color={colors.error} />
   157|                  <Text style={{ ...typography.caption, color: colors.error }}>Delete mission</Text>
   158|                </TouchableOpacity>
   159|              </View>
   160|            )}
   161|          </Card>
   162|        )
   163|      })}
   164|
   165|      {/* Abandoned missions */}
   166|      {abandonedMissions.length > 0 && (
   167|        <>
   168|          <SectionHeader title="Abandoned" subtitle={`${abandonedMissions.length} missions`} icon={<AlertTriangle size={16} color={colors.text.tertiary} />} />
   169|          {abandonedMissions.map(mission => (
   170|            <Card key={mission.id} variant="subtle" style={styles.abandonedCard}>
   171|              <Text style={styles.abandonedTitle}>{mission.title}</Text>
   172|              <View style={styles.abandonedActions}>
   173|                <TouchableOpacity onPress={() => {/* reactivate */}}>
   174|                  <Text style={styles.reactivateText}>Reactivate</Text>
   175|                </TouchableOpacity>
   176|                <TouchableOpacity onPress={() => deleteMission(mission.id)}>
   177|                  <Trash2 size={14} color={colors.error} />
   178|                </TouchableOpacity>
   179|              </View>
   180|            </Card>
   181|          ))}
   182|        </>
   183|      )}
   184|
   185|      {/* Create Modal */}
   186|      <Modal transparent animationType="slide" visible={showCreate} onRequestClose={() => setShowCreate(false)}>
   187|        <View style={styles.modalOverlay}>
   188|          <BlurView intensity={40} style={styles.modalContainer}>
   189|            <View style={styles.modalHeader}>
   190|              <Text style={styles.modalTitle}>New Mission</Text>
   191|              <TouchableOpacity onPress={() => setShowCreate(false)}>
   192|                <X size={24} color={colors.text.tertiary} />
   193|              </TouchableOpacity>
   194|            </View>
   195|            <Text style={styles.inputLabel}>Mission title</Text>
   196|            <TextInput style={styles.textInput} placeholder="e.g. Launch my product"
   197|              placeholderTextColor={colors.text.disabled} value={newTitle} onChangeText={setNewTitle} autoFocus />
   198|            <Text style={styles.inputLabel}>Description (optional)</Text>
   199|            <TextInput style={[styles.textInput, styles.textArea]} placeholder="What does success look like?"
   200|              placeholderTextColor={colors.text.disabled} value={newDesc} onChangeText={setNewDesc} multiline numberOfLines={3} />
   201|            <Button title="Create Mission" onPress={handleCreate} variant="gradient" size="lg"
   202|              disabled={!newTitle.trim()} style={{ width: '100%' }} />
   203|          </BlurView>
   204|        </View>
   205|      </Modal>
   206|
   207|      <View style={{ height: layout.tabBarHeight + spacing.lg }} />
   208|    </Screen>
   209|  )
   210|}
   211|
   212|const styles = StyleSheet.create({
   213|  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
   214|  title: { ...typography.headline, color: colors.text.primary },
   215|  subtitle: { ...typography.bodyMedium, color: colors.text.tertiary, marginTop: 2 },
   216|  missionCard: { padding: spacing.md, marginBottom: spacing.sm },
   217|  missionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
   218|  missionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
   219|  missionInfo: { flex: 1, marginLeft: spacing.sm },
   220|  missionTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
   221|  missionMeta: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
   222|  avoidanceTag: { ...typography.caption, color: colors.accent.orange, marginTop: 2 },
   223|  progressTrack: { height: 4, backgroundColor: colors.border.subtle, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' },
   224|  progressFill: { height: '100%', borderRadius: 2 },
   225|  expanded: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border.subtle },
   226|  actions: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md, flexWrap: 'wrap' },
   227|  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: colors.bg.surface },
   228|  actionText: { ...typography.caption, color: colors.text.secondary },
   229|  microRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
   230|  microCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border.default, justifyContent: 'center', alignItems: 'center' },
   231|  microInfo: { flex: 1 },
   232|  microTitle: { ...typography.bodyMedium, color: colors.text.primary },
   233|  microMeta: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },
   234|  emptyMicros: { ...typography.bodySmall, color: colors.text.disabled, textAlign: 'center', paddingVertical: spacing.md },
   235|  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, paddingVertical: spacing.xs },
   236|  abandonedCard: { padding: spacing.md, marginBottom: spacing.sm, opacity: 0.6 },
   237|  abandonedTitle: { ...typography.bodyMedium, color: colors.text.tertiary },
   238|  abandonedActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
   239|  reactivateText: { ...typography.bodySmall, color: colors.brand[400] },
   240|  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
   241|  modalContainer: { borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.lg, paddingBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border.subtle },
   242|  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
   243|  modalTitle: { ...typography.h2, color: colors.text.primary },
   244|  inputLabel: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.xs },
   245|  textInput: { backgroundColor: colors.bg.surface, borderRadius: radius.lg, padding: spacing.md, color: colors.text.primary, ...typography.body, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border.subtle },
   246|  textArea: { minHeight: 80, textAlignVertical: 'top' },
   247|})
   248|