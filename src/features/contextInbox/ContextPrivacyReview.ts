// ══════════════════════════════════════════════════════════════
// INTENT — Context Capsule Privacy Review
// Best-in-class review UX for sensitive context ingestion
// ══════════════════════════════════════════════════════════════

export type PrivacyClassification = 'public' | 'personal' | 'sensitive' | 'restricted'

export interface ContextReviewData {
  capsuleId: string
  rawText: string
  summary: string
  obligations: string[]
  deadlines: string[]
  people: string[]
  blockers: string[]
  category: string | null
  privacyClassification: PrivacyClassification
  suggestedMission: string
  suggestedDuration: number
  processingOptions: ProcessingOptions
}

export interface ProcessingOptions {
  keepLocalOnly: boolean
  allowAI: boolean
  deleteRawAfterMission: boolean
  saveAsMissionChain: boolean
  doNotStore: boolean
}

// ── Privacy Classification ─────────────────────────────────

export function classifyContextPrivacy(text: string): PrivacyClassification {
  const lower = text.toLowerCase()

  // Restricted: medical, financial, legal
  const restrictedWords = ['ssn', 'social security', 'bank account', 'password', 'diagnosis', 'medication', 'therapy', 'lawyer', 'attorney', 'court']
  if (restrictedWords.some((w) => lower.includes(w))) return 'restricted'

  // Sensitive: emotional, personal relationships
  const sensitiveWords = ['depressed', 'anxious', 'breakup', 'divorce', 'death', 'died', 'abuse', 'trauma', 'addiction', 'relapse']
  if (sensitiveWords.some((w) => lower.includes(w))) return 'sensitive'

  // Personal: names, dates, locations
  const personalWords = ['my boss', 'my teacher', 'my professor', 'my mom', 'my dad', 'my partner', 'doctor']
  if (personalWords.some((w) => lower.includes(w))) return 'personal'

  return 'public'
}

// ── Default Processing Options ─────────────────────────────

export function getDefaultProcessingOptions(classification: PrivacyClassification): ProcessingOptions {
  switch (classification) {
    case 'restricted':
      return { keepLocalOnly: true, allowAI: false, deleteRawAfterMission: true, saveAsMissionChain: false, doNotStore: false }
    case 'sensitive':
      return { keepLocalOnly: true, allowAI: false, deleteRawAfterMission: false, saveAsMissionChain: true, doNotStore: false }
    case 'personal':
      return { keepLocalOnly: true, allowAI: true, deleteRawAfterMission: false, saveAsMissionChain: true, doNotStore: false }
    case 'public':
      return { keepLocalOnly: false, allowAI: true, deleteRawAfterMission: false, saveAsMissionChain: true, doNotStore: false }
  }
}

// ── Privacy Copy ───────────────────────────────────────────

export function getPrivacyClassificationCopy(classification: PrivacyClassification): string {
  const copies: Record<PrivacyClassification, string> = {
    public: 'No sensitive content detected',
    personal: 'Contains personal references',
    sensitive: 'Contains emotionally sensitive content',
    restricted: 'Contains highly sensitive data — local only recommended',
  }
  return copies[classification]
}

export function getPrivacyBadgeColor(classification: PrivacyClassification): string {
  const colors: Record<PrivacyClassification, string> = {
    public: '#00ff88',
    personal: '#ffaa00',
    sensitive: '#ff6644',
    restricted: '#ff2222',
  }
  return colors[classification]
}

export function getProcessingOptionsCopy(options: ProcessingOptions): string[] {
  const copies: string[] = []
  if (options.keepLocalOnly) copies.push('Data stays on your device')
  if (!options.allowAI) copies.push('AI processing disabled')
  if (options.deleteRawAfterMission) copies.push('Raw text deleted after mission')
  if (options.doNotStore) copies.push('Nothing saved')
  return copies
}
