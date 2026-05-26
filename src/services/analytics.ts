// ══════════════════════════════════════════════════════════════
// Analytics Event System
// MMKV-backed, consent-gated, batched event tracking.
//
// 15 canonical events. Stored in MMKV under 'intent-analytics'.
// Flushed in batches of 50. No network calls — local only.
// ══════════════════════════════════════════════════════════════

import { MMKV } from 'react-native-mmkv';
import { hasConsented, ConsentLedger, PermissionId } from './consent';

// ── MMKV Instance ───────────────────────────────────────────

const analyticsStorage = new MMKV({ id: 'intent-analytics' });

// ── Constants ───────────────────────────────────────────────

const QUEUE_KEY = 'analytics_queue';
const STORED_KEY = 'analytics_stored';
const BATCH_SIZE = 50;
const ANALYTICS_PERMISSION: PermissionId = 'data_sharing_anonymous';

// ── Event Names & Payloads ──────────────────────────────────

export type AnalyticsEventName =
  | 'app_install'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'first_rescue_completed'
  | 'rescue_started'
  | 'rescue_completed'
  | 'rescue_abandoned'
  | 'before_scroll_opened'
  | 'before_scroll_completed'
  | 'danger_window_notification_tapped'
  | 'intelligence_panel_viewed'
  | 'paywall_shown'
  | 'paywall_converted'
  | 'paywall_dismissed'
  | 'ai_coach_message_sent';

export interface AppInstallPayload { platform: string }
export interface OnboardingStartedPayload { firstState?: string }
export interface OnboardingCompletedPayload { timeToCompleteMs: number; missionGenerated: boolean }
export interface FirstRescueCompletedPayload { protocol: string; stateId: string; minutes: number; wasSalvaged: boolean }
export interface RescueStartedPayload { stateId: string; protocol: string; plannedMinutes: number }
export interface RescueCompletedPayload { actualMinutes: number; wasSalvaged: boolean; distractionsCaptured: number }
export interface RescueAbandonedPayload { atPercent: number; stateId: string }
export interface BeforeScrollOpenedPayload { skipCount: number }
export interface BeforeScrollCompletedPayload { scrolledAnyway: boolean }
export interface DangerWindowNotificationTappedPayload { windowId: string; convertedToSession: boolean }
export interface IntelligencePanelViewedPayload { sessionCount: number }
export interface PaywallShownPayload { trigger: string; isPro: boolean }
export interface PaywallConvertedPayload { plan: string; trigger: string }
export interface PaywallDismissedPayload { trigger: string }
export interface AiCoachMessageSentPayload { responseSourceTier: string; latencyMs: number }

export interface AnalyticsEventPayloadMap {
  app_install: AppInstallPayload;
  onboarding_started: OnboardingStartedPayload;
  onboarding_completed: OnboardingCompletedPayload;
  first_rescue_completed: FirstRescueCompletedPayload;
  rescue_started: RescueStartedPayload;
  rescue_completed: RescueCompletedPayload;
  rescue_abandoned: RescueAbandonedPayload;
  before_scroll_opened: BeforeScrollOpenedPayload;
  before_scroll_completed: BeforeScrollCompletedPayload;
  danger_window_notification_tapped: DangerWindowNotificationTappedPayload;
  intelligence_panel_viewed: IntelligencePanelViewedPayload;
  paywall_shown: PaywallShownPayload;
  paywall_converted: PaywallConvertedPayload;
  paywall_dismissed: PaywallDismissedPayload;
  ai_coach_message_sent: AiCoachMessageSentPayload;
}

// ── Event Interface ─────────────────────────────────────────

export interface AnalyticsMetadata {
  app_version: string;
  platform: 'ios' | 'android' | 'web';
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> {
  id: string;
  name: T;
  timestamp: string;
  session_id: string;
  user_id: string;
  payload: AnalyticsEventPayloadMap[T];
  metadata: AnalyticsMetadata;
}

// ── Queue Shape ─────────────────────────────────────────────

interface AnalyticsQueue {
  events: AnalyticsEvent[];
  last_flushed: string | null;
}

// ── Consent Gate ────────────────────────────────────────────

let _cachedConsent: boolean | null = null;
let _consentLedger: ConsentLedger | null = null;

export function setAnalyticsConsentLedger(ledger: ConsentLedger): void {
  _consentLedger = ledger;
  _cachedConsent = null;
}

export function isAnalyticsPermitted(): boolean {
  if (_cachedConsent !== null) return _cachedConsent;
  if (!_consentLedger) return false;
  _cachedConsent = hasConsented(_consentLedger, ANALYTICS_PERMISSION);
  return _cachedConsent;
}

export function invalidateConsentCache(): void {
  _cachedConsent = null;
}

// ── Internal Helpers ────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function getSessionId(): string {
  return 'sess_' + Date.now().toString(36);
}

function getPlatform(): 'ios' | 'android' | 'web' {
  try {
    const { Platform } = require('react-native');
    return Platform?.OS ?? 'web';
  } catch {
    return 'web';
  }
}

function buildMetadata(): AnalyticsMetadata {
  try {
    const pkg = require('../../package.json');
    return { app_version: pkg.version ?? '1.0.0', platform: getPlatform() };
  } catch {
    return { app_version: '1.0.0', platform: getPlatform() };
  }
}

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

// ── Queue Management (MMKV) ─────────────────────────────────

function getQueue(): AnalyticsQueue {
  try {
    const raw = analyticsStorage.getString(QUEUE_KEY);
    if (raw) return JSON.parse(raw) as AnalyticsQueue;
  } catch {
    // Corrupted — start fresh
  }
  return { events: [], last_flushed: null };
}

function saveQueue(queue: AnalyticsQueue): void {
  analyticsStorage.set(QUEUE_KEY, JSON.stringify(queue));
}

// ── Core Tracking API ───────────────────────────────────────

/**
 * Track an analytics event. Respects consent — silently dropped
 * if the user has not consented. Events are batched locally and
 * flushed when the batch reaches BATCH_SIZE (50).
 */
export function trackEvent<T extends AnalyticsEventName>(
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
    id: generateId(),
    name,
    timestamp: new Date().toISOString(),
    session_id: options?.sessionId ?? getSessionId(),
    user_id: options?.userId ?? 'anonymous',
    payload,
    metadata: { ...buildMetadata(), ...(options?.metadata ?? {}) },
  };

  const queue = getQueue();
  queue.events.push(event as AnalyticsEvent);

  if (queue.events.length >= BATCH_SIZE) {
    flushEvents();
  } else {
    saveQueue(queue);
  }
}

/**
 * Synchronous tracking for Zustand store actions.
 * Writes to a pending buffer flushed on the next microtask.
 */
let _pendingBuffer: AnalyticsEvent[] = [];
let _flushScheduled = false;

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
    id: generateId(),
    name,
    timestamp: new Date().toISOString(),
    session_id: options?.sessionId ?? getSessionId(),
    user_id: options?.userId ?? 'anonymous',
    payload,
    metadata: { ...buildMetadata(), ...(options?.metadata ?? {}) },
  };

  _pendingBuffer.push(event as AnalyticsEvent);

  if (_pendingBuffer.length >= 5) {
    flushPendingBuffer();
  } else if (!_flushScheduled) {
    _flushScheduled = true;
    Promise.resolve().then(() => {
      flushPendingBuffer();
      _flushScheduled = false;
    });
  }
}

function flushPendingBuffer(): void {
  if (_pendingBuffer.length === 0) return;
  const events = [..._pendingBuffer];
  _pendingBuffer = [];

  const queue = getQueue();
  queue.events.push(...events);

  if (queue.events.length >= BATCH_SIZE) {
    flushEvents();
  } else {
    saveQueue(queue);
  }
}

/**
 * Flush all queued events to persistent storage.
 * In a future version this would also send to a server.
 */
export function flushEvents(): void {
  const queue = getQueue();
  if (queue.events.length === 0) return;

  try {
    const raw = analyticsStorage.getString(STORED_KEY);
    const existing: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    const merged = [...existing, ...queue.events];
    analyticsStorage.set(STORED_KEY, JSON.stringify(merged));
  } catch {
    return; // Keep events in queue for retry
  }

  queue.events = [];
  queue.last_flushed = new Date().toISOString();
  saveQueue(queue);
}

/** Force flush — useful on app background or before shutdown. */
export function forceFlush(): void {
  flushPendingBuffer();
  flushEvents();
}

// ── Event Queries ───────────────────────────────────────────

function getAllEvents(): AnalyticsEvent[] {
  const raw = analyticsStorage.getString(STORED_KEY);
  const flushed: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
  const queue = getQueue();
  return [...flushed, ...queue.events];
}

/** Get count of a specific event type. */
export function getEventCount(name: AnalyticsEventName): number {
  return getAllEvents().filter((e) => e.name === name).length;
}

/** Get total number of stored events. */
export function getTotalEventCount(): number {
  return getAllEvents().length;
}

// ── Data Management ─────────────────────────────────────────

/** Clear all analytics data (for testing or data deletion). */
export function clearAnalytics(): void {
  analyticsStorage.delete(STORED_KEY);
  analyticsStorage.delete(QUEUE_KEY);
  _pendingBuffer = [];
}

/** Get current queue size (for debugging). */
export function getQueueSize(): number {
  return getQueue().events.length + _pendingBuffer.length;
}

/** Export all events as JSON (for GDPR requests). */
export function exportAllEvents(): string {
  return JSON.stringify(getAllEvents(), null, 2);
}

// ── Store Integration ───────────────────────────────────────

/** Call once during app init to wire the consent ledger. */
export function initAnalytics(ledger: ConsentLedger): void {
  setAnalyticsConsentLedger(ledger);
}

/** Call from store subscription to keep consent current. */
export function onStoreUpdate(ledger: ConsentLedger): void {
  setAnalyticsConsentLedger(ledger);
}
