// ══════════════════════════════════════════════════════════════
// INTENT — Danger Window Editor Screen
// Create and edit danger windows
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import type { DangerWindow, DangerWindowSource } from '../../src/types/ambient'
import type { UserState } from '../../src/types/moment'
import { validateDangerWindow } from '../../src/services/ambient/dangerWindowEngine'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATE_OPTIONS: { id: UserState; label: string; emoji: string }[] = [
  { id: 'avoiding', label: 'Avoiding', emoji: '🙈' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
  { id: 'stuck', label: 'Stuck', emoji: '🫠' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'distracted', label: 'Distracted', emoji: '🦋' },
  { id: 'anxious', label: 'Anxious', emoji: '😰' },
  { id: 'doomscroll_risk', label: 'Doomscroll', emoji: '📱' },
  { id: 'perfectionism', label: 'Perfectionism', emoji: '✨' },
]

export default function DangerWindowEditor() {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [startTime, setStartTime] = useState('20:00')
  const [endTime, setEndTime] = useState('22:00')
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [usualState, setUsualState] = useState<UserState | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  const handleSave = () => {
    const window: Partial<DangerWindow> = {
      label: label.trim() || 'Custom window',
      startTime,
      endTime,
      daysOfWeek: selectedDays,
      usualState,
      source: 'user_defined' as DangerWindowSource,
      confidence: 0.5,
      enabled: true,
    }

    const validationErrors = validateDangerWindow(window)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    // Save and go back
    router.back()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New Danger Window</Text>
      </View>

      {errors.length > 0 && (
        <View style={styles.errorCard}>
          {errors.map((err, i) => (
            <Text key={i} style={styles.errorText}>• {err}</Text>
          ))}
        </View>
      )}

      {/* Label */}
      <Text style={styles.sectionTitle}>Label</Text>
      <TextInput
        style={styles.input}
        value={label}
        onChangeText={setLabel}
        placeholder="e.g., Evening doomscroll"
        placeholderTextColor="#6B7280"
      />

      {/* Time Range */}
      <Text style={styles.sectionTitle}>Time Range</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <Text style={styles.timeLabel}>Start</Text>
          <TextInput
            style={styles.timeInput}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="HH:MM"
            placeholderTextColor="#6B7280"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <Text style={styles.timeDash}>—</Text>
        <View style={styles.timeField}>
          <Text style={styles.timeLabel}>End</Text>
          <TextInput
            style={styles.timeInput}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="HH:MM"
            placeholderTextColor="#6B7280"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      {/* Days */}
      <Text style={styles.sectionTitle}>Days</Text>
      <View style={styles.daysRow}>
        {DAY_LABELS.map((day, i) => (
          <Pressable
            key={i}
            style={[styles.dayChip, selectedDays.includes(i) && styles.dayChipActive]}
            onPress={() => toggleDay(i)}
          >
            <Text style={[styles.dayText, selectedDays.includes(i) && styles.dayTextActive]}>
              {day}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Usual State */}
      <Text style={styles.sectionTitle}>Usual State (optional)</Text>
      <View style={styles.stateGrid}>
        {STATE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.stateChip, usualState === opt.id && styles.stateChipActive]}
            onPress={() => setUsualState(usualState === opt.id ? null : opt.id)}
          >
            <Text style={styles.stateEmoji}>{opt.emoji}</Text>
            <Text style={[styles.stateLabel, usualState === opt.id && styles.stateLabelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Save */}
      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Danger Window</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 20, paddingBottom: 48 },
  header: { marginBottom: 24 },
  backButton: { padding: 8, marginBottom: 8 },
  backText: { fontSize: 16, color: '#6C3AED' },
  title: { fontSize: 28, fontWeight: '700', color: '#F1F1F1' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16,
    fontSize: 16, color: '#F1F1F1',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeField: { flex: 1 },
  timeLabel: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  timeInput: {
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16,
    fontSize: 18, color: '#F1F1F1', textAlign: 'center', fontWeight: '600',
  },
  timeDash: { fontSize: 20, color: '#6B7280', marginTop: 16 },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayChip: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 10, padding: 12,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  dayChipActive: { borderColor: '#6C3AED', backgroundColor: '#2A1A4E' },
  dayText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  dayTextActive: { color: '#F1F1F1' },
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stateChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  stateChipActive: { borderColor: '#6C3AED' },
  stateEmoji: { fontSize: 16, marginRight: 6 },
  stateLabel: { fontSize: 14, color: '#9CA3AF' },
  stateLabelActive: { color: '#F1F1F1' },
  saveButton: {
    backgroundColor: '#6C3AED', borderRadius: 16, padding: 18,
    alignItems: 'center', marginTop: 32,
  },
  saveButtonText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  errorCard: { backgroundColor: '#2A1A1A', borderRadius: 12, padding: 16, marginBottom: 16 },
  errorText: { fontSize: 14, color: '#F87171' },
})
