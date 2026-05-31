// ══════════════════════════════════════════════════════════════
// INTENT — Population Priors
// Sensible defaults for new users with no personal data.
// These are population-level patterns that get replaced by
// personal data as the user accumulates sessions.
// No store imports — data is passed in as parameters.
// ══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface PopulationPrior {
  /** Hours when drift is most common across the population (0-23) */
  typicalDangerHours: number[]
  /** Average session duration in minutes */
  averageSessionMinutes: number
  /** Most common emotional states at drift time */
  commonStates: string[]
  /** Baseline momentum score (0-100) for a new user */
  defaultMomentumBaseline: number
}

export interface DangerWindow {
  startHour: number
  endHour: number
  label: string
  riskLevel: 'low' | 'moderate' | 'high'
  suggestedAction: string
}

interface PersonalDataPoint {
  /** Number of completed sessions */
  sessionCount: number
  /** User's actual average session minutes (if available) */
  avgSessionMinutes?: number
  /** User's actual danger hours (if detected) */
  personalDangerHours?: number[]
  /** User's actual common states */
  personalStates?: string[]
  /** User's actual momentum baseline */
  personalMomentum?: number
}

// ── Population Prior ─────────────────────────────────────────

/**
 * Returns population-level defaults for a new user.
 * Optional timezone can shift danger hours to local time.
 *
 * These priors are based on common patterns observed in
 * productivity and habit-tracking research:
 *   - Afternoon energy dip (2-4pm) is nearly universal
 *   - Late evening (9-11pm) is when doomscrolling risk peaks
 *   - Short sessions (5-10 min) have highest completion rates
 *   - Overwhelmed and avoiding are the most common initial states
 */
export function getPopulationPrior(timezone?: string): PopulationPrior {
  // Base priors (UTC-adjustable)
  const base: PopulationPrior = {
    typicalDangerHours: [14, 15, 16, 21, 22, 23],
    averageSessionMinutes: 7,
    commonStates: ['overwhelmed', 'avoiding', 'stuck', 'tired', 'scattered'],
    defaultMomentumBaseline: 40,
  }

  if (!timezone) return base

  // Attempt timezone-aware adjustment (best-effort)
  try {
    const offset = getTimezoneOffset(timezone)
    const adjustedHours = base.typicalDangerHours.map(h => {
      const adjusted = (h + offset + 24) % 24
      return adjusted
    })
    return { ...base, typicalDangerHours: adjustedHours }
  } catch {
    // Unknown timezone — return base
    return base
  }
}

/**
 * Returns common danger windows with labels and suggested actions.
 * These are the windows shown to new users before personal data replaces them.
 */
export function getDefaultDangerWindows(): DangerWindow[] {
  return [
    {
      startHour: 14,
      endHour: 16,
      label: 'Afternoon dip',
      riskLevel: 'moderate',
      suggestedAction: 'A 5-minute reset can break the afternoon fog. Shrink the task to its smallest version.',
    },
    {
      startHour: 16,
      endHour: 17,
      label: 'Late afternoon drift',
      riskLevel: 'moderate',
      suggestedAction: 'The day is winding down. One tiny win before evening changes the whole tone.',
    },
    {
      startHour: 21,
      endHour: 23,
      label: 'Evening doomscroll window',
      riskLevel: 'high',
      suggestedAction: 'This is when scrolling steals the most time. A 2-minute action before screens is your best defense.',
    },
    {
      startHour: 0,
      endHour: 2,
      label: 'Late night spiral',
      riskLevel: 'low',
      suggestedAction: 'If you are still up, rest is the rescue. One tiny action, then sleep.',
    },
  ]
}

/**
 * Returns tips for new users who have no session history.
 * These appear during onboarding and on empty states.
 */
export function getOnboardingHints(): string[] {
  return [
    'Start with a 2-minute rescue. That is it. Two minutes is enough to break drift.',
    'You do not need to finish — starting is the win. Every rescue counts, even the ones you abandon.',
    'Pick the state that feels closest right now. "Overwhelmed" and "avoiding" are the most common — you are not alone.',
    'INTENT learns your patterns over time. The first 10 sessions are the calibration phase.',
    'The best time to rescue a moment is right now. The second best is in 2 minutes.',
    'You can do anything for 120 seconds. That is the core belief here.',
    'Drift is not laziness — it is your brain seeking comfort. A tiny action rewires the loop.',
    'Come back tomorrow. Consistency beats intensity. One rescue per day is a strong start.',
  ]
}

/**
 * Merges population-level priors with personal data as it accumulates.
 * The transition is gradual:
 *   - 0-5 sessions: 100% population prior
 *   - 5-15 sessions: 70% prior / 30% personal
 *   - 15-30 sessions: 40% prior / 60% personal
 *   - 30+ sessions: 10% prior / 90% personal
 *
 * This prevents the system from making wild swings based on
 * a few data points while still learning quickly.
 */
export function transitionFromPrior(
  prior: PopulationPrior,
  personalData: PersonalDataPoint,
): PopulationPrior {
  const n = personalData.sessionCount

  // Blend ratio: how much to trust personal data vs. population prior
  let personalWeight: number
  if (n < 5) {
    personalWeight = 0
  } else if (n < 15) {
    personalWeight = (n - 5) / 10 * 0.3   // 0 → 0.3
  } else if (n < 30) {
    personalWeight = 0.3 + ((n - 15) / 15) * 0.3  // 0.3 → 0.6
  } else if (n < 60) {
    personalWeight = 0.6 + ((n - 30) / 30) * 0.3  // 0.6 → 0.9
  } else {
    personalWeight = 0.9
  }

  const priorWeight = 1 - personalWeight

  // Merge danger hours: union of prior and personal, weighted by confidence
  const mergedDangerHours = mergeDangerHours(
    prior.typicalDangerHours,
    personalData.personalDangerHours ?? [],
    priorWeight,
    personalWeight,
  )

  // Merge average session minutes
  const mergedMinutes = personalData.avgSessionMinutes != null
    ? Math.round(prior.averageSessionMinutes * priorWeight + personalData.avgSessionMinutes * personalWeight)
    : prior.averageSessionMinutes

  // Merge common states (prefer personal if available)
  const mergedStates = personalData.personalStates && personalData.personalStates.length > 0
    ? personalWeight > 0.5 ? personalData.personalStates : prior.commonStates
    : prior.commonStates

  // Merge momentum baseline
  const mergedMomentum = personalData.personalMomentum != null
    ? Math.round(prior.defaultMomentumBaseline * priorWeight + personalData.personalMomentum * personalWeight)
    : prior.defaultMomentumBaseline

  return {
    typicalDangerHours: mergedDangerHours,
    averageSessionMinutes: mergedMinutes,
    commonStates: mergedStates,
    defaultMomentumBaseline: mergedMomentum,
  }
}

/**
 * Returns the current blend level description for display.
 * Useful for showing the user how much INTENT knows about them.
 */
export function getDataConfidence(sessionCount: number): {
  level: 'learning' | 'building' | 'personalized' | 'deep'
  label: string
  description: string
} {
  if (sessionCount < 5) {
    return {
      level: 'learning',
      label: 'Getting to know you',
      description: 'Using general patterns for now. Your data will take over soon.',
    }
  }
  if (sessionCount < 15) {
    return {
      level: 'building',
      label: 'Building your profile',
      description: 'Starting to see your personal patterns emerge.',
    }
  }
  if (sessionCount < 30) {
    return {
      level: 'personalized',
      label: 'Your patterns',
      description: 'Most recommendations are based on your personal data now.',
    }
  }
  return {
    level: 'deep',
    label: 'Deeply personalized',
    description: 'INTENT knows your rhythms. Every suggestion is based on your history.',
  }
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Merges two sets of danger hours based on weights.
 * Returns the hours that are most likely to be danger hours,
 * blending population and personal data.
 */
function mergeDangerHours(
  priorHours: number[],
  personalHours: number[],
  priorWeight: number,
  personalWeight: number,
): number[] {
  if (personalHours.length === 0) return priorHours
  if (personalWeight >= 0.8) return personalHours

  // Score each hour: if it appears in either set, give it a score
  const hourScores: Record<number, number> = {}

  for (const h of priorHours) {
    hourScores[h] = (hourScores[h] ?? 0) + priorWeight
  }
  for (const h of personalHours) {
    hourScores[h] = (hourScores[h] ?? 0) + personalWeight
  }

  // Return hours with score > 0.3 (threshold for inclusion)
  return Object.entries(hourScores)
    .filter(([, score]) => score > 0.3)
    .map(([hour]) => parseInt(hour, 10))
    .sort((a, b) => a - b)
}

/**
 * Best-effort timezone offset in hours from UTC.
 * Returns a number from -12 to +14.
 */
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date()
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
  } catch {
    return 0
  }
}
