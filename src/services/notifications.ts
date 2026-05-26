// ══════════════════════════════════════════════════════════════
// INTENT — Notification Service
// Push notifications for reminders, streak protection, daily summaries
// ══════════════════════════════════════════════════════════════

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import * as TaskManager from 'expo-task-manager'
import { Platform } from 'react-native'
import { logger } from './logger'
import type { MicroMission } from '../types/mission'
import type { DangerWindow } from '../types/ambient'
import type { DangerWindow as PredictiveDangerWindow, UserIntelligenceProfile } from '../engine/predictiveEngine'
import {
  rescueCopy,
  streakProtectionCopy,
  summaryCopy,
  dangerWindowCopy,
  predictiveDangerWindowCopy,
  comebackCopy,
  type DailyStats,
  type ComebackSessionInfo,
} from './notificationCopy'
import {
  scheduleOptimalTime,
  debounceNotification,
  trackNotificationSent,
  trackNotificationOutcome,
  getUserPatternsFromHistory,
  type NotificationType,
} from './notificationScheduler'
import { checkPermission } from './consent'

// ── Configure notification handler ────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// ── Notification Permission Strategy (Audit Section 2.3) ──────
// Ask AFTER first rescue, not before. Show in-app context before OS dialog.

import { Alert } from 'react-native'
import { useAppStore } from '../store'

/**
 * Request notification permissions with user-facing context.
 * Shows an in-app alert explaining WHY before triggering the OS permission dialog.
 * Should be called after first successful rescue session.
 */
export async function requestNotificationPermissionsWithContext(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Stay Ahead of Your Hardest Hours',
      "INTENT can warn you before your drift windows — the times you usually lose focus.\n\nNo marketing. No streaks. Just 'your 2pm is coming.'\n\nAllow notifications?",
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => {
            // Record the decline for analytics
            try {
              const state = useAppStore.getState()
              state.recordRetention?.('notification_declined_post_rescue', {})
            } catch {}
            resolve(false)
          },
        },
        {
          text: 'Allow',
          style: 'default',
          onPress: async () => {
            const granted = await requestNotificationPermissions()
            if (granted) {
              // Mark notification consent in consent ledger
              try {
                const state = useAppStore.getState()
                state.updateConsent?.('notifications_smart', true, 'post_rescue', 'Granted after first rescue')
                state.recordRetention?.('notification_accepted_post_rescue', {})
              } catch {}
            }
            resolve(granted)
          },
        },
      ],
    )
  })
}

// ── Permissions ────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    logger.log('Push notifications require a physical device')
    return false
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    logger.log('Notification permission denied')
    return false
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('focus-reminders', {
      name: 'Focus Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C3AED',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('streak-protection', {
      name: 'Streak Protection',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#F59E0B',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('daily-summary', {
      name: 'Daily Summary',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    })
  }

  return true
}

// ── Schedule Notifications ─────────────────────────────────

export async function scheduleFocusReminder(hour: number, minute: number) {
  await cancelFocusReminder()

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to Focus 🎯',
      body: 'Your next focus session is waiting. Let\'s build that streak!',
      data: { type: 'focus_reminder' },
      sound: 'default',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: 'focus-reminders',
    },
  })
}

export async function cancelFocusReminder() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'focus_reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier)
    }
  }
}

export async function scheduleStreakProtectionReminder() {
  await cancelStreakProtectionReminder()

  // Schedule for 8 PM if no session completed today
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Streak in Danger! 🔥',
      body: "You haven't completed a focus session today. Don't break the chain!",
      data: { type: 'streak_protection' },
      sound: 'default',
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
      channelId: 'streak-protection',
    },
  })
}

export async function cancelStreakProtectionReminder() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'streak_protection') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier)
    }
  }
}

// Old scheduleDailySummary removed — replaced by new consent-gated version below

export async function cancelDailySummary() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'daily_summary') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier)
    }
  }
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

// ── Session Complete Notification ──────────────────────────

export async function showSessionCompleteNotification(minutes: number, streak: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Session Complete! 🎉',
      body: `Great work! ${minutes} minutes focused. ${streak > 0 ? `${streak} day streak!` : 'Start your streak today!'}`,
      data: { type: 'session_complete' },
      sound: 'default',
    },
    trigger: null, // Show immediately
  })
}

// ── Notification Categories (for actions) ──────────────────

export async function setupNotificationCategories() {
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('focus-reminder', [
      {
        identifier: 'start-session',
        buttonTitle: 'Start Session',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze 15min',
        options: {},
      },
    ])

    await Notifications.setNotificationCategoryAsync('rescue', [
      {
        identifier: 'start-rescue',
        buttonTitle: 'Start 2 min',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'make-smaller',
        buttonTitle: 'Make smaller',
        options: {},
      },
      {
        identifier: 'not-today',
        buttonTitle: 'Not today',
        options: {},
      },
    ])

    await Notifications.setNotificationCategoryAsync('streak', [
      {
        identifier: 'start-session',
        buttonTitle: 'Start Session',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {},
      },
    ])
  }
}

// ── Consent Gate ─────────────────────────────────────────────
// All smart notifications require 'notifications_smart' consent

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _consentLedger: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _userProfile: any = null

/** Inject consent dependencies — call once at app startup */
export function setNotificationConsentContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ledger: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any,
): void {
  _consentLedger = ledger
  _userProfile = user
}

function hasSmartNotificationConsent(): boolean {
  if (!_consentLedger || !_userProfile) return false
  const check = checkPermission('notifications_smart', _consentLedger, _userProfile)
  return check.permitted
}

// ── Rescue Notification ──────────────────────────────────────

export async function scheduleRescueNotification(
  mission: MicroMission,
  delaySeconds: number = 0,
): Promise<string | null> {
  if (!hasSmartNotificationConsent()) return null
  if (!debounceNotification('rescue')) return null

  const copy = rescueCopy(mission.state, mission.protocolId, mission.title)

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: copy.data,
      sound: 'default',
      categoryIdentifier: 'rescue',
    },
    trigger: delaySeconds > 0
      ? { seconds: delaySeconds, channelId: 'focus-reminders' }
      : null,
  })

  trackNotificationSent(identifier, 'rescue', new Date(Date.now() + delaySeconds * 1000))
  return identifier
}

// ── Streak Protection ────────────────────────────────────────

export async function scheduleStreakProtection(
  currentStreak: number,
): Promise<string | null> {
  if (!hasSmartNotificationConsent()) return null
  if (!debounceNotification('streak_protection')) return null

  const patterns = getUserPatternsFromHistory()
  const copy = streakProtectionCopy(currentStreak)

  // Use optimal scheduling — prefer evening if no pattern data
  const scheduleResult = scheduleOptimalTime(
    'streak_protection',
    patterns,
    null, // quiet hours handled by scheduleOptimalTime defaults
  )

  if (!scheduleResult.shouldSchedule || !scheduleResult.scheduledFor) return null

  // Calculate seconds from now
  const delaySeconds = Math.max(
    0,
    Math.floor((scheduleResult.scheduledFor.getTime() - Date.now()) / 1000),
  )

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: copy.data,
      sound: 'default',
      categoryIdentifier: 'streak',
    },
    trigger: {
      seconds: delaySeconds,
      channelId: 'streak-protection',
    },
  })

  trackNotificationSent(identifier, 'streak_protection', scheduleResult.scheduledFor)
  return identifier
}

// ── Daily Summary ────────────────────────────────────────────

export async function scheduleDailySummary(
  stats: DailyStats,
  hour: number = 21,
  minute: number = 0,
): Promise<string | null> {
  if (!hasSmartNotificationConsent()) return null

  const copy = summaryCopy(stats)

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: copy.data,
      sound: 'default',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: 'daily-summary',
    },
  })

  trackNotificationSent(identifier, 'daily_summary', new Date())
  return identifier
}

// ── Danger Window Alert ──────────────────────────────────────

export async function scheduleDangerWindowAlert(
  window: DangerWindow,
): Promise<string | null> {
  if (!hasSmartNotificationConsent()) return null
  if (!window.enabled) return null
  if (!debounceNotification('danger_window')) return null

  const copy = dangerWindowCopy(window)

  // Parse start time and schedule 10 minutes before
  const [startHour, startMinute] = window.startTime.split(':').map(Number)
  let alertMinute = startMinute - 10
  let alertHour = startHour
  if (alertMinute < 0) {
    alertMinute += 60
    alertHour = (alertHour - 1 + 24) % 24
  }

  // Schedule for matching days of week
  // expo-notifications doesn't support day-of-week triggers directly,
  // so we schedule as a daily repeat and let the app filter by day
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: copy.data,
      sound: 'default',
    },
    trigger: {
      hour: alertHour,
      minute: alertMinute,
      repeats: true,
      channelId: 'focus-reminders',
    },
  })

  trackNotificationSent(identifier, 'danger_window', new Date())
  return identifier
}

// ── Cancel Notifications ─────────────────────────────────────

export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier)
}

export async function cancelNotificationsByType(type: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  for (const notif of scheduled) {
    if (notif.content.data?.type === type) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier)
    }
  }
}

// ── Get Scheduled Notifications ──────────────────────────────

export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  return Notifications.getAllScheduledNotificationsAsync()
}

// ── Handle Notification Response ─────────────────────────────
// Called when user interacts with a notification (tap, action button)

export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
): {
  type: string
  action: string
  data: Record<string, unknown>
} {
  const { notification, actionIdentifier } = response
  const data = notification.request.content.data as Record<string, unknown>
  const type = (data?.type as string) ?? 'unknown'

  // Map action identifiers to outcomes
  let action: string
  switch (actionIdentifier) {
    case 'start-rescue':
    case 'start-session':
      action = 'action_pressed'
      break
    case 'make-smaller':
    case 'not-today':
    case 'dismiss':
      action = 'dismissed'
      break
    case Notifications.DEFAULT_ACTION_IDENTIFIER:
      action = 'tapped'
      break
    default:
      action = 'tapped'
  }

  // Track the outcome
  trackNotificationOutcome(notification.request.identifier, action as 'tapped' | 'dismissed' | 'action_pressed')

  return { type, action, data }
}

// ── Predictive Danger Window Notifications ────────────────────
// Schedules weekly notifications for high-confidence danger windows
// detected by the predictive engine. 10 minutes before the window.

export async function scheduleDangerWindowNotifications(
  dangerWindows: PredictiveDangerWindow[],
  _profile: UserIntelligenceProfile,
): Promise<string[]> {
  if (!hasSmartNotificationConsent()) return []

  // Cancel all existing danger_window notifications
  await cancelNotificationsByType('danger_window')

  // Get top 3 windows with confidence > 0.5, sorted by riskScore
  const eligible = dangerWindows
    .filter(w => w.confidence > 0.5)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 3)

  const identifiers: string[] = []

  for (const window of eligible) {
    const copy = predictiveDangerWindowCopy(window)

    // Schedule 10 minutes before window starts
    let alertMinute = 50 // 60 - 10
    let alertHour = window.startHour
    // If startHour:00 minus 10 min wraps backward
    // (startHour * 60) - 10 = startHour*60 - 10
    // We want the notification at (startHour:00 - 10min)
    // e.g., startHour=14 → 13:50
    alertHour = (alertHour - 1 + 24) % 24

    // expo-notifications weekday: 1=Sunday, 2=Monday, ..., 7=Saturday
    // predictive engine dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
    const weekday = window.dayOfWeek + 1 // 0→1, 1→2, ..., 6→7

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body,
        data: copy.data,
        sound: 'default',
      },
      trigger: {
        weekday,
        hour: alertHour,
        minute: alertMinute,
        repeats: true,
        channelId: 'focus-reminders',
      },
    })

    trackNotificationSent(identifier, 'danger_window', new Date())
    identifiers.push(identifier)
  }

  return identifiers
}

// ── Comeback Notification ─────────────────────────────────────
// Scheduled 30-90 minutes after a session is abandoned.
// Debounced to prevent duplicate comeback notifications.

let _lastComebackScheduleTime = 0
const COMEBACK_DEBOUNCE_MS = 30 * 60 * 1000 // 30 min debounce

export async function scheduleComebackNotification(
  sessionInfo: ComebackSessionInfo,
): Promise<string | null> {
  if (!hasSmartNotificationConsent()) return null

  // Debounce: don't schedule if we scheduled one recently
  const now = Date.now()
  if (now - _lastComebackScheduleTime < COMEBACK_DEBOUNCE_MS) return null
  _lastComebackScheduleTime = now

  // Also use the scheduler-level debounce
  if (!debounceNotification('comeback')) return null

  const copy = comebackCopy(sessionInfo)

  // Schedule 30-90 minutes after abandonment (randomized)
  const delayMinutes = 30 + Math.floor(Math.random() * 60)
  const delaySeconds = delayMinutes * 60

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: copy.data,
      sound: 'default',
      categoryIdentifier: 'rescue',
    },
    trigger: {
      seconds: delaySeconds,
      channelId: 'focus-reminders',
    },
  })

  trackNotificationSent(identifier, 'comeback', new Date(Date.now() + delaySeconds * 1000))
  return identifier
}

// ── Permission Request with Context ───────────────────────────
// Shows a custom explanation before triggering the OS permission dialog.

export async function requestNotificationPermissionsWithContext(
  contextMessage: string,
): Promise<'granted' | 'denied' | 'undetermined'> {
  if (!Device.isDevice) {
    logger.log('Push notifications require a physical device')
    return 'denied'
  }

  // Check if already granted
  const existing = await Notifications.getPermissionsAsync()
  if (existing.status === 'granted') return 'granted'

  // Log the context message — the calling UI should display this
  // to the user before invoking this function (e.g. via an Alert or modal).
  // We include it here so the message is co-located with the permission flow.
  logger.log(`[NotificationPermission] Context: ${contextMessage}`)

  const result = await Notifications.requestPermissionsAsync()

  // Set up Android channels if newly granted
  if (result.status === 'granted' && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('focus-reminders', {
      name: 'Focus Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C3AED',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('streak-protection', {
      name: 'Streak Protection',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#F59E0B',
      sound: 'default',
    })

    await Notifications.setNotificationChannelAsync('daily-summary', {
      name: 'Daily Summary',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    })
  }

  return result.status as 'granted' | 'denied' | 'undetermined'
}

// ── Background Task Registration ─────────────────────────────

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK'

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    logger.error('[NotificationBackground] Task error:', error)
    return
  }

  if (data) {
    // Process background notification data
    logger.log('[NotificationBackground] Processing background notification')
  }
})

export async function registerBackgroundNotificationTask(): Promise<boolean> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK)
    if (!isRegistered) {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
    }
    return true
  } catch (err) {
    logger.error('[NotificationBackground] Failed to register task:', err)
    return false
  }
}

export async function unregisterBackgroundNotificationTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK)
    if (isRegistered) {
      await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK)
    }
  } catch (err) {
    logger.error('[NotificationBackground] Failed to unregister task:', err)
  }
}
