// ══════════════════════════════════════════════════════════════
// INTENT — Validated AI Pipeline
// AI output is never final until validated
// Extended: shame detection, crisis detection, PII sanitization
// ══════════════════════════════════════════════════════════════

import { assessCrisis, filterShameLanguage } from '../../engine/safety'
import type { CrisisLevel } from '../../engine/safety'

export type ValidationFailureReason =
  | 'timeout'
  | 'invalid_json'
  | 'vague_mission'
  | 'unsafe_language'
  | 'privacy_violation'
  | 'hallucinated_action'
  | 'schema_mismatch'
  | 'quality_below_threshold'

export interface ValidatedOutput<T> {
  success: boolean
  data: T | null
  fallbackUsed: boolean
  failureReason: ValidationFailureReason | null
  validationSteps: ValidationStep[]
  latencyMs: number
}

export interface ValidationStep {
  name: string
  passed: boolean
  detail: string
}

// ── Response Validation ─────────────────────────────────────

export interface ResponseValidationResult {
  valid: boolean
  issues: string[]
  sanitized: string
}

/**
 * Validate an AI response string for safety, quality, and format.
 * Returns validation status, list of issues, and a sanitized version.
 */
export function validateResponse(response: string): ResponseValidationResult {
  const issues: string[] = []
  let sanitized = response

  // 1. Check for empty or whitespace-only
  if (!response || response.trim().length === 0) {
    return { valid: false, issues: ['Empty response'], sanitized: '' }
  }

  // 2. Check for shame language
  if (checkForShameLanguage(response)) {
    const shameResult = filterShameLanguage(response)
    sanitized = shameResult.filtered
    issues.push(`Shame language detected: ${shameResult.detectedPatterns.join(', ')}`)
  }

  // 3. Check for crisis content
  const crisis = checkForCrisisContent(response)
  if (crisis.isCrisis) {
    issues.push(`Crisis content detected (severity: ${crisis.severity})`)
  }

  // 4. Check for PII
  const piiIssues = detectPII(response)
  if (piiIssues.length > 0) {
    issues.push(`PII detected: ${piiIssues.join(', ')}`)
    sanitized = removePII(sanitized)
  }

  // 5. Check for medical/clinical advice
  if (containsMedicalAdvice(response)) {
    issues.push('Contains medical/clinical advice')
  }

  // 6. Check response length
  if (response.length > 2000) {
    issues.push('Response exceeds maximum length')
    sanitized = enforceMaxLength(sanitized, 2000)
  }

  return {
    valid: issues.length === 0,
    issues,
    sanitized,
  }
}

// ── Shame Language Detection ─────────────────────────────────

/**
 * Check if text contains shame-based language.
 * Uses the safety engine's pattern matching.
 */
export function checkForShameLanguage(text: string): boolean {
  const result = filterShameLanguage(text)
  return result.hadShameLanguage
}

// ── Crisis Content Detection ─────────────────────────────────

export interface CrisisCheckResult {
  isCrisis: boolean
  severity: CrisisLevel
  signals: string[]
}

/**
 * Check if text contains crisis-related content.
 * Uses the safety engine's crisis detection.
 */
export function checkForCrisisContent(text: string): CrisisCheckResult {
  const assessment = assessCrisis(text)
  return {
    isCrisis: assessment.level === 'moderate' || assessment.level === 'severe',
    severity: assessment.level,
    signals: assessment.detectedSignals,
  }
}

// ── Output Sanitization ──────────────────────────────────────

// PII patterns
const PII_PATTERNS: { pattern: RegExp; label: string; replacement: string }[] = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, label: 'email', replacement: '[email]' },
  // Phone numbers (various formats)
  { pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, label: 'phone', replacement: '[phone]' },
  // SSN
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'ssn', replacement: '[ssn]' },
  // Credit card numbers
  { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, label: 'credit_card', replacement: '[card]' },
  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, label: 'ip_address', replacement: '[ip]' },
  // Street addresses (basic)
  { pattern: /\b\d{1,5}\s+([A-Z][a-z]+\s*)+(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court)\b/gi, label: 'address', replacement: '[address]' },
]

/**
 * Sanitize output text: remove PII, fix formatting, normalize whitespace.
 */
export function sanitizeOutput(text: string): string {
  let sanitized = text

  // Remove PII
  for (const { pattern, replacement } of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement)
  }

  // Fix common formatting issues
  sanitized = sanitized
    .replace(/\n{3,}/g, '\n\n')           // Max 2 consecutive newlines
    .replace(/\s{2,}/g, ' ')              // Collapse multiple spaces
    .replace(/^\s+|\s+$/g, '')            // Trim
    .replace(/\.{2,}/g, '...')            // Normalize ellipsis
    .replace(/!{2,}/g, '!')               // Normalize exclamation marks

  return sanitized
}

/**
 * Remove PII from text (without other formatting changes).
 */
function removePII(text: string): string {
  let cleaned = text
  for (const { pattern, replacement } of PII_PATTERNS) {
    cleaned = cleaned.replace(pattern, replacement)
  }
  return cleaned
}

/**
 * Detect PII in text. Returns list of detected PII types.
 */
function detectPII(text: string): string[] {
  const found: string[] = []
  for (const { pattern, label } of PII_PATTERNS) {
    if (pattern.test(text)) {
      found.push(label)
    }
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0
  }
  return found
}

/**
 * Check if text contains medical/clinical advice.
 */
function containsMedicalAdvice(text: string): boolean {
  return /\b(diagnos|prescri|medication|dosage|antidepressant|therapy session|clinical treatment|take this medicine|stop taking)\b/i.test(text)
}

/**
 * Enforce maximum character length on text.
 * Truncates at word boundary and adds ellipsis if truncated.
 */
export function enforceMaxLength(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text

  // Try to truncate at word boundary
  const truncated = text.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace) + '...'
  }

  return truncated + '...'
}

// ── Validation Pipeline (Existing) ──────────────────────────

export async function validateAIPipeline<T>(params: {
  aiCall: () => Promise<T | null>
  fallback: T
  schemaValidator: (data: T) => boolean
  safetyGuard: (data: T) => { safe: boolean; reason: string }
  qualityGate: (data: T) => { score: number; threshold: number }
  privacyGuard: (data: T) => { clean: boolean; violations: string[] }
}): Promise<ValidatedOutput<T>> {
  const startTime = Date.now()
  const steps: ValidationStep[] = []

  // Step 1: AI Call
  let aiResult: T | null = null
  try {
    aiResult = await Promise.race([
      params.aiCall(),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
  } catch (err) {
    const reason = err instanceof Error && err.message === 'timeout' ? 'timeout' : 'invalid_json'
    steps.push({ name: 'ai_call', passed: false, detail: reason })
    return buildFallback(params.fallback, reason, steps, Date.now() - startTime)
  }

  if (!aiResult) {
    steps.push({ name: 'ai_call', passed: false, detail: 'null response' })
    return buildFallback(params.fallback, 'invalid_json', steps, Date.now() - startTime)
  }

  steps.push({ name: 'ai_call', passed: true, detail: 'received response' })

  // Step 2: Schema Validation
  if (!params.schemaValidator(aiResult)) {
    steps.push({ name: 'schema_validation', passed: false, detail: 'schema mismatch' })
    return buildFallback(params.fallback, 'schema_mismatch', steps, Date.now() - startTime)
  }
  steps.push({ name: 'schema_validation', passed: true, detail: 'valid schema' })

  // Step 3: Safety Guard
  const safety = params.safetyGuard(aiResult)
  if (!safety.safe) {
    steps.push({ name: 'safety_guard', passed: false, detail: safety.reason })
    return buildFallback(params.fallback, 'unsafe_language', steps, Date.now() - startTime)
  }
  steps.push({ name: 'safety_guard', passed: true, detail: 'safe' })

  // Step 4: Quality Gate
  const quality = params.qualityGate(aiResult)
  if (quality.score < quality.threshold) {
    steps.push({ name: 'quality_gate', passed: false, detail: `score ${quality.score}/${quality.threshold}` })
    return buildFallback(params.fallback, 'quality_below_threshold', steps, Date.now() - startTime)
  }
  steps.push({ name: 'quality_gate', passed: true, detail: `score ${quality.score}/${quality.threshold}` })

  // Step 5: Privacy Guard
  const privacy = params.privacyGuard(aiResult)
  if (!privacy.clean) {
    steps.push({ name: 'privacy_guard', passed: false, detail: privacy.violations.join(', ') })
    return buildFallback(params.fallback, 'privacy_violation', steps, Date.now() - startTime)
  }
  steps.push({ name: 'privacy_guard', passed: true, detail: 'clean' })

  return {
    success: true,
    data: aiResult,
    fallbackUsed: false,
    failureReason: null,
    validationSteps: steps,
    latencyMs: Date.now() - startTime,
  }
}

function buildFallback<T>(
  fallback: T,
  reason: ValidationFailureReason,
  steps: ValidationStep[],
  latencyMs: number,
): ValidatedOutput<T> {
  return {
    success: true, // fallback is still a success
    data: fallback,
    fallbackUsed: true,
    failureReason: reason,
    validationSteps: steps,
    latencyMs,
  }
}
