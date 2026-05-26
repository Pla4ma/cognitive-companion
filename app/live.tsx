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
import { Screen, Button, ProgressRing, ProPaywall } from '../src/components'
import { showSessionCompleteNotification, requestNotificationPermissionsWithContext } from '../src/services/notifications'
import { getSocialProofStat, getActivationCelebration } from '../src/services/retention/retentionEngine'
import type { UserState } from '../src/types'
import * as Haptics from 'expo-haptics'
import { usePostSessionFlow } from '../src/hooks/usePostSessionFlow'
import { useProgressiveProfiling } from '../src/hooks/useProgressiveProfiling'
import { ProgressiveProfiling } from '../src/components/ProgressiveProfiling'

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
  const sessionCount = useAppStore((s) => s.sessionCount)
  const plan = useAppStore((s) => s.user?.plan ?? 'free')

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showSalvage, setShowSalvage] = useState(false)
  const [distractionInput, setDistractionInput] = useState('')
  const [showDistractionCapture, setShowDistractionCapture] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState(10)
  const [sessionNotes, setSessionNotes] = useState('')
  const [socialProof, setSocialProof] = useState<string | null>(null)
  const [activationCelebration, setActivationCelebration] = useState<{ show: boolean; message: string; submessage: string } | null>(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const { postSessionState, startFlow, advanceMoment, skipToEnd } = usePostSessionFlow()

  // ── Progressive Profiling ──
  const profiling = useProgressiveProfiling()

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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
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
      // First rescue: request notification permission after celebration
      setTimeout(() => {
        void requestNotificationPermissionsWithContext()
      }, 3500)
    }

    // Paywall trigger: session 5 on free plan
    if (sessionCount >= 5 && plan === 'free') {
      setTimeout(() => setShowPaywall(true), 2000)
    }

    // Start post-session flow
    startFlow(activeSession ?? { mode: 'focus', actual_seconds: elapsedSeconds, planned_minutes: selectedDuration, status: 'completed' })
  }, [completeSession, sessionNotes, elapsedSeconds, activeSession, sessionCount, plan, startFlow, selectedDuration])

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setDistractionInput('')
      setShowDistractionCapture(false)
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
            <TouchableOpacity
              key={d}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedDuration === d }}
              accessibilityLabel={`${d} minutes`}
              style={[styles.durationChip, selectedDuration === d && styles.durationChipActive]}
              onPress={() => { setSelectedDuration(d); Haptics.selectionAsync() }}
            >
              <Text style={[styles.durationChipText, selectedDuration === d && styles.durationChipTextActive]}>{d}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Start Mission"
          onPress={() => startSession(activeMission?.id, activeMicro?.id, 'focus', selectedDuration)}
          variant="gradient"
          size="lg"
          style={{ width: '100%', marginTop: spacing.lg }}
        />

        <Button
          title="Just Show Me the Timer"
          onPress={() => startSession(undefined, undefined, 'focus', Math.min(selectedDuration, 5))}
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
              <Text accessibilityRole="timer" accessibilityLabel={`${Math.floor(timeLeft / 60)} minutes and ${timeLeft % 60} seconds remaining`} style={[typography.mono, { color: colors.text.primary, fontSize: 48 }]}
                adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1}>
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
          <Button title="End" onPress={handleAbandon} variant="ghost" size="sm" accessibilityLabel="End session early" />
          {isActive ? (
            <Button title="" onPress={pauseSession} variant="primary" size="lg" accessibilityLabel="Pause session"
              style={[styles.mainBtn, { width: 72, height: 72, borderRadius: 36 }]}
              icon={<Pause size={28} color={colors.text.inverse} />} />
          ) : (
            <Button title="" onPress={resumeSession} variant="primary" size="lg" accessibilityLabel="Resume session"
              style={[styles.mainBtn, { width: 72, height: 72, borderRadius: 36 }]}
              icon={<Play size={28} color={colors.text.inverse} />} />
          )}
          <Button title="Done" onPress={() => setShowSalvage(true)} variant="secondary" size="sm" accessibilityLabel="Complete session"
            icon={<CheckCircle2 size={16} color={colors.accent.green} />} />
        </View>

        {/* Capture Distraction */}
        {!showDistractionCapture ? (
          <TouchableOpacity style={styles.captureBtn} onPress={() => setShowDistractionCapture(true)} accessibilityLabel="Capture a distraction">
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

      {/* Post-Session Flow */}
      {postSessionState.currentMoment && !showSalvage && (
        <View style={styles.postSessionOverlay}>
          <PostSessionMomentRenderer
            moment={postSessionState.currentMoment}
            onAdvance={advanceMoment}
            onSkip={skipToEnd}
            onGoHome={() => { skipToEnd(); router.push('/') }}
            onAnotherRescue={() => { skipToEnd(); router.push('/') }}
          />
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

      {showPaywall && (
        <ProPaywall
          trigger="session_5"
          visible={showPaywall}
          onDismiss={() => setShowPaywall(false)}
          onSuccess={() => setShowPaywall(false)}
        />
      )}

      {/* Progressive Profiling Modal */}
      {profiling.shouldShow && profiling.questionType && (
        <ProgressiveProfiling
          questionType={profiling.questionType as 'work_type' | 'struggle_time' | 'biggest_project'}
          onComplete={profiling.handleAnswer}
          onDismiss={profiling.handleDismiss}
        />
      )}
    </Screen>
  )
}

// ── Post-Session Moment Renderer ─────────────────────────────

function PostSessionMomentRenderer({ moment, onAdvance, onSkip, onGoHome, onAnotherRescue }: {
  moment: import('../src/hooks/usePostSessionFlow').PostSessionMomentConfig
  onAdvance: () => void
  onSkip: () => void
  onGoHome: () => void
  onAnotherRescue: () => void
}) {
  const renderContent = () => {
    switch (moment.moment) {
      case 'activation_celebration':
        return (
          <>
            <Text style={styles.momentTitle}>{(moment.data.message as string) ?? 'You did it!'}</Text>
            <Text style={styles.momentSub}>{(moment.data.submessage as string) ?? 'First rescue complete.'}</Text>
          </>
        )
      case 'social_proof':
        return (
          <>
            <Text style={styles.momentProof}>{(moment.data.proof as string) ?? ''}</Text>
          </>
        )
      case 'comeback_acknowledgment':
        return (
          <>
            <Text style={styles.momentTitle}>Welcome back.</Text>
            <Text style={styles.momentSub}>{(moment.data.message as string) ?? ''}</Text>
          </>
        )
      case 'momentum_update':
        return (
          <>
            <Text style={styles.momentTitle}>Momentum building.</Text>
            <Text style={styles.momentSub}>{(moment.data.summary as string) ?? ''}</Text>
          </>
        )
      case 'next_action_prompt':
        return (
          <>
            <Text style={styles.momentTitle}>What's next?</Text>
            <Text style={styles.momentSub}>{(moment.data.prompt as string) ?? 'Another rescue, or close for now.'}</Text>
          </>
        )
      case 'brain_dump_prompt':
        return (
          <>
            <Text style={styles.momentTitle}>Brain dump?</Text>
            <Text style={styles.momentSub}>
              {(moment.data.message as string) ?? 'You have pending items. Turn them into missions?'}
            </Text>
          </>
        )
      case 'weekly_narrative':
        return (
          <>
            <Text style={styles.momentTitle}>Your week</Text>
            <Text style={styles.momentSub}>{(moment.data.message as string) ?? ''}</Text>
          </>
        )
      case 'day_milestone':
        return (
          <>
            <Text style={styles.momentTitle}>{(moment.data.message as string) ?? ''}</Text>
            <Text style={styles.momentSub}>{(moment.data.submessage as string) ?? ''}</Text>
          </>
        )
      case 'activation_celebration':
        return (
          <>
            <Text style={styles.momentTitle}>{(moment.data.message as string) ?? 'You did it!'}</Text>
            <Text style={styles.momentSub}>{(moment.data.submessage as string) ?? 'First rescue complete.'}</Text>
          </>
        )
      default:
        return (
          <>
            <Text style={styles.momentTitle}>{(moment.data.title as string) ?? ''}</Text>
            <Text style={styles.momentSub}>{(moment.data.body as string) ?? ''}</Text>
          </>
        )
    }
  }

  return (
    <View style={styles.momentContainer}>
      {renderContent()}
      <View style={styles.momentActions}>
        {moment.moment === 'next_action_prompt' ? (
          <>
            <TouchableOpacity onPress={onGoHome} style={styles.momentBtn}>
              <Text style={styles.momentBtnText}>Go Home</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAnotherRescue} style={[styles.momentBtn, { backgroundColor: colors.accent.green }]}>
              <Text style={styles.momentBtnText}>Another Rescue</Text>
            </TouchableOpacity>
          </>
        ) : moment.requiresInteraction ? (
          <TouchableOpacity onPress={onAdvance} style={styles.momentBtn}>
            <Text style={styles.momentBtnText}>Continue</Text>
          </TouchableOpacity>
        ) : null}
        {moment.moment !== 'next_action_prompt' && (
          <TouchableOpacity onPress={onSkip} style={styles.momentSkip}>
            <Text style={styles.momentSkipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.momentProgress}>{(moment.data.currentIndex as number ?? 0) + 1} / {moment.data.totalCount ?? 1}</Text>
    </View>
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
  durationChipActive: { borderColor: colors.brand[400], backgroundColor: colors.brand[400] + '15' },
  durationChipTextActive: { color: colors.brand[400], fontWeight: '600' },
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

  // Post-Session Flow
  postSessionOverlay: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xl, backgroundColor: 'rgba(0,0,0,0.75)',
  },
  momentContainer: { alignItems: 'center', padding: spacing.xl },
  momentTitle: { ...typography.h2, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.md },
  momentSub: { ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl },
  momentProof: { ...typography.bodyLarge, color: colors.text.primary, textAlign: 'center', fontStyle: 'italic', marginBottom: spacing.xl },
  momentActions: { flexDirection: 'row', gap: spacing.md },
  momentBtn: { backgroundColor: colors.brand[500], borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  momentBtnText: { ...typography.bodyMedium, color: colors.text.inverse, fontWeight: '700' },
  momentSkip: { padding: spacing.md },
  momentSkipText: { ...typography.bodySmall, color: colors.text.disabled },
  momentProgress: { ...typography.caption, color: colors.text.disabled, marginTop: spacing.md },
})
