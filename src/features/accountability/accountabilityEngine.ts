// ══════════════════════════════════════════════════════════════
// INTENT — Accountability Pacts
// Social without social media — private, opt-in, no feeds
// ══════════════════════════════════════════════════════════════

export type PrivacyLevel = 'none' | 'local_only' | 'share_card_manual' | 'notification_draft'
export type CheckInFrequency = 'daily' | 'weekly' | 'after_rescue' | 'manual'
export type AllowedShareData = 'completed_rescue_count' | 'weekly_story_summary' | 'custom_message'

export interface AccountabilityPact {
  id: string
  title: string
  partnerName: string
  partnerContact: string | null
  privacyLevel: PrivacyLevel
  checkInFrequency: CheckInFrequency
  allowedShareData: AllowedShareData[]
  createdAt: number
  lastCheckIn: number | null
  active: boolean
}

// ── Create Pact ────────────────────────────────────────────

export function createPact(params: {
  title: string
  partnerName: string
  partnerContact?: string
  privacyLevel: PrivacyLevel
  checkInFrequency: CheckInFrequency
  allowedShareData: AllowedShareData[]
}): AccountabilityPact {
  return {
    id: `pact_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: params.title,
    partnerName: params.partnerName,
    partnerContact: params.partnerContact ?? null,
    privacyLevel: params.privacyLevel,
    checkInFrequency: params.checkInFrequency,
    allowedShareData: params.allowedShareData,
    createdAt: Date.now(),
    lastCheckIn: null,
    active: true,
  }
}

// ── Generate Check-in Message ──────────────────────────────

export interface CheckInData {
  rescueCount: number
  bestProtocol: string | null
  weeklyInsight: string | null
  customMessage: string | null
}

export function generateCheckInMessage(
  pact: AccountabilityPact,
  data: CheckInData,
): string {
  const parts: string[] = [`Hey ${pact.partnerName},`]

  if (pact.allowedShareData.includes('completed_rescue_count') && data.rescueCount > 0) {
    parts.push(`I rescued ${data.rescueCount} focus moments this ${pact.checkInFrequency === 'daily' ? 'day' : 'week'}.`)
  }

  if (pact.allowedShareData.includes('weekly_story_summary') && data.weeklyInsight) {
    parts.push(data.weeklyInsight)
  }

  if (pact.allowedShareData.includes('custom_message') && data.customMessage) {
    parts.push(data.customMessage)
  }

  if (data.bestProtocol) {
    parts.push(`What works best: ${data.bestProtocol}`)
  }

  return parts.join('\n')
}

// ── Default Pacts ──────────────────────────────────────────

export function getStarterPact(): Partial<AccountabilityPact> {
  return {
    title: 'Weekly check-in',
    privacyLevel: 'share_card_manual',
    checkInFrequency: 'weekly',
    allowedShareData: ['completed_rescue_count', 'weekly_story_summary'],
  }
}

export function getPactPrivacyCopy(level: PrivacyLevel): string {
  const copies: Record<PrivacyLevel, string> = {
    none: 'No sharing',
    local_only: 'Data stays on your device',
    share_card_manual: 'You copy and send the check-in yourself',
    notification_draft: 'INTENT drafts a message, you send it',
  }
  return copies[level]
}
