// ══════════════════════════════════════════════════════════════
// INTENT — Reminder Handoff Generator
// Creates reminder proposals with deep-link support
// ══════════════════════════════════════════════════════════════

import { Platform, Alert } from 'react-native'
import * as Linking from 'expo-linking'
import type {
  ActionHandoff,
  ReminderPayload,
} from '../../types/actionHandoff'
import { HANDOFF_RISK_MATRIX, HANDOFF_REQUIRES_CONFIRMATION } from '../../types/actionHandoff'
import type { Mission } from '../../types'

// ── Types ────────────────────────────────────────────────────

export interface ReminderInput {
  title: string
  dueDate: string     // ISO 8601
  notes?: string
  priority?: 'low' | 'medium' | 'high'
}

// ── UID ─────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ── Time Helpers ────────────────────────────────────────────

function defaultScheduledTime(): string {
  const d = new Date()
  d.setHours(d.getHours() + 2)
  return d.toISOString()
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoString
  }
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return isoString
  }
}

// ── Extract Reminder Details from Context ───────────────────

function extractReminderTitle(missionContext: string): string {
  const lines = missionContext.split('\n').filter((l) => l.trim().length > 0)
  if (lines.length > 0) return lines[0].slice(0, 80)
  return 'Follow up'
}

function extractReminderBody(missionContext: string): string {
  const sentences = missionContext
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5)

  if (sentences.length > 1) return sentences.slice(0, 3).join('. ') + '.'
  if (sentences.length === 1) return sentences[0]
  return missionContext.slice(0, 200)
}

// ── Priority Mapping ────────────────────────────────────────

function priorityToFlag(priority: ReminderInput['priority']): number {
  switch (priority) {
    case 'high': return 1
    case 'medium': return 5
    case 'low': return 9
    default: return 0 // none
  }
}

// ── Public API ──────────────────────────────────────────────

export function createReminder(
  title: string,
  dueDate: string,
  notes?: string,
  priority?: ReminderInput['priority'],
): ReminderInput {
  return { title, dueDate, notes, priority }
}

export async function openRemindersApp(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // x-apple-reminderkit:// opens the Reminders app directly
    const supported = await Linking.canOpenURL('x-apple-reminderkit://')
    if (supported) {
      await Linking.openURL('x-apple-reminderkit://')
      return true
    }
    // Fallback: try the default reminders scheme
    await Linking.openURL('x-apple-reminder://')
    return true
  }

  // Android: open Google Tasks or default reminders
  const googleTasks = 'com.google.android.apps.tasks'
  const supported = await Linking.canOpenURL(`package:${googleTasks}`)
  if (supported) {
    await Linking.openURL(`package:${googleTasks}`)
    return true
  }

  // Generic Android reminder intent fallback
  Alert.alert(
    'Open Reminders',
    'Could not open a reminders app automatically. Please open your preferred reminders app manually.',
  )
  return false
}

export async function openReminderDeepLink(reminder: ReminderInput): Promise<boolean> {
  if (Platform.OS === 'ios') {
    // iOS doesn't support creating reminders via URL scheme alone.
    // Open the app and let user add manually; we at least get them there.
    return openRemindersApp()
  }

  // Android: Google Tasks intent with pre-filled title
  const encoded = encodeURIComponent(reminder.title)
  const url = `intent://create_task#Intent;scheme=https;package=com.google.android.apps.tasks;S.title=${encoded};end`
  const supported = await Linking.canOpenURL(url)
  if (supported) {
    await Linking.openURL(url)
    return true
  }

  return openRemindersApp()
}

export function parseTaskFromMission(mission: Mission): ReminderInput {
  const now = new Date()
  const dueDate = mission.deadline
    ? new Date(mission.deadline).toISOString()
    : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // +24 hours fallback

  return {
    title: mission.title,
    dueDate,
    notes: mission.description || undefined,
    priority: 'medium',
  }
}

// ── Legacy Handoff Builder ──────────────────────────────────

export function createReminderHandoff(
  missionId: string,
  context: string,
  scheduledTime?: string,
): ActionHandoff {
  const time = scheduledTime ?? defaultScheduledTime()
  const title = extractReminderTitle(context)
  const body = extractReminderBody(context)

  const payload: ReminderPayload = {
    title,
    body,
    scheduledTime: time,
    repeat: 'none',
  }

  const riskLevel = HANDOFF_RISK_MATRIX.reminder
  const requiresConfirmation = HANDOFF_REQUIRES_CONFIRMATION.reminder

  return {
    id: uid(),
    type: 'reminder',
    sourceContextId: null,
    sourceMissionId: missionId,
    title: `Reminder: ${title}`,
    preview: `${formatDate(time)} at ${formatTime(time)} — ${title}`,
    editablePayload: payload as unknown as Record<string, unknown>,
    riskLevel,
    requiresConfirmation,
    status: 'proposed',
    auditLog: [{ action: 'created', timestamp: new Date().toISOString(), details: null }],
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    completedAt: null,
  }
}
