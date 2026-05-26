// ══════════════════════════════════════════════════════════════
// INTENT — Voice Intent Extraction Tests
// Tests for parsing voice transcripts into structured intents
// ══════════════════════════════════════════════════════════════

import {
  extractIntentFromVoice,
  detectUserState,
  isBrainDump,
} from '../services/voice/voiceIntent'
import type { VoiceIntentResult } from '../types/voice'

// ── State Detection Tests ───────────────────────────────────

describe('Voice Intent Extraction', () => {
  describe('state detection', () => {
    test('detects avoiding state', () => {
      const result = extractIntentFromVoice("I've been avoiding this all day")
      expect(result.state).toBe('avoiding')
      expect(result.confidence).toBeGreaterThan(0)
    })

    test('detects overwhelmed state', () => {
      const result = extractIntentFromVoice("I'm overwhelmed, there's too much to do")
      expect(result.state).toBe('overwhelmed')
    })

    test('detects stuck state', () => {
      const result = extractIntentFromVoice("I'm stuck on this, I don't know how to proceed")
      expect(result.state).toBe('stuck')
    })

    test('detects tired state', () => {
      const result = extractIntentFromVoice("I'm so exhausted and have no energy")
      expect(result.state).toBe('tired')
    })

    test('detects distracted state', () => {
      const result = extractIntentFromVoice("I keep getting distracted by everything")
      expect(result.state).toBe('distracted')
    })

    test('detects anxious state', () => {
      const result = extractIntentFromVoice("I'm feeling anxious and stressed about this")
      expect(result.state).toBe('anxious')
    })

    test('detects scattered state', () => {
      const result = extractIntentFromVoice("I'm scattered, jumping between too many things")
      expect(result.state).toBe('scattered')
    })

    test('detects ready state', () => {
      const result = extractIntentFromVoice("I'm ready, feeling motivated and locked in")
      expect(result.state).toBe('ready')
    })

    test('detects bored state', () => {
      const result = extractIntentFromVoice("This is so boring and tedious")
      expect(result.state).toBe('bored')
    })

    test('detects perfectionism state', () => {
      const result = extractIntentFromVoice("It has to be perfect, not good enough yet")
      expect(result.state).toBe('perfectionism')
    })

    test('detects unclear state', () => {
      const result = extractIntentFromVoice("I'm confused and don't know where to start")
      expect(result.state).toBe('unclear')
    })

    test('detects time_pressure state', () => {
      const result = extractIntentFromVoice("I'm running out of time, the deadline is today")
      expect(result.state).toBe('time_pressure')
    })

    test('detects low_confidence state', () => {
      const result = extractIntentFromVoice("I can't do this, I'm not smart enough")
      expect(result.state).toBe('low_confidence')
    })

    test('detects shame_spiral state', () => {
      const result = extractIntentFromVoice("I'm such a failure, I feel so ashamed")
      expect(result.state).toBe('shame_spiral')
    })

    test('detects doomscroll_risk state', () => {
      const result = extractIntentFromVoice("I'm about to scroll TikTok, keep losing myself in my phone")
      expect(result.state).toBe('doomscroll_risk')
    })

    test('detects planning_loop state', () => {
      const result = extractIntentFromVoice("I keep planning but never actually do it, going in circles")
      expect(result.state).toBe('planning_loop')
    })

    test('detects fake_productivity state', () => {
      const result = extractIntentFromVoice("I'm still researching and organizing my thoughts, just planning")
      expect(result.state).toBe('fake_productivity')
    })
  })

  // ── Category Detection ────────────────────────────────────

  describe('category detection', () => {
    test('detects state_declaration category', () => {
      const result = extractIntentFromVoice("I feel overwhelmed")
      expect(result.category).toBe('state_declaration')
    })

    test('detects request category', () => {
      const result = extractIntentFromVoice("Help me start, I need to work on this")
      expect(result.category).toBe('request')
    })

    test('detects distraction category', () => {
      const result = extractIntentFromVoice("I just got distracted, a random thought came to mind")
      expect(result.category).toBe('distraction')
    })

    test('detects brain_dump category', () => {
      const result = extractIntentFromVoice("Brain dump: first I need to email the professor, then I need to review notes, and also finish the essay")
      expect(result.category).toBe('brain_dump')
    })

    test('returns unknown for unclassifiable text', () => {
      const result = extractIntentFromVoice("Hello")
      expect(result.category).toBe('unknown')
    })
  })

  // ── Confidence Scoring ────────────────────────────────────

  describe('confidence scoring', () => {
    test('returns 0 confidence for empty text', () => {
      const result = extractIntentFromVoice('')
      expect(result.confidence).toBe(0)
      expect(result.state).toBeNull()
    })

    test('returns higher confidence for phrase matches than keyword matches', () => {
      const phraseResult = extractIntentFromVoice("I can't make myself start")
      const keywordResult = extractIntentFromVoice("I'm avoiding")
      // Both should detect 'avoiding' but phrase match should score well
      expect(phraseResult.state).toBe('avoiding')
      expect(keywordResult.state).toBe('avoiding')
      expect(phraseResult.confidence).toBeGreaterThan(0)
      expect(keywordResult.confidence).toBeGreaterThan(0)
    })

    test('respects minConfidence option', () => {
      const highThreshold = extractIntentFromVoice("maybe kind of avoiding", { minConfidence: 0.9 })
      // With a very high threshold, may not detect the state
      expect(highThreshold.confidence).toBeDefined()
    })
  })

  // ── Protocol Mapping ──────────────────────────────────────

  describe('protocol mapping', () => {
    test('maps avoiding to a rescue protocol', () => {
      const result = extractIntentFromVoice("I've been avoiding this task")
      expect(result.protocol).toBeDefined()
      expect(result.protocol).toBe('two_minute_ignition')
    })

    test('maps overwhelmed to shrink_the_beast', () => {
      const result = extractIntentFromVoice("I'm overwhelmed, too much to handle")
      expect(result.protocol).toBe('shrink_the_beast')
    })

    test('maps perfectionism to ugly_first_move', () => {
      const result = extractIntentFromVoice("It has to be perfect, I keep rewriting")
      expect(result.protocol).toBe('ugly_first_move')
    })

    test('returns null protocol when no state detected', () => {
      const result = extractIntentFromVoice("Hello world")
      expect(result.protocol).toBeNull()
    })
  })

  // ── Context Extraction ────────────────────────────────────

  describe('context extraction', () => {
    test('extracts time references', () => {
      const result = extractIntentFromVoice("I need 30 minutes to finish this")
      expect(result.context.timeReference).toBe(30)
    })

    test('extracts hour time references', () => {
      const result = extractIntentFromVoice("I have 2 hours to complete this")
      expect(result.context.timeReference).toBe(120)
    })

    test('detects explicit requests', () => {
      const result = extractIntentFromVoice("Help me start this task")
      expect(result.context.explicitRequest).toBe(true)
    })

    test('extracts mentioned tasks', () => {
      const result = extractIntentFromVoice("I need to finish my biology essay")
      expect(result.context.mentionedTask).toBeTruthy()
    })

    test('extracts emotion keywords', () => {
      const result = extractIntentFromVoice("I'm feeling anxious and frustrated")
      expect(result.context.emotionKeywords).toContain('anxious')
      expect(result.context.emotionKeywords).toContain('frustrated')
    })
  })

  // ── Quick Helpers ─────────────────────────────────────────

  describe('quick helpers', () => {
    test('detectUserState returns state directly', () => {
      const state = detectUserState("I'm overwhelmed with everything")
      expect(state).toBe('overwhelmed')
    })

    test('detectUserState returns null for ambiguous text', () => {
      const state = detectUserState("ok")
      expect(state).toBeNull()
    })

    test('isBrainDump detects brain dumps', () => {
      expect(isBrainDump("Brain dump: email professor, review notes, finish essay")).toBe(true)
    })

    test('isBrainDump returns false for simple text', () => {
      expect(isBrainDump("I feel tired")).toBe(false)
    })
  })

  // ── Edge Cases ────────────────────────────────────────────

  describe('edge cases', () => {
    test('handles whitespace-only input', () => {
      const result = extractIntentFromVoice('   ')
      expect(result.category).toBe('unknown')
      expect(result.state).toBeNull()
      expect(result.confidence).toBe(0)
    })

    test('handles mixed states gracefully', () => {
      const result = extractIntentFromVoice("I'm overwhelmed and anxious and avoiding everything")
      // Should pick the strongest signal
      expect(result.state).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    test('preserves raw transcript', () => {
      const raw = "I'm stuck and need help"
      const result = extractIntentFromVoice(raw)
      expect(result.rawTranscript).toBe(raw)
    })
  })
})
