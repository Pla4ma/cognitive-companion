// ══════════════════════════════════════════════════════════════
// INTENT — Ambient Agent Service
// Orchestrates proactive rescue suggestions
// ══════════════════════════════════════════════════════════════

import type {
  AmbientModeSettings,
  AmbientSuggestion,
  AmbientAgentState,
  AmbientTrigger,
  AmbientSurface,
  AmbientPromptType,
  DangerWindow,
} from '../../types/ambient'
import { DEFAULT_AMBIENT_SETTINGS } from '../../types/ambient'
import {
  evaluateAmbientPolicy,
  isWithinDangerWindow,
  isWithinQuietHours,
} from './ambientPolicy'
import { generateAmbientCopy, generateWhyExplanation } from './ambientCopy'

// ── Ambient Agent ──────────────────────────────────────────

export class AmbientAgent {
  private settings: AmbientModeSettings
  private state: AmbientAgentState
  private suggestions: AmbientSuggestion[] = []
  private recentCopy: string[] = []

  constructor(settings: AmbientModeSettings = DEFAULT_AMBIENT_SETTINGS) {
    this.settings = settings
    this.state = {
      status: 'inactive',
      suggestionsToday: 0,
      lastSuggestionAt: null,
      consecutiveDismissals: 0,
      lastDismissalAt: null,
      activeDangerWindowId: null,
      nextScheduledCheck: null,
    }
  }

  // ── Settings ────────────────────────────────────────────

  updateSettings(settings: Partial<AmbientModeSettings>): void {
    this.settings = { ...this.settings, ...settings }
    if (!this.settings.enabled) {
      this.state.status = 'inactive'
    }
  }

  getSettings(): AmbientModeSettings {
    return { ...this.settings }
  }

  getState(): AmbientAgentState {
    return { ...this.state }
  }

  getSuggestions(): AmbientSuggestion[] {
    return [...this.suggestions]
  }

  getActiveSuggestions(): AmbientSuggestion[] {
    const now = new Date()
    return this.suggestions.filter(
      (s) => !s.dismissedAt && !s.actedAt && new Date(s.expiresAt) > now,
    )
  }

  // ── Core Loop ───────────────────────────────────────────

  /**
   * Check if an ambient suggestion should be generated.
   * Call this periodically or on app foreground.
   */
  check(now: Date = new Date()): AmbientSuggestion | null {
    if (!this.settings.enabled) return null

    // Evaluate policy
    const policy = evaluateAmbientPolicy(
      this.settings,
      this.state.suggestionsToday,
      this.state.consecutiveDismissals,
      this.state.lastDismissalAt,
      now,
    )

    if (!policy.allowed) {
      this.state.status = policy.reason === 'Within quiet hours' ? 'quiet_hours' : 'watching'
      return null
    }

    // Check danger windows
    const activeWindow = isWithinDangerWindow(this.settings.dangerWindows, now)
    if (activeWindow) {
      this.state.activeDangerWindowId = activeWindow.id
      return this.createSuggestion('danger_window', activeWindow, now)
    }

    this.state.status = 'watching'
    return null
  }

  /**
   * Generate a suggestion for a specific trigger.
   */
  suggestForTrigger(
    trigger: AmbientTrigger,
    surface: AmbientSurface = 'in_app',
    now: Date = new Date(),
  ): AmbientSuggestion | null {
    const policy = evaluateAmbientPolicy(
      this.settings,
      this.state.suggestionsToday,
      this.state.consecutiveDismissals,
      this.state.lastDismissalAt,
      now,
    )

    if (!policy.allowed) return null

    return this.createSuggestion(trigger, null, now, surface)
  }

  // ── Suggestion Lifecycle ────────────────────────────────

  dismissSuggestion(suggestionId: string): void {
    const suggestion = this.suggestions.find((s) => s.id === suggestionId)
    if (!suggestion || suggestion.dismissedAt) return

    suggestion.dismissedAt = new Date().toISOString()
    this.state.consecutiveDismissals += 1
    this.state.lastDismissalAt = new Date().toISOString()
  }

  actOnSuggestion(suggestionId: string, action: string): void {
    const suggestion = this.suggestions.find((s) => s.id === suggestionId)
    if (!suggestion || suggestion.actedAt) return

    suggestion.actedAt = new Date().toISOString()
    suggestion.actionTaken = action
    this.state.consecutiveDismissals = 0
  }

  // ── Danger Window Management ────────────────────────────

  addDangerWindow(window: Omit<DangerWindow, 'id' | 'createdAt' | 'updatedAt'>): DangerWindow {
    const newWindow: DangerWindow = {
      ...window,
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.settings.dangerWindows.push(newWindow)
    return newWindow
  }

  updateDangerWindow(id: string, updates: Partial<DangerWindow>): void {
    this.settings.dangerWindows = this.settings.dangerWindows.map((w) =>
      w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w,
    )
  }

  removeDangerWindow(id: string): void {
    this.settings.dangerWindows = this.settings.dangerWindows.filter((w) => w.id !== id)
  }

  // ── Internal ────────────────────────────────────────────

  private createSuggestion(
    trigger: AmbientTrigger,
    dangerWindow: DangerWindow | null,
    now: Date,
    surface: AmbientSurface = 'in_app',
  ): AmbientSuggestion {
    const promptType = this.triggerToPromptType(trigger)
    const copy = generateAmbientCopy({
      trigger,
      promptType,
      dangerWindow,
      sensitiveMode: this.settings.sensitiveMode,
      recentCopy: this.recentCopy,
      confidence: dangerWindow?.confidence ?? 0.5,
    })

    const suggestion: AmbientSuggestion = {
      id: uid(),
      trigger,
      surface,
      copy: copy.body,
      title: copy.title,
      body: copy.body,
      recommendedAction: copy.action,
      protocolId: dangerWindow?.preferredProtocol ?? null,
      missionSeed: null,
      privacyLevel: this.settings.sensitiveMode ? 'personal' : 'public',
      dangerWindowId: dangerWindow?.id ?? null,
      confidence: dangerWindow?.confidence ?? 0.5,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // 30 min
      createdAt: now.toISOString(),
      dismissedAt: null,
      actedAt: null,
      actionTaken: null,
    }

    this.suggestions.push(suggestion)
    this.state.suggestionsToday += 1
    this.state.lastSuggestionAt = now.toISOString()
    this.state.status = 'suggestion_ready'

    // Track recent copy to avoid repeats
    this.recentCopy.push(copy.title, copy.body)
    if (this.recentCopy.length > 10) {
      this.recentCopy = this.recentCopy.slice(-10)
    }

    return suggestion
  }

  private triggerToPromptType(trigger: AmbientTrigger): AmbientPromptType {
    const mapping: Record<AmbientTrigger, AmbientPromptType> = {
    danger_window: 'rescue',
    missed_rescue: 'comeback',
    abandoned_mission: 'comeback',
    comeback: 'comeback',
    before_scroll_window: 'before_scroll',
      context_due_soon: 'context_to_mission',
      user_pattern: 'rescue',
    }
    return mapping[trigger] ?? 'rescue'
  }

  // ── Reset Daily ─────────────────────────────────────────

  resetDaily(): void {
    this.state.suggestionsToday = 0
    this.state.consecutiveDismissals = 0
  }
}

// ── Helpers ────────────────────────────────────────────────

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ── Factory ────────────────────────────────────────────────

export function createAmbientAgent(settings?: AmbientModeSettings): AmbientAgent {
  return new AmbientAgent(settings)
}
