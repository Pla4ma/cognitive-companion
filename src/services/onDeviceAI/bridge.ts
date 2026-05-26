// ══════════════════════════════════════════════════════════════
// INTENT — On-Device AI Bridge
// Unified interface: deterministic ↔ native ↔ remote
// ══════════════════════════════════════════════════════════════

export interface OnDeviceAI {
  isAvailable(): Promise<boolean>
  classifyMomentLocal(input: string): Promise<MissionClassification | null>
  extractActionsLocal(text: string): Promise<ExtractedContext | null>
  shrinkMissionLocal(mission: string, state: string): Promise<string | null>
  generateCoachPulseLocal(context: string): Promise<string | null>
  detectSensitiveContentLocal(text: string): Promise<SensitivityResult | null>
}

export interface MissionClassification {
  state: string
  confidence: number
  energy: 'low' | 'medium' | 'high'
  category: string
}

export interface ExtractedContext {
  obligations: string[]
  deadlines: string[]
  people: string[]
  blockers: string[]
  nextActions: string[]
}

export interface SensitivityResult {
  isSensitive: boolean
  level: 'safe' | 'personal' | 'sensitive' | 'restricted'
  reason: string
}

// ── Deterministic Fallback ─────────────────────────────────

class DeterministicBridge implements OnDeviceAI {
  async isAvailable(): Promise<boolean> { return true }

  async classifyMomentLocal(input: string): Promise<MissionClassification | null> {
    const lower = input.toLowerCase()
    if (lower.includes('overwhelm') || lower.includes('too much')) return { state: 'overwhelmed', confidence: 0.7, energy: 'low', category: 'rescue' }
    if (lower.includes('stuck') || lower.includes('no idea')) return { state: 'stuck', confidence: 0.7, energy: 'medium', category: 'rescue' }
    if (lower.includes('avoid') || lower.includes("don't want")) return { state: 'avoiding', confidence: 0.7, energy: 'low', category: 'rescue' }
    if (lower.includes('tired') || lower.includes('exhausted')) return { state: 'tired', confidence: 0.7, energy: 'low', category: 'rescue' }
    if (lower.includes('scroll') || lower.includes('phone')) return { state: 'doomscroll_risk', confidence: 0.6, energy: 'low', category: 'before_scroll' }
    if (lower.includes('perfect') || lower.includes('not good enough')) return { state: 'perfectionism', confidence: 0.6, energy: 'medium', category: 'rescue' }
    return null
  }

  async extractActionsLocal(text: string): Promise<ExtractedContext | null> {
    const obligations: string[] = []
    const deadlines: string[] = []

    // Simple keyword extraction
    const lines = text.split(/[.\n]/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      if (trimmed.toLowerCase().includes('need to') || trimmed.toLowerCase().includes('have to') || trimmed.toLowerCase().includes('must')) {
        obligations.push(trimmed)
      }
      if (trimmed.toLowerCase().includes('due') || trimmed.toLowerCase().includes('deadline') || trimmed.toLowerCase().includes('by ')) {
        deadlines.push(trimmed)
      }
    }

    if (obligations.length === 0 && deadlines.length === 0) return null
    return { obligations, deadlines, people: [], blockers: [], nextActions: [] }
  }

  async shrinkMissionLocal(mission: string, _state: string): Promise<string | null> {
    return `Do the smallest version of: ${mission.slice(0, 40)}`
  }

  async generateCoachPulseLocal(context: string): Promise<string | null> {
    return 'One tiny step is enough.'
  }

  async detectSensitiveContentLocal(text: string): Promise<SensitivityResult | null> {
    const lower = text.toLowerCase()
    const sensitiveWords = ['suicide', 'kill', 'die', 'harm', 'hurt', 'abuse', 'assault']
    const isSensitive = sensitiveWords.some((w) => lower.includes(w))
    return {
      isSensitive,
      level: isSensitive ? 'restricted' : 'safe',
      reason: isSensitive ? 'Contains potentially sensitive content' : 'No sensitive content detected',
    }
  }
}

// ── Bridge Singleton ───────────────────────────────────────

let bridge: OnDeviceAI = new DeterministicBridge()

export function getOnDeviceAI(): OnDeviceAI {
  return bridge
}

export function setOnDeviceAI(custom: OnDeviceAI): void {
  bridge = custom
}

export function resetOnDeviceAI(): void {
  bridge = new DeterministicBridge()
}
