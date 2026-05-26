// ══════════════════════════════════════════════════════════════
// INTENT — Instant Rescue Onboarding (Phase 9)
// First 10-second experience. No auth. No typing. Immediate value.
// Flow: Where do you lose time? → Pick your state → First mission → Complete
// ══════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Play, ChevronRight, Zap } from 'lucide-react-native'
import { colors, spacing, radius, typography, shadows } from '../src/theme'
import { getProtocolForState, RESCUE_PROTOCOLS } from '../src/types/rescue'
import { compileMission } from '../src/engine/missionCompiler'
import type { UserState, EnergyLevel, BlockerType, MicroMission } from '../src/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface OnboardingStep {
  id: string
  title: string
  subtitle: string
}

const DRIFT_LOSS_OPTIONS = [
  { id: 'avoiding', emoji: '🙈', label: 'Avoiding hard tasks', state: 'avoiding' as UserState },
  { id: 'scrolling', emoji: '📱', label: 'Doomscrolling', state: 'doomscroll_risk' as UserState },
  { id: 'overthinking', emoji: '🌀', label: 'Overthinking', state: 'anxious' as UserState },
  { id: 'overwhelmed', emoji: '🌊', label: 'Feeling overwhelmed', state: 'overwhelmed' as UserState },
  { id: 'switching', emoji: '🔀', label: 'Switching tasks', state: 'scattered' as UserState },
  { id: 'quitting', emoji: '🏃', label: 'Quitting too early', state: 'avoiding' as UserState },
]

const STATE_OPTIONS = [
  { id: 'avoiding', emoji: '🙈', label: 'Avoiding', color: '#EF4444' },
  { id: 'overwhelmed', emoji: '🌊', label: 'Overwhelmed', color: '#F59E0B' },
  { id: 'stuck', emoji: '🫠', label: 'Stuck', color: '#8B5CF6' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: '#6366F1' },
  { id: 'distracted', emoji: '🦋', label: 'Distracted', color: '#EC4899' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#F97316' },
  { id: 'scattered', emoji: '🌪️', label: 'Scattered', color: '#14B8A6' },
  { id: 'ready', emoji: '🚀', label: 'Ready', color: '#10B981' },
]

const TIME_OPTIONS = [1, 2, 5, 10, 15, 25]

export default function InstantRescueOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedLoss, setSelectedLoss] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<UserState | null>(null)
  const [selectedMinutes, setSelectedMinutes] = useState(2)
  const [compiledMission, setCompiledMission] = useState<MicroMission | null>(null)

  const handleLossSelect = useCallback((option: typeof DRIFT_LOSS_OPTIONS[0]) => {
    setSelectedLoss(option.id)
    setSelectedState(option.state)
    setStep(1)
  }, [])

  const handleStateSelect = useCallback((state: UserState) => {
    setSelectedState(state)
  }, [])

  const handleTimeSelect = useCallback((minutes: number) => {
    setSelectedMinutes(minutes)
  }, [])

  const handleGenerateMission = useCallback(() => {
    if (!selectedState) return

    const protocolId = getProtocolForState(selectedState)
    const result = compileMission({
      state: selectedState,
      blocker: null,
      energy: 'medium',
      availableMinutes: selectedMinutes,
      contextText: null,
      threadId: null,
      previousFailures: [],
      previousSuccesses: [],
      protocolId,
      privacyPolicy: 'local_only',
    })

    setCompiledMission(result.primaryMission)
    setStep(3)
  }, [selectedState, selectedMinutes])

  const handleStartMission = useCallback(() => {
    // Navigate to live mission with the compiled mission
    router.push('/live')
  }, [router])

  const handleSkipToApp = useCallback(() => {
    router.replace('/')
  }, [router])

  // ── Step 0: Where do you lose time? ──────────────────────
  if (step === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(108,58,237,0.12)', 'transparent']} style={styles.gradientBg} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>1 / 3</Text>
          </View>

          <Text style={styles.title}>Where do you lose time?</Text>
          <Text style={styles.subtitle}>Be honest. This stays on your device.</Text>

          <View style={styles.optionsGrid}>
            {DRIFT_LOSS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => handleLossSelect(option)}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <ChevronRight size={16} color={colors.text.tertiary} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkipToApp}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // ── Step 1: Pick your state right now ────────────────────
  if (step === 1) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(108,58,237,0.08)', 'transparent']} style={styles.gradientBg} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(0)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepNumber}>2 / 3</Text>
          </View>

          <Text style={styles.title}>Pick your state right now</Text>
          <Text style={styles.subtitle}>No wrong answer. Just how you feel.</Text>

          <View style={styles.stateGrid}>
            {STATE_OPTIONS.map(state => (
              <TouchableOpacity
                key={state.id}
                style={[
                  styles.stateChip,
                  selectedState === state.id && {
                    borderColor: state.color,
                    backgroundColor: state.color + '15',
                  },
                ]}
                onPress={() => handleStateSelect(state.id as UserState)}
              >
                <Text style={styles.stateEmoji}>{state.emoji}</Text>
                <Text
                  style={[
                    styles.stateLabel,
                    selectedState === state.id && { color: state.color },
                  ]}
                >
                  {state.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedState && (
            <TouchableOpacity style={styles.continueBtn} onPress={() => setStep(2)}>
              <Text style={styles.continueText}>Continue</Text>
              <ChevronRight size={18} color={colors.text.inverse} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── Step 2: How much time? ───────────────────────────────
  if (step === 2) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(108,58,237,0.08)', 'transparent']} style={styles.gradientBg} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.stepNumber}>3 / 3</Text>
          </View>

          <Text style={styles.title}>Give INTENT 2 minutes?</Text>
          <Text style={styles.subtitle}>
            {selectedState && RESCUE_PROTOCOLS[getProtocolForState(selectedState)].name} works best with small starts.
          </Text>

          <View style={styles.timeGrid}>
            {TIME_OPTIONS.map(minutes => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.timeChip,
                  selectedMinutes === minutes && styles.timeChipActive,
                ]}
                onPress={() => handleTimeSelect(minutes)}
              >
                <Text
                  style={[
                    styles.timeValue,
                    selectedMinutes === minutes && styles.timeValueActive,
                  ]}
                >
                  {minutes}
                </Text>
                <Text
                  style={[
                    styles.timeUnit,
                    selectedMinutes === minutes && styles.timeValueActive,
                  ]}
                >
                  min
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateMission}>
            <LinearGradient colors={colors.gradients.brand} style={styles.generateGradient}>
              <Zap size={20} color={colors.text.inverse} />
              <Text style={styles.generateText}>Generate My First Mission</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  // ── Step 3: Your first mission ───────────────────────────
  if (step === 3 && compiledMission) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['rgba(16,185,129,0.1)', 'transparent']} style={styles.gradientBg} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.missionCard}>
            <Text style={styles.missionLabel}>YOUR FIRST MISSION</Text>
            <Text style={styles.missionAction}>{compiledMission.exactAction}</Text>
            <Text style={styles.missionDuration}>{selectedMinutes} minutes</Text>

            <View style={styles.missionCriteria}>
              <Text style={styles.criteriaLabel}>Success means:</Text>
              <Text style={styles.criteriaText}>{compiledMission.completionCriteria}</Text>
            </View>

            {compiledMission.fallbackMission && (
              <View style={styles.fallbackBox}>
                <Text style={styles.fallbackLabel}>If it's too hard:</Text>
                <Text style={styles.fallbackText}>{compiledMission.fallbackMission}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.startMissionBtn} onPress={handleStartMission}>
            <LinearGradient colors={colors.gradients.brand} style={styles.startMissionGradient}>
              <Play size={20} color={colors.text.inverse} />
              <Text style={styles.startMissionText}>Start Mission</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkipToApp}>
            <Text style={styles.skipText}>I'll try later</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.base },
  gradientBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl * 2 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  stepNumber: { ...typography.caption, color: colors.text.tertiary },
  backText: { ...typography.bodySmall, color: colors.brand[400] },
  title: { ...typography.h1, color: colors.text.primary, fontSize: 28, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMedium, color: colors.text.secondary, marginBottom: spacing.xl, lineHeight: 22 },

  // Options
  optionsGrid: { gap: spacing.sm },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border.subtle,
  },
  optionEmoji: { fontSize: 24 },
  optionLabel: { ...typography.bodyMedium, color: colors.text.primary, flex: 1 },

  // State Grid
  stateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stateChip: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 3) / 4,
    alignItems: 'center', padding: spacing.md, borderRadius: radius.lg,
    backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle,
    gap: spacing.xs,
  },
  stateEmoji: { fontSize: 22 },
  stateLabel: { ...typography.caption, color: colors.text.secondary, textAlign: 'center' },

  // Time Grid
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 2) / 3,
    alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg,
    backgroundColor: colors.bg.surface, borderWidth: 1, borderColor: colors.border.subtle,
  },
  timeChipActive: { borderColor: colors.brand[400], backgroundColor: colors.brand[400] + '15' },
  timeValue: { ...typography.h2, color: colors.text.primary, fontSize: 28 },
  timeValueActive: { color: colors.brand[400] },
  timeUnit: { ...typography.caption, color: colors.text.tertiary },

  // Buttons
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
    marginTop: spacing.xl, backgroundColor: colors.brand[400],
    borderRadius: radius.lg, padding: spacing.md,
  },
  continueText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },
  generateBtn: { marginTop: spacing.xl, borderRadius: radius.lg, overflow: 'hidden' },
  generateGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md,
  },
  generateText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },
  skipBtn: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.md },
  skipText: { ...typography.bodySmall, color: colors.text.tertiary },

  // Mission Card
  missionCard: {
    backgroundColor: colors.bg.surface, borderRadius: radius.xl,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border.subtle,
    marginBottom: spacing.xl,
  },
  missionLabel: { ...typography.labelSmall, color: colors.accent.green, marginBottom: spacing.sm },
  missionAction: { ...typography.h2, color: colors.text.primary, fontSize: 22, lineHeight: 30, marginBottom: spacing.sm },
  missionDuration: { ...typography.bodyMedium, color: colors.text.tertiary, marginBottom: spacing.lg },
  missionCriteria: { marginBottom: spacing.md },
  criteriaLabel: { ...typography.labelSmall, color: colors.text.tertiary, marginBottom: spacing.xs },
  criteriaText: { ...typography.bodyMedium, color: colors.text.secondary },
  fallbackBox: {
    backgroundColor: colors.bg.elevated, borderRadius: radius.md,
    padding: spacing.md, marginTop: spacing.md,
  },
  fallbackLabel: { ...typography.labelSmall, color: colors.accent.orange, marginBottom: spacing.xs },
  fallbackText: { ...typography.bodySmall, color: colors.text.secondary },

  // Start Mission
  startMissionBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  startMissionGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md,
  },
  startMissionText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '600' },
})
