// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Mode Settings
// Settings screen for configuring ambient agent behavior
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'

export function AmbientModeSettings(): React.JSX.Element {
  const navigation = useNavigation<any>()
  const [enabled, setEnabled] = useState(true)
  const [intensity, setIntensity] = useState<'low' | 'balanced' | 'active'>('balanced')
  const [maxPrompts, setMaxPrompts] = useState(3)
  const [quietStart, setQuietStart] = useState(23)
  const [quietEnd, setQuietEnd] = useState(7)
  const [sensitiveMode, setSensitiveMode] = useState(true)
  const [requireUserFirst, setRequireUserFirst] = useState(true)
  const [allowNotification, setAllowNotification] = useState(true)
  const [allowWidget, setAllowWidget] = useState(true)
  const [allowInApp, setAllowInApp] = useState(true)

  const dangerWindows = [
    { id: '1', label: 'Evening drift', start: '20:00', end: '22:00', days: 'Mon–Fri' },
  ]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ambient Mode</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Master Toggle */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Enable Ambient Mode</Text>
              <Text style={styles.rowDesc}>
                INTENT proactively suggests rescue moments
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: '#333', true: '#00ff88' }}
              thumbColor={enabled ? '#fff' : '#888'}
            />
          </View>
        </View>

        {enabled && (
          <>
            {/* Intensity */}
            <Text style={styles.sectionTitle}>Intensity</Text>
            <View style={styles.intensityRow}>
              {(['low', 'balanced', 'active'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.intensityChip,
                    intensity === level && styles.intensityChipActive,
                  ]}
                  onPress={() => setIntensity(level)}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      intensity === level && styles.intensityTextActive,
                    ]}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Max Prompts */}
            <Text style={styles.sectionTitle}>Max Prompts Per Day</Text>
            <View style={styles.sliderRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity
                  key={n}
                  style={[styles.sliderDot, maxPrompts === n && styles.sliderDotActive]}
                  onPress={() => setMaxPrompts(n)}
                >
                  <Text
                    style={[
                      styles.sliderDotText,
                      maxPrompts === n && styles.sliderDotTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quiet Hours */}
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>
                  {quietStart}:00 – {quietEnd}:00
                </Text>
                <View style={styles.quietButtons}>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => setQuietStart((quietStart + 23) % 24)}
                  >
                    <Text style={styles.timeBtnText}>◀</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.timeBtn}
                    onPress={() => setQuietEnd((quietEnd + 1) % 24)}
                  >
                    <Text style={styles.timeBtnText}>▶</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Surfaces */}
            <Text style={styles.sectionTitle}>Allowed Surfaces</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>In-App</Text>
                <Switch value={allowInApp} onValueChange={setAllowInApp} trackColor={{ false: '#333', true: '#00ff88' }} />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Notifications</Text>
                <Switch value={allowNotification} onValueChange={setAllowNotification} trackColor={{ false: '#333', true: '#00ff88' }} />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Widget</Text>
                <Switch value={allowWidget} onValueChange={setAllowWidget} trackColor={{ false: '#333', true: '#00ff88' }} />
              </View>
            </View>

            {/* Safety */}
            <Text style={styles.sectionTitle}>Safety</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>Sensitive mode</Text>
                  <Text style={styles.rowDesc}>
                    Never mention state labels in notifications
                  </Text>
                </View>
                <Switch value={sensitiveMode} onValueChange={setSensitiveMode} trackColor={{ false: '#333', true: '#00ff88' }} />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowLabel}>Require user-initiated first</Text>
                  <Text style={styles.rowDesc}>
                    Don't suggest until user has done one rescue
                  </Text>
                </View>
                <Switch value={requireUserFirst} onValueChange={setRequireUserFirst} trackColor={{ false: '#333', true: '#00ff88' }} />
              </View>
            </View>

            {/* Danger Windows */}
            <Text style={styles.sectionTitle}>Danger Windows</Text>
            {dangerWindows.map(dw => (
              <View key={dw.id} style={styles.dwCard}>
                <Text style={styles.dwLabel}>{dw.label}</Text>
                <Text style={styles.dwTime}>
                  {dw.start} – {dw.end} · {dw.days}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addDwButton}
              onPress={() => navigation.navigate('DangerWindowEditor')}
            >
              <Text style={styles.addDwText}>+ Add Danger Window</Text>
            </TouchableOpacity>
          </>
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
  },
  backText: { fontSize: 16, color: '#00ff88', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 24,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  rowInfo: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 15, color: '#fff', fontWeight: '600' },
  rowDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginHorizontal: 16 },
  intensityRow: { flexDirection: 'row', gap: 8 },
  intensityChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  intensityChipActive: { borderColor: '#00ff88', backgroundColor: '#00ff8815' },
  intensityText: { fontSize: 14, color: '#888', fontWeight: '600' },
  intensityTextActive: { color: '#00ff88' },
  sliderRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  sliderDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderDotActive: { borderColor: '#00ff88', backgroundColor: '#00ff8820' },
  sliderDotText: { fontSize: 16, color: '#888', fontWeight: '700' },
  sliderDotTextActive: { color: '#00ff88' },
  quietButtons: { flexDirection: 'row', gap: 8 },
  timeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBtnText: { fontSize: 14, color: '#fff' },
  dwCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  dwLabel: { fontSize: 15, color: '#fff', fontWeight: '600' },
  dwTime: { fontSize: 13, color: '#888', marginTop: 2 },
  addDwButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00ff8840',
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 8,
  },
  addDwText: { fontSize: 15, color: '#00ff88', fontWeight: '600' },
})
