// ── Question Policy ─────────────────────────────────────────
// Controls when and what questions to ask users

export interface QuestionDecision {
  shouldAsk: boolean;
  question?: string;
  reason?: string;
}

export type QuestionType = 'time_available' | 'context' | 'intent' | 'energy_level';

export function decideQuestion(
  state: string,
  timeAvailable: number | null,
  context: string,
  intent: string
): QuestionDecision {
  // If we already have enough info, don't ask
  if (timeAvailable !== null && timeAvailable > 0 && context && intent) {
    return {
      shouldAsk: false,
      reason: 'enough_info',
    };
  }

  // Priority: time_available first, then context, then intent
  if (timeAvailable === null || timeAvailable === 0) {
    return {
      shouldAsk: true,
      question: 'time_available',
      reason: 'missing_time',
    };
  }

  if (!context) {
    return {
      shouldAsk: true,
      question: 'context',
      reason: 'missing_context',
    };
  }

  if (!intent) {
    return {
      shouldAsk: true,
      question: 'intent',
      reason: 'missing_intent',
    };
  }

  return {
    shouldAsk: false,
    reason: 'enough_info',
  };
}

export function validateQuestionCount(count: number): boolean {
  // Only allow one question per session to avoid overwhelming users
  return count < 2;
}
