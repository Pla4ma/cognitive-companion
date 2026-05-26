// ══════════════════════════════════════════════════════════════
// INTENT — Danger Window Editor
// Editor for creating/editing danger windows
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'

const DAYS = [
  { key: 0, label: 'Sun' },
  { key: 1, label: 'Mon' },
  { key: 2, label: 'Tue' },
  { key: 3, label: 'Wed' },
  { key: 4, label: 'Thu' },
  { key: 5, label: 'Fri' },
  { key: 6, label: 'Sat' },
]

const STATES = [
  'overwhelmed',
  'stuck',
  'tired',
  'anxious',
  'perfectionism',
  'doomscroll_risk',
  'low_energy',
  'procrastinating',
]

const PROTOCOLS = [
  'shrink_the_beast',
  'body_double',
  'maintenance_spark',
  'pressure_valve',
  'ugly_first_move',
  'before_scroll',
  'deep_work_sprint',
]

const DURATIONS = [2, 5, 10, 15, 25]

export function DangerWindowEditor(): React.JSX.Element {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const existing = route.params?.window

  const [label, setLabel] = useState(existing?.label ?? '')
  const [startHour, setStartHour] = useState(existing?.startHour ?? 20)
  const [endHour, setEndHour] = useState(existing?.endHour ?? 22)
  const [selectedDays, setSelectedDays] = useState<Set<number>>(
    new Set(existing?.daysOfWeek ?? [1, 2, 3, 4, 5])
  )
  const [usualState, setUsualState] = useState(existing?.usualState ?? 'overwhelmed')
  const [preferredProtocol, setPreferredProtocol] = useState(
    existing?.preferredProtocol ?? 'shrink_the_beast'
  )
  const [preferredDuration, setPreferredDuration] = useState(existing?.preferredDuration ?? 5)
  const [enabled, setEnabled] = useState(existing?.enabled ?? true)

  const toggleDay = (d: number) => {
    const next = new Set(selectedDays)
    if (next.has(d)) next.delete(d)
    else next.add(d)
    setSelectedDays(next)
  }

  const handleSave = () => {
    // Save to store
    navigation.goBack()
  }

  const handleDelete = () => {
    navigation.goBack()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existing ? 'Edit Danger Window' : 'New Danger Window'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Label */}
        <Text style={styles.fieldLabel}>Label</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Evening drift, Post-work scroll"
          placeholderTextColor="#555"
          value={label}
          onChangeText={setLabel}
        />

        {/* Time Range */}
        <Text style={styles.fieldLabel}>Time Range</Text>
        <View style={styles.timeRow}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeSmall}>Start</Text>
            <Text style={styles.timeValue}>{startHour}:00</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setStartHour((startHour + 23) % 24)}
              >
                <Text style={styles.timeBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setStartHour((startHour + 1) % 24)}
              >
                <Text style={styles.timeBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.timeArrow}>→</Text>
          <View style={styles.timeBlock}>
            <Text style={styles.timeSmall}>End</Text>
            <Text style={styles.timeValue}>{endHour}:00</Text>
            <View style={styles.timeButtons}>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setEndHour((endHour + 23) % 24)}
              >
                <Text style={styles.timeBtnText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setEndHour((endHour + 1) % 24)}
              >
                <Text style={styles.timeBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Days */}
        <Text style={styles.fieldLabel}>Days of Week</Text>
        <View style={styles.daysRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d.key}
              style={[styles.dayChip, selectedDays.has(d.key) && styles.dayChipActive]}
              onPress={() => toggleDay(d.key)}
            >
              <Text
                style={[styles.dayText, selectedDays.has(d.key) && styles.dayTextActive]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Usual State */}
        <Text style={styles.fieldLabel}>Usual State</Text>
        <View style={styles.chipGrid}>
          {STATES.map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.stateChip, usualState === s && styles.stateChipActive]}
              onPress={() => setUsualState(s)}
            >
              <Text
                style={[styles.stateText, usualState === s && styles.stateTextActive]}
              >
                {s.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferred Protocol */}
        <Text style={styles.fieldLabel}>Preferred Protocol</Text>
        <View style={styles.chipGrid}>
          {PROTOCOLS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.stateChip, preferredProtocol === p && styles.stateChipActive]}
              onPress={() => setPreferredProtocol(p)}
            >
              <Text
                style={[styles.stateText, preferredProtocol === p && styles.stateTextActive]}
              >
                {p.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Duration */}
        <Text style={styles.fieldLabel}>Preferred Duration</Text>
        <View style={styles.durationRow}>
          {DURATIONS.map(d => (
            <TouchableOpacity
              key={d}
              style={[
                styles.durationChip,
                preferredDuration === d && styles.durationChipActive,
              ]}
              onPress={() => setPreferredDuration(d)}
            >
              <Text
                style={[
                  styles.durationText,
                  preferredDuration === d && styles.durationTextActive,
                ]}
              >
                {d}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enabled */}
        <View style={styles.enabledRow}>
          <Text style={styles.enabledLabel}>Enabled</Text>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: '#333', true: '#00ff88' }}
            thumbColor={enabled ? '#fff' : '#888'}
          />
        </View>

        {/* Source badge */}
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>
            Source: {existing?.source ?? 'user_defined'}
          </Text>
        </View>

        {existing && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Danger Window</Text>
          </TouchableOpacity>
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  cancelText: { fontSize: 16, color: '#888' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  saveText: { fontSize: 16, color: '#00ff88', fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  timeBlock: { alignItems: 'center' },
  timeSmall: { fontSize: 12, color: '#888', marginBottom: 4 },
  timeValue: { fontSize: 32, fontWeight: '800', color: '#fff' },
  timeButtons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  timeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  timeBtnText: { fontSize: 16, color: '#00ff88', fontWeight: '700' },
  timeArrow: { fontSize: 20, color: '#555', marginTop: 16 },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dayChipActive: { backgroundColor: '#00ff8820', borderColor: '#00ff88' },
  dayText: { fontSize: 13, color: '#888', fontWeight: '600' },
  dayTextActive: { color: '#00ff88' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  stateChipActive: { backgroundColor: '#00ff8820', borderColor: '#00ff88' },
  stateText: { fontSize: 13, color: '#888', fontWeight: '600' },
  stateTextActive: { color: '#00ff88' },
  durationRow: { flexDirection: 'row', gap: 10 },
  durationChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  durationChipActive: { backgroundColor: '#00ff8820', borderColor: '#00ff88' },
  durationText: { fontSize: 15, color: '#888', fontWeight: '700' },
  durationTextActive: { color: '#00ff88' },
  enabledRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  enabledLabel: { fontSize: 15, color: '#fff', fontWeight: '600' },
  sourceBadge: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  sourceText: { fontSize: 12, color: '#666' },
  deleteButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2a1a1a',
    borderWidth: 1,
    borderColor: '#ff444433',
    alignItems: 'center',
  },
  deleteButtonText: { fontSize: 15, color: '#ff6666', fontWeight: '600' },
})
