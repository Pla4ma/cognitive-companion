// ── Planning Loop Detector Tests ─────────────────────────────

import { detectPlanningLoop, generatePlanningLoopCopy, generateDriftMirrorInsight, generateCommandlessRecommendation } from '../engine/insights'
import { createOpenLoop, createLoopFromFailure, updateLoopStatus } from '../engine/stateEngines'
import { createAttentionReceipt, getReceiptTitle } from '../engine/sessionEngines'
import { getEmergencyStartMission, getEmergencyStartForState } from '../engine/stateEngines'
import { createIntentLockState, recordExitAttempt, shouldShowExitFriction, deactivateIntentLock } from '../engine/stateEngines'
import { isNewUser, getStarterDefault, processFeedback } from '../engine/stateEngines'
import { getOutcomeMeta, isProgress, getOutcomeOptions } from '../engine/missionEngines'
import { calculateIntentScore, getScoreDisclaimer } from '../engine/stateEngines'
import { createEmptyPlaybook, updatePlaybookFromOutcome, getPlaybookSummary } from '../engine/sessionEngines'
import { decideCoachResponse } from '../services/ai/coachPolicy'
import { decideQuestion, validateQuestionCount } from '../agents/antiDriftAgent/questionPolicy'
import { createMissionThread, addThreadEvent, getThreadSummary } from '../engine/sessionEngines'
import { validateAIOutput, validateMissionQuality } from '../services/ai/validatedAI'
import { generateCandidates, selectBestCandidate, explainCandidateChoice } from '../engine/missionEngines'
import { evaluateAction, getReviewCopy } from '../services/actionQueue/actionPolicy'
import { compileMissionChain, advanceChain, getCurrentStep, isChainComplete } from '../services/missionChains/chainCompiler'
import { generateNotificationCopy, isUnsafeCopy, sanitizeCopy } from '../services/notificationCopy/engine'
import { filterWidgetData, getDefaultWidgetPrivacy } from '../services/widgets/widgetPrivacy'

// ── Planning Loop Detector Tests ───────────────────────────

describe('PlanningLoopDetector', () => {
  test('detects planning loop after multiple edits without start', () => {
    const now = Date.now()
    const activities = [
      { type: 'mission_edit' as const, timestamp: now - 60000 },
      { type: 'mission_edit' as const, timestamp: now - 50000 },
      { type: 'mission_edit' as const, timestamp: now - 40000 },
      { type: 'mission_edit' as const, timestamp: now - 30000 },
    ]
    const signal = detectPlanningLoop(activities)
    expect(signal.detected).toBe(true)
    expect(signal.severity).toBe('medium')
  })

  test('does not detect loop when missions are started', () => {
    const now = Date.now()
    const activities = [
      { type: 'mission_edit' as const, timestamp: now - 60000 },
      { type: 'mission_edit' as const, timestamp: now - 50000 },
      { type: 'mission_start' as const, timestamp: now - 40000 },
    ]
    const signal = detectPlanningLoop(activities)
    expect(signal.detected).toBe(false)
  })

  test('generates copy for detected loop', () => {
    const copy = generatePlanningLoopCopy({ detected: true, severity: 'medium', indicators: [], timeInAppWithoutAction: 7, suggestedIntervention: '' })
    expect(copy.length).toBeGreaterThan(0)
  })
})

// ── Open Loops Tests ───────────────────────────────────────

describe('OpenLoops', () => {
  test('creates open loop with correct fields', () => {
    const loop = createOpenLoop('Email professor', 'brain_dump', 'Write the subject line', 4)
    expect(loop.title).toBe('Email professor')
    expect(loop.status).toBe('open')
    expect(loop.emotionalWeight).toBe(4)
    expect(loop.nextTinyAction).toBe('Write the subject line')
  })

  test('creates loop from failed mission', () => {
    const loop = createLoopFromFailure('Write essay', 'too hard')
    expect(loop.source).toBe('failed_mission')
    expect(loop.status).toBe('open')
  })

  test('updates loop status', () => {
    const loop = createOpenLoop('Test', 'user_capture', 'Do it')
    const updated = updateLoopStatus(loop, 'relieved')
    expect(updated.status).toBe('relieved')
  })
})

// ── Attention Receipts Tests ───────────────────────────────

describe('AttentionReceipts', () => {
  test('creates receipt with all fields', () => {
    const receipt = createAttentionReceipt({
      beforeState: 'overwhelmed',
      driftSignal: null,
      missionTitle: 'Write one sentence',
      missionAction: 'Open essay doc and write one ugly sentence',
      duration: 5,
      outcome: 'completed',
      whatChanged: 'Started writing',
      nextMicroStep: 'Write second sentence',
    })
    expect(receipt.beforeState).toBe('Overwhelmed')
    expect(receipt.outcome).toBe('completed')
    expect(receipt.shareableVersion).toContain('5 minutes')
  })

  test('returns correct title for outcome', () => {
    expect(getReceiptTitle('completed')).toBe('Moment rescued')
    expect(getReceiptTitle('salvaged')).toBe('Something saved')
  })
})

// ── Emergency Start Tests ──────────────────────────────────

describe('EmergencyStart', () => {
  test('returns a mission', () => {
    const result = getEmergencyStartMission()
    expect(result.mission).toBeDefined()
    expect(result.mission.estimatedMinutes).toBeGreaterThan(0)
    expect(result.mission.exactAction.length).toBeGreaterThan(0)
  })

  test('returns state-specific mission', () => {
    const result = getEmergencyStartForState('overwhelmed')
    expect(result.mission.estimatedMinutes).toBeLessThanOrEqual(5)
  })
})

// ── Intent Lock Tests ──────────────────────────────────────

describe('IntentLock', () => {
  test('creates active lock state', () => {
    const state = createIntentLockState('mission_1')
    expect(state.active).toBe(true)
    expect(state.exitAttempts).toBe(0)
  })

  test('records exit attempts', () => {
    const state = createIntentLockState('mission_1')
    const updated = recordExitAttempt(state)
    expect(updated.exitAttempts).toBe(1)
    expect(updated.exitFrictionShown).toBe(true)
  })

  test('shows exit friction on first attempt', () => {
    const state = createIntentLockState('mission_1')
    expect(shouldShowExitFriction(state)).toBe(true)
  })

  test('deactivates lock', () => {
    const state = createIntentLockState('mission_1')
    const deactivated = deactivateIntentLock(state)
    expect(deactivated.active).toBe(false)
  })
})

// ── New User Magic Tests ───────────────────────────────────

describe('NewUserMagic', () => {
  test('detects new user', () => {
    expect(isNewUser(2, 1)).toBe(true)
    expect(isNewUser(20, 30)).toBe(false)
  })

  test('returns starter default for state', () => {
    const def = getStarterDefault('overwhelmed')
    expect(def.duration).toBeLessThanOrEqual(5)
    expect(def.copy.length).toBeGreaterThan(0)
  })

  test('processes feedback', () => {
    const result = processFeedback({
      feedback: 'too_hard',
      state: 'overwhelmed',
      duration: 10,
      protocolId: 'test',
      timestamp: Date.now(),
    })
    expect(result.adjustment).toBe('decrease_duration')
    expect(result.newDuration).toBeLessThan(10)
  })
})

// ── Mission Outcome Tests ──────────────────────────────────

describe('MissionOutcomes', () => {
  test('returns all outcome options', () => {
    const options = getOutcomeOptions()
    expect(options.length).toBeGreaterThanOrEqual(10)
    expect(options).toContain('completed')
    expect(options).toContain('salvaged')
  })

  test('counts started as progress', () => {
    expect(isProgress('started')).toBe(true)
    expect(isProgress('abandoned')).toBe(false)
  })

  test('returns metadata for outcome', () => {
    const meta = getOutcomeMeta('completed')
    expect(meta.label).toBe('Done')
    expect(meta.momentumWeight).toBe(1.0)
  })
})

// ── Intent Score Tests ─────────────────────────────────────

describe('IntentScore', () => {
  test('calculates score from components', () => {
    const score = calculateIntentScore({
      startRate: 0.8,
      rescueCompletion: 0.7,
      salvageRate: 0.5,
      comebackRate: 0.6,
      reducedDrift: 0.4,
      planningLoopAvoidance: 0.3,
      beforeScrollWins: 0.7,
      missionFit: 0.8,
      consistency: 0.6,
    })
    expect(score.total).toBeGreaterThan(0)
    expect(score.total).toBeLessThanOrEqual(100)
    expect(score.label.length).toBeGreaterThan(0)
  })

  test('returns disclaimer', () => {
    const disclaimer = getScoreDisclaimer()
    expect(disclaimer).toContain('not your worth')
  })
})

// ── Playbook Tests ─────────────────────────────────────────

describe('Playbook', () => {
  test('creates playbook with starter rules', () => {
    const playbook = createEmptyPlaybook()
    expect(playbook.rules.length).toBeGreaterThan(0)
    expect(playbook.isLearning).toBe(true)
  })

  test('updates playbook from outcome', () => {
    const playbook = createEmptyPlaybook()
    const updated = updatePlaybookFromOutcome(playbook, 'overwhelmed', 'shrink', 2, 'success')
    expect(updated.totalMissions).toBe(1)
  })

  test('generates summary', () => {
    const playbook = createEmptyPlaybook()
    const summary = getPlaybookSummary(playbook)
    expect(summary.length).toBeGreaterThan(0)
  })
})

// ── Coach Policy Tests ─────────────────────────────────────

describe('CoachPolicy', () => {
  test('returns tiny_action for stuck state', () => {
    const decision = decideCoachResponse('stuck', "I don't know what to do", false, 0)
    expect(decision.responseType).toBe('tiny_action')
    expect(decision.maxSentences).toBeLessThanOrEqual(2)
  })

  test('returns safety_redirect for shame_spiral', () => {
    const decision = decideCoachResponse('shame_spiral', 'I feel worthless', false, 0)
    expect(decision.responseType).toBe('safety_redirect')
  })

  test('always includes CTA buttons', () => {
    const decision = decideCoachResponse('overwhelmed', 'too much', false, 0)
    expect(decision.buttons.length).toBeGreaterThan(0)
  })
})

// ── Question Policy Tests ──────────────────────────────────

describe('QuestionPolicy', () => {
  test('does not ask when enough info exists', () => {
    const decision = decideQuestion('overwhelmed', 5, 'school', 'help')
    expect(decision.shouldAsk).toBe(false)
  })

  test('asks time when missing', () => {
    const decision = decideQuestion('overwhelmed', null, 'school', 'help')
    expect(decision.shouldAsk).toBe(true)
    expect(decision.question).toBe('time_available')
  })

  test('validates question count', () => {
    expect(validateQuestionCount(1)).toBe(true)
    expect(validateQuestionCount(2)).toBe(false)
  })
})

// ── Mission Thread Tests ───────────────────────────────────

describe('MissionThreads', () => {
  test('creates thread', () => {
    const thread = createMissionThread('English Essay')
    expect(thread.title).toBe('English Essay')
    expect(thread.status).toBe('active')
  })

  test('adds events', () => {
    let thread = createMissionThread('Test')
    thread = addThreadEvent(thread, 'mission_started', 'Started')
    thread = addThreadEvent(thread, 'mission_completed', 'Done')
    const summary = getThreadSummary(thread)
    expect(summary.totalAttempts).toBe(1)
    expect(summary.completions).toBe(1)
  })
})

// ── Drift Mirror Tests ─────────────────────────────────────

describe('DriftMirror', () => {
  test('generates insight', () => {
    const insight = generateDriftMirrorInsight({
      state: 'overwhelmed',
      situation: 'essay',
      protocol: 'Ugly First Move',
      outcome: 'completed',
      duration: 5,
    })
    expect(insight.newRule.length).toBeGreaterThan(0)
    expect(insight.shareSafeVersion.length).toBeGreaterThan(0)
  })
})

// ── Commandless Agent Tests ────────────────────────────────

describe('CommandlessAgent', () => {
  test('recommends active mission continuation', () => {
    const rec = generateCommandlessRecommendation({
      state: null, currentHour: 14, totalMissions: 10, totalDays: 5,
      lastOutcome: null, hasActiveMission: true, planningLoopDetected: false,
      pendingContextCapsule: false, recentRescueCount: 2,
    })
    expect(rec.displayMode).toBe('strong_recommendation')
  })

  test('asks state for new users', () => {
    const rec = generateCommandlessRecommendation({
      state: null, currentHour: 14, totalMissions: 1, totalDays: 1,
      lastOutcome: null, hasActiveMission: false, planningLoopDetected: false,
      pendingContextCapsule: false, recentRescueCount: 0,
    })
    expect(rec.displayMode).toBe('ask_state')
    expect(rec.shouldShowStateChips).toBe(true)
  })

  test('detects planning loop', () => {
    const rec = generateCommandlessRecommendation({
      state: null, currentHour: 14, totalMissions: 10, totalDays: 5,
      lastOutcome: null, hasActiveMission: false, planningLoopDetected: true,
      pendingContextCapsule: false, recentRescueCount: 2,
    })
    expect(rec.shouldShowPlanningLoopWarning).toBe(true)
  })
})

// ── Validated AI Tests ─────────────────────────────────────

describe('ValidatedAI', () => {
  test('accepts valid output', () => {
    const result = validateAIOutput('Open the essay and write one sentence', 'Just start', { requiredStructure: 'mission' })
    expect(result.accepted).toBe(true)
    expect(result.usedFallback).toBe(false)
  })

  test('rejects empty output', () => {
    const result = validateAIOutput('', 'fallback', {})
    expect(result.usedFallback).toBe(true)
  })

  test('rejects unsafe content', () => {
    const result = validateAIOutput('You are avoiding your work again', 'Start small', {})
    expect(result.usedFallback).toBe(true)
  })

  test('validates mission quality', () => {
    const result = validateMissionQuality('Open the essay doc and write one ugly sentence')
    expect(result.quality).toBe('high')
  })

  test('rejects generic mission', () => {
    const result = validateMissionQuality('Do your best')
    expect(result.quality).not.toBe('high')
  })
})

// ── Mission Candidate Selector Tests ───────────────────────

describe('MissionCandidateSelector', () => {
  test('generates candidates', () => {
    const candidates = generateCandidates('overwhelmed', 5, 'school', [])
    expect(candidates.length).toBeGreaterThan(0)
  })

  test('selects best candidate', () => {
    const candidates = generateCandidates('overwhelmed', 5, 'school', [])
    const best = selectBestCandidate(candidates)
    expect(best).not.toBeNull()
    expect(best!.totalScore).toBeGreaterThan(0)
  })

  test('explains choice', () => {
    const candidates = generateCandidates('overwhelmed', 5, 'school', [])
    const best = selectBestCandidate(candidates)!
    const explanation = explainCandidateChoice(best, candidates)
    expect(explanation.length).toBeGreaterThan(0)
  })
})

// ── Action Policy Tests ────────────────────────────────────

describe('ActionPolicy', () => {
  test('allows internal safe actions', () => {
    const decision = evaluateAction('create_mission')
    expect(decision.allowed).toBe(true)
    expect(decision.blocked).toBe(false)
  })

  test('blocks critical actions', () => {
    const decision = evaluateAction('send_email')
    expect(decision.blocked).toBe(true)
  })

  test('requires review for external actions', () => {
    const decision = evaluateAction('create_calendar_event')
    expect(decision.requiresReview).toBe(true)
    expect(decision.requiresStrongConfirmation).toBe(true)
  })

  test('returns review copy', () => {
    const copy = getReviewCopy('draft_email')
    expect(copy).toContain('email')
  })
})

// ── Mission Chain Tests ────────────────────────────────────

describe('MissionChains', () => {
  test('compiles school assignment chain', () => {
    const chain = compileMissionChain('English Essay', 'school_assignment')
    expect(chain.steps.length).toBeGreaterThan(0)
    expect(chain.currentStep).toBe(0)
  })

  test('advances chain', () => {
    let chain = compileMissionChain('Test', 'cleaning')
    chain = advanceChain(chain)
    expect(chain.currentStep).toBe(1)
    expect(chain.steps[0].status).toBe('completed')
  })

  test('gets current step', () => {
    const chain = compileMissionChain('Test', 'life_admin')
    const step = getCurrentStep(chain)
    expect(step).not.toBeNull()
    expect(step!.status).toBe('active')
  })

  test('completes chain', () => {
    let chain = compileMissionChain('Test', 'creative')
    for (let i = 0; i < chain.steps.length; i++) {
      chain = advanceChain(chain)
    }
    expect(isChainComplete(chain)).toBe(true)
  })
})

// ── Notification Copy Tests ────────────────────────────────

describe('NotificationCopy', () => {
  test('generates copy for rescue', () => {
    const result = generateNotificationCopy({
      category: 'rescue',
      state: 'overwhelmed',
      style: 'gentle',
      privacyMode: 'safe',
      recentDismissals: 0,
      cooldownActive: false,
    })
    expect(result.shouldSend).toBe(true)
    expect(result.body.length).toBeGreaterThan(0)
  })

  test('suppresses after dismissals', () => {
    const result = generateNotificationCopy({
      category: 'rescue',
      state: null,
      style: 'gentle',
      privacyMode: 'safe',
      recentDismissals: 3,
      cooldownActive: false,
    })
    expect(result.shouldSend).toBe(false)
  })

  test('detects unsafe copy', () => {
    expect(isUnsafeCopy('You are avoiding your work')).toBe(true)
    expect(isUnsafeCopy('Tiny restart available')).toBe(false)
  })

  test('sanitizes unsafe copy', () => {
    const sanitized = sanitizeCopy('You are avoiding your essay again')
    expect(sanitized).not.toContain('avoiding')
  })
})

// ── Widget Privacy Tests ───────────────────────────────────

describe('WidgetPrivacy', () => {
  test('filters data in private mode', () => {
    const data = {
      title: 'Write essay',
      subtitle: 'English class',
      action: 'Start',
      missionText: 'Open essay doc and write one ugly sentence',
      stateLabel: 'avoiding',
      category: 'school',
    }
    const settings = getDefaultWidgetPrivacy()
    const filtered = filterWidgetData(data, settings)
    expect(filtered.missionText).toBeNull()
    expect(filtered.stateLabel).toBeNull()
    expect(filtered.title).toBe('Rescue ready')
  })

  test('allows detail in detailed mode', () => {
    const data = {
      title: 'Write essay',
      subtitle: 'English class',
      action: 'Start',
      missionText: 'Open essay doc',
      stateLabel: 'overwhelmed',
      category: 'school',
    }
    const filtered = filterWidgetData(data, { mode: 'detailed', hideOnLockScreen: false, hideSensitiveStates: false, hideMissionText: false })
    expect(filtered.missionText).toBe('Open essay doc')
  })
})
