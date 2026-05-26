// ══════════════════════════════════════════════════════════════
// INTENT — Live Mission Screen
// Anti-drift timer, distraction capture, salvage mode, body-double
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Alert, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { Pause, Play, Square, CheckCircle2, SkipForward, AlertTriangle, Brain, X } from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { colors, spacing, radius, typography, shadows } from '../src/theme'
import { Screen, Button, ProgressRing } from '../src/components'
import { showSessionCompleteNotification } from '../src/services/notifications'
import { getSocialProofStat, getActivationCelebration } from '../src/services/retention/retentionEngine'
import type { UserState } from '../src/types'

export default function LiveMissionScreen() {
  const activeSession = useAppStore((s) => s.activeSession)
  const startSession = useAppStore((s) => s.startSession)
  const updateSessionTimer = useAppStore((s) => s.updateSessionTimer)
  const pauseSession = useAppStore((s) => s.pauseSession)
  const resumeSession = useAppStore((s) => s.resumeSession)
  const completeSession = useAppStore((s) => s.completeSession)
  const abandonSession = useAppStore((s) => s.abandonSession)
  const salvageSession = useAppStore((s) => s.salvageSession)
  const captureDistraction = useAppStore((s) => s.captureDistraction)
  const missions = useAppStore((s) => s.missions)
  const microMissions = useAppStore((s) => s.microMissions)

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showSalvage, setShowSalvage] = useState(false)
  const [distractionInput, setDistractionInput] = useState('')
  const [showDistractionCapture, setShowDistractionCapture] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [socialProof, setSocialProof] = useState<string | null>(null)
  const [activationCelebration, setActivationCelebration] = useState<{ show: boolean; message: string; submessage: string } | null>(null)

  const pulseAnim = useRef(new Animated.Value(1)).current
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef<number>(0)

  const activeMission = missions.find(m => m.status === 'active')
  const activeMicro = microMissions.find(mm => mm.status === 'in_progress' || mm.status === 'pending')

  // ── Timer ──
  useEffect(() => {
    if (activeSession?.status === 'active') {
      sessionStartRef.current = Date.now() - elapsedSeconds * 1000
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000)
        setElapsedSeconds(elapsed)
        updateSessionTimer(activeSession.id, elapsed)
        if (elapsed >= activeSession.planned_minutes * 60) {
          handleComplete()
        }
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [activeSession?.status, activeSession?.id])

  useEffect(() => {
    if (activeSession?.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [activeSession?.status])

  const handleComplete = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    completeSession(sessionNotes)
    showSessionCompleteNotification(Math.round(elapsedSeconds / 60), 0)

    // Show social proof stat after completion
    const proof = getSocialProofStat(
      (activeSession?.mode as string as UserState) ?? null,
      true,
    )
    if (proof) setSocialProof(proof)

    // Check if this was the first rescue (activation celebration)
    const retentionState = useAppStore.getState().retentionState
    const celebration = getActivationCelebration(retentionState)
    if (celebration.show && retentionState.totalRescues <= 1) {
      setActivationCelebration(celebration)
    }
  }, [completeSession, sessionNotes, elapsedSeconds, activeSession])

  const handleAbandon = () => {
    Alert.alert(
      'End Session Early?',
      'Your effort still counts. We can salvage what you did.',
      [
        { text: 'Keep Going', style: 'cancel' },
        { text: 'Salvage', style: 'default', onPress: () => { salvageSession(sessionNotes); setShowSalvage(false) } },
        { text: 'Abandon', style: 'destructive', onPress: abandonSession },
      ]
    )
  }

  const handleCaptureDistraction = () => {
    if (distractionInput.trim()) {
      captureDistraction(distractionInput.trim())
      setDistractionInput('')
      setShowDistractionCapture(false)
      void 0
    }
  }

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ── No active session → Setup ──
  if (!activeSession) {
    return (
      <Screen gradient={['rgba(108,58,237,0.06)', 'transparent']}>
        <Text style={styles.setupTitle}>Start a Mission</Text>
        
        {/* Mission selector */}
        {activeMission && (
          <View style={styles.activeMissionBanner}>
            <Text style={styles.activeMissionLabel}>ACTIVE MISSION</Text>
            <Text style={styles.activeMissionTitle}>{activeMission.title}</Text>
          </View>
        )}

        {/* Duration */}
        <Text style={styles.durationLabel}>DURATION</Text>
        <View style={styles.durationRow}>
          {[2, 5, 10, 15, 25, 45, 60].map(d => (
            <TouchableOpacity key={d} style={styles.durationChip}>
              <Text style={styles.durationChipText}>{d}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Start Mission"
          onPress={() => startSession(undefined, undefined, 'focus', 10)}
          variant="gradient"
          size="lg"
          style={{ width: '100%', marginTop: spacing.lg }}
        />

        <Button
          title="Just Show Me the Timer"
          onPress={() => startSession(undefined, undefined, 'focus', 5)}
          variant="ghost"
          size="sm"
          style={{ width: '100%', marginTop: spacing.sm }}
        >
          <Text style={styles.bodyDoubleHint}>⏱ 5-min body-double mode</Text>
        </Button>
      </Screen>
    )
  }

  // ── Active Session ──
  const totalPlanned = activeSession.planned_minutes * 60
  const progress = Math.min(elapsedSeconds / totalPlanned, 1)
  const timeLeft = Math.max(totalPlanned - elapsedSeconds, 0)
  const isActive = activeSession.status === 'active'

  return (
    <Screen scrollable={false} gradient={['rgba(108,58,237,0.08)', 'transparent']}>
      <View style={styles.liveContainer}>
        {/* Mission context */}
        <View style={styles.missionContext}>
          {activeMission && (
            <>
              <Text style={styles.missionTitle}>{activeMission.title}</Text>
              {activeMicro && (
                <Text style={styles.microTitle}>→ {activeMicro.title}</Text>
              )}
            </>
          )}
          {!activeMission && (
            <Text style={styles.missionTitle}>Focus Session</Text>
          )}
        </View>

        {/* Timer */}
        <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <ProgressRing progress={progress} size={220} strokeWidth={8} color={colors.brand[500]}>
            <View style={styles.timerDisplay}>
              <Text style={[typography.mono, { color: colors.text.primary, fontSize: 48 }]}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.text.tertiary }]}>
                {isActive ? 'remaining' : 'paused'}
              </Text>
            </View>
          </ProgressRing>
        </Animated.View>

        {/* Distraction counter */}
        {activeSession.distractions_captured > 0 && (
          <View style={styles.distractionCounter}>
            <Brain size={14} color={colors.accent.pink} />
            <Text style={styles.distractionCountText}>
              {activeSession.distractions_captured} captured
            </Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <Button title="End" onPress={handleAbandon} variant="ghost" size="sm" />
          {isActive ? (
            <Button title="" onPress={pauseSession} variant="primary" size="lg"
              style={[styles.mainBtn, { width: 72, height: 72, borderRadius: 36 }]}
              icon={<Pause size={28} color={colors.text.inverse} />} />
          ) : (
            <Button title="" onPress={resumeSession} variant="primary" size="lg"
              style={[styles.mainBtn, { width: 72, height: 72, borderRadius: 36 }]}
              icon={<Play size={28} color={colors.text.inverse} />} />
          )}
          <Button title="Done" onPress={() => setShowSalvage(true)} variant="secondary" size="sm"
            icon={<CheckCircle2 size={16} color={colors.accent.green} />} />
        </View>

        {/* Capture Distraction */}
        {!showDistractionCapture ? (
          <TouchableOpacity style={styles.captureBtn} onPress={() => setShowDistractionCapture(true)}>
            <Brain size={16} color={colors.text.tertiary} />
            <Text style={styles.captureBtnText}>Capture a distraction</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.distractionInput}>
            <TextInput
              style={styles.distractionTextInput}
              placeholder="What's pulling your attention?"
              placeholderTextColor={colors.text.disabled}
              value={distractionInput}
              onChangeText={setDistractionInput}
              autoFocus
              multiline
            />
            <View style={styles.distractionActions}>
              <TouchableOpacity onPress={() => setShowDistractionCapture(false)}>
                <X size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCaptureDistraction}>
                <Text style={styles.captureSubmit}>Capture</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Social Proof Toast */}
      {socialProof && !showSalvage && (
        <View style={styles.socialProofContainer}>
          <Text style={styles.socialProofText}>{socialProof}</Text>
          <TouchableOpacity onPress={() => setSocialProof(null)}>
            <Text style={styles.socialProofDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Activation Celebration Overlay */}
      {activationCelebration?.show && (
        <View style={styles.activationContainer}>
          <Text style={styles.activationMessage}>{activationCelebration.message}</Text>
          <Text style={styles.activationSubmessage}>{activationCelebration.submessage}</Text>
          <TouchableOpacity onPress={() => setActivationCelebration(null)} style={styles.activationDismiss}>
            <Text style={styles.activationDismissText}>Let's go →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Salvage Modal */}
      {showSalvage && (
        <BlurView intensity={40} style={styles.salvageOverlay}>
          <View style={styles.salvageModal}>
            <Text style={styles.salvageTitle}>Complete Session</Text>
            <Text style={styles.salvageProgress}>
              {Math.round(elapsedSeconds / 60)} of {activeSession.planned_minutes} minutes
            </Text>
            <Text style={styles.salvagePercent}>
              {Math.round(progress * 100)}% complete
            </Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Session notes (optional)"
              placeholderTextColor={colors.text.disabled}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              multiline
            />
            <View style={styles.salvageActions}>
              <Button title="Complete" onPress={handleComplete} variant="gradient" size="md" />
              <Button title="Cancel" onPress={() => setShowSalvage(false)} variant="ghost" size="sm" />
            </View>
          </View>
        </BlurView>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  setupTitle: { ...typography.headline, color: colors.text.primary, marginBottom: spacing.lg },
  activeMissionBanner: {
    backgroundColor: colors.brand[500] + '15', borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.brand[500] + '30',
  },
  activeMissionLabel: { ...typography.labelSmall, color: colors.brand[400], marginBottom: 2 },
  activeMissionTitle: { ...typography.h3, color: colors.text.primary },
  durationLabel: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.sm },
  durationRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', marginBottom: spacing.lg },
  durationChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.bg.surface, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  durationChipText: { ...typography.bodyMedium, color: colors.text.tertiary },
  bodyDoubleHint: { ...typography.caption, color: colors.text.disabled },

  liveContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  missionContext: { alignItems: 'center', marginBottom: spacing.xl },
  missionTitle: { ...typography.h2, color: colors.text.primary, textAlign: 'center' },
  microTitle: { ...typography.bodyMedium, color: colors.brand[400], marginTop: spacing.xs },
  timerContainer: { marginBottom: spacing.xl },
  timerDisplay: { alignItems: 'center' },
  distractionCounter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accent.pink + '15', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: radius.full, marginBottom: spacing.md,
  },
  distractionCountText: { ...typography.caption, color: colors.accent.pink },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  mainBtn: shadows.glow as ViewStyle,
  captureBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginTop: spacing.md, padding: spacing.sm,
  },
  captureBtnText: { ...typography.caption, color: colors.text.tertiary },
  distractionInput: {
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.border.subtle,
  },
  distractionTextInput: { ...typography.bodyMedium, color: colors.text.primary, minHeight: 40 },
  distractionActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  captureSubmit: { ...typography.bodyMedium, color: colors.brand[400], fontWeight: '600' },

  salvageOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  salvageModal: {
    backgroundColor: colors.bg.card, borderRadius: radius.xxl,
    padding: spacing.xl, width: '100%', maxWidth: 360,
    borderWidth: 1, borderColor: colors.border.default,
  },
  salvageTitle: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.sm },
  salvageProgress: { ...typography.h3, color: colors.brand[400], fontSize: 24 },
  salvagePercent: { ...typography.bodyMedium, color: colors.text.tertiary, marginBottom: spacing.lg },
  notesInput: {
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg, color: colors.text.primary,
    ...typography.bodyMedium, minHeight: 60, textAlignVertical: 'top',
    borderWidth: 1, borderColor: colors.border.subtle,
  },
  salvageActions: { gap: spacing.sm },
  socialProofContainer: {
    position: 'absolute', bottom: 100, left: spacing.lg, right: spacing.lg,
    backgroundColor: colors.bg.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: 1, borderColor: colors.brand[500] + '30',
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 4,
  },
  socialProofText: { ...typography.bodySmall, color: colors.text.secondary, flex: 1 },
  socialProofDismiss: { ...typography.bodyMedium, color: colors.text.disabled },
  activationContainer: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xl, backgroundColor: 'rgba(0,0,0,0.7)',
  },
  activationMessage: { ...typography.h2, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md },
  activationSubmessage: { ...typography.bodyMedium, color: colors.text.tertiary, textAlign: 'center', marginBottom: spacing.xl },
  activationDismiss: {
    backgroundColor: colors.brand[500], borderRadius: radius.lg,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  activationDismissText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '700' },
})
