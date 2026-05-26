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
  KeyboardAvoidingView, Platform, TouchableOpacity, Animated,
} from 'react-native'
import { BlurView } from 'expo-blur'
import {
  Send, Trash2, Lightbulb, Target, Zap, Brain,
  Shield, TrendingUp, AlertTriangle, Clock, ChevronRight,
} from 'lucide-react-native'
import { useAppStore } from '../src/store'
import { UserState, Mission, MicroMission } from '../src/types'
import {
  predictDrift, buildIntelligenceProfile, DriftPrediction,
  DangerWindow, UserIntelligenceProfile,
} from '../src/engine'
import { streamChat } from '../src/services/ai'
import { colors, spacing, radius, typography, shadows } from '../src/theme'
import { Screen, Card, EmptyState } from '../src/components'

// ── Types ────────────────────────────────────────────────────

interface ActionSuggestion {
  id: string
  type: 'break_down' | 'start_session' | 'body_double' | 'brain_dump' | 'salvage' | 'simplify' | 'danger_alert'
  title: string
  subtitle: string
  icon: any
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
  const store = useAppStore()
  const user = store.user
  const sessions = store.sessions
  const missions = store.missions
  const microMissions = store.microMissions
  const momentumEvents = store.momentumEvents
  const resistancePatterns = store.resistancePatterns
  const distractions = store.distractions
  const brainDumps = store.brainDumps
  const features = store.getFeatures
  const startSession = store.startSession
  const addMission = store.addMission

  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [showActions, setShowActions] = useState(true)
  const scrollRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(1)).current

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
      store.addMicroMission(mission.id, step, '', 5)
    })
    addSystemMessage(`Created ${steps.length} micro-steps. Start with step 1 — just open the thing.`)
  }, [store])

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
  }), [user, momentumEvents, missions, sessions, prediction, profile])

  useEffect(() => {
    if (isStreaming || messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length, isStreaming, streamingText])

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isStreaming) return

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
    setShowActions(false)

    const conversationHistory = messages.slice(-15).map(m => ({
      id: m.id,
      user_id: user?.id ?? '',
      role: m.role === 'system' ? 'assistant' as const : m.role,
      content: m.content,
      metadata: {},
      created_at: m.timestamp,
    }))

    try {
      await streamChat(
        conversationHistory,
        userMessage,
        contextData,
        (text) => setStreamingText(text),
        (fullText) => {
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
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Something went wrong. Try again.',
        timestamp: new Date().toISOString(),
      }])
      setStreamingText('')
      setIsStreaming(false)
    }
  }, [inputText, isStreaming, messages, contextData, user])

  const handleQuickAction = useCallback((suggestion: ActionSuggestion) => {
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
    setShowActions(false)
  }, [])

  const pushStyle = user?.push_style ?? 'gentle'
  const hasMessages = messages.filter(m => m.role !== 'system').length > 0
  const isLocked = !features()['CORE']

  // ── Locked State ──
  if (isLocked) {
    return (
      <Screen>
        <View style={styles.lockedContainer}>
          <EmptyState
            icon="🔒"
            title="Complete 3 sessions to unlock your coach"
            description="Your AI coach learns from your patterns. Start with a few focus sessions to unlock personalized guidance."
            actionLabel="Go to Rescue"
            onAction={() => {}}
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
                : 'Action-first guidance. Not a chatbot.'}
            </Text>
          </View>
          {hasMessages && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => { setMessages([]); setShowActions(true) }}
            >
              <Trash2 size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome + Action Suggestions (before first message) */}
          {!hasMessages && showActions && (
            <View style={styles.welcomeSection}>
              {/* Drift Prediction Card */}
              {prediction && prediction.confidence > 0.2 && (
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

          {/* System Messages */}
          {messages.filter(m => m.role === 'system').map((msg) => (
            <View key={msg.id} style={styles.systemMessage}>
              <Text style={styles.systemMessageText}>{msg.content}</Text>
            </View>
          ))}

          {/* Chat Messages */}
          {messages.filter(m => m.role !== 'system').map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                msg.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              <BlurView
                intensity={msg.role === 'user' ? 15 : 25}
                style={[
                  styles.messageBlur,
                  msg.role === 'user' ? styles.userBlur : styles.aiBlur,
                ]}
              >
                <Text style={styles.messageText}>{msg.content}</Text>
              </BlurView>
            </View>
          ))}

          {/* Streaming */}
          {isStreaming && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <BlurView intensity={25} style={[styles.messageBlur, styles.aiBlur]}>
                <Text style={styles.messageText}>{streamingText || 'Thinking...'}</Text>
                <View style={styles.typingRow}>
                  <View style={[styles.typingDot, { backgroundColor: colors.brand[500] }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.brand[500], opacity: 0.6 }]} />
                  <View style={[styles.typingDot, { backgroundColor: colors.brand[500], opacity: 0.3 }]} />
                </View>
              </BlurView>
            </View>
          )}

          <View style={{ height: spacing.md }} />
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <BlurView intensity={30} style={styles.inputBlur}>
            <TextInput
              style={styles.textInput}
              placeholder="Or type anything..."
              placeholderTextColor={colors.text.disabled}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              multiline
              maxLength={1000}
              editable={!isStreaming}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!inputText.trim() || isStreaming) && { opacity: 0.3 }]}
              onPress={handleSend}
              disabled={!inputText.trim() || isStreaming}
            >
              <Send size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerLeft: {},
  title: { ...typography.headline, color: colors.text.primary },
  subtitle: { ...typography.bodySmall, color: colors.text.tertiary, marginTop: 2 },
  clearBtn: { padding: spacing.xs },
  lockedContainer: { flex: 1, justifyContent: 'center' },

  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },

  // Welcome
  welcomeSection: { paddingBottom: spacing.lg },
  predictionCard: { padding: spacing.md, marginBottom: spacing.lg },
  predictionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  predictionLabel: { ...typography.labelSmall, color: colors.brand[400] },
  predictionRisk: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs },
  predictionAction: { ...typography.bodyMedium, color: colors.text.secondary, lineHeight: 20 },
  predictionWindow: { ...typography.caption, color: colors.text.tertiary, marginTop: spacing.xs },

  actionsTitle: { ...typography.label, color: colors.text.tertiary, marginBottom: spacing.sm },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionContent: { flex: 1 },
  actionTitle: { ...typography.bodyMedium, color: colors.text.primary, fontWeight: '600' },
  actionSubtitle: { ...typography.caption, color: colors.text.tertiary, marginTop: 2 },

  // Messages
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: colors.brand[500] + '10',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  systemMessageText: { ...typography.bodySmall, color: colors.brand[400], textAlign: 'center' },

  messageBubble: { maxWidth: '85%', marginBottom: spacing.sm },
  userBubble: { alignSelf: 'flex-end' },
  aiBubble: { alignSelf: 'flex-start' },
  messageBlur: { borderRadius: radius.xl, overflow: 'hidden' },
  userBlur: { backgroundColor: colors.brand[500] + '20', borderWidth: 1, borderColor: colors.brand[500] + '30' },
  aiBlur: { backgroundColor: colors.bg.card, borderWidth: 1, borderColor: colors.border.subtle },
  messageText: { ...typography.bodyMedium, color: colors.text.primary, padding: spacing.md, lineHeight: 21 },
  typingRow: { flexDirection: 'row', gap: 6, padding: spacing.md, paddingTop: 0 },
  typingDot: { width: 8, height: 8, borderRadius: 4 },

  // Input
  inputContainer: { padding: spacing.sm },
  inputBlur: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: colors.text.primary,
    ...typography.bodyMedium,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.xs,
    ...shadows.glow,
  },
})
