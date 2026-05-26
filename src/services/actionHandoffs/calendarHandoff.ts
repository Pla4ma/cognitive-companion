// ══════════════════════════════════════════════════════════════
// INTENT — Calendar Block Handoff Generator
// Creates calendar event proposals with ICS fallback
// ══════════════════════════════════════════════════════════════

import { Platform } from 'react-native'
import * as Linking from 'expo-linking'
import * as Clipboard from 'expo-clipboard'
import type {
  ActionHandoff,
  CalendarBlockPayload,
} from '../../types/actionHandoff'
import { HANDOFF_RISK_MATRIX, HANDOFF_REQUIRES_CONFIRMATION } from '../../types/actionHandoff'
import type { Mission } from '../../types'

// ── Types ────────────────────────────────────────────────────

export interface CalendarEventInput {
  title: string
  startDate: string   // ISO 8601
  endDate: string     // ISO 8601
  notes?: string
  alarm?: number      // minutes before event; 0 = no alarm
  location?: string
}

// ── UID ─────────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ── Time Helpers ────────────────────────────────────────────

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoString
  }
}

function addMinutes(isoString: string, minutes: number): string {
  const d = new Date(isoString)
  d.setMinutes(d.getMinutes() + minutes)
  return d.toISOString()
}

function toICSDate(isoString: string): string {
  const d = new Date(isoString)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

// ── Context Parsing ─────────────────────────────────────────

function extractTitle(missionContext: string): string {
  const firstLine = missionContext.split('\n')[0]?.trim() ?? ''
  if (firstLine.length > 0 && firstLine.length <= 80) return firstLine
  return firstLine.slice(0, 80) || 'Focus block'
}

function extractDescription(missionContext: string): string {
  return missionContext.trim().slice(0, 500)
}

// ── ICS Generation ──────────────────────────────────────────

export function generateICSString(
  title: string,
  startTime: string,
  endTime: string,
  description?: string,
): string {
  const now = toICSDate(new Date().toISOString())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//INTENT//Focus Block//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(startTime)}`,
    `DTEND:${toICSDate(endTime)}`,
    `DTSTAMP:${now}`,
    `UID:${uid()}@intent-app`,
    `SUMMARY:${title}`,
  ]

  if (description) {
    lines.push(`DESCRIPTION:${description.replace(/\n/g, '\\n')}`)
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

export function generateICSEvent(event: CalendarEventInput): string {
  const now = toICSDate(new Date().toISOString())
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//INTENT//Calendar Event//EN',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(event.startDate)}`,
    `DTEND:${toICSDate(event.endDate)}`,
    `DTSTAMP:${now}`,
    `UID:${uid()}@intent-app`,
    `SUMMARY:${event.title}`,
  ]

  if (event.notes) {
    lines.push(`DESCRIPTION:${event.notes.replace(/\n/g, '\\n')}`)
  }
  if (event.location) {
    lines.push(`LOCATION:${event.location}`)
  }
  if (event.alarm && event.alarm > 0) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${event.title}`,
      `TRIGGER:-PT${event.alarm}M`,
      'END:VALARM',
    )
  }

  lines.push('END:VEVENT', 'END:VCALENDAR')
  return lines.join('\r\n')
}

// ── Calendar Deep Links ─────────────────────────────────────

function buildCalendarDeepLink(event: CalendarEventInput): string {
  if (Platform.OS === 'ios') {
    // calshow: opens iOS Calendar at a specific Unix timestamp
    const timestamp = Math.floor(new Date(event.startDate).getTime() / 1000)
    return `calshow:${timestamp}`
  }
  // Android: open calendar at event time
  const startMs = new Date(event.startDate).getTime()
  return `content://com.android.calendar/events/${startMs}`
}

// ── Public API ──────────────────────────────────────────────

export function createCalendarEvent(
  title: string,
  startDate: string,
  endDate: string,
  notes?: string,
  alarm?: number,
): CalendarEventInput {
  return { title, startDate, endDate, notes, alarm }
}

export async function openCalendarForEvent(event: CalendarEventInput): Promise<boolean> {
  const deepLink = buildCalendarDeepLink(event)
  const supported = await Linking.canOpenURL(deepLink)
  if (supported) {
    await Linking.openURL(deepLink)
    return true
  }

  // Fallback: copy ICS to clipboard so user can import manually
  const ics = generateICSEvent(event)
  await Clipboard.setStringAsync(ics)
  return false
}

export function parseDeadlineFromMission(mission: Mission): CalendarEventInput {
  const now = new Date()
  const startDate = mission.deadline
    ? new Date(mission.deadline).toISOString()
    : new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  const endDate = new Date(new Date(startDate).getTime() + 60 * 60 * 1000).toISOString()

  return {
    title: mission.title,
    startDate,
    endDate,
    notes: mission.description || undefined,
    alarm: 15,
  }
}

// ── Legacy Handoff Builder ──────────────────────────────────

export function createCalendarHandoff(
  missionId: string,
  context: string,
  startTime?: string,
  duration?: number,
): ActionHandoff {
  const start = startTime ?? new Date().toISOString()
  const durationMin = duration ?? 30
  const endTime = addMinutes(start, durationMin)

  const title = extractTitle(context)
  const description = extractDescription(context)

  const payload: CalendarBlockPayload = {
    title: `Focus: ${title}`,
    startTime: start,
    endTime,
    notes: description,
    location: null,
  }

  const riskLevel = HANDOFF_RISK_MATRIX.calendar_block
  const requiresConfirmation = HANDOFF_REQUIRES_CONFIRMATION.calendar_block

  return {
    id: uid(),
    type: 'calendar_block',
    sourceContextId: null,
    sourceMissionId: missionId,
    title: `Focus block: ${title}`,
    preview: `${formatTime(start)} – ${formatTime(endTime)} (${durationMin} min)`,
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
