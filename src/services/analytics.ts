// ══════════════════════════════════════════════════════════════
// INTENT — Analytics Event System
// Offline-first, consent-gated, fully typed event tracking.
//
// Events are batched in AsyncStorage under 'intent-analytics'
// and flushed in batches of up to 50. No network calls —
// everything stays local unless a future transport is added.
// ══════════════════════════════════════════════════════════════

import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasConsented, ConsentLedger, PermissionId } from '../services/consent';
import { UserProfile } from '../types';

// ── Storage Keys ────────────────────────────────────────────

const ANALYTICS_STORAGE_KEY = 'intent-analytics';
const ANALYTICS_QUEUE_KEY = 'intent-analytics-queue';
const ANALYTICS_SESSION_KEY = 'intent-analytics-session';
const ANALYTICS_USER_KEY = 'intent-analytics-user';
const BATCH_SIZE = 50;

// ── Event Category Enum ────────────────────────────────────

export type AnalyticsEventCategory =
  | 'onboarding'
  | 'session'
  | 'rescue'
  | 'mission'
  | 'coach'
  | 'before_scroll'
  | 'notification'
  | 'settings'
  | 'app'
  | 'share';

// ── Event Name Union ───────────────────────────────────────

export type AnalyticsEventName =
  // Onboarding
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  // Sessions
  | 'session_started'
  | 'session_completed'
  | 'session_abandoned'
  | 'session_salvaged'
  | 'checkpoint_answered'
  // Rescue
  | 'rescue_started'
  | 'rescue_completed'
  | 'state_selected'
  // Missions
  | 'mission_created'
  | 'mission_completed'
  | 'mission_abandoned'
  | 'mission_salvaged'
  | 'micro_mission_completed'
  // Coach
  | 'coach_message_sent'
  | 'coach_action_taken'
  | 'coach_quick_prompt_tap'
  // Before Scroll
  | 'before_scroll_shown'
  | 'before_scroll_action_tapped'
  | 'before_scroll_skipped'
  // Notifications
  | 'notification_received'
  | 'notification_tapped'
  | 'notification_action_tap'
  // Settings
  | 'push_style_changed'
  | 'notification_time_changed'
  | 'trust_center_opened'
  // App
  | 'app_opened'
  | 'app_backgrounded'
  | 'app_foregrounded'
  | 'cold_start'
  | 'warm_start'
  // Share
  | 'share_tapped'
  | 'share_completed'
  | 'share_dismissed';

// ── Category lookup ────────────────────────────────────────

export function getEventCategory(name: AnalyticsEventName): AnalyticsEventCategory {
  const prefix = name.split('_')[0];
  const categoryMap: Record<string, AnalyticsEventCategory> = {
    onboarding: 'onboarding',
    session: 'session',
    rescue: 'rescue',
    mission: 'mission',
    micro: 'mission',
    coach: 'coach',
    before: 'before_scroll',
    notification: 'notification',
    push: 'settings',
    trust: 'settings',
    app: 'app',
    share: 'share',
    checkpoint: 'session',
    state: 'rescue',
  };
  return categoryMap[prefix] ?? 'app';
}

// ── Event Payloads ─────────────────────────────────────────

export interface OnboardingStartedPayload {
  step?: number;
}

export interface OnboardingStepCompletedPayload {
  step: number;
  step_name?: string;
}

export interface OnboardingCompletedPayload {
  total_steps: number;
  duration_seconds?: number;
}

export interface SessionStartedPayload {
  mission_id?: string | null;
  micro_mission_id?: string | null;
  mode?: 'focus' | 'salvage' | 'body_double';
  planned_minutes?: number;
}

export interface SessionCompletedPayload {
  session_id: string;
  mission_id?: string | null;
  planned_minutes: number;
  actual_seconds: number;
  distractions_captured?: number;
}

export interface SessionAbandonedPayload {
  session_id: string;
  mission_id?: string | null;
  planned_minutes: number;
  actual_seconds: number;
  abandon_reason?: string;
}

export interface SessionSalvagedPayload {
  session_id: string;
  mission_id?: string | null;
  planned_minutes: number;
  actual_seconds: number;
  salvage_notes?: string | null;
}

export interface CheckpointAnsweredPayload {
  session_id: string;
  checkpoint_index: number;
  response: string;
}

export interface RescueStartedPayload {
  trigger: string;
  state?: string;
}

export interface RescueCompletedPayload {
  trigger: string;
  state?: string;
  outcome: 'session_started' | 'mission_advanced' | 'state_changed' | 'other';
}

export interface StateSelectedPayload {
  state: string;
  source: 'rescue' | 'manual' | 'onboarding';
}

export interface MissionCreatedPayload {
  mission_id: string;
  has_description: boolean;
  has_deadline: boolean;
}

export interface MissionCompletedPayload {
  mission_id: string;
  total_sessions: number;
  total_minutes: number;
}

export interface MissionAbandonedPayload {
  mission_id: string;
  total_sessions: number;
  total_minutes: number;
  abandon_reason?: string;
}

export interface MissionSalvagedPayload {
  mission_id: string;
  salvage_notes?: string | null;
}

export interface MicroMissionCompletedPayload {
  micro_mission_id: string;
  mission_id: string;
  estimated_minutes: number;
  actual_minutes: number;
}

export interface CoachMessageSentPayload {
  message_length: number;
  has_context: boolean;
}

export interface CoachActionTakenPayload {
  action: string;
  source: 'suggestion' | 'quick_prompt' | 'full_chat';
}

export interface CoachQuickPromptTapPayload {
  prompt_id: string;
  prompt_label: string;
}

export interface BeforeScrollShownPayload {
  scroll_app: string;
  trigger: 'time_threshold' | 'app_open' | 'manual';
}

export interface BeforeScrollActionTappedPayload {
  action: 'start_session' | 'brain_dump' | 'state_check' | 'dismiss';
}

export interface BeforeScrollSkippedPayload {
  scroll_app: string;
  time_on_screen_ms?: number;
}

export interface NotificationReceivedPayload {
  notification_id: string;
  type: 'smart' | 'reminder' | 'streak' | 'marketing';
  channel: 'push' | 'local';
}

export interface NotificationTappedPayload {
  notification_id: string;
  type: string;
  time_to_tap_seconds?: number;
}

export interface NotificationActionTapPayload {
  notification_id: string;
  action: string;
}

export interface PushStyleChangedPayload {
  from: string;
  to: string;
}

export interface NotificationTimeChangedPayload {
  time_type: 'morning' | 'evening' | 'focus_reminder';
  old_value?: string;
  new_value: string;
}

export interface TrustCenterOpenedPayload {
  source: 'settings' | 'onboarding' | 'prompt';
}

export interface AppOpenedPayload {
  launch_type: 'cold' | 'warm' | 'notification' | 'widget' | 'shortcut';
  referral?: string;
}

export interface AppBackgroundedPayload {
  session_active: boolean;
  time_in_app_seconds?: number;
}

export interface AppForegroundedPayload {
  time_in_background_seconds?: number;
}

export interface ColdStartPayload {
  app_version: string;
  is_first_launch: boolean;
}

export interface WarmStartPayload {
  app_version: string;
}

export interface ShareTappedPayload {
  share_type: 'mission' | 'streak' | 'achievement' | 'app';
  surface: 'mission_detail' | 'session_complete' | 'settings' | 'share_sheet';
}

export interface ShareCompletedPayload {
  share_type: string;
  channel: string;
}

export interface ShareDismissedPayload {
  share_type: string;
  surface: string;
}

// ── Payload Map ────────────────────────────────────────────

export interface AnalyticsEventPayloadMap {
  onboarding_started: OnboardingStartedPayload;
  onboarding_step_completed: OnboardingStepCompletedPayload;
  onboarding_completed: OnboardingCompletedPayload;
  session_started: SessionStartedPayload;
  session_completed: SessionCompletedPayload;
  session_abandoned: SessionAbandonedPayload;
  session_salvaged: SessionSalvagedPayload;
  checkpoint_answered: CheckpointAnsweredPayload;
  rescue_started: RescueStartedPayload;
  rescue_completed: RescueCompletedPayload;
  state_selected: StateSelectedPayload;
  mission_created: MissionCreatedPayload;
  mission_completed: MissionCompletedPayload;
  mission_abandoned: MissionAbandonedPayload;
  mission_salvaged: MissionSalvagedPayload;
  micro_mission_completed: MicroMissionCompletedPayload;
  coach_message_sent: CoachMessageSentPayload;
  coach_action_taken: CoachActionTakenPayload;
  coach_quick_prompt_tap: CoachQuickPromptTapPayload;
  before_scroll_shown: BeforeScrollShownPayload;
  before_scroll_action_tapped: BeforeScrollActionTappedPayload;
  before_scroll_skipped: BeforeScrollSkippedPayload;
  notification_received: NotificationReceivedPayload;
  notification_tapped: NotificationTappedPayload;
  notification_action_tap: NotificationActionTapPayload;
  push_style_changed: PushStyleChangedPayload;
  notification_time_changed: NotificationTimeChangedPayload;
  trust_center_opened: TrustCenterOpenedPayload;
  app_opened: AppOpenedPayload;
  app_backgrounded: AppBackgroundedPayload;
  app_foregrounded: AppForegroundedPayload;
  cold_start: ColdStartPayload;
  warm_start: WarmStartPayload;
  share_tapped: ShareTappedPayload;
  share_completed: ShareCompletedPayload;
  share_dismissed: ShareDismissedPayload;
}

// ── Core Event Interface ───────────────────────────────────

export interface AnalyticsMetadata {
  app_version: string;
  platform: 'ios' | 'android' | 'web';
  device_info: string;
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsEvent<
  T extends AnalyticsEventName = AnalyticsEventName
> {
  id: string;
  name: T;
  category: AnalyticsEventCategory;
  timestamp: string;
  session_id: string;
  user_id: string;
  payload: AnalyticsEventPayloadMap[T];
  metadata: AnalyticsMetadata;
}

// ── Stored Queue Format ────────────────────────────────────

interface AnalyticsQueue {
  events: AnalyticsEvent[];
  last_flushed: string | null;
  version: string;
}

// ── Summary Stats ──────────────────────────────────────────

export interface AnalyticsSummaryStats {
  total_sessions: number;
  total_sessions_completed: number;
  total_sessions_abandoned: number;
  total_sessions_salvaged: number;
  session_completion_rate: number; // 0-1
  session_skip_rate: number; // 0-1
  rescue_rate: number; // 0-1
  total_missions_created: number;
  total_missions_completed: number;
  total_missions_abandoned: number;
  total_missions_salvaged: number;
  mission_completion_rate: number; // 0-1
  total_rescues_started: number;
  total_rescues_completed: number;
  rescue_success_rate: number; // 0-1
  total_onboarding_events: number;
  total_coach_interactions: number;
  total_shares: number;
  total_notifications_tapped: number;
  total_before_scroll_shown: number;
  total_before_scroll_skipped: number;
  before_scroll_skip_rate: number; // 0-1
  total_app_opens: number;
  total_cold_starts: number;
  total_warm_starts: number;
  days_active: number;
  first_event_date: string | null;
  last_event_date: string | null;
  total_events: number;
}

// ── Daily / Weekly Counts ──────────────────────────────────

export interface DailyEventCounts {
  date: string; // YYYY-MM-DD
  total: number;
  by_category: Record<AnalyticsEventCategory, number>;
  by_event: Partial<Record<AnalyticsEventName, number>>;
}

export interface WeeklyEventCounts {
  week_start: string; // YYYY-MM-DD
  week_end: string;   // YYYY-MM-DD
  total: number;
  by_category: Record<AnalyticsEventCategory, number>;
  by_event: Partial<Record<AnalyticsEventName, number>>;
  daily_breakdown: DailyEventCounts[];
}

// ── Internal Helpers ───────────────────────────────────────

function generateEventId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function getAnalyticsSessionId(): string {
  // Simple session ID — in production you'd use a proper session manager
  return 'sess_' + Date.now().toString(36);
}

function getAppVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require('../../package.json');
    return pkg.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function getPlatform(): 'ios' | 'android' | 'web' {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Platform } = require('react-native');
    return Platform?.OS ?? 'web';
  } catch {
    return 'web';
  }
}

function getDeviceInfo(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Platform } = require('react-native');
    return `${Platform?.OS ?? 'unknown'} ${Platform?.Version ?? ''}`.trim();
  } catch {
    return 'unknown';
  }
}

function buildMetadata(): AnalyticsMetadata {
  return {
    app_version: getAppVersion(),
    platform: getPlatform(),
    device_info: getDeviceInfo(),
  };
}

// ── Consent Gate ───────────────────────────────────────────

// The permission ID for analytics tracking. We use 'data_sharing_anonymous'
// as the closest existing permission, but also accept a custom key.
const ANALYTICS_PERMISSION: PermissionId = 'data_sharing_anonymous';

// ── Privacy Scrubbing ───────────────────────────────────────

const SENSITIVE_KEYS = [
  'context_text', 'raw_content', 'brain_dump', 'distraction_content',
  'mission_text', 'email_body', 'message_body', 'password', 'ssn',
  'credit_card', 'bank_account',
];

/**
 * Scrub sensitive data from an analytics event's payload.
 * Removes keys matching SENSITIVE_KEYS, strips non-primitive values,
 * and truncates strings longer than 100 characters.
 */
export function scrubEvent<T extends AnalyticsEventName>(
  event: AnalyticsEvent<T>,
): AnalyticsEvent<T> {
  const scrubbed: Record<string, any> = {};
  for (const [key, value] of Object.entries(event.payload as Record<string, any>)) {
    if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) continue;
    if (!['string', 'number', 'boolean'].includes(typeof value)) continue;
    if (typeof value === 'string' && value.length > 100) {
      scrubbed[key] = value.slice(0, 100);
    } else {
      scrubbed[key] = value;
    }
  }
  return { ...event, payload: scrubbed as AnalyticsEventPayloadMap[T] };
}

let _cachedConsent: boolean | null = null;
let _consentLedger: ConsentLedger | null = null;

/**
 * Set the consent ledger to check against. Call this from the store
 * or app initialization so analytics always checks the latest ledger.
 */
export function setAnalyticsConsentLedger(ledger: ConsentLedger): void {
  _consentLedger = ledger;
  _cachedConsent = null; // Invalidate cache
}

/**
 * Check if analytics tracking is permitted.
 * Returns true if the user has consented to analytics tracking.
 */
export function isAnalyticsPermitted(): boolean {
  if (_cachedConsent !== null) return _cachedConsent;
  if (!_consentLedger) return false;
  _cachedConsent = hasConsented(_consentLedger, ANALYTICS_PERMISSION);
  return _cachedConsent;
}

/**
 * Invalidate the cached consent check (e.g., after consent changes).
 */
export function invalidateConsentCache(): void {
  _cachedConsent = null;
}

// ── Queue Management ───────────────────────────────────────

async function getQueue(): Promise<AnalyticsQueue> {
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    if (raw) {
      return JSON.parse(raw) as AnalyticsQueue;
    }
  } catch {
    // Corrupted data — start fresh
  }
  return { events: [], last_flushed: null, version: '1.0.0' };
}

async function saveQueue(queue: AnalyticsQueue): Promise<void> {
  await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue));
}

// ── Core Tracking API ──────────────────────────────────────

/**
 * Track an analytics event. Respects consent — if the user has not
 * consented to analytics tracking, the event is silently dropped.
 *
 * Events are batched locally. When the batch reaches BATCH_SIZE (50),
 * the queue is "flushed" (persisted to AsyncStorage for later export).
 */
export async function trackEvent<T extends AnalyticsEventName>(
  name: T,
  payload: AnalyticsEventPayloadMap[T],
  options?: {
    userId?: string;
    sessionId?: string;
    metadata?: Partial<AnalyticsMetadata>;
  },
): Promise<void> {
  // Consent gate
  if (!isAnalyticsPermitted()) return;

  const event: AnalyticsEvent<T> = {
    id: generateEventId(),
    name,
    category: getEventCategory(name),
    timestamp: new Date().toISOString(),
    session_id: options?.sessionId ?? getAnalyticsSessionId(),
    user_id: options?.userId ?? 'anonymous',
    payload,
    metadata: {
      ...buildMetadata(),
      ...(options?.metadata ?? {}),
    },
  };

  const queue = await getQueue();
  queue.events.push(event as AnalyticsEvent);

  // Flush if batch size reached
  if (queue.events.length >= BATCH_SIZE) {
    await flushEvents();
  } else {
    await saveQueue(queue);
  }
}

/**
 * Synchronous-style tracking for use inside Zustand store actions.
 * This writes to a pending buffer that gets flushed on the next tick.
 * Respects consent.
 */
let _pendingBuffer: AnalyticsEvent[] = [];

export function trackEventSync<T extends AnalyticsEventName>(
  name: T,
  payload: AnalyticsEventPayloadMap[T],
  options?: {
    userId?: string;
    sessionId?: string;
    metadata?: Partial<AnalyticsMetadata>;
  },
): void {
  if (!isAnalyticsPermitted()) return;

  const event: AnalyticsEvent<T> = {
    id: generateEventId(),
    name,
    category: getEventCategory(name),
    timestamp: new Date().toISOString(),
    session_id: options?.sessionId ?? getAnalyticsSessionId(),
    user_id: options?.userId ?? 'anonymous',
    payload,
    metadata: {
      ...buildMetadata(),
      ...(options?.metadata ?? {}),
    },
  };

  _pendingBuffer.push(event as AnalyticsEvent);

  // Schedule flush on next microtask
  if (_pendingBuffer.length >= 5) {
    flushPendingBuffer();
  } else {
    // Debounce: schedule a flush if one isn't already pending
    if (!_flushScheduled) {
      _flushScheduled = true;
      Promise.resolve().then(() => {
        flushPendingBuffer();
        _flushScheduled = false;
      });
    }
  }
}

let _flushScheduled = false;

async function flushPendingBuffer(): Promise<void> {
  if (_pendingBuffer.length === 0) return;
  const events = [..._pendingBuffer];
  _pendingBuffer = [];

  const queue = await getQueue();
  queue.events.push(...events);

  if (queue.events.length >= BATCH_SIZE) {
    await flushEvents();
  } else {
    await saveQueue(queue);
  }
}

/**
 * Flush all queued events to persistent storage.
 * In a future version this would also send to a server.
 */
export async function flushEvents(): Promise<void> {
  const queue = await getQueue();
  if (queue.events.length === 0) return;

  // Persist flushed events under the main key for dashboard queries
  try {
    const raw = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
    const existing: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    const merged = [...existing, ...queue.events];
    await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // If we can't persist, keep events in queue for retry
    return;
  }

  // Clear the queue
  queue.events = [];
  queue.last_flushed = new Date().toISOString();
  await saveQueue(queue);
}

/**
 * Force flush — useful on app background or before shutdown.
 */
export async function forceFlush(): Promise<void> {
  await flushPendingBuffer();
  await flushEvents();
}

// ── Event Reader ───────────────────────────────────────────

async function getAllEvents(): Promise<AnalyticsEvent[]> {
  // Combine flushed events + pending queue
  const [flushedRaw, queue] = await Promise.all([
    AsyncStorage.getItem(ANALYTICS_STORAGE_KEY),
    getQueue(),
  ]);

  const flushed: AnalyticsEvent[] = flushedRaw ? JSON.parse(flushedRaw) : [];
  return [...flushed, ...queue.events];
}

// ── Dashboard Helpers ──────────────────────────────────────

/**
 * Get daily event counts for the last N days.
 */
export async function getDailyEventCounts(days: number = 7): Promise<DailyEventCounts[]> {
  const events = await getAllEvents();
  const now = new Date();
  const result: DailyEventCounts[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().slice(0, 10);

    const dayEvents = events.filter((e) => e.timestamp.slice(0, 10) === dateStr);

    const by_category = {} as Record<AnalyticsEventCategory, number>;
    const by_event = {} as Partial<Record<AnalyticsEventName, number>>;

    for (const cat of [
      'onboarding', 'session', 'rescue', 'mission', 'coach',
      'before_scroll', 'notification', 'settings', 'app', 'share',
    ] as AnalyticsEventCategory[]) {
      by_category[cat] = dayEvents.filter((e) => e.category === cat).length;
    }

    for (const evt of dayEvents) {
      by_event[evt.name] = (by_event[evt.name] ?? 0) + 1;
    }

    result.push({
      date: dateStr,
      total: dayEvents.length,
      by_category,
      by_event,
    });
  }

  return result.reverse(); // Oldest first
}

/**
 * Get weekly event counts for the last N weeks.
 */
export async function getWeeklyEventCounts(weeks: number = 4): Promise<WeeklyEventCounts[]> {
  const events = await getAllEvents();
  const now = new Date();
  const result: WeeklyEventCounts[] = [];

  for (let w = 0; w < weeks; w++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    const weekEvents = events.filter((e) => {
      const d = e.timestamp.slice(0, 10);
      return d >= weekStartStr && d <= weekEndStr;
    });

    const by_category = {} as Record<AnalyticsEventCategory, number>;
    const by_event = {} as Partial<Record<AnalyticsEventName, number>>;

    for (const cat of [
      'onboarding', 'session', 'rescue', 'mission', 'coach',
      'before_scroll', 'notification', 'settings', 'app', 'share',
    ] as AnalyticsEventCategory[]) {
      by_category[cat] = weekEvents.filter((e) => e.category === cat).length;
    }

    for (const evt of weekEvents) {
      by_event[evt.name] = (by_event[evt.name] ?? 0) + 1;
    }

    // Daily breakdown within the week
    const daily_breakdown: DailyEventCounts[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + d);
      const dayStr = day.toISOString().slice(0, 10);
      const dayEvents = weekEvents.filter((e) => e.timestamp.slice(0, 10) === dayStr);

      const dayByCategory = {} as Record<AnalyticsEventCategory, number>;
      const dayByEvent = {} as Partial<Record<AnalyticsEventName, number>>;

      for (const cat of [
        'onboarding', 'session', 'rescue', 'mission', 'coach',
        'before_scroll', 'notification', 'settings', 'app', 'share',
      ] as AnalyticsEventCategory[]) {
        dayByCategory[cat] = dayEvents.filter((e) => e.category === cat).length;
      }
      for (const evt of dayEvents) {
        dayByEvent[evt.name] = (dayByEvent[evt.name] ?? 0) + 1;
      }

      daily_breakdown.push({
        date: dayStr,
        total: dayEvents.length,
        by_category: dayByCategory,
        by_event: dayByEvent,
      });
    }

    result.push({
      week_start: weekStartStr,
      week_end: weekEndStr,
      total: weekEvents.length,
      by_category,
      by_event,
      daily_breakdown,
    });
  }

  return result.reverse(); // Oldest first
}

/**
 * Get raw event history for the last N days.
 */
export async function getEventHistory(days: number = 7): Promise<AnalyticsEvent[]> {
  const events = await getAllEvents();
  const cutoff = Date.now() - days * 86400000;
  return events.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}

/**
 * Get summary statistics for the analytics dashboard.
 */
export async function getSummaryStats(): Promise<AnalyticsSummaryStats> {
  const events = await getAllEvents();

  const count = (name: AnalyticsEventName) =>
    events.filter((e) => e.name === name).length;

  const total_sessions = count('session_started');
  const total_sessions_completed = count('session_completed');
  const total_sessions_abandoned = count('session_abandoned');
  const total_sessions_salvaged = count('session_salvaged');
  const total_session_outcomes = total_sessions_completed + total_sessions_abandoned + total_sessions_salvaged;

  const total_rescues_started = count('rescue_started');
  const total_rescues_completed = count('rescue_completed');

  const total_missions_created = count('mission_created');
  const total_missions_completed = count('mission_completed');
  const total_missions_abandoned = count('mission_abandoned');
  const total_missions_salvaged = count('mission_salvaged');

  const total_before_scroll_shown = count('before_scroll_shown');
  const total_before_scroll_skipped = count('before_scroll_skipped');

  // Unique active days
  const activeDays = new Set(events.map((e) => e.timestamp.slice(0, 10)));

  const sortedByDate = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return {
    total_sessions,
    total_sessions_completed,
    total_sessions_abandoned,
    total_sessions_salvaged,
    session_completion_rate: total_session_outcomes > 0
      ? total_sessions_completed / total_session_outcomes
      : 0,
    session_skip_rate: total_session_outcomes > 0
      ? total_sessions_abandoned / total_session_outcomes
      : 0,
    rescue_rate: total_sessions > 0
      ? total_rescues_started / total_sessions
      : 0,
    total_missions_created,
    total_missions_completed,
    total_missions_abandoned,
    total_missions_salvaged,
    mission_completion_rate: total_missions_created > 0
      ? total_missions_completed / total_missions_created
      : 0,
    total_rescues_started,
    total_rescues_completed,
    rescue_success_rate: total_rescues_started > 0
      ? total_rescues_completed / total_rescues_started
      : 0,
    total_onboarding_events: events.filter((e) => e.category === 'onboarding').length,
    total_coach_interactions: events.filter((e) => e.category === 'coach').length,
    total_shares: events.filter((e) => e.category === 'share').length,
    total_notifications_tapped: count('notification_tapped'),
    total_before_scroll_shown,
    total_before_scroll_skipped,
    before_scroll_skip_rate: total_before_scroll_shown > 0
      ? total_before_scroll_skipped / total_before_scroll_shown
      : 0,
    total_app_opens: count('app_opened'),
    total_cold_starts: count('cold_start'),
    total_warm_starts: count('warm_start'),
    days_active: activeDays.size,
    first_event_date: sortedByDate[0]?.timestamp ?? null,
    last_event_date: sortedByDate[sortedByDate.length - 1]?.timestamp ?? null,
    total_events: events.length,
  };
}

// ── Convenience Trackers ───────────────────────────────────

/** Track mission creation. */
export function trackMissionCreated(
  missionId: string,
  hasDescription: boolean,
  hasDeadline: boolean,
  userId?: string,
): void {
  trackEventSync('mission_created', {
    mission_id: missionId,
    has_description: hasDescription,
    has_deadline: hasDeadline,
  }, { userId });
}

/** Track mission completion. */
export function trackMissionCompleted(
  missionId: string,
  totalSessions: number,
  totalMinutes: number,
  userId?: string,
): void {
  trackEventSync('mission_completed', {
    mission_id: missionId,
    total_sessions: totalSessions,
    total_minutes: totalMinutes,
  }, { userId });
}

/** Track mission abandonment. */
export function trackMissionAbandoned(
  missionId: string,
  totalSessions: number,
  totalMinutes: number,
  userId?: string,
  abandonReason?: string,
): void {
  trackEventSync('mission_abandoned', {
    mission_id: missionId,
    total_sessions: totalSessions,
    total_minutes: totalMinutes,
    abandon_reason: abandonReason,
  }, { userId });
}

/** Track mission salvage. */
export function trackMissionSalvaged(
  missionId: string,
  userId?: string,
  salvageNotes?: string | null,
): void {
  trackEventSync('mission_salvaged', {
    mission_id: missionId,
    salvage_notes: salvageNotes ?? null,
  }, { userId });
}

/** Track session start. */
export function trackSessionStarted(
  userId?: string,
  missionId?: string | null,
  microMissionId?: string | null,
  mode?: 'focus' | 'salvage' | 'body_double',
  plannedMinutes?: number,
): void {
  trackEventSync('session_started', {
    mission_id: missionId ?? null,
    micro_mission_id: microMissionId ?? null,
    mode: mode ?? 'focus',
    planned_minutes: plannedMinutes ?? 25,
  }, { userId });
}

/** Track session completion. */
export function trackSessionCompleted(
  sessionId: string,
  missionId: string | null,
  plannedMinutes: number,
  actualSeconds: number,
  userId?: string,
  distractionsCaptured?: number,
): void {
  trackEventSync('session_completed', {
    session_id: sessionId,
    mission_id: missionId ?? null,
    planned_minutes: plannedMinutes,
    actual_seconds: actualSeconds,
    distractions_captured: distractionsCaptured ?? 0,
  }, { userId });
}

/** Track session abandonment. */
export function trackSessionAbandoned(
  sessionId: string,
  missionId: string | null,
  plannedMinutes: number,
  actualSeconds: number,
  userId?: string,
): void {
  trackEventSync('session_abandoned', {
    session_id: sessionId,
    mission_id: missionId ?? null,
    planned_minutes: plannedMinutes,
    actual_seconds: actualSeconds,
  }, { userId });
}

/** Track session salvage. */
export function trackSessionSalvaged(
  sessionId: string,
  missionId: string | null,
  plannedMinutes: number,
  actualSeconds: number,
  userId?: string,
  salvageNotes?: string | null,
): void {
  trackEventSync('session_salvaged', {
    session_id: sessionId,
    mission_id: missionId ?? null,
    planned_minutes: plannedMinutes,
    actual_seconds: actualSeconds,
    salvage_notes: salvageNotes ?? null,
  }, { userId });
}

/** Track rescue started (via momentum event type). */
export function trackRescueStarted(
  trigger: string,
  state?: string,
  userId?: string,
): void {
  trackEventSync('rescue_started', {
    trigger,
    state,
  }, { userId });
}

// ── Store Integration Helper ───────────────────────────────

/**
 * Call this once during app initialization to wire the consent ledger
 * into the analytics system. Pass the store's consentLedger state.
 *
 * Usage in your app entry point or store subscription:
 *   setAnalyticsConsentLedger(store.getState().consentLedger);
 */
export function initAnalytics(ledger: ConsentLedger): void {
  setAnalyticsConsentLedger(ledger);
}

/**
 * Subscribe this to the Zustand store so analytics always has the
 * latest consent ledger. Call from a store subscription.
 */
export function onStoreUpdate(ledger: ConsentLedger): void {
  setAnalyticsConsentLedger(ledger);
}

// ── Export / Debug ─────────────────────────────────────────

/**
 * Get the current queue size (for debugging).
 */
export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.events.length + _pendingBuffer.length;
}

/**
 * Clear all analytics data (for testing or data deletion requests).
 */
export async function clearAllAnalyticsData(): Promise<void> {
  await AsyncStorage.removeItem(ANALYTICS_STORAGE_KEY);
  await AsyncStorage.removeItem(ANALYTICS_QUEUE_KEY);
  _pendingBuffer = [];
}

/**
 * Get all events as JSON (for data export / GDPR requests).
 */
export async function exportAllEvents(): Promise<string> {
  const events = await getAllEvents();
  return JSON.stringify(events, null, 2);
}
