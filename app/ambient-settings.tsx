// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Mode Settings Screen
// Full settings for ambient agent mode
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppStore } from '../../src/store'
import type { AmbientIntensity, AmbientSurface, AmbientPromptType, DangerWindow } from '../../src/types/ambient'
import { DEFAULT_AMBIENT_SETTINGS, INTENSITY_DEFAULTS } from '../../src/types/ambient'
import { formatQuietHours } from '../../src/services/ambient/quietHours'
import { DANGER_WINDOW_PRESETS } from '../../src/services/ambient/dangerWindowEngine'

export default function AmbientModeSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState(DEFAULT_AMBIENT_SETTINGS)

  const updateSetting = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Ambient Mode</Text>
      </View>

      {/* Master Toggle */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>Ambient Mode</Text>
            <Text style={styles.hint}>INTENT appears during drift windows</Text>
          </View>
          <Switch
            value={settings.enabled}
            onValueChange={(v) => updateSetting('enabled', v)}
            trackColor={{ true: '#6C3AED' }}
          />
        </View>
      </View>

      {settings.enabled && (
        <>
          {/* Intensity */}
          <Text style={styles.sectionTitle}>Intensity</Text>
          <View style={styles.intensityRow}>
            {(['low', 'balanced', 'active'] as AmbientIntensity[]).map((level) => (
              <Pressable
                key={level}
                style={[styles.intensityChip, settings.intensity === level && styles.intensityChipActive]}
                onPress={() => {
                  updateSetting('intensity', level)
                  updateSetting('maxPromptsPerDay', INTENSITY_DEFAULTS[level].maxPrompts)
                }}
              >
                <Text style={[styles.intensityText, settings.intensity === level && styles.intensityTextActive]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
                <Text style={styles.intensitySub}>
                  {INTENSITY_DEFAULTS[level].maxPrompts}/day
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Max Prompts */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Max prompts per day</Text>
              <Text style={styles.value}>{settings.maxPromptsPerDay}</Text>
            </View>
          </View>

          {/* Quiet Hours */}
          <Text style={styles.sectionTitle}>Quiet Hours</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.label}>Quiet Hours</Text>
                <Text style={styles.hint}>{formatQuietHours(settings.quietHours)}</Text>
              </View>
              <Switch
                value={settings.quietHours.enabled}
                onValueChange={(v) =>
                  updateSetting('quietHours', { ...settings.quietHours, enabled: v })
                }
              />
            </View>
          </View>

          {/* Privacy */}
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.label}>Sensitive mode</Text>
                <Text style={styles.hint}>Never mention states in notifications</Text>
              </View>
              <Switch
                value={settings.sensitiveMode}
                onValueChange={(v) => updateSetting('sensitiveMode', v)}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.label}>Require first rescue</Text>
                <Text style={styles.hint}>Only activate after user starts first rescue</Text>
              </View>
              <Switch
                value={settings.requireUserInitiatedFirst}
                onValueChange={(v) => updateSetting('requireUserInitiatedFirst', v)}
              />
            </View>
          </View>

          {/* Danger Windows */}
          <Text style={styles.sectionTitle}>Danger Windows</Text>
          {settings.dangerWindows.map((dw) => (
            <View key={dw.id} style={styles.dangerCard}>
              <View style={styles.dangerHeader}>
                <Text style={styles.dangerLabel}>{dw.label}</Text>
                <Switch
                  value={dw.enabled}
                  onValueChange={(v) => {
                    updateSetting('dangerWindows', settings.dangerWindows.map((w) =>
                      w.id === dw.id ? { ...w, enabled: v } : w,
                    ))
                  }}
                />
              </View>
              <Text style={styles.dangerTime}>
                {dw.startTime} – {dw.endTime} · {dw.daysOfWeek.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
              </Text>
              {dw.usualState && (
                <Text style={styles.dangerState}>Usually: {dw.usualState}</Text>
              )}
            </View>
          ))}

          <Pressable
            style={styles.addButton}
            onPress={() => {
              // Navigate to danger window editor
              router.push('/danger-window-editor')
            }}
          >
            <Text style={styles.addButtonText}>+ Add Danger Window</Text>
          </Pressable>

          {/* Quick Presets */}
          <Text style={styles.sectionTitle}>Quick Presets</Text>
          {DANGER_WINDOW_PRESETS.map((preset, i) => (
            <Pressable
              key={i}
              style={styles.presetCard}
              onPress={() => {
                const newWindow: DangerWindow = {
                  ...preset,
                  id: Date.now().toString(36) + i,
                  preferredProtocol: null,
                  preferredDuration: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as DangerWindow
                updateSetting('dangerWindows', [...settings.dangerWindows, newWindow])
              }}
            >
              <Text style={styles.presetLabel}>{preset.label}</Text>
              <Text style={styles.presetTime}>
                {preset.startTime} – {preset.endTime}
              </Text>
            </Pressable>
          ))}

          {/* Allowed Surfaces */}
          <Text style={styles.sectionTitle}>Surfaces</Text>
          <View style={styles.card}>
            {(['in_app', 'notification', 'widget', 'shortcut'] as AmbientSurface[]).map((surface) => (
              <View key={surface} style={styles.surfaceRow}>
                <Text style={styles.surfaceLabel}>{surface.replace(/_/g, ' ')}</Text>
                <Switch
                  value={settings.allowedSurfaces.includes(surface)}
                  onValueChange={(v) => {
                    if (v) {
                      updateSetting('allowedSurfaces', [...settings.allowedSurfaces, surface])
                    } else {
                      updateSetting('allowedSurfaces', settings.allowedSurfaces.filter((s) => s !== surface))
                    }
                  }}
                />
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8 },
  backText: { fontSize: 16, color: '#6C3AED' },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F1F1', marginLeft: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 16, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, color: '#F1F1F1', fontWeight: '500' },
  hint: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  value: { fontSize: 16, color: '#6C3AED', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#2A2A3E', marginVertical: 12 },
  intensityRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  intensityChip: {
    flex: 1, backgroundColor: '#1A1A2E', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  intensityChipActive: { borderColor: '#6C3AED' },
  intensityText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  intensityTextActive: { color: '#F1F1F1' },
  intensitySub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  dangerCard: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, marginBottom: 8 },
  dangerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dangerLabel: { fontSize: 16, color: '#F1F1F1', fontWeight: '500' },
  dangerTime: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  dangerState: { fontSize: 13, color: '#6C3AED', marginTop: 2 },
  addButton: {
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#6C3AED', borderStyle: 'dashed',
  },
  addButtonText: { fontSize: 15, color: '#6C3AED', fontWeight: '500' },
  presetCard: {
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  presetLabel: { fontSize: 15, color: '#F1F1F1' },
  presetTime: { fontSize: 13, color: '#6B7280' },
  surfaceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
  },
  surfaceLabel: { fontSize: 15, color: '#D1D5DB', textTransform: 'capitalize' },
})
