// ══════════════════════════════════════════════════════════════
// INTENT — Action-First Coach Screen v3
//
// NOT a chatbot. Not a persona. Not a chat screen.
//
// This is an action-first agent interface:
//   - Surfaces mission-aware suggestions before the user types
//   - Offers tool-connected actions (break down mission, start body double, etc.)
//   - Shows the user's current drift prediction and danger windows
//   - Adapts tone based on push style AND current risk level
//   - Short, actionable responses — never walls of text
//
// The coach is a tool, not a friend. It helps you move.
// ══════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, TouchableOpacity, Animated, LayoutAnimation,
} from 'react-native'
import { BlurView } from 'expo-blur'
import {
  Send, Trash2, Lightbulb, Target, Zap, Brain,
  Shield, TrendingUp, AlertTriangle, Clock, ChevronRight, Mic, MicOff,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useAppStore } from '../../src/store'
import { UserState, Mission, MicroMission } from '../../src/types'
import {
  predictDrift, buildIntelligenceProfile, DriftPrediction,
  DangerWindow, UserIntelligenceProfile,
} from '../../src/engine'
import { coachStreamResponse, CoachContext } from '../../src/services/ai'
import { DEFAULT_PRIVACY_SETTINGS } from '../../src/types/privacy'
import { useAIQuota } from '../../src/hooks/useAIQuota'
import { colors, spacing, radius, typography, shadows } from '../../src/theme'
import { HapticPatterns } from '../../src/services/haptics'
import { motion, getAnimationDuration } from '../../src/theme/motion'
import { announceForScreenReader } from '../../src/utils/accessibility'
import { Screen, Card, Button, EmptyState } from '../../src/components'
import { isOnline } from '../../src/services/connectivity'
import { handleAIError, formatUserFacingError } from '../../src/services/errorHandling'
import { useOfflineCapable } from '../../src/hooks/useOfflineCapable'

// ── Types ────────────────────────────────────────────────────

interface ActionSuggestion {
  id: string
  type: 'break_down' | 'start_session' | 'body_double' | 'brain_dump' | 'salvage' | 'simplify' | 'danger_alert'
  title: string
  subtitle: string
  icon: LucideIcon
  color: string
  priority: number
  onPress: () => void
}

interface CoachMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  actionTaken?: string
}

// ── Component ────────────────────────────────────────────────

export default function CoachScreen() {
  const user = useAppStore(s => s.user)
  const sessions = useAppStore(s => s.sessions)
  const missions = useAppStore(s => s.missions)
  const microMissions = useAppStore(s => s.microMissions)
  const momentumEvents = useAppStore(s => s.momentumEvents)
  const resistancePatterns = useAppStore(s => s.resistancePatterns)
  const distractions = useAppStore(s => s.distractions)
  const brainDumps = useAppStore(s => s.brainDumps)
  const getFeatures = useAppStore(s => s.getFeatures)
  const features = getFeatures()
  const startSession = useAppStore(s => s.startSession)
  const addMission = useAppStore(s => s.addMission)
  const addMicroMission = useAppStore(s => s.addMicroMission)
  const consentLedger = useAppStore(s => s.consentLedger)
  const aiQuota = useAIQuota()
  const { canUseAI, canRescue, isOnline: onlineStatus, offlineMessage } = useOfflineCapable()

  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [actionsExpanded, setActionsExpanded] = useState(true)
  const scrollRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  // ── Predictive Intelligence ──
  const prediction = useMemo<DriftPrediction | null>(() => {
    if (sessions.length < 2) return null
    try {
      return predictDrift({
        sessions,
        patterns: resistancePatterns,
        distractions,
        momentumEvents,
        missions,
        microMissions,
        brainDumps,
      })
    } catch {
      return null
    }
  }, [sessions, resistancePatterns, distractions, momentumEvents, missions, microMissions, brainDumps])

  const profile = useMemo<UserIntelligenceProfile | null>(() => {
    if (sessions.length < 3) return null
    try {
      return buildIntelligenceProfile({
        sessions,
        patterns: resistancePatterns,
        distractions,
        momentumEvents,
        missions,
        microMissions,
        brainDumps,
      })
    } catch {
      return null
    }
  }, [sessions, resistancePatterns, distractions, momentumEvents, missions, microMissions, brainDumps])

  // ── Action Suggestions ──
  const actionSuggestions = useMemo<ActionSuggestion[]>(() => {
    const suggestions: ActionSuggestion[] = []
    const activeMissions = missions.filter(m => m.status === 'active')

    // Danger alert — highest priority
    if (prediction && (prediction.currentRiskLevel === 'high' || prediction.currentRiskLevel === 'critical')) {
      // Haptic alert when drift danger is detected
      HapticPatterns.rescue()
      suggestions.push({
        id: 'danger_alert',
        type: 'danger_alert',
        title: 'You\'re in a high-risk window',
        subtitle: prediction.recommendedAction,
        icon: AlertTriangle,
        color: colors.error,
        priority: 100,
        onPress: () => {
          startSession(undefined, undefined, 'focus', 2)
          addSystemMessage('Started a 2-minute rescue session. Just open the thing you\'re avoiding.')
        },
      })
    }

    // Break down a mission
    if (activeMissions.length > 0) {
      const stuckMission = activeMissions.find(m => m.avoidance_state === 'overwhelmed' || m.avoidance_state === 'stuck')
      if (stuckMission) {
        suggestions.push({
          id: 'break_down',
          type: 'break_down',
          title: `Break down: ${stuckMission.title}`,
          subtitle: 'Split this mission into smaller steps',
          icon: Target,
          color: colors.brand[500],
          priority: 80,
          onPress: () => handleBreakDownMission(stuckMission),
        })
      }
    }

    // Start a quick session
    suggestions.push({
      id: 'start_session',
      type: 'start_session',
      title: 'Start a 5-minute session',
      subtitle: 'Just 5 minutes. That\'s all it takes.',
      icon: Zap,
      color: colors.accent.green,
      priority: 60,
      onPress: () => {
        startSession(undefined, undefined, 'focus', 5)
        addSystemMessage('Started a 5-minute focus session. Go!')
      },
    })

    // Body double
    suggestions.push({
      id: 'body_double',
      type: 'body_double',
      title: 'Body Double Mode',
      subtitle: 'Virtual co-working. Stay accountable.',
      icon: Shield,
      color: colors.accent.pink,
      priority: 50,
      onPress: () => {
        startSession(undefined, undefined, 'body_double', 10)
        addSystemMessage('Body double mode activated. I\'m right here with you.')
      },
    })

    // Brain dump
    suggestions.push({
      id: 'brain_dump',
      type: 'brain_dump',
      title: 'Brain Dump',
      subtitle: 'Get everything out of your head',
      icon: Brain,
      color: colors.accent.orange,
      priority: 40,
      onPress: () => {
        addSystemMessage('What\'s on your mind? Just type it all out — I\'ll help you sort it.')
      },
    })

    // Salvage if there are abandoned sessions
    const recentAbandoned = sessions.filter(s => {
      const hoursAgo = (Date.now() - new Date(s.started_at).getTime()) / 3600000
      return s.status === 'abandoned' && hoursAgo < 24
    })
    if (recentAbandoned.length > 0) {
      suggestions.push({
        id: 'salvage',
        type: 'salvage',
        title: `Salvage ${recentAbandoned.length} abandoned session${recentAbandoned.length > 1 ? 's' : ''}`,
        subtitle: 'Your effort still counts',
        icon: TrendingUp,
        color: colors.accent.cyan,
        priority: 70,
        onPress: () => {
          addSystemMessage('You didn\'t fail — you just stopped. Let\'s pick up where you left off.')
        },
      })
    }

    return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 4)
  }, [prediction, missions, sessions, startSession])

  // ── Helpers ──
  const addSystemMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      role: 'system',
      content,
      timestamp: new Date().toISOString(),
    }])
  }, [])

  const handleBreakDownMission = useCallback((mission: Mission) => {
    // Generate micro-missions via AI
    addSystemMessage(`Breaking down "${mission.title}" into smaller steps...`)
    // In a real implementation, this would call the AI service
    // For now, create some default micro-missions
    const steps = [
      'Open the project/file and just look at it for 2 minutes',
      'Write down the very next physical action needed',
      'Do that one action — nothing else',
    ]
    steps.forEach((step, i) => {
      addMicroMission(mission.id, step, '', 5)
    })
    addSystemMessage(`Created ${steps.length} micro-steps. Start with step 1 — just open the thing.`)
  }, [addMicroMission, addSystemMessage])

  // ── AI Chat ──
  const contextData = useMemo(() => ({
    userName: user?.display_name || 'friend',
    pushStyle: user?.push_style ?? 'gentle' as const,
    currentMomentum: momentumEvents.filter(e => {
      const weekAgo = Date.now() - 7 * 86400000
      return new Date(e.created_at).getTime() >= weekAgo
    }).reduce((s, e) => s + e.points, 0),
    activeMissions: missions.filter(m => m.status === 'active').length,
    todayMinutes: Math.round(
      sessions.filter(s => {
        const today = new Date().toISOString().slice(0, 10)
        return s.started_at.slice(0, 10) === today && (s.status === 'completed' || s.status === 'salvaged')
      }).reduce((sum, s) => sum + s.actual_seconds, 0) / 60
    ),
    currentStreak: 0,
    recentAvoidance: prediction?.mostLikelyState || null,
    driftRisk: prediction?.currentRiskLevel || 'low',
    dangerWindows: profile?.dangerWindows.length || 0,
    sessionCount: sessions.length,
  }), [user, momentumEvents, missions, sessions, prediction, profile])

  useEffect(() => {
    if (isStreaming || messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length, isStreaming, streamingText])

  // ── Cleanup streaming timeout on unmount ──
  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  // ── Voice Input ──
  // TODO: Install @react-native-voice/voice for real speech-to-text.
  // For now, this is a stub that logs intent and toggles visual state.
  const toggleVoiceInput = useCallback(async () => {
    if (isListening) {
      // Stop listening
      setIsListening(false)
      console.log('[VoiceInput] Stopped listening (stub)')
    } else {
      // Start listening
      setIsListening(true)
      console.log('[VoiceInput] Started listening (stub)')
      // TODO: When @react-native-voice/voice is installed:
      //   import Voice from '@react-native-voice/voice'
      //   Voice.onSpeechResults = (e) => setInputText(e.value?.[0] ?? '')
      //   Voice.onSpeechEnd = () => setIsListening(false)
      //   await Voice.start('en-US')
      // Simulate auto-stop after 5 seconds for visual feedback
      setTimeout(() => {
        setIsListening(false)
        console.log('[VoiceInput] Auto-stopped (stub — install @react-native-voice/voice for real STT)')
      }, 5000)
    }
  }, [isListening])

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isStreaming || !canUseAI) return

    HapticPatterns.tap()
    // ── AI daily limit enforcement ──
    if (!aiQuota.canSendMessage) {
      setMessages(prev => [...prev, {
        id: `quota-${Date.now()}`,
        role: 'system',
        content: `You've reached your daily AI message limit (${aiQuota.messagesRemaining} remaining). Upgrade to Pro for unlimited coaching.`,
        timestamp: new Date().toISOString(),
      }])
      return
    }

    const userMessage = inputText.trim()
    const newUserMsg: CoachMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newUserMsg])
    setInputText('')
    setIsStreaming(true)
    setStreamingText('')
    setActionsExpanded(false)

    // Increment quota count
    aiQuota.incrementMessages()

    const conversationHistory = messages.slice(-15).map(m => ({
      id: m.id,
      user_id: user?.id ?? '',
      role: m.role === 'system' ? 'assistant' as const : m.role,
      content: m.content,
      metadata: {},
      created_at: m.timestamp,
    }))

    // Build CoachContext for the orchestrator
    const coachContext: CoachContext = {
      userName: contextData.userName,
      pushStyle: contextData.pushStyle,
      currentMomentum: contextData.currentMomentum,
      activeMissions: contextData.activeMissions,
      todayMinutes: contextData.todayMinutes,
      currentStreak: contextData.currentStreak,
      recentAvoidance: contextData.recentAvoidance,
      driftRisk: contextData.driftRisk,
      dangerWindows: contextData.dangerWindows,
      sessionCount: contextData.sessionCount,
    }

    try {
      // 30-second streaming timeout
      timeoutRef.current = setTimeout(() => {
        const timeoutError = formatUserFacingError('The AI coach timed out.')
        setIsStreaming(false)
        setStreamingText('')
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `${timeoutError.message}${timeoutError.action ? ` ${timeoutError.action}?` : ''}`,
          timestamp: new Date().toISOString(),
        }])
      }, 30000)

      await coachStreamResponse(
        conversationHistory,
        userMessage,
        coachContext,
        consentLedger,
        DEFAULT_PRIVACY_SETTINGS,
        (text) => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
          setStreamingText(text)
        },
        (fullText) => {
          clearTimeout(timeoutRef.current)
          // Announce AI response for screen readers
          announceForScreenReader(fullText)
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fullText,
            timestamp: new Date().toISOString(),
          }])
          setStreamingText('')
          setIsStreaming(false)
        },
      )
    } catch (error) {
      clearTimeout(timeoutRef.current)
      const appError = handleAIError(error)
      const userError = formatUserFacingError(appError)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: appError.recoverable
          ? `${userError.message}\n\n${appError.suggestedAction || ''}`
          : userError.message,
        timestamp: new Date().toISOString(),
      }])
      setStreamingText('')
      setIsStreaming(false)
    }
  }, [inputText, isStreaming, messages, contextData, user, consentLedger, aiQuota])

  const handleQuickAction = useCallback((suggestion: ActionSuggestion) => {
    HapticPatterns.confirm()
    suggestion.onPress()
    // Add a user message to trigger AI response
    const actionMsg: CoachMessage = {
      id: `action-${Date.now()}`,
      role: 'user',
      content: suggestion.title,
      timestamp: new Date().toISOString(),
      actionTaken: suggestion.type,
    }
    setMessages(prev => [...prev, actionMsg])
    setActionsExpanded(false)
  }, [])

  const pushStyle = user?.push_style ?? 'gentle'
  const hasMessages = messages.filter(m => m.role !== 'system').length > 0
  const isLocked = !features['CORE']

  // ── Locked State (Limited Mode) ──
  if (isLocked) {
    return (
      <Screen>
        <View style={styles.lockedContainer}>
          <Text style={styles.title}>Your Coach</Text>
          <Text style={[styles.subtitle, { marginTop: spacing.sm, marginBottom: spacing.lg }]}>
            I get smarter as we work together. After a few sessions, I'll know your patterns and give you personalized guidance.
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.tertiary, marginBottom: spacing.xl }]}>
            For now, I can still help you think through what's in your way.
          </Text>
          <TextInput
            style={styles.chatInput}
            placeholder="What's pulling you away right now?"
            placeholderTextColor={colors.text.disabled}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
          />
          <Button
            title="Send"
            onPress={handleSend}
            variant="gradient"
            size="md"
            style={{ marginTop: spacing.sm }}
            disabled={!inputText.trim() || isStreaming}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen scrollable={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              {pushStyle === 'gentle' ? '🌱' : pushStyle === 'firm' ? '🔥' : '⚡'} Coach
            </Text>
            <Text style={styles.subtitle}>
              {prediction && prediction.currentRiskLevel !== 'low'
                ? `${prediction.currentRiskLevel === 'critical' ? '🔴' : prediction.currentRiskLevel === 'high' ? '🟡' : '🟢'} ${prediction.recommendedAction.slice(0, 40)}...`
                : aiQuota.isPro
                  ? 'Action-first guidance. Not a chatbot.'
                  : `Action-first guidance. ${aiQuota.messagesRemaining} AI messages left today.`}
            </Text>
          </View>
          {hasMessages && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setMessages([]); setActionsExpanded(true) }}
              accessibilityLabel="Clear conversation"
            >
              <Trash2 size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
          {/* Offline indicator in header */}
          {!onlineStatus && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineIndicatorText}>Offline</Text>
            </View>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Offline Banner */}
          {!canUseAI && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineBannerIcon}>📡</Text>
              <View style={styles.offlineBannerContent}>
                <Text style={styles.offlineBannerTitle}>You're offline</Text>
                <Text style={styles.offlineBannerText}>
                  AI coaching unavailable. Rescue sessions still work.
                </Text>
              </View>
            </View>
          )}

          {/* Welcome + Action Suggestions */}
          {(!hasMessages || actionsExpanded) && (
            <View style={styles.welcomeSection}>
              {/* Drift Prediction Card */}
              {!hasMessages && prediction && prediction.confidence > 0.2 && (
                <Card variant="glow" style={styles.predictionCard}>
                  <View style={styles.predictionHeader}>
                    <Clock size={16} color={colors.brand[400]} />
                    <Text style={styles.predictionLabel}>DRIFT PREDICTION</Text>
                  </View>
                  <Text style={styles.predictionRisk}>
                    {prediction.currentRiskLevel === 'critical' ? '🔴 Critical risk' :
                     prediction.currentRiskLevel === 'high' ? '🟠 High risk' :
                     prediction.currentRiskLevel === 'moderate' ? '🟡 Moderate' :
                     '🟢 Low risk'}
                  </Text>
                  <Text style={styles.predictionAction}>{prediction.recommendedAction}</Text>
                  {prediction.nextDangerWindow && (
                    <Text style={styles.predictionWindow}>
                      Next danger window: {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][prediction.nextDangerWindow.dayOfWeek]} {prediction.nextDangerWindow.startHour}:00-{prediction.nextDangerWindow.endHour}:00
                    </Text>
                  )}
                </Card>
              )}

              {/* Quick Actions */}
              <Text style={styles.actionsTitle}>What do you need right now?</Text>
              {actionSuggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  accessibilityRole="button"
                  accessibilityLabel={suggestion.title}
                  style={styles.actionCard}
                  onPress={() => handleQuickAction(suggestion)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIcon, { backgroundColor: suggestion.color + '20' }]}>
                    <suggestion.icon size={20} color={suggestion.color} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{suggestion.title}</Text>
                    <Text style={styles.actionSubtitle}>{suggestion.subtitle}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.text.tertiary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Collapsed actions indicator when conversation is active */}
          {hasMessages && !actionsExpanded && (
            <TouchableOpacity
              style={styles.quickActionsCollapsed}
              onPress={() => setActionsExpanded(true)}
              accessibilityLabel="Show quick actions"
            >
              <Text style={styles.quickActionsCollapsedText}>⚡ Quick Actions</Text>
            </TouchableOpacity>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <View key={msg.id} style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : msg.role === 'system' ? styles.systemBubble : styles.assistantBubble,
            ]}>
              <Text style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : msg.role === 'system' ? styles.systemText : styles.assistantText,
              ]}>
                {msg.content}
              </Text>
            </View>
          ))}

          {/* Streaming text */}
          {isStreaming && streamingText && (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <Text style={[styles.messageText, styles.assistantText]}>
                {streamingText}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="What's pulling you away right now?"
            placeholderTextColor={colors.text.disabled}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micBtnActive]}
            onPress={toggleVoiceInput}
            disabled={isStreaming || !canUseAI}
            accessibilityLabel={isListening ? 'Stop voice input' : 'Start voice input'}
            accessibilityRole="button"
          >
            {isListening
              ? <MicOff size={20} color={colors.error} />
              : <Mic size={20} color={inputText.trim() ? colors.text.tertiary : colors.brand[400]} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isStreaming) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isStreaming || !canUseAI}
            accessibilityLabel="Send message"
          >
            <Send size={20} color={inputText.trim() && !isStreaming && canUseAI ? colors.brand[400] : colors.text.disabled} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  clearBtn: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  welcomeSection: {
    marginBottom: spacing.lg,
  },
  predictionCard: {
    marginBottom: spacing.lg,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  predictionLabel: {
    ...typography.caption,
    color: colors.brand[400],
    fontWeight: '700',
    letterSpacing: 1,
  },
  predictionRisk: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  predictionAction: {
    ...typography.body,
    color: colors.text.secondary,
  },
  predictionWindow: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  actionsTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  quickActionsCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
  },
  quickActionsCollapsedText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.brand[500],
    borderBottomRightRadius: spacing.xs,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.card,
    borderBottomLeftRadius: spacing.xs,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: colors.bg.elevated,
    borderRadius: radius.sm,
  },
  messageText: {
    ...typography.body,
  },
  userText: {
    color: colors.text.primary,
  },
  assistantText: {
    color: colors.text.primary,
  },
  systemText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  chatInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.bg.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.error + '20',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  offlineBannerIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  offlineBannerContent: {
    flex: 1,
  },
  offlineBannerTitle: {
    ...typography.body,
    color: '#92400E',
    fontWeight: '700',
  },
  offlineBannerText: {
    ...typography.caption,
    color: '#A16207',
    marginTop: 2,
  },
  offlineIndicator: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  offlineIndicatorText: {
    ...typography.caption,
    color: '#92400E',
    fontWeight: '600',
  },
})
