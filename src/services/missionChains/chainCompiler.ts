// ══════════════════════════════════════════════════════════════
// INTENT — Mission Chain Compiler
// Turn big work into guided sequences of tiny steps
// ══════════════════════════════════════════════════════════════

export type ChainCategory = 'school_assignment' | 'exam_study' | 'cleaning' | 'life_admin' | 'creative' | 'work_project'

export interface ChainStep {
  id: string
  order: number
  title: string
  exactAction: string
  duration: number
  fallback: string
  status: 'pending' | 'active' | 'completed' | 'skipped' | 'blocked'
  startedAt: number | null
  completedAt: number | null
}

export interface MissionChain {
  id: string
  title: string
  category: ChainCategory
  summary: string
  steps: ChainStep[]
  currentStep: number
  estimatedTotalTime: number
  deadlinePressure: 'none' | 'low' | 'medium' | 'high'
  createdAt: number
  updatedAt: number
}

// ── Chain Templates ────────────────────────────────────────

const CHAIN_TEMPLATES: Record<ChainCategory, { title: string; exactAction: string; duration: number; fallback: string }[]> = {
  school_assignment: [
    { title: 'Open prompt', exactAction: 'Open the assignment and find the due date', duration: 2, fallback: 'Find the file' },
    { title: 'Write title', exactAction: 'Write the assignment title in a new doc', duration: 2, fallback: 'Create the document' },
    { title: 'Rough outline', exactAction: 'Make a rough outline with 3 bullets', duration: 5, fallback: 'Write 3 words' },
    { title: 'Ugly sentence', exactAction: 'Write one ugly sentence', duration: 3, fallback: 'Write any sentence' },
    { title: 'First paragraph', exactAction: 'Complete the first paragraph', duration: 10, fallback: 'Write 2 more sentences' },
    { title: 'Review rubric', exactAction: 'Check the rubric for first section', duration: 5, fallback: 'Read the rubric' },
    { title: 'Format check', exactAction: 'Check formatting and save', duration: 3, fallback: 'Save the file' },
  ],
  exam_study: [
    { title: 'Open notes', exactAction: 'Open your notes or textbook', duration: 2, fallback: 'Find the material' },
    { title: 'List topics', exactAction: 'List the chapters or topics to cover', duration: 3, fallback: 'Name 3 topics' },
    { title: 'Make flashcards', exactAction: 'Make 3 flashcards from the first topic', duration: 5, fallback: 'Write 1 key term' },
    { title: 'Practice questions', exactAction: 'Answer 3 practice questions', duration: 10, fallback: 'Answer 1 question' },
    { title: 'Mark weak areas', exactAction: 'Mark the topic you are weakest on', duration: 2, fallback: 'Name one hard topic' },
    { title: 'Review weak topic', exactAction: 'Review the weak topic for 10 minutes', duration: 10, fallback: 'Read for 5 minutes' },
    { title: 'Self-quiz', exactAction: 'Quiz yourself on 5 key points', duration: 5, fallback: 'Recall 3 points' },
  ],
  cleaning: [
    { title: '10 items basket', exactAction: 'Put 10 items into one basket', duration: 2, fallback: 'Put 5 items' },
    { title: 'Clear surface', exactAction: 'Clear one surface completely', duration: 5, fallback: 'Clear a corner' },
    { title: 'Trash sweep', exactAction: 'Throw away obvious trash', duration: 3, fallback: 'Throw away 3 things' },
    { title: 'Laundry pile', exactAction: 'Put all laundry in one pile', duration: 3, fallback: 'Find 5 dirty items' },
    { title: '5-minute reset', exactAction: 'Set a 5-minute timer and reset one area', duration: 5, fallback: 'Set the timer' },
    { title: 'Stop or continue', exactAction: 'Stop when timer ends or continue intentionally', duration: 1, fallback: 'Decide' },
  ],
  life_admin: [
    { title: 'Open the thing', exactAction: 'Open the bill, form, or email', duration: 2, fallback: 'Find it' },
    { title: 'Find due date', exactAction: 'Find the due date or action required', duration: 2, fallback: 'Read the first line' },
    { title: 'Write summary', exactAction: 'Write a one-line summary of what needs doing', duration: 2, fallback: 'Name the action' },
    { title: 'Draft message', exactAction: 'Draft the next message or reminder', duration: 5, fallback: 'Write the first line' },
    { title: 'Schedule follow-up', exactAction: 'Set a reminder for the follow-up', duration: 2, fallback: 'Write it down' },
  ],
  creative: [
    { title: 'Open project', exactAction: 'Open the project or create a new one', duration: 2, fallback: 'Open the app' },
    { title: 'Ugly version', exactAction: 'Create the ugliest possible first version', duration: 5, fallback: 'Make anything' },
    { title: '3 rough ideas', exactAction: 'Add 3 rough ideas or variations', duration: 5, fallback: 'Add 1 idea' },
    { title: 'Pick direction', exactAction: 'Pick one direction to develop', duration: 2, fallback: 'Name your favorite' },
    { title: 'Export draft', exactAction: 'Export or save the current draft', duration: 2, fallback: 'Save the file' },
    { title: 'Next tiny edit', exactAction: 'Decide the next tiny edit', duration: 2, fallback: 'Name one improvement' },
  ],
  work_project: [
    { title: 'Read ticket', exactAction: 'Open the ticket and read the description', duration: 2, fallback: 'Open the ticket' },
    { title: 'First comment', exactAction: 'Write the first comment or update draft', duration: 5, fallback: 'Write one sentence' },
    { title: 'Identify blocker', exactAction: 'Name the first blocker or dependency', duration: 2, fallback: 'List what you need' },
    { title: 'Tiny progress', exactAction: 'Make the smallest possible progress', duration: 5, fallback: 'Read related docs' },
    { title: 'Status update', exactAction: 'Write a 2-sentence status update', duration: 3, fallback: 'Write 1 sentence' },
  ],
}

// ── Compile Chain ──────────────────────────────────────────

export function compileMissionChain(
  title: string,
  category: ChainCategory,
  deadlinePressure: 'none' | 'low' | 'medium' | 'high' = 'none',
): MissionChain {
  const template = CHAIN_TEMPLATES[category]
  const now = Date.now()

  const steps: ChainStep[] = template.map((t, i) => ({
    id: `step_${now}_${i}`,
    order: i,
    title: t.title,
    exactAction: t.exactAction,
    duration: t.duration,
    fallback: t.fallback,
    status: i === 0 ? 'active' : 'pending',
    startedAt: i === 0 ? now : null,
    completedAt: null,
  }))

  return {
    id: `chain_${now}_${Math.random().toString(36).slice(2, 9)}`,
    title,
    category,
    summary: `${template.length} steps, ~${template.reduce((a, b) => a + b.duration, 0)} minutes`,
    steps,
    currentStep: 0,
    estimatedTotalTime: template.reduce((a, b) => a + b.duration, 0),
    deadlinePressure,
    createdAt: now,
    updatedAt: now,
  }
}

// ── Chain Operations ───────────────────────────────────────

export function advanceChain(chain: MissionChain): MissionChain {
  const steps = [...chain.steps]
  const current = steps[chain.currentStep]
  if (current) {
    current.status = 'completed'
    current.completedAt = Date.now()
  }
  const nextIdx = chain.currentStep + 1
  if (nextIdx < steps.length) {
    steps[nextIdx].status = 'active'
    steps[nextIdx].startedAt = Date.now()
  }
  return { ...chain, steps, currentStep: nextIdx, updatedAt: Date.now() }
}

export function skipStep(chain: MissionChain): MissionChain {
  const steps = [...chain.steps]
  steps[chain.currentStep].status = 'skipped'
  return advanceChain({ ...chain, steps })
}

export function getCurrentStep(chain: MissionChain): ChainStep | null {
  return chain.steps[chain.currentStep] ?? null
}

export function getChainProgress(chain: MissionChain): number {
  const done = chain.steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length
  return Math.round((done / chain.steps.length) * 100)
}

export function isChainComplete(chain: MissionChain): boolean {
  return chain.steps.every((s) => s.status === 'completed' || s.status === 'skipped')
}
