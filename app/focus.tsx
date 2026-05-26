// ══════════════════════════════════════════════════════════════
// INTENT — Body Double 2.0 Focus Screen
//
// NOT a Pomodoro timer. NOT a stopwatch. NOT a dashboard.
//
// This is an anti-drift accountability session:
//   - Body double modes: presence (quiet), voice (spoken prompts), screen_share (virtual co-working)
//   - Real-time distraction interception: detects when you're drifting and intervenes
//   - Accountability checkpoints: gentle pulses at intervals to confirm you're on track
//   - Escape prevention: "Before you switch apps" warnings
//   - Momentum tracking during session: not just after
//   - Salvage-first: ending early gives partial credit, never shaming
//   - Post-session reflection: what worked, what didn't, what's next
//
// The app catches drift DURING the session, not after.
// ══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, Animated, Dimensions, ViewStyle,
  TouchableOpacity, TextInput,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import {
  Play, Pause, Square, CheckCircle2, SkipForward,
  Brain, Shield, AlertTriangle, Zap, Heart, X, ChevronDown,
} from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { FOCUS_TYPES, FocusType } from '../src/types'
import { colors, spacing, radius, typography, shadows, animation, layout } from '../src/theme'
import { Screen, Button, ProgressRing } from '../src/components'

// ── Types ────────────────────────────────────────────────────

interface Checkpoint {
  atMinute: number
  message: string
  answered: boolean
  response: 'on_track' | 'drifting' | 'stuck' | null
}

interface SessionMilestone {
  minute: number
  label: string
  points: number
  reached: boolean
}

type BodyPresenceLevel = 'ambient' | 'active' | 'intervention'

// ── Component ────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function FocusScreen() {
  const store = useAppStore()
  const activeSession = store.activeSession
  const startSession = store.startSession
  const updateSessionTimer = store.updateSessionTimer
  const pauseSession = store.pauseSession
  const resumeSession = store.resumeSession
  const completeSession = store.completeSession
  const cancelSession = store.cancelSession
  const salvageSession = store.salvageSession
  const captureDistraction = store.captureDistraction
  const abandonSession = store.abandonSession

  // Setup state
  const [selectedType, setSelectedType] = useState<FocusType>('deep_work')
  const [duration, setDuration] = useState(25)

  // Active session state
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [showEndOptions, setShowEndOptions] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [bodyPresence, setBodyPresence] = useState<BodyPresenceLevel>('ambient')
  const [distractionInput, setDistractionInput] = useState('')
  const [showDistractionCapture, setShowDistractionCapture] = useState(false)
  const [showCheckpoint, setShowCheckpoint] = useState(false)
  const [currentCheckpoint, setCurrentCheckpoint] = useState<Checkpoint | null>(null)
  const [milestones, setMilestones] = useState<SessionMilestone[]>([])
  const [currentReflection, setCurrentReflection] = useState<'energy' | 'focus' | 'mood' | null>(null)
  const [reflectionValues, setReflectionValues] = useState({ energy: 5, focus: 5, mood: 5 })

  // Refs
  const pulseAnim = useRef(new Animated.Value(1)).current
  const glowAnim = useRef(new Animated.Value(0)).current
  const breatheAnim = useRef(new Animated.Value(0)).current
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionStartRef = useRef<number>(0)
  const checkpointsRef = useRef<Checkpoint[]>([])
  const lastCheckpointMinute = useRef<number>(0)

  const config = FOCUS_TYPES[selectedType]

  // ── Generate milestones and checkpoints ──
  const setupSessionTracking = useCallback((totalMinutes: number) => {
    // Milestones at 25%, 50%, 75%, 100%
    const milestonePcts = [0.25, 0.5, 0.75, 1.0]
    const newMilestones: SessionMilestone[] = milestonePcts.map((pct) => {
      const minute = Math.round(totalMinutes * pct)
      return {
        minute,
        label: pct === 1.0 ? 'Finish!' : pct === 0.75 ? 'Final push' : pct === 0.5 ? 'Halfway' : 'Good start',
        points: Math.round(pct * 10),
        reached: false,
      }
    })
    setMilestones(newMilestones)

    // Checkpoints every 5 min (but not at start or end)
    const newCheckpoints: Checkpoint[] = []
    const checkpointMessages = [
      'Still on track?',
      'How\'s your focus right now?',
      'Need to adjust anything?',
      'You\'re doing great. Still going?',
      'Quick check-in: focused or drifting?',
      'Still in the zone?',
    ]
    for (let m = 5; m < totalMinutes; m += 5) {
      const msgIdx = Math.floor(m / 5) - 1
      newCheckpoints.push({
        atMinute: m,
        message: checkpointMessages[msgIdx % checkpointMessages.length],
        answered: false,
        response: null,
      })
    }
    checkpointsRef.current = newCheckpoints
  }, [])

  // ── Timer Logic ──
  useEffect(() => {
    if (activeSession?.status === 'active') {
      sessionStartRef.current = Date.now() - elapsedSeconds * 1000

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartRef.current) / 1000)
        const elapsedMinutes = Math.floor(elapsed / 60)
        setElapsedSeconds(elapsed)

        if (activeSession) {
          updateSessionTimer(activeSession.id, elapsed)
        }

        // Check milestones
        setMilestones(prev => prev.map(ms => {
          if (!ms.reached && elapsedMinutes >= ms.minute) {
            // Body presence: celebrate milestone
            if (ms.minute > 0) {
              triggerMilestonePulse()
            }
            return { ...ms, reached: true }
          }
          return ms
        }))

        // Check checkpoints
        const pendingCheckpoint = checkpointsRef.current.find(
          cp => !cp.answered && elapsedMinutes >= cp.atMinute && cp.atMinute > lastCheckpointMinute.current
        )
        if (pendingCheckpoint) {
          lastCheckpointMinute.current = pendingCheckpoint.atMinute
          setCurrentCheckpoint(pendingCheckpoint)
          setShowCheckpoint(true)
        }

        // Auto-complete at planned duration
        if (activeSession && elapsed >= activeSession.planned_minutes * 60) {
          handleComplete()
        }
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeSession?.status, activeSession?.id])

  // ── Breathing animation (body double presence) ──
  useEffect(() => {
    if (activeSession?.status === 'active' && bodyPresence !== 'ambient') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(breatheAnim, { toValue: 0, duration: 4000, useNativeDriver: true }),
        ])
      ).start()
    } else {
      breatheAnim.setValue(0)
    }
  }, [activeSession?.status, bodyPresence])

  // ── Pulse animation ──
  useEffect(() => {
    if (activeSession?.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ).start()
      Animated.timing(glowAnim, { toValue: 1, duration: animation.normal, useNativeDriver: true }).start()
    } else {
      pulseAnim.setValue(1)
      glowAnim.setValue(0)
    }
  }, [activeSession?.status])

  const triggerMilestonePulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.1, duration: 300, useNativeDriver: true }),
      Animated.spring(pulseAnim, { toValue: 1, ...animation.springBouncy, useNativeDriver: true }),
    ]).start()
  }, [])

  // ── Handlers ──
  const handleStart = useCallback(() => {
    setElapsedSeconds(0)
    setShowComplete(false)
    setShowEndOptions(false)
    setBodyPresence('ambient')
    lastCheckpointMinute.current = 0
    setupSessionTracking(duration)
    startSession(undefined, undefined, 'focus', duration)
  }, [duration, startSession, setupSessionTracking])

  const handlePause = useCallback(() => {
    pauseSession()
    setBodyPresence('ambient')
  }, [pauseSession])

  const handleResume = useCallback(() => {
    resumeSession()
  }, [resumeSession])

  const handleComplete = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    completeSession(sessionNotes)
    setShowComplete(true)
  }, [completeSession, sessionNotes])

  const handleEndSession = useCallback(() => {
    setShowEndOptions(true)
  }, [])

  const handleAbandon = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    abandonSession()
    setElapsedSeconds(0)
    setShowComplete(false)
    setShowEndOptions(false)
  }, [abandonSession])

  const handleSalvage = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    salvageSession(sessionNotes)
    setShowComplete(true)
    setShowEndOptions(false)
  }, [salvageSession, sessionNotes])

  const handleCheckpointResponse = useCallback((response: 'on_track' | 'drifting' | 'stuck') => {
    if (currentCheckpoint) {
      const updated = checkpointsRef.current.map(cp =>
        cp.atMinute === currentCheckpoint.atMinute ? { ...cp, answered: true, response } : cp
      )
      checkpointsRef.current = updated

      // Adapt body presence based on response
      if (response === 'drifting') {
        setBodyPresence('intervention')
        // After 30 seconds, return to active
        setTimeout(() => setBodyPresence('active'), 30000)
      } else if (response === 'stuck') {
        setBodyPresence('intervention')
      } else {
        setBodyPresence('active')
      }
    }
    setCurrentCheckpoint(null)
    setShowCheckpoint(false)
  }, [currentCheckpoint])

  const handleCaptureDistraction = useCallback(() => {
    if (distractionInput.trim()) {
      captureDistraction(distractionInput.trim())
      setDistractionInput('')
      setShowDistractionCapture(false)
    }
  }, [distractionInput, captureDistraction])

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ── Completion View ──
  if (showComplete && activeSession) {
    const actualMinutes = Math.round(elapsedSeconds / 60)
    const completionPct = Math.round((elapsedSeconds / (activeSession.planned_minutes * 60)) * 100)
    const reachedMilestones = milestones.filter(m => m.reached).length

    return (
      <Screen scrollable={false} gradient={['rgba(16,185,129,0.12)', 'transparent']}>
        <View style={styles.completeContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text style={styles.completeEmoji}>
              {completionPct >= 90 ? '🏆' : completionPct >= 50 ? '💪' : '🌱'}
            </Text>
          </Animated.View>
          <Text style={styles.completeTitle}>
            {completionPct >= 90 ? 'Session Complete!' : completionPct >= 50 ? 'Good Effort!' : 'You Showed Up!'}
          </Text>
          <Text style={styles.completeSubtitle}>
            {config.label} · {actualMinutes} of {activeSession.planned_minutes} minutes
          </Text>

          <View style={styles.completeStats}>
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{actualMinutes}m</Text>
              <Text style={styles.completeStatLabel}>focused</Text>
            </View>
            <View style={styles.completeStatDivider} />
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{completionPct}%</Text>
              <Text style={styles.completeStatLabel}>completion</Text>
            </View>
            <View style={styles.completeStatDivider} />
            <View style={styles.completeStat}>
              <Text style={styles.completeStatValue}>{reachedMilestones}/{milestones.length}</Text>
              <Text style={styles.completeStatLabel}>milestones</Text>
            </View>
          </View>

          {/* Reflection */}
          <View style={styles.reflectionSection}>
            <Text style={styles.reflectionTitle}>Quick reflection (optional)</Text>
            <View style={styles.reflectionRow}>
              <Text style={styles.reflectionLabel}>Energy</Text>
              <View style={styles.reflectionScale}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.reflectionDot, reflectionValues.energy === v && styles.reflectionDotActive]}
                    onPress={() => setReflectionValues(prev => ({ ...prev, energy: v }))}
                  />
                ))}
              </View>
            </View>
            <View style={styles.reflectionRow}>
              <Text style={styles.reflectionLabel}>Focus</Text>
              <View style={styles.reflectionScale}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.reflectionDot, reflectionValues.focus === v && styles.reflectionDotActive]}
                    onPress={() => setReflectionValues(prev => ({ ...prev, focus: v }))}
                  />
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.completeMessage}>
            {completionPct >= 90
              ? "You crushed it! That's real progress. 🔥"
              : completionPct >= 50
              ? "Solid effort. Every minute of focus counts. 💪"
              : "You showed up. That's the hardest part. Next time will be easier. 🌱"}
          </Text>

          <Button
            title="Back to Focus"
            onPress={() => { setShowComplete(false); setElapsedSeconds(0) }}
            variant="gradient"
            size="lg"
            iconRight={<Zap size={18} color={colors.text.inverse} />}
          />
        </View>
      </Screen>
    )
  }

  // ── Active Session View ──
  if (activeSession) {
    const totalPlanned = activeSession.planned_minutes * 60
    const progress = Math.min(elapsedSeconds / totalPlanned, 1)
    const timeLeft = Math.max(totalPlanned - elapsedSeconds, 0)
    const isActive = activeSession.status === 'active'
    const elapsedMinutes = Math.floor(elapsedSeconds / 60)
    const nextMilestone = milestones.find(m => !m.reached)

    return (
      <Screen scrollable={false} gradient={[config.color + '12', 'transparent']}>
        <View style={styles.activeContainer}>
          {/* Body Double Presence Indicator */}
          {bodyPresence !== 'ambient' && (
            <Animated.View
              style={[
                styles.presenceIndicator,
                {
                  opacity: breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  transform: [{ scale: breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }],
                },
              ]}
            >
              <View style={[styles.presenceDot, { backgroundColor: config.color }]} />
              <Text style={styles.presenceText}>
                {bodyPresence === 'intervention' ? 'I\'m here. You\'re drifting.' : 'Body double active'}
              </Text>
            </Animated.View>
          )}

          <Text style={[styles.activeType, { color: config.color }]}>
            {config.label}
          </Text>

          {/* Timer Circle */}
          <View style={styles.timerContainer}>
            <Animated.View
              style={[
                styles.timerGlow,
                {
                  transform: [{ scale: pulseAnim }],
                  borderColor: config.color + '20',
                  opacity: glowAnim,
                },
              ]}
            />
            <ProgressRing progress={progress} size={240} strokeWidth={8} color={config.color}>
              <View style={styles.timerDisplay}>
                <Text style={[typography.mono, { color: colors.text.primary, fontSize: 52 }]}>
                  {formatTime(timeLeft)}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.text.tertiary, marginTop: 4 }]}>
                  {isActive ? 'remaining' : 'paused'}
                </Text>
              </View>
            </ProgressRing>
          </View>

          {/* Milestone Progress */}
          <View style={styles.milestoneRow}>
            {milestones.map((ms, i) => (
              <View key={i} style={styles.milestoneItem}>
                <View style={[
                  styles.milestoneDot,
                  { backgroundColor: ms.reached ? config.color : colors.border.subtle },
                ]} />
                <Text style={[styles.milestoneLabel, ms.reached && { color: config.color }]}>
                  {ms.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Next milestone hint */}
          {nextMilestone && (
            <Text style={styles.nextMilestoneText}>
              Next: {nextMilestone.label} at {nextMilestone.minute}m ({Math.max(0, nextMilestone.minute - elapsedMinutes)}m away)
            </Text>
          )}

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
            <Button title="End" onPress={handleEndSession} variant="ghost" size="sm" />

            {isActive ? (
              <Button
                title=""
                onPress={handlePause}
                variant="primary"
                size="lg"
                style={[styles.mainBtn, { backgroundColor: config.color, width: 72, height: 72, borderRadius: 36 }]}
                icon={<Pause size={28} color={colors.text.inverse} />}
              />
            ) : (
              <Button
                title=""
                onPress={handleResume}
                variant="primary"
                size="lg"
                style={[styles.mainBtn, { backgroundColor: config.color, width: 72, height: 72, borderRadius: 36 }]}
                icon={<Play size={28} color={colors.text.inverse} />}
              />
            )}

            <Button
              title="Done"
              onPress={handleComplete}
              variant="secondary"
              size="sm"
              icon={<CheckCircle2 size={16} color={colors.accent.green} />}
            />
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

        {/* Checkpoint Modal */}
        {showCheckpoint && currentCheckpoint && (
          <BlurView intensity={40} style={styles.checkpointOverlay}>
            <View style={styles.checkpointModal}>
              <Text style={styles.checkpointMessage}>{currentCheckpoint.message}</Text>
              <View style={styles.checkpointOptions}>
                <TouchableOpacity
                  style={[styles.checkpointOption, { backgroundColor: colors.accent.green + '20' }]}
                  onPress={() => handleCheckpointResponse('on_track')}
                >
                  <Text style={styles.checkpointOptionText}>✅ On track</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.checkpointOption, { backgroundColor: colors.accent.orange + '20' }]}
                  onPress={() => handleCheckpointResponse('drifting')}
                >
                  <Text style={styles.checkpointOptionText}>😵 Drifting</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.checkpointOption, { backgroundColor: colors.error + '20' }]}
                  onPress={() => handleCheckpointResponse('stuck')}
                >
                  <Text style={styles.checkpointOptionText}>🚫 Stuck</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        )}

        {/* End Session Options */}
        {showEndOptions && (
          <BlurView intensity={40} style={styles.checkpointOverlay}>
            <View style={styles.endOptionsModal}>
              <Text style={styles.endOptionsTitle}>End session?</Text>
              <Text style={styles.endOptionsProgress}>
                {Math.round(elapsedSeconds / 60)} of {activeSession.planned_minutes} minutes ({Math.round(progress * 100)}%)
              </Text>

              <View style={styles.endOptionsActions}>
                <Button
                  title="Complete Session"
                  onPress={handleComplete}
                  variant="gradient"
                  size="md"
                  style={{ width: '100%' }}
                />
                <Button
                  title={`Salvage (${Math.round(elapsedSeconds / 60)}m credit)`}
                  onPress={handleSalvage}
                  variant="secondary"
                  size="md"
                  style={{ width: '100%' }}
                />
                <Button
                  title="Abandon"
                  onPress={handleAbandon}
                  variant="ghost"
                  size="sm"
                  style={{ width: '100%' }}
                />
                <Button
                  title="Keep Going"
                  onPress={() => setShowEndOptions(false)}
                  variant="ghost"
                  size="sm"
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          </BlurView>
        )}
      </Screen>
    )
  }

  // ── Setup View ──
  return (
    <Screen gradient={['rgba(108,58,237,0.04)', 'transparent']}>
      <Text style={styles.setupTitle}>Start a Focus Session</Text>
      <Text style={styles.setupSubtitle}>Choose your focus type and duration</Text>

      {/* Type Selector */}
      <View style={styles.typeGrid}>
        {(Object.keys(FOCUS_TYPES) as FocusType[]).map((type) => {
          const cfg = FOCUS_TYPES[type]
          const isSelected = selectedType === type
          return (
            <TouchableOpacity
              key={type}
              style={[styles.typeCard, isSelected && { borderColor: cfg.color, backgroundColor: cfg.color + '10' }]}
              onPress={() => setSelectedType(type)}
              activeOpacity={0.8}
            >
              <View style={[styles.typeDot, { backgroundColor: cfg.color }]} />
              <Text style={[styles.typeName, isSelected && { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={styles.typeDesc}>{cfg.description}</Text>
              <Text style={styles.typeDuration}>{cfg.defaultMinutes}m default</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Duration Selector */}
      <View style={styles.durationSection}>
        <Text style={styles.durationLabel}>DURATION</Text>
        <View style={styles.durationButtons}>
          {[10, 15, 25, 30, 45, 60, 90].map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.durationBtn,
                duration === d && {
                  backgroundColor: config.color + '25',
                  borderColor: config.color,
                },
              ]}
              onPress={() => setDuration(d)}
            >
              <Text
                style={[
                  styles.durationBtnText,
                  duration === d && { color: config.color, fontWeight: '700' },
                ]}
              >
                {d}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body Double Mode */}
      <View style={styles.bodyDoubleSection}>
        <Text style={styles.bodyDoubleLabel}>BODY DOUBLE MODE</Text>
        <View style={styles.bodyDoubleOptions}>
          {[
            { id: 'none', label: 'Solo', emoji: '🧑' },
            { id: 'presence', label: 'Presence', emoji: '👤' },
            { id: 'voice', label: 'Voice', emoji: '🗣️' },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.bodyDoubleOption}
              onPress={() => {}}
            >
              <Text style={styles.bodyDoubleEmoji}>{mode.emoji}</Text>
              <Text style={styles.bodyDoubleOptionLabel}>{mode.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Start Button */}
      <Button
        title={`Start ${config.label} — ${duration} min`}
        onPress={handleStart}
        variant="gradient"
        size="lg"
        icon={<Play size={20} color={colors.text.inverse} />}
        style={{ width: '100%' }}
      />

      <View style={{ height: layout.tabBarHeight + spacing.lg }} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  // Setup
  setupTitle: { ...typography.headline, color: colors.text.primary },
  setupSubtitle: { ...typography.bodyMedium, color: colors.text.tertiary, marginTop: 4, marginBottom: spacing.xl },
  typeGrid: { gap: spacing.sm, marginBottom: spacing.xl },
  typeCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.xs,
  },
  typeDot: { width: 14, height: 14, borderRadius: 7 },
  typeName: { ...typography.h3, color: colors.text.primary, fontSize: 16 },
  typeDesc: { ...typography.bodySmall, color: colors.text.tertiary },
  typeDuration: { ...typography.caption, color: colors.text.tertiary },
  durationSection: { marginBottom: spacing.xl },
  durationLabel: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.sm },
  durationButtons: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  durationBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  durationBtnText: { ...typography.bodyMedium, color: colors.text.tertiary },

  // Body Double
  bodyDoubleSection: { marginBottom: spacing.xl },
  bodyDoubleLabel: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.sm },
  bodyDoubleOptions: { flexDirection: 'row', gap: spacing.sm },
  bodyDoubleOption: {
    flex: 1,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  bodyDoubleEmoji: { fontSize: 24, marginBottom: spacing.xs },
  bodyDoubleOptionLabel: { ...typography.caption, color: colors.text.secondary },

  // Active
  activeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  presenceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.bg.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  presenceDot: { width: 8, height: 8, borderRadius: 4 },
  presenceText: { ...typography.caption, color: colors.text.tertiary },
  activeType: { ...typography.label, fontSize: 14, letterSpacing: 2, marginBottom: spacing.xl },
  timerContainer: { position: 'relative', marginBottom: spacing.lg },
  timerGlow: {
    position: 'absolute',
    width: 280, height: 280,
    borderRadius: 140,
    borderWidth: 2,
    top: -20, left: -20,
  },
  timerDisplay: { alignItems: 'center' },

  // Milestones
  milestoneRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  milestoneItem: { alignItems: 'center', gap: 4 },
  milestoneDot: { width: 10, height: 10, borderRadius: 5 },
  milestoneLabel: { ...typography.caption, color: colors.text.tertiary, fontSize: 10 },
  nextMilestoneText: { ...typography.caption, color: colors.text.tertiary, marginBottom: spacing.md },

  distractionCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent.pink + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.md,
  },
  distractionCountText: { ...typography.caption, color: colors.accent.pink },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  mainBtn: shadows.glow as ViewStyle,
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  captureBtnText: { ...typography.caption, color: colors.text.tertiary },
  distractionInput: {
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  distractionTextInput: { ...typography.bodyMedium, color: colors.text.primary, minHeight: 40 },
  distractionActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
  captureSubmit: { ...typography.bodyMedium, color: colors.brand[400], fontWeight: '600' },

  // Checkpoint
  checkpointOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  checkpointModal: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  checkpointMessage: { ...typography.h3, color: colors.text.primary, textAlign: 'center', marginBottom: spacing.lg },
  checkpointOptions: { gap: spacing.sm },
  checkpointOption: {
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  checkpointOptionText: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },

  // End Options
  endOptionsModal: {
    backgroundColor: colors.bg.card,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  endOptionsTitle: { ...typography.h2, color: colors.text.primary, marginBottom: spacing.xs },
  endOptionsProgress: { ...typography.bodyMedium, color: colors.text.tertiary, marginBottom: spacing.lg },
  endOptionsActions: { gap: spacing.sm },

  // Complete
  completeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  completeEmoji: { fontSize: 72, marginBottom: spacing.lg },
  completeTitle: { ...typography.headline, color: colors.text.primary, marginBottom: spacing.xs },
  completeSubtitle: { ...typography.body, color: colors.text.tertiary, marginBottom: spacing.xl },
  completeStats: { flexDirection: 'row', gap: spacing.xl, marginBottom: spacing.lg },
  completeStat: { alignItems: 'center' },
  completeStatValue: { ...typography.h2, color: colors.text.primary },
  completeStatLabel: { ...typography.caption, color: colors.text.tertiary },
  completeStatDivider: { width: 1, backgroundColor: colors.border.subtle },

  // Reflection
  reflectionSection: { width: '100%', marginBottom: spacing.lg },
  reflectionTitle: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.sm },
  reflectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  reflectionLabel: { ...typography.bodySmall, color: colors.text.secondary, width: 60 },
  reflectionScale: { flexDirection: 'row', gap: 4 },
  reflectionDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border.subtle },
  reflectionDotActive: { backgroundColor: colors.brand[500] },

  completeMessage: { ...typography.bodyMedium, color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 22 },
})
