// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Mode Onboarding Screen
// Introduces ambient agent mode to users
// ══════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native'
import { useRouter } from 'expo-router'
import { useAppStore } from '../../src/store'
import type { AmbientIntensity, AmbientModeSettings } from '../../src/types/ambient'
import { DEFAULT_AMBIENT_SETTINGS, INTENSITY_DEFAULTS } from '../../src/types/ambient'

const INTENSITY_OPTIONS: { id: AmbientIntensity; label: string; emoji: string; description: string }[] = [
  { id: 'low', label: 'Gentle', emoji: '🌱', description: 'Max 2 prompts/day. Only in-app and notifications.' },
  { id: 'balanced', label: 'Balanced', emoji: '⚖️', description: 'Max 4 prompts/day. Adds widget support.' },
  { id: 'active', label: 'Active', emoji: '🔥', description: 'Max 6 prompts/day. All surfaces.' },
]

export default function AmbientModeOnboarding() {
  const router = useRouter()
  const [settings, setSettings] = useState<AmbientModeSettings>({
    ...DEFAULT_AMBIENT_SETTINGS,
    enabled: true,
  })
  const [step, setStep] = useState(0)

  const handleIntensitySelect = (intensity: AmbientIntensity) => {
    const defaults = INTENSITY_DEFAULTS[intensity]
    setSettings((s) => ({
      ...s,
      intensity,
      maxPromptsPerDay: defaults.maxPrompts,
      allowedSurfaces: defaults.surfaces,
    }))
    setStep(1)
  }

  const handleComplete = () => {
    // Save settings to store
    router.back()
  }

  if (step === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>🌊</Text>
        <Text style={styles.title}>Ambient Mode</Text>
        <Text style={styles.subtitle}>
          INTENT can gently appear before your usual drift windows.{'\n\n'}
          You stay in control. No creepy surveillance. No shame.
        </Text>

        <View style={styles.features}>
          <FeatureRow emoji="⏰" text="Appears during your chosen danger windows" />
          <FeatureRow emoji="🔒" text="Privacy-safe copy — never mentions sensitive states" />
          <FeatureRow emoji="✋" text="Every prompt has a 'Not now' option" />
          <FeatureRow emoji="📉" text="Frequency drops if you dismiss prompts" />
        </View>

        <Text style={styles.sectionTitle}>Choose your intensity</Text>

        {INTENSITY_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            style={[styles.optionCard, settings.intensity === option.id && styles.optionCardActive]}
            onPress={() => handleIntensitySelect(option.id)}
          >
            <Text style={styles.optionEmoji}>{option.emoji}</Text>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionDesc}>{option.description}</Text>
            </View>
          </Pressable>
        ))}

        <Pressable style={styles.skipButton} onPress={() => router.back()}>
          <Text style={styles.skipText}>Not now</Text>
        </Pressable>
      </ScrollView>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>⏰</Text>
      <Text style={styles.title}>Set Danger Windows</Text>
      <Text style={styles.subtitle}>
        When does INTENT usually need to appear?{'\n'}
        You can always change these later.
      </Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Sensitive mode</Text>
        <Switch
          value={settings.sensitiveMode}
          onValueChange={(v) => setSettings((s) => ({ ...s, sensitiveMode: v }))}
        />
      </View>
      <Text style={styles.settingHint}>
        When on, notifications never mention states like "anxious" or "avoiding"
      </Text>

      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Require first rescue before ambient</Text>
        <Switch
          value={settings.requireUserInitiatedFirst}
          onValueChange={(v) => setSettings((s) => ({ ...s, requireUserInitiatedFirst: v }))}
        />
      </View>

      <Pressable style={styles.primaryButton} onPress={handleComplete}>
        <Text style={styles.primaryButtonText}>Enable Ambient Mode</Text>
      </Pressable>

      <Pressable style={styles.skipButton} onPress={() => setStep(0)}>
        <Text style={styles.skipText}>Back</Text>
      </Pressable>
    </ScrollView>
  )
}

function FeatureRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  content: { padding: 24, paddingBottom: 48 },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700', color: '#F1F1F1', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#9CA3AF', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  features: { marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureEmoji: { fontSize: 20, marginRight: 12 },
  featureText: { fontSize: 15, color: '#D1D5DB', flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#F1F1F1', marginBottom: 16 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20,
    marginBottom: 12, borderWidth: 2, borderColor: 'transparent',
  },
  optionCardActive: { borderColor: '#6C3AED' },
  optionEmoji: { fontSize: 28, marginRight: 16 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 18, fontWeight: '600', color: '#F1F1F1', marginBottom: 4 },
  optionDesc: { fontSize: 14, color: '#9CA3AF' },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, marginBottom: 8,
  },
  settingLabel: { fontSize: 16, color: '#F1F1F1', flex: 1 },
  settingHint: { fontSize: 13, color: '#6B7280', marginBottom: 16, paddingHorizontal: 4 },
  primaryButton: {
    backgroundColor: '#6C3AED', borderRadius: 16, padding: 18,
    alignItems: 'center', marginTop: 24,
  },
  primaryButtonText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  skipButton: { alignItems: 'center', marginTop: 16, padding: 12 },
  skipText: { fontSize: 16, color: '#6B7280' },
})
